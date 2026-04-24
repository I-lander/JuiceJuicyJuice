import argparse
import os
import random
import wave

import numpy as np


SAMPLE_RATE = 44100
BPM = 72
BEAT_DURATION = 60.0 / BPM
BEATS_PER_BAR = 3
BAR_DURATION = BEATS_PER_BAR * BEAT_DURATION
EIGHTH_DURATION = BEAT_DURATION / 2
SIXTEENTH_DURATION = BEAT_DURATION / 4
LOOP_BARS = 16
LOOP_DURATION = LOOP_BARS * BAR_DURATION
CROSSFADE_DURATION = 3.0
RENDER_DURATION = LOOP_DURATION + CROSSFADE_DURATION

LOOP_SAMPLES = int(LOOP_DURATION * SAMPLE_RATE)
RENDER_SAMPLES = int(RENDER_DURATION * SAMPLE_RATE)


NOTE_OFFSETS = {
    "C": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3,
    "E": 4, "F": 5, "F#": 6, "Gb": 6, "G": 7, "G#": 8, "Ab": 8,
    "A": 9, "A#": 10, "Bb": 10, "B": 11,
}


def note_to_frequency(note_name: str) -> float:
    octave = int(note_name[-1])
    semitone = NOTE_OFFSETS[note_name[:-1]]
    midi_number = 12 * (octave + 1) + semitone
    return 440.0 * (2.0 ** ((midi_number - 69) / 12.0))


def triangle_wave(frequency: float, duration: float) -> np.ndarray:
    sample_count = int(duration * SAMPLE_RATE)
    time_axis = np.arange(sample_count) / SAMPLE_RATE
    phase = (time_axis * frequency) % 1.0
    return 4.0 * np.abs(phase - 0.5) - 1.0


def sine_wave(frequency: float, duration: float) -> np.ndarray:
    sample_count = int(duration * SAMPLE_RATE)
    time_axis = np.arange(sample_count) / SAMPLE_RATE
    return np.sin(2.0 * np.pi * frequency * time_axis)


def square_wave(frequency: float, duration: float, duty: float = 0.5) -> np.ndarray:
    sample_count = int(duration * SAMPLE_RATE)
    time_axis = np.arange(sample_count) / SAMPLE_RATE
    phase = (time_axis * frequency) % 1.0
    return np.where(phase < duty, 1.0, -1.0)


def wobble_triangle(frequency: float, duration: float,
                    depth_cents: float = 35.0, rate_hz: float = 3.2,
                    drift_cents: float = 22.0, drift_rate_hz: float = 0.18) -> np.ndarray:
    sample_count = int(duration * SAMPLE_RATE)
    time_axis = np.arange(sample_count) / SAMPLE_RATE
    vibrato_ratio = 2.0 ** (depth_cents / 1200.0) - 1.0
    drift_ratio = 2.0 ** (drift_cents / 1200.0) - 1.0
    vibrato = vibrato_ratio * np.sin(2.0 * np.pi * rate_hz * time_axis)
    drift = drift_ratio * np.sin(2.0 * np.pi * drift_rate_hz * time_axis + 0.7)
    modulation = 1.0 + vibrato + drift
    instantaneous_frequency = frequency * modulation
    phase = 2.0 * np.pi * np.cumsum(instantaneous_frequency) / SAMPLE_RATE
    wrapped = (phase / (2.0 * np.pi)) % 1.0
    return 4.0 * np.abs(wrapped - 0.5) - 1.0


def pitch_slide(start_frequency: float, end_frequency: float, duration: float,
                waveform: str = "triangle", duty: float = 0.4) -> np.ndarray:
    sample_count = int(duration * SAMPLE_RATE)
    frequency_curve = np.linspace(start_frequency, end_frequency, sample_count)
    phase = 2.0 * np.pi * np.cumsum(frequency_curve) / SAMPLE_RATE
    if waveform == "square":
        return np.where((phase % (2.0 * np.pi)) < (duty * 2.0 * np.pi), 1.0, -1.0)
    wrapped = (phase / (2.0 * np.pi)) % 1.0
    return 4.0 * np.abs(wrapped - 0.5) - 1.0


