const frag = `
precision highp float;

uniform sampler2D uMainSampler;
varying vec2 outTexCoord;

uniform float glitchIntensity;
uniform float time;

float hash(float seed) {
    float wrapped = fract(seed * 0.1031);
    wrapped *= wrapped + 33.33;
    wrapped *= wrapped + wrapped;
    return fract(wrapped);
}

void main() {
    vec2 uv = outTexCoord;
    float intensity = clamp(glitchIntensity, 0.0, 1.0);

    if (intensity <= 0.001) {
        gl_FragColor = texture2D(uMainSampler, uv);
        return;
    }

    float timeStep = floor(time * (5.0 + intensity * 15.0));

    float blockIndex = floor(uv.y * (10.0 + intensity * 30.0));
    float blockRand = hash(blockIndex + timeStep * 3.17);
    if (blockRand < intensity * 0.4) {
        float offset = (hash(blockIndex + timeStep * 7.13) - 0.5) * intensity * 0.06;
        uv.x += offset;
    }

    if (intensity > 0.3) {
        float tearY = hash(timeStep * 1.13);
        float tearWidth = 0.003 + intensity * 0.008;
        if (abs(uv.y - tearY) < tearWidth) {
            uv.x += (intensity - 0.3) * 0.05 * sign(hash(timeStep * 0.37) - 0.5);
        }
    }

    float aberration = intensity * 0.008;

    vec4 redChannel = texture2D(uMainSampler, vec2(uv.x + aberration, uv.y));
    vec4 greenChannel = texture2D(uMainSampler, uv);
    vec4 blueChannel = texture2D(uMainSampler, vec2(uv.x - aberration, uv.y));

    vec3 color = vec3(redChannel.r, greenChannel.g, blueChannel.b);
    float alpha = greenChannel.a;

    float noiseRand = hash(uv.x * 37.0 + uv.y * 59.0 + time * 13.0);
    if (noiseRand < intensity * intensity * 0.05) {
        float noiseVal = hash(uv.y * 41.0 + time * 7.0);
        color = mix(color, vec3(noiseVal), 0.5);
    }

    if (intensity > 0.7) {
        float flicker = 1.0 + (hash(timeStep * 2.0 + 55.0) - 0.5) * (intensity - 0.7) * 0.3;
        color *= max(flicker, 0.85);
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
