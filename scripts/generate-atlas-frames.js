const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function parsePng(buffer) {
  if (!buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error('Not a PNG file');
  }

  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idatChunks = [];

  let offset = 8;
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;

    if (type === 'IHDR') {
      width = buffer.readUInt32BE(dataStart);
      height = buffer.readUInt32BE(dataStart + 4);
      bitDepth = buffer.readUInt8(dataStart + 8);
      colorType = buffer.readUInt8(dataStart + 9);
    } else if (type === 'IDAT') {
      idatChunks.push(buffer.subarray(dataStart, dataEnd));
    } else if (type === 'IEND') {
      break;
    }

    offset = dataEnd + 4;
  }

  if (bitDepth !== 8) {
    throw new Error(`Unsupported bit depth: ${bitDepth}`);
  }

  let bytesPerPixel;
  switch (colorType) {
    case 0:
      bytesPerPixel = 1;
      break;
    case 2:
      bytesPerPixel = 3;
      break;
    case 4:
      bytesPerPixel = 2;
      break;
    case 6:
      bytesPerPixel = 4;
      break;
    default:
      throw new Error(`Unsupported color type: ${colorType}`);
  }

  const decompressed = zlib.inflateSync(Buffer.concat(idatChunks));
  const stride = width * bytesPerPixel;
  const pixels = Buffer.alloc(stride * height);

  let srcOffset = 0;
  let dstOffset = 0;
  for (let y = 0; y < height; y++) {
    const filterType = decompressed[srcOffset++];
    const scanline = decompressed.subarray(srcOffset, srcOffset + stride);
    srcOffset += stride;

    const prevRowOffset = dstOffset - stride;
    for (let x = 0; x < stride; x++) {
      const byte = scanline[x];
      const left = x >= bytesPerPixel ? pixels[dstOffset + x - bytesPerPixel] : 0;
      const up = y > 0 ? pixels[prevRowOffset + x] : 0;
      const upLeft = y > 0 && x >= bytesPerPixel ? pixels[prevRowOffset + x - bytesPerPixel] : 0;

      let value;
      switch (filterType) {
        case 0:
          value = byte;
          break;
        case 1:
          value = (byte + left) & 0xff;
          break;
        case 2:
          value = (byte + up) & 0xff;
          break;
        case 3:
          value = (byte + Math.floor((left + up) / 2)) & 0xff;
          break;
        case 4: {
          const predictor = left + up - upLeft;
          const pa = Math.abs(predictor - left);
          const pb = Math.abs(predictor - up);
          const pc = Math.abs(predictor - upLeft);
          let pred;
          if (pa <= pb && pa <= pc) pred = left;
          else if (pb <= pc) pred = up;
          else pred = upLeft;
          value = (byte + pred) & 0xff;
          break;
        }
        default:
          throw new Error(`Unknown PNG filter type: ${filterType}`);
      }
      pixels[dstOffset + x] = value;
    }
    dstOffset += stride;
  }

  return { width, height, bytesPerPixel, colorType, pixels };
}

function findNonEmptyFrames(png, cellSize) {
  const { width, height, bytesPerPixel, colorType, pixels } = png;
  const columns = Math.floor(width / cellSize);
  const rows = Math.floor(height / cellSize);

  let alphaOffset;
  if (colorType === 6) alphaOffset = 3;
  else if (colorType === 4) alphaOffset = 1;
  else alphaOffset = -1;

  const frames = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      let hasContent = alphaOffset === -1;
      for (let pixelY = 0; pixelY < cellSize && !hasContent; pixelY++) {
        const absoluteY = row * cellSize + pixelY;
        const rowOffset = absoluteY * width * bytesPerPixel;
        for (let pixelX = 0; pixelX < cellSize; pixelX++) {
          const absoluteX = col * cellSize + pixelX;
          const pixelOffset = rowOffset + absoluteX * bytesPerPixel;
          if (pixels[pixelOffset + alphaOffset] > 0) {
            hasContent = true;
            break;
          }
        }
      }
      if (hasContent) frames.push(row * columns + col);
    }
  }
  return frames;
}

const PROJECT_ROOT = path.resolve(__dirname, '..');
const IMAGES_DIR = path.join(PROJECT_ROOT, 'public', 'assets', 'images');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'public', 'assets', 'data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'atlas-frames.json');

const ATLASES = [
  { key: 'sprite', file: 'sprite-atlas.png', cellSize: 16 },
  { key: 'particle', file: 'particle-atlas.png', cellSize: 16 },
];

const result = {};
for (const atlas of ATLASES) {
  const filePath = path.join(IMAGES_DIR, atlas.file);
  const buffer = fs.readFileSync(filePath);
  const png = parsePng(buffer);
  const frames = findNonEmptyFrames(png, atlas.cellSize);
  const totalCells = Math.floor(png.width / atlas.cellSize) * Math.floor(png.height / atlas.cellSize);
  result[atlas.key] = frames;
  console.log(`${atlas.file}: ${frames.length}/${totalCells} non-empty frames`);
}

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(result));
console.log(`Wrote ${path.relative(PROJECT_ROOT, OUTPUT_FILE)}`);
