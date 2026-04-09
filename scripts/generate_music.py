import numpy as np
import wave
import os

SAMPLE_RATE = 44100
TOTAL_DURATION = 60.0
CROSSFADE_DURATION = 4.0
RENDER_DURATION = TOTAL_DURATION + CROSSFADE_DURATION
RENDER_SAMPLES = int(RENDER_DURATION * SAMPLE_RATE)
LOOP_SAMPLES = int(TOTAL_DURATION * SAMPLE_RATE)

BPM = 95
BEAT = 60.0 / BPM


def note_to_freq(note_name):
    note_map = {
        "C": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3,
        "E": 4, "F": 5, "F#": 6, "Gb": 6, "G": 7, "G#": 8, "Ab": 8,
        "A": 9, "A#": 10, "Bb": 10, "B": 11,
    }
    octave = int(note_name[-1])
    semitone = note_map[note_name[:-1]]
    midi = 12 * (octave + 1) + semitone
    return 440.0 * (2.0 ** ((midi - 69) / 12.0))


def sine_wave(frequency, duration):
    samples = int(duration * SAMPLE_RATE)
    time = np.linspace(0, duration, samples, endpoint=False)
    return np.sin(2.0 * np.pi * frequency * time)


def square_wave(frequency, duration, duty=0.5):
    samples = int(duration * SAMPLE_RATE)
    time = np.linspace(0, duration, samples, endpoint=False)
    phase = (frequency * time) % 1.0
    return np.where(phase < duty, 1.0, -1.0)


def triangle_wave(frequency, duration):
    samples = int(duration * SAMPLE_RATE)
    time = np.linspace(0, duration, samples, endpoint=False)
    phase = (frequency * time) % 1.0
    return 2.0 * np.abs(2.0 * phase - 1.0) - 1.0


def mix_into(target, signal, offset_samples):
    end = offset_samples + len(signal)
    if end > len(target):
        signal = signal[: len(target) - offset_samples]
        end = len(target)
    if offset_samples < 0:
        signal = signal[-offset_samples:]
        offset_samples = 0
    target[offset_samples:end] += signal


def apply_envelope(signal, attack=0.01, decay=0.05, sustain_level=0.6, release=0.1):
    length = len(signal)
    envelope = np.ones(length)
    attack_end = min(int(attack * SAMPLE_RATE), length)
    decay_end = min(attack_end + int(decay * SAMPLE_RATE), length)
    release_start = max(0, length - int(release * SAMPLE_RATE))
    if attack_end > 0:
        envelope[:attack_end] = np.linspace(0, 1, attack_end)
    if decay_end > attack_end:
        envelope[attack_end:decay_end] = np.linspace(1.0, sustain_level, decay_end - attack_end)
    if release_start > decay_end:
        envelope[decay_end:release_start] = sustain_level
    if release_start < length:
        envelope[release_start:] = np.linspace(sustain_level, 0, length - release_start)
    return signal * envelope


def apply_slow_envelope(signal, attack=2.0, release=2.0):
    length = len(signal)
    envelope = np.ones(length)
    attack_samples = min(int(attack * SAMPLE_RATE), length)
    release_samples = min(int(release * SAMPLE_RATE), length)
    if attack_samples > 0:
        envelope[:attack_samples] = np.linspace(0, 1, attack_samples)
    if release_samples > 0:
        envelope[-release_samples:] = np.linspace(1, 0, release_samples)
    return signal * envelope


def pad_tone(frequency, duration):
    detune_ratio = 2.0 ** (5.0 / 1200.0)
    layer_a = sine_wave(frequency, duration)
    layer_b = sine_wave(frequency * detune_ratio, duration)
    layer_c = sine_wave(frequency / detune_ratio, duration)
    return (layer_a + layer_b * 0.6 + layer_c * 0.6) / 2.5


def generate_pads():
    track = np.zeros(RENDER_SAMPLES)

    chords = [
        (["G3", "B3", "D4", "F#4"], 15.0),
        (["C3", "E3", "G3", "B3"], 15.0),
        (["D3", "F#3", "A3", "C4"], 15.0),
        (["E3", "G3", "B3", "D4"], 15.0),
    ]

    position = 0.0
    for chord_notes, duration in chords * 2:
        if position >= RENDER_DURATION:
            break
        remaining = min(duration, RENDER_DURATION - position)
        for note_name in chord_notes:
            freq = note_to_freq(note_name)
            tone = pad_tone(freq, remaining)
            tone = apply_slow_envelope(tone, attack=3.0, release=3.0)
            mix_into(track, tone * 0.08, int(position * SAMPLE_RATE))
        position += duration

    return track


def generate_bass():
    track = np.zeros(RENDER_SAMPLES)

    pattern = [
        ("G2", 2), ("REST", 1), ("G2", 1),
        ("C2", 2), ("REST", 1), ("D2", 1),
        ("D2", 2), ("REST", 1), ("A2", 1),
        ("E2", 2), ("REST", 1), ("D2", 1),
    ]

    position = 0.0
    while position < RENDER_DURATION:
        for note_name, beats in pattern:
            if position >= RENDER_DURATION:
                break
            duration = beats * BEAT
            if note_name != "REST":
                freq = note_to_freq(note_name)
                tone = triangle_wave(freq, duration)
                tone = apply_envelope(tone, attack=0.02, decay=0.15, sustain_level=0.5, release=0.15)
                mix_into(track, tone * 0.15, int(position * SAMPLE_RATE))
            position += duration

    return track


