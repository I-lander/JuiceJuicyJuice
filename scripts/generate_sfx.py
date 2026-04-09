import numpy as np
import wave
import os

SAMPLE_RATE = 44100
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "public", "assets", "sounds")


def save_wav(filename, signal):
    signal = np.clip(signal, -1.0, 1.0)
    int_signal = np.int16(signal * 32767 * 0.9)
    filepath = os.path.join(OUTPUT_DIR, filename)
    with wave.open(filepath, "w") as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(SAMPLE_RATE)
        wav_file.writeframes(int_signal.tobytes())
    print(f"  -> {filepath}")


def sine(freq, duration):
    time = np.linspace(0, duration, int(duration * SAMPLE_RATE), endpoint=False)
    return np.sin(2.0 * np.pi * freq * time)


def square(freq, duration, duty=0.5):
    time = np.linspace(0, duration, int(duration * SAMPLE_RATE), endpoint=False)
    phase = (freq * time) % 1.0
    return np.where(phase < duty, 1.0, -1.0)


def noise(duration):
    return np.random.uniform(-1.0, 1.0, int(duration * SAMPLE_RATE))


def decay_env(samples, rate=8.0):
    return np.exp(-np.linspace(0, rate, samples))


def generate_click_particles():
    duration = 0.12
    samples = int(duration * SAMPLE_RATE)
    tone = sine(880, duration) * 0.5 + sine(1320, duration) * 0.3 + square(660, duration, 0.125) * 0.2
    envelope = decay_env(samples, 12.0)
    signal = tone * envelope * 0.6
    save_wav("click_particles.wav", signal)


def generate_wall_bounce():
    duration = 0.1
    samples = int(duration * SAMPLE_RATE)
    time = np.linspace(0, duration, samples, endpoint=False)
    sweep = sine(300, duration) * 0.4 + sine(150, duration) * 0.3
    thump = sine(80, duration) * decay_env(samples, 15.0) * 0.5
    envelope = decay_env(samples, 10.0)
    signal = (sweep * envelope + thump) * 0.5
    save_wav("wall_bounce.wav", signal)


def generate_sprite_bounce():
    duration = 0.08
    samples = int(duration * SAMPLE_RATE)
    tone = sine(500, duration) * 0.4 + sine(750, duration) * 0.3 + noise(duration) * 0.1
    envelope = decay_env(samples, 14.0)
    signal = tone * envelope * 0.5
    save_wav("sprite_bounce.wav", signal)


def generate_button_click():
    duration = 0.06
    samples = int(duration * SAMPLE_RATE)
    tone = square(1000, duration, 0.125) * 0.3 + sine(1200, duration) * 0.4
    envelope = decay_env(samples, 16.0)
    signal = tone * envelope * 0.5
    save_wav("button_click.wav", signal)


def generate_purchase():
    duration = 0.2
    samples = int(duration * SAMPLE_RATE)
    time = np.linspace(0, duration, samples, endpoint=False)
    freq_sweep = 600 + 800 * (time / duration)
    tone = np.sin(2.0 * np.pi * freq_sweep * time) * 0.5
    sparkle_a = sine(1400, duration) * 0.2
    sparkle_b_raw = sine(1800, duration * 0.5) * 0.15
    sparkle_b = np.pad(sparkle_b_raw, (0, samples - len(sparkle_b_raw)), constant_values=0)
    sparkle = sparkle_a + sparkle_b
    envelope = decay_env(samples, 6.0)
    signal = (tone + sparkle) * envelope * 0.5
    save_wav("purchase.wav", signal)


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    print("Generating click_particles...")
    generate_click_particles()

    print("Generating wall_bounce...")
    generate_wall_bounce()

    print("Generating sprite_bounce...")
    generate_sprite_bounce()

    print("Generating button_click...")
    generate_button_click()

    print("Generating purchase...")
    generate_purchase()

    print("Done!")


if __name__ == "__main__":
    main()