def adsr_envelope(length_samples: int, attack: float, decay: float, sustain_level: float, release: float) -> np.ndarray:
    attack_samples = min(int(attack * SAMPLE_RATE), length_samples)
    decay_samples = min(int(decay * SAMPLE_RATE), length_samples - attack_samples)
    release_samples = min(int(release * SAMPLE_RATE), length_samples - attack_samples - decay_samples)
    sustain_samples = length_samples - attack_samples - decay_samples - release_samples

    attack_curve = np.linspace(0.0, 1.0, attack_samples) if attack_samples else np.array([])
    decay_curve = np.linspace(1.0, sustain_level, decay_samples) if decay_samples else np.array([])
    sustain_curve = np.full(max(sustain_samples, 0), sustain_level)
    release_curve = np.linspace(sustain_level, 0.0, release_samples) if release_samples else np.array([])

    envelope = np.concatenate([attack_curve, decay_curve, sustain_curve, release_curve])
    if len(envelope) < length_samples:
        envelope = np.pad(envelope, (0, length_samples - len(envelope)))
    return envelope[:length_samples]


def mix_into(target: np.ndarray, signal: np.ndarray, offset_samples: int) -> None:
    if offset_samples < 0:
        signal = signal[-offset_samples:]
        offset_samples = 0
    end_sample = offset_samples + len(signal)
    if end_sample > len(target):
        signal = signal[: len(target) - offset_samples]
        end_sample = len(target)
    target[offset_samples:end_sample] += signal


def play_note(track: np.ndarray, note_name: str, position_seconds: float, duration_seconds: float,
              waveform: str = "triangle", duty: float = 0.5, amplitude: float = 0.14,
              attack: float = 0.04, decay: float = 0.12, sustain: float = 0.6, release: float = 0.4,
              wobble: bool = False, detune_cents: float = 0.0) -> None:
    if note_name == "REST":
        return
    frequency = note_to_frequency(note_name) * (2.0 ** (detune_cents / 1200.0))
    if wobble:
        tone = wobble_triangle(frequency, duration_seconds)
    elif waveform == "square":
        tone = square_wave(frequency, duration_seconds, duty)
    elif waveform == "triangle":
        tone = triangle_wave(frequency, duration_seconds)
    elif waveform == "sine":
        tone = sine_wave(frequency, duration_seconds)
    else:
        tone = triangle_wave(frequency, duration_seconds)
    envelope = adsr_envelope(len(tone), attack, decay, sustain, release)
    mix_into(track, tone * envelope * amplitude, int(position_seconds * SAMPLE_RATE))


def play_pad(track: np.ndarray, chord: list, position_seconds: float, duration_seconds: float,
             amplitude: float = 0.06, detune_spread_cents: float = 14.0) -> None:
    sample_count = int(duration_seconds * SAMPLE_RATE)
    if sample_count <= 0:
        return
    time_axis = np.arange(sample_count) / SAMPLE_RATE
    mixed = np.zeros(sample_count)
    detune_steps = (-detune_spread_cents, -detune_spread_cents * 0.35, 0.0,
                    detune_spread_cents * 0.4, detune_spread_cents)
    for detune_cents in detune_steps:
        detune_ratio = 2.0 ** (detune_cents / 1200.0)
        for note_name in chord:
            frequency = note_to_frequency(note_name) * detune_ratio
            mixed += triangle_wave(frequency, duration_seconds)
    mixed /= max(len(chord) * len(detune_steps), 1)
    slow_breath = 0.78 + 0.22 * np.sin(2.0 * np.pi * 0.22 * time_axis + 1.1)
    mixed *= slow_breath
    attack_time = min(1.2, duration_seconds * 0.4)
    release_time = min(1.4, duration_seconds * 0.45)
    envelope = adsr_envelope(sample_count, attack_time, 0.3, 0.8, release_time)
    mix_into(track, mixed * envelope * amplitude, int(position_seconds * SAMPLE_RATE))


def soft_kick(duration: float = 0.22) -> np.ndarray:
    sample_count = int(duration * SAMPLE_RATE)
    time_axis = np.arange(sample_count) / SAMPLE_RATE
    frequency_sweep = 95.0 * np.exp(-time_axis * 22.0) + 44.0
    phase = 2.0 * np.pi * np.cumsum(frequency_sweep) / SAMPLE_RATE
    amplitude_curve = np.exp(-time_axis * 9.0)
    return np.sin(phase) * amplitude_curve


def brush_tap(duration: float = 0.12) -> np.ndarray:
    sample_count = int(duration * SAMPLE_RATE)
    time_axis = np.arange(sample_count) / SAMPLE_RATE
    noise = np.random.uniform(-1.0, 1.0, sample_count) * 0.45
    amplitude_curve = np.exp(-time_axis * 26.0)
    return noise * amplitude_curve