def generate_melody():
    track = np.zeros(RENDER_SAMPLES)

    phrases = [
        [("B4", 0.5), ("D5", 0.5), ("G5", 0.75), ("REST", 1.25), ("E5", 0.5), ("D5", 0.25), ("B4", 0.25),
         ("REST", 4), ("A4", 0.5), ("B4", 0.75), ("REST", 6.75)],

        [("D5", 0.5), ("E5", 0.25), ("D5", 0.25), ("B4", 0.75), ("REST", 2.25),
         ("G5", 0.5), ("F#5", 0.25), ("E5", 0.25), ("REST", 3), ("D5", 0.75), ("REST", 6.25)],

        [("G5", 0.75), ("REST", 0.5), ("E5", 0.25), ("G5", 0.25), ("A5", 0.5), ("G5", 0.25), ("E5", 0.5),
         ("REST", 3), ("B4", 0.5), ("D5", 0.5), ("REST", 7.95)],

        [("A4", 0.25), ("B4", 0.25), ("D5", 0.5), ("REST", 1.5), ("G5", 0.5), ("E5", 0.5), ("REST", 1.5),
         ("D5", 0.25), ("E5", 0.25), ("D5", 0.25), ("B4", 0.5), ("REST", 8.7)],
    ]

    position = 0.0
    for phrase in phrases:
        for note_name, beats in phrase:
            if position >= RENDER_DURATION:
                break
            duration = beats * BEAT
            if note_name != "REST":
                freq = note_to_freq(note_name)
                tone = square_wave(freq, duration, duty=0.125)
                tone = apply_envelope(tone, attack=0.02, decay=0.1, sustain_level=0.35, release=0.2)
                mix_into(track, tone * 0.08, int(position * SAMPLE_RATE))
            position += duration

    return track


def generate_counter_melody():
    track = np.zeros(RENDER_SAMPLES)

    phrases = [
        [("REST", 8), ("G5", 0.25), ("A5", 0.25), ("B5", 0.5), ("REST", 1.5),
         ("D5", 0.5), ("REST", 4)],

        [("REST", 5), ("E5", 0.25), ("G5", 0.5), ("F#5", 0.25), ("E5", 0.5),
         ("REST", 2), ("B5", 0.75), ("A5", 0.25), ("REST", 5.5)],

        [("REST", 3), ("B5", 0.5), ("REST", 0.5), ("A5", 0.25), ("G5", 0.25), ("E5", 0.5),
         ("REST", 4), ("D5", 0.5), ("E5", 0.25), ("REST", 5.25)],

        [("REST", 6), ("G5", 0.25), ("B5", 0.25), ("A5", 0.5), ("REST", 1.5),
         ("E5", 0.25), ("D5", 0.25), ("B4", 0.5), ("REST", 5.5)],
    ]

    position = 0.0
    for phrase in phrases:
        for note_name, beats in phrase:
            if position >= RENDER_DURATION:
                break
            duration = beats * BEAT
            if note_name != "REST":
                freq = note_to_freq(note_name)
                tone = sine_wave(freq, duration) * 0.6 + square_wave(freq, duration, duty=0.125) * 0.4
                tone = apply_envelope(tone, attack=0.01, decay=0.08, sustain_level=0.3, release=0.15)
                mix_into(track, tone * 0.05, int(position * SAMPLE_RATE))
            position += duration

    return track


def generate_blips():
    track = np.zeros(RENDER_SAMPLES)

    np.random.seed(42)
    blip_notes = ["B5", "D6", "G5", "E6", "A5", "D6", "B5", "G6",
                  "E5", "F#5", "A5", "B5", "D6", "E6", "G5", "A5",
                  "B5", "D6", "F#6", "G6", "E5", "B5", "D6", "A5"]

    blip_times = sorted(np.random.uniform(1.0, RENDER_DURATION - 1.0, len(blip_notes)))

    for onset, note_name in zip(blip_times, blip_notes):
        freq = note_to_freq(note_name)
        blip_duration = np.random.uniform(0.06, 0.15)
        tone = sine_wave(freq, blip_duration)
        samples = len(tone)
        envelope = np.exp(-np.linspace(0, 10, samples))
        tone = tone * envelope
        mix_into(track, tone * 0.06, int(onset * SAMPLE_RATE))

    return track


def crossfade_loop(signal):
    crossfade_samples = int(CROSSFADE_DURATION * SAMPLE_RATE)
    output = signal[:LOOP_SAMPLES].copy()

    tail = signal[LOOP_SAMPLES: LOOP_SAMPLES + crossfade_samples]
    fade_out = np.linspace(1.0, 0.0, crossfade_samples)
    fade_in = np.linspace(0.0, 1.0, crossfade_samples)

    output[:crossfade_samples] = output[:crossfade_samples] * fade_in + tail * fade_out

    return output


def soft_clip(signal, threshold=0.85):
    return np.tanh(signal / threshold) * threshold


def save_wav(filename, signal):
    signal = np.clip(signal, -1.0, 1.0)
    int_signal = np.int16(signal * 32767 * 0.9)

    with wave.open(filename, "w") as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(SAMPLE_RATE)
        wav_file.writeframes(int_signal.tobytes())


def main():
    print("Generating pads...")
    pads = generate_pads()

    print("Generating bass...")
    bass = generate_bass()

    print("Generating melody...")
    melody = generate_melody()

    print("Generating counter melody...")
    counter_melody = generate_counter_melody()

    print("Generating blips...")
    blips = generate_blips()

    print("Mixing...")
    mix = pads + bass + melody + counter_melody + blips
    mix = soft_clip(mix)

    print("Crossfading for seamless loop...")
    loop = crossfade_loop(mix)

    output_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "public", "assets", "music")
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "ambient_loop.wav")

    print(f"Saving to {output_path}...")
    save_wav(output_path, loop)

    duration = len(loop) / SAMPLE_RATE
    print(f"Done! Seamless loop: {duration:.0f}s")


if __name__ == "__main__":
    main()
