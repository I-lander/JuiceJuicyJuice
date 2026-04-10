const frag = `
precision mediump float;

uniform sampler2D uMainSampler;
varying vec2 outTexCoord;

uniform float glitchIntensity;
uniform float time;
uniform vec2 resolution;

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
    vec2 uv = outTexCoord;
    float intensity = clamp(glitchIntensity, 0.0, 1.0);

    if (intensity <= 0.001) {
        gl_FragColor = texture2D(uMainSampler, uv);
        return;
    }

    float timeStep = floor(time * (5.0 + intensity * 20.0));

    float blockHeight = 0.02 + (1.0 - intensity) * 0.06;
    float blockIndex = floor(uv.y / blockHeight);
    float blockSeed = hash(vec2(blockIndex, timeStep));
    if (blockSeed < intensity * 0.5) {
        uv.x += (blockSeed - 0.25) * intensity * 0.2;
    }

    float lineSeed = hash(vec2(floor(uv.y * resolution.y * 0.5), timeStep * 1.7));
    if (lineSeed < intensity * 0.2) {
        uv.x += (lineSeed - 0.5) * intensity * 0.1;
    }

    float verticalShift = (hash(vec2(timeStep * 0.3, 7.0)) - 0.5) * intensity * intensity * 0.03;
    uv.y += verticalShift;

    if (intensity > 0.2) {
        float tearPosition = fract(time * 0.5 + hash(vec2(timeStep, 99.0)));
        float tearWidth = 0.005 + intensity * 0.02;
        if (abs(uv.y - tearPosition) < tearWidth) {
            uv.x += (intensity - 0.2) * 0.15 * sign(hash(vec2(timeStep, 88.0)) - 0.5);
        }
    }

    float aberration = intensity * 15.0 / resolution.x;
    float vertAberration = intensity * 5.0 / resolution.y;

    vec4 redChannel = texture2D(uMainSampler, vec2(uv.x + aberration, uv.y + vertAberration * 0.3));
    vec4 greenChannel = texture2D(uMainSampler, uv);
    vec4 blueChannel = texture2D(uMainSampler, vec2(uv.x - aberration, uv.y - vertAberration * 0.3));

    vec3 color = vec3(redChannel.r, greenChannel.g, blueChannel.b);
    float alpha = greenChannel.a;

    float noiseSeed = hash(uv * resolution + vec2(time * 543.21));
    if (noiseSeed < intensity * intensity * 0.1) {
        color = mix(color, vec3(hash(uv + time)), 0.8);
    }

    float corruptSeed = hash(vec2(timeStep * 0.5, 42.0));
    if (corruptSeed < intensity * 0.25) {
        float corruptType = hash(vec2(timeStep * 0.7, 13.0));
        if (corruptType < 0.33) {
            color.rgb = color.grb;
        } else if (corruptType < 0.66) {
            color.rgb = color.bgr;
        } else {
            color.rgb = color.gbr;
        }
    }

    if (intensity > 0.6) {
        float flickerAmount = (intensity - 0.6) * 2.5;
        float flicker = 1.0 + (hash(vec2(timeStep * 2.0, 55.0)) - 0.5) * flickerAmount * 0.3;
        color *= flicker;
    }

    gl_FragColor = vec4(color, alpha);
}
`;

export default class GlitchShader extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
  public glitchIntensity: number = 0;
  public screenWidth: number = 512;
  public screenHeight: number = 288;

  constructor(game: Phaser.Game) {
    super({
      game,
      renderTarget: true,
      fragShader: frag,
    });
  }

  onPreRender(): void {
    this.set1f('glitchIntensity', this.glitchIntensity);
    this.set1f('time', this.game.loop.time / 1000);
    this.set2f('resolution', this.screenWidth, this.screenHeight);
  }
}