def wood_tick(duration: float = 0.06) -> np.ndarray:
    sample_count = int(duration * SAMPLE_RATE)
    time_axis = np.arange(sample_count) / SAMPLE_RATE
    noise = np.random.uniform(-1.0, 1.0, sample_count) * 0.25
    tonal = np.sin(2.0 * np.pi * 1450.0 * time_axis) * 0.35
    tonal += np.sin(2.0 * np.pi * 2100.0 * time_axis) * 0.18
    amplitude_curve = np.exp(-time_axis * 110.0)
    return (noise + tonal) * amplitude_curve


def glass_ping(frequency: float, duration: float = 0.9) -> np.ndarray:
    sample_count = int(duration * SAMPLE_RATE)
    time_axis = np.arange(sample_count) / SAMPLE_RATE
    fundamental = np.sin(2.0 * np.pi * frequency * time_axis)
    inharmonic = np.sin(2.0 * np.pi * frequency * 2.76 * time_axis) * 0.35
    higher = np.sin(2.0 * np.pi * frequency * 5.4 * time_axis) * 0.12
    amplitude_curve = np.exp(-time_axis * 4.5)
    return (fundamental + inharmonic + higher) * amplitude_curve


CHORD_PROGRESSION = [
    ["A2", "C3", "E3", "A3"],
    ["D3", "F3", "A3", "D4"],
    ["A2", "C3", "E3", "G3"],
    ["E2", "G#3", "B3", "D4"],
    ["F2", "A2", "C3", "F3"],
    ["D3", "F3", "A3", "C4"],
    ["E2", "G#3", "B3", "E4"],
    ["A2", "C3", "E3", "A3"],
]


def generate_pad(track: np.ndarray) -> None:
    bar_index = 0
    position = 0.0
    while position < RENDER_DURATION:
        chord = CHORD_PROGRESSION[bar_index % len(CHORD_PROGRESSION)]
        play_pad(track, chord, position, BAR_DURATION * 1.08, amplitude=0.1)
        position += BAR_DURATION
        bar_index += 1


def generate_bass(track: np.ndarray) -> None:
    root_per_bar = [
        ("A1", "E2", "A2"),
        ("D2", "A2", "D2"),
        ("A1", "E2", "C2"),
        ("E2", "B2", "E2"),
        ("F1", "C2", "F2"),
        ("D2", "A2", "F2"),
        ("E2", "B2", "G#2"),
        ("A1", "E2", "A2"),
    ]
    bar_index = 0
    position = 0.0
    while position < RENDER_DURATION:
        beats = root_per_bar[bar_index % len(root_per_bar)]
        for beat_index, note_name in enumerate(beats):
            beat_position = position + beat_index * BEAT_DURATION
            if beat_position >= RENDER_DURATION:
                break
            accent = 0.2 if beat_index == 0 else 0.11
            play_note(
                track, note_name, beat_position, BEAT_DURATION * 0.85,
                waveform="triangle", amplitude=accent,
                attack=0.015, decay=0.12, sustain=0.55, release=0.18,
            )
        position += BAR_DURATION
        bar_index += 1


def generate_lead(track: np.ndarray) -> None:
    phrase_a = [
        ("A5", 4), ("G5", 2), ("E5", 2), ("A5", 2), ("B5", 2),
        ("C6", 6), ("B5", 2), ("A5", 4),
        ("G5", 4), ("E5", 2), ("D5", 2), ("E5", 4),
        ("G#5", 6), ("B5", 2), ("E5", 4),
    ]
    phrase_b = [
        ("C6", 4), ("A5", 2), ("F5", 2), ("E5", 4),
        ("D5", 4), ("F5", 2), ("A5", 2), ("C6", 4),
        ("B5", 6), ("G#5", 2), ("E5", 4),
        ("A5", 8), ("REST", 4),
    ]

    sequence = phrase_a + phrase_b

    position = 0.0
    note_index = 0
    for note_name, eighths in sequence:
        if position >= RENDER_DURATION:
            break
        note_duration = eighths * EIGHTH_DURATION
        sustained = eighths >= 4 and note_name != "REST"
        slight_flatten = -8.0 if (note_index % 5 == 3 and note_name != "REST") else 0.0
        play_note(
            track, note_name, position, note_duration * 0.95,
            waveform="triangle", amplitude=0.095,
            attack=0.06, decay=0.18, sustain=0.6, release=0.5,
            wobble=sustained, detune_cents=slight_flatten,
        )
        position += note_duration
        note_index += 1


def generate_music_box(track: np.ndarray) -> None:
    bar_index = 0
    position = 0.0
    skip_bars = {2, 5, 10, 13}
    while position < RENDER_DURATION:
        if bar_index % len(CHORD_PROGRESSION) not in skip_bars:
            chord = CHORD_PROGRESSION[bar_index % len(CHORD_PROGRESSION)]
            pattern = [chord[2], chord[3], chord[2], chord[1], chord[2], chord[3]]
            for step_index, note_name in enumerate(pattern):
                step_position = position + step_index * EIGHTH_DURATION
                if step_position >= RENDER_DURATION:
                    break
                base_frequency = note_to_frequency(note_name) * 2.0
                tone = glass_ping(base_frequency, duration=EIGHTH_DURATION * 4.0)
                envelope = adsr_envelope(len(tone), 0.005, 0.05, 0.35, 0.5)
                amplitude = 0.045 if step_index % 2 == 0 else 0.03
                mix_into(track, tone * envelope * amplitude,
                         int(step_position * SAMPLE_RATE))
        position += BAR_DURATION
        bar_index += 1


def generate_waltz_drums(track: np.ndarray) -> None:
    bar_index = 0
    while bar_index * BAR_DURATION < RENDER_DURATION:
        bar_start = bar_index * BAR_DURATION
        kick_time = bar_start
        mix_into(track, soft_kick() * 0.32, int(kick_time * SAMPLE_RATE))

        for beat_index in (1, 2):
            beat_time = bar_start + beat_index * BEAT_DURATION
            if beat_time >= RENDER_DURATION:
                break
            amplitude = 0.11 if random.random() > 0.15 else 0.06
            mix_into(track, brush_tap() * amplitude, int(beat_time * SAMPLE_RATE))

        if bar_index % 4 == 3:
            stumble_time = bar_start + 2.5 * BEAT_DURATION
            if stumble_time < RENDER_DURATION:
                mix_into(track, wood_tick() * 0.09, int(stumble_time * SAMPLE_RATE))

        if random.random() < 0.3:
            ghost_time = bar_start + 1.5 * BEAT_DURATION
            if ghost_time < RENDER_DURATION:
                mix_into(track, wood_tick() * 0.05, int(ghost_time * SAMPLE_RATE))

        bar_index += 1


def generate_quirks(track: np.ndarray) -> None:
    phrase_length = 4 * BAR_DURATION
    for phrase_start in np.arange(0.0, LOOP_DURATION, phrase_length):
        slide_time = phrase_start + phrase_length - 0.9
        if slide_time < LOOP_DURATION:
            start_frequency = note_to_frequency("E5")
            end_frequency = note_to_frequency("A4")
            slide = pitch_slide(start_frequency, end_frequency, 0.8, waveform="triangle")
            envelope = adsr_envelope(len(slide), 0.05, 0.15, 0.4, 0.5)
            mix_into(track, slide * envelope * 0.055,
                     int(slide_time * SAMPLE_RATE))

    dissonant_pitches = ["Bb5", "F#5", "D#5", "C#6"]
    for _ in range(5):
        onset = random.uniform(1.0, LOOP_DURATION - 1.5)
        pitch_name = random.choice(dissonant_pitches)
        frequency = note_to_frequency(pitch_name)
        blip_duration = random.uniform(0.18, 0.32)
        tone = triangle_wave(frequency, blip_duration)
        envelope = np.exp(-np.linspace(0.0, 5.0, len(tone)))
        mix_into(track, tone * envelope * 0.03, int(onset * SAMPLE_RATE))

    whistle_count = 3
    for _ in range(whistle_count):
        onset = random.uniform(2.0, LOOP_DURATION - 2.0)
        start_note = random.choice(["C6", "D6", "E6"])
        end_note = random.choice(["A5", "G5", "F5"])
        start_frequency = note_to_frequency(start_note)
        end_frequency = note_to_frequency(end_note)
        whistle_duration = random.uniform(0.5, 0.9)
        whistle = pitch_slide(start_frequency, end_frequency, whistle_duration, waveform="triangle")
        envelope = adsr_envelope(len(whistle), 0.08, 0.2, 0.5, 0.3)
        mix_into(track, whistle * envelope * 0.035, int(onset * SAMPLE_RATE))


def apply_slow_tremolo(track: np.ndarray, rate_hz: float = 1.6, depth: float = 0.18) -> np.ndarray:
    time_axis = np.arange(len(track)) / SAMPLE_RATE
    modulation = 1.0 - depth + depth * (0.5 + 0.5 * np.sin(2.0 * np.pi * rate_hz * time_axis))
    return track * modulation


def apply_simple_delay(track: np.ndarray, delay_seconds: float, feedback: float = 0.3,
                       mix: float = 0.3) -> np.ndarray:
    delay_samples = int(delay_seconds * SAMPLE_RATE)
    output = track.copy()
    buffer = track.copy()
    for tap_index in range(1, 5):
        offset = delay_samples * tap_index
        if offset >= len(track):
            break
        amplitude = mix * (feedback ** (tap_index - 1))
        output[offset:] += buffer[:-offset] * amplitude
    return output


def soft_clip(signal: np.ndarray, threshold: float = 0.85) -> np.ndarray:
    return np.tanh(signal / threshold) * threshold


def crossfade_loop(signal: np.ndarray) -> np.ndarray:
    crossfade_samples = int(CROSSFADE_DURATION * SAMPLE_RATE)
    output = signal[:LOOP_SAMPLES].copy()
    tail = signal[LOOP_SAMPLES:LOOP_SAMPLES + crossfade_samples]
    if len(tail) < crossfade_samples:
        tail = np.pad(tail, (0, crossfade_samples - len(tail)))
    fade_in = np.linspace(0.0, 1.0, crossfade_samples)
    fade_out = np.linspace(1.0, 0.0, crossfade_samples)
    output[:crossfade_samples] = output[:crossfade_samples] * fade_in + tail * fade_out
    return output


def save_wav(filepath: str, signal: np.ndarray) -> None:
    signal = np.clip(signal, -1.0, 1.0)
    integer_signal = np.int16(signal * 32767 * 0.9)
    with wave.open(filepath, "w") as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(SAMPLE_RATE)
        wav_file.writeframes(integer_signal.tobytes())


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate a melancholic off-kilter waltz loop for the prestige screen."
    )
    default_output = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "public", "assets", "music", "prestige_loop.wav",
    )
    parser.add_argument("--output", "-o", default=default_output, help="Output .wav path")
    parser.add_argument("--seed", type=int, default=2718, help="Random seed")
    arguments = parser.parse_args()

    np.random.seed(arguments.seed)
    random.seed(arguments.seed)

    print(f"Tempo: {BPM} BPM (3/4 waltz)  |  Loop length: {LOOP_DURATION:.2f}s  |  Bars: {LOOP_BARS}")

    pad_track = np.zeros(RENDER_SAMPLES)
    bass_track = np.zeros(RENDER_SAMPLES)
    lead_track = np.zeros(RENDER_SAMPLES)
    music_box_track = np.zeros(RENDER_SAMPLES)
    drums_track = np.zeros(RENDER_SAMPLES)
    quirks_track = np.zeros(RENDER_SAMPLES)

    print("Dreamy detuned minor pad...")
    generate_pad(pad_track)
    print("Low melancholy bass in 3/4...")
    generate_bass(bass_track)
    print("Crying wobbly lead with occasional flat notes...")
    generate_lead(lead_track)
    print("Broken music box arpeggios...")
    generate_music_box(music_box_track)
    print("Slow stumbling waltz drums...")
    generate_waltz_drums(drums_track)
    print("Dissonant quirks and descending whistles...")
    generate_quirks(quirks_track)

    lead_track = apply_simple_delay(lead_track, delay_seconds=BEAT_DURATION * 0.66,
                                    feedback=0.36, mix=0.32)
    music_box_track = apply_simple_delay(music_box_track, delay_seconds=BEAT_DURATION * 0.5,
                                         feedback=0.4, mix=0.35)
    quirks_track = apply_simple_delay(quirks_track, delay_seconds=BEAT_DURATION * 0.75,
                                      feedback=0.3, mix=0.28)

    pad_track = apply_slow_tremolo(pad_track, rate_hz=0.7, depth=0.12)

    mixed = pad_track + bass_track + lead_track + music_box_track + drums_track + quirks_track
    mixed = soft_clip(mixed, threshold=0.8)

    print("Crossfading for seamless loop...")
    loop = crossfade_loop(mixed)

    os.makedirs(os.path.dirname(arguments.output), exist_ok=True)
    save_wav(arguments.output, loop)
    duration_seconds = len(loop) / SAMPLE_RATE
    print(f"Saved: {arguments.output}  ({duration_seconds:.2f}s)")


if __name__ == "__main__":
    main()
