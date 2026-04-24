import argparse
import math
import os
import random
import wave

import numpy as np


SAMPLE_RATE = 44100
BPM = 96
BEAT_DURATION = 60.0 / BPM
SIXTEENTH_DURATION = BEAT_DURATION / 4
LOOP_BARS = 24
BAR_DURATION = 4 * BEAT_DURATION
LOOP_DURATION = LOOP_BARS * BAR_DURATION
CROSSFADE_DURATION = 2.5
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


def square_wave(frequency: float, duration: float, duty: float = 0.5) -> np.ndarray:
    sample_count = int(duration * SAMPLE_RATE)
    time_axis = np.arange(sample_count) / SAMPLE_RATE
    phase = (time_axis * frequency) % 1.0
    return np.where(phase < duty, 1.0, -1.0)


def triangle_wave(frequency: float, duration: float) -> np.ndarray:
    sample_count = int(duration * SAMPLE_RATE)
    time_axis = np.arange(sample_count) / SAMPLE_RATE
    phase = (time_axis * frequency) % 1.0
    return 4.0 * np.abs(phase - 0.5) - 1.0


def sine_wave(frequency: float, duration: float) -> np.ndarray:
    sample_count = int(duration * SAMPLE_RATE)
    time_axis = np.arange(sample_count) / SAMPLE_RATE
    return np.sin(2.0 * np.pi * frequency * time_axis)


def sawtooth_wave(frequency: float, duration: float) -> np.ndarray:
    sample_count = int(duration * SAMPLE_RATE)
    time_axis = np.arange(sample_count) / SAMPLE_RATE
    phase = (time_axis * frequency) % 1.0
    return 2.0 * phase - 1.0


def pitch_slide(start_frequency: float, end_frequency: float, duration: float, duty: float = 0.5) -> np.ndarray:
    sample_count = int(duration * SAMPLE_RATE)
    frequency_curve = np.linspace(start_frequency, end_frequency, sample_count)
    phase = 2.0 * np.pi * np.cumsum(frequency_curve) / SAMPLE_RATE
    return np.where((phase % (2.0 * np.pi)) < (duty * 2.0 * np.pi), 1.0, -1.0)


def vibrato_triangle(frequency: float, duration: float, depth_cents: float = 15.0, rate_hz: float = 5.0) -> np.ndarray:
    sample_count = int(duration * SAMPLE_RATE)
    time_axis = np.arange(sample_count) / SAMPLE_RATE
    depth_ratio = 2.0 ** (depth_cents / 1200.0) - 1.0
    modulation = 1.0 + depth_ratio * np.sin(2.0 * np.pi * rate_hz * time_axis)
    instantaneous_frequency = frequency * modulation
    phase = 2.0 * np.pi * np.cumsum(instantaneous_frequency) / SAMPLE_RATE
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
              waveform: str = "triangle", duty: float = 0.5, amplitude: float = 0.18,
              attack: float = 0.02, decay: float = 0.08, sustain: float = 0.6, release: float = 0.2,
              vibrato: bool = False) -> None:
    if note_name == "REST":
        return
    frequency = note_to_frequency(note_name)
    if vibrato:
        tone = vibrato_triangle(frequency, duration_seconds, depth_cents=14.0, rate_hz=4.5)
    elif waveform == "square":
        tone = square_wave(frequency, duration_seconds, duty)
    elif waveform == "triangle":
        tone = triangle_wave(frequency, duration_seconds)
    elif waveform == "sine":
        tone = sine_wave(frequency, duration_seconds)
    elif waveform == "saw":
        tone = sawtooth_wave(frequency, duration_seconds)
    else:
        tone = triangle_wave(frequency, duration_seconds)
    envelope = adsr_envelope(len(tone), attack, decay, sustain, release)
    mix_into(track, tone * envelope * amplitude, int(position_seconds * SAMPLE_RATE))


def play_pad(track: np.ndarray, chord: list, position_seconds: float, duration_seconds: float,
             amplitude: float = 0.05) -> None:
    sample_count = int(duration_seconds * SAMPLE_RATE)
    if sample_count <= 0:
        return
    time_axis = np.arange(sample_count) / SAMPLE_RATE
    mixed = np.zeros(sample_count)
    for detune_cents in (-6.0, 0.0, 6.0):
        detune_ratio = 2.0 ** (detune_cents / 1200.0)
        for note_name in chord:
            frequency = note_to_frequency(note_name) * detune_ratio
            mixed += triangle_wave(frequency, duration_seconds)
    mixed /= max(len(chord) * 3, 1)
    slow_lfo = 0.85 + 0.15 * np.sin(2.0 * np.pi * 0.35 * time_axis)
    mixed *= slow_lfo
    attack_time = min(0.8, duration_seconds * 0.35)
    release_time = min(1.0, duration_seconds * 0.4)
    envelope = adsr_envelope(sample_count, attack_time, 0.2, 0.8, release_time)
    mix_into(track, mixed * envelope * amplitude, int(position_seconds * SAMPLE_RATE))


def kick_drum(duration: float = 0.16) -> np.ndarray:
    sample_count = int(duration * SAMPLE_RATE)
    time_axis = np.arange(sample_count) / SAMPLE_RATE
    frequency_sweep = 120.0 * np.exp(-time_axis * 30.0) + 52.0
    phase = 2.0 * np.pi * np.cumsum(frequency_sweep) / SAMPLE_RATE
    amplitude_curve = np.exp(-time_axis * 14.0)
    return np.sin(phase) * amplitude_curve


def rim_click(duration: float = 0.05) -> np.ndarray:
    sample_count = int(duration * SAMPLE_RATE)
    time_axis = np.arange(sample_count) / SAMPLE_RATE
    noise = np.random.uniform(-1.0, 1.0, sample_count) * 0.3
    tonal = np.sin(2.0 * np.pi * 1800.0 * time_axis) * 0.4
    tonal += np.sin(2.0 * np.pi * 2400.0 * time_axis) * 0.2
    amplitude_curve = np.exp(-time_axis * 120.0)
    return (noise + tonal) * amplitude_curve


def soft_snare(duration: float = 0.12) -> np.ndarray:
    sample_count = int(duration * SAMPLE_RATE)
    time_axis = np.arange(sample_count) / SAMPLE_RATE
    noise = np.random.uniform(-1.0, 1.0, sample_count)
    tonal = triangle_wave(260.0, duration) * 0.25
    amplitude_curve = np.exp(-time_axis * 28.0)
    return (noise * 0.5 + tonal) * amplitude_curve


def hat_click(duration: float = 0.04, soft: bool = False) -> np.ndarray:
    sample_count = int(duration * SAMPLE_RATE)
    time_axis = np.arange(sample_count) / SAMPLE_RATE
    noise = np.random.uniform(-1.0, 1.0, sample_count)
    if soft:
        noise *= 0.7
    amplitude_curve = np.exp(-time_axis * 90.0)
    return noise * amplitude_curve


def shaker_tick(duration: float = 0.07) -> np.ndarray:
    sample_count = int(duration * SAMPLE_RATE)
    time_axis = np.arange(sample_count) / SAMPLE_RATE
    noise = np.random.uniform(-1.0, 1.0, sample_count)
    tilt = np.sin(2.0 * np.pi * 5200.0 * time_axis) * 0.25
    amplitude_curve = np.exp(-time_axis * 42.0)
    return (noise + tilt) * amplitude_curve


def cowbell_chirp(duration: float = 0.1) -> np.ndarray:
    sample_count = int(duration * SAMPLE_RATE)
    time_axis = np.arange(sample_count) / SAMPLE_RATE
    high_tone = triangle_wave(780.0, duration)
    low_tone = triangle_wave(540.0, duration)
    amplitude_curve = np.exp(-time_axis * 30.0)
    return (high_tone + low_tone) * 0.35 * amplitude_curve


def generate_pad(track: np.ndarray) -> None:
    chord_progression = [
        ["C3", "E3", "G3", "B3"],
        ["F3", "A3", "C4", "E4"],
        ["A2", "C3", "E3", "G3"],
        ["G2", "B2", "D3", "F3"],
    ]
    bar_index = 0
    position = 0.0
    while position < RENDER_DURATION:
        chord = chord_progression[bar_index % len(chord_progression)]
        pad_duration = BAR_DURATION * 1.05
        play_pad(track, chord, position, pad_duration, amplitude=0.09)
        position += BAR_DURATION
        bar_index += 1


def generate_bass(track: np.ndarray) -> None:
    bass_pattern_bar = [
        ("C2", 4), ("G2", 2), ("C2", 2), ("Eb2", 4), ("G2", 4),
        ("F2", 4), ("C3", 2), ("F2", 2), ("A2", 4), ("C3", 4),
        ("A1", 4), ("E2", 2), ("A1", 2), ("C2", 4), ("E2", 4),
        ("G1", 4), ("D2", 2), ("G1", 2), ("B1", 4), ("D2", 4),
    ]
    notes_per_bar = 5
    position = 0.0
    bar_index = 0
    while position < RENDER_DURATION:
        chord_index = (bar_index % 4) * notes_per_bar
        bar_notes = bass_pattern_bar[chord_index:chord_index + notes_per_bar]
        for note_name, sixteenths in bar_notes:
            if position >= RENDER_DURATION:
                break
            note_duration = sixteenths * SIXTEENTH_DURATION
            play_note(
                track, note_name, position, note_duration * 0.92,
                waveform="triangle", amplitude=0.17,
                attack=0.012, decay=0.06, sustain=0.72, release=0.08,
            )
            position += note_duration
        bar_index += 1


def generate_lead(track: np.ndarray) -> None:
    melody_a = [
        ("E5", 4), ("G5", 4), ("C6", 6), ("B5", 2),
        ("A5", 4), ("G5", 2), ("E5", 2), ("C5", 8),
        ("REST", 4), ("A5", 2), ("C6", 2), ("G5", 4), ("E5", 4),
        ("D5", 4), ("G5", 4), ("B5", 8),
    ]
    melody_b = [
        ("C6", 6), ("B5", 2), ("A5", 4), ("G5", 4),
        ("F5", 4), ("A5", 4), ("C6", 8),
        ("E5", 2), ("G5", 2), ("A5", 4), ("G5", 4), ("REST", 4),
        ("D5", 4), ("F5", 4), ("G5", 4), ("REST", 4),
    ]

    sequence = []
    for section in [melody_a, melody_a, melody_b]:
        sequence.extend(section)

    position = 0.0
    for note_name, sixteenths in sequence:
        if position >= RENDER_DURATION:
            break
        note_duration = sixteenths * SIXTEENTH_DURATION
        should_vibrato = sixteenths >= 6 and note_name != "REST"
        play_note(
            track, note_name, position, note_duration * 0.95,
            waveform="triangle", amplitude=0.11,
            attack=0.025, decay=0.1, sustain=0.65, release=0.25,
            vibrato=should_vibrato,
        )
        position += note_duration


def generate_arp(track: np.ndarray) -> None:
    chord_progression = [
        ["C4", "E4", "G4", "C5"],
        ["F4", "A4", "C5", "F5"],
        ["A3", "C4", "E4", "A4"],
        ["G3", "B3", "D4", "G4"],
    ]
    bar_index = 0
    position = 0.0
    while position < RENDER_DURATION:
        chord = chord_progression[bar_index % len(chord_progression)]
        pattern = chord + chord[::-1][1:3]
        for step_index in range(8):
            if position >= RENDER_DURATION:
                break
            note_name = pattern[step_index % len(pattern)]
            note_duration = SIXTEENTH_DURATION * 2
            play_note(
                track, note_name, position, note_duration * 0.88,
                waveform="triangle", amplitude=0.05,
                attack=0.008, decay=0.05, sustain=0.4, release=0.08,
            )
            position += note_duration
        bar_index += 1


def generate_drums(track: np.ndarray) -> None:
    kick_sixteenths = {0, 10}
    snare_sixteenths = {4, 12}
    shaker_sixteenths = set(range(0, 16, 2))
    rim_sixteenths = {7}

    bar_index = 0
    while bar_index * BAR_DURATION < RENDER_DURATION:
        bar_start = bar_index * BAR_DURATION
        for step in range(16):
            step_time = bar_start + step * SIXTEENTH_DURATION
            if step_time >= RENDER_DURATION:
                break
            if step in kick_sixteenths:
                mix_into(track, kick_drum() * 0.42, int(step_time * SAMPLE_RATE))
            if step in snare_sixteenths:
                if random.random() < 0.7:
                    mix_into(track, rim_click() * 0.2, int(step_time * SAMPLE_RATE))
                else:
                    mix_into(track, soft_snare() * 0.18, int(step_time * SAMPLE_RATE))
            if step in rim_sixteenths and random.random() < 0.4:
                mix_into(track, rim_click() * 0.11, int(step_time * SAMPLE_RATE))
            if step in shaker_sixteenths:
                amplitude = 0.05 if step % 4 == 0 else 0.035
                mix_into(track, shaker_tick() * amplitude, int(step_time * SAMPLE_RATE))
            if step % 4 == 2:
                mix_into(track, hat_click(soft=True) * 0.04, int(step_time * SAMPLE_RATE))
        bar_index += 1


def generate_quirks(track: np.ndarray) -> None:
    eight_bar_duration = 8 * BAR_DURATION

    slide_offsets = [eight_bar_duration - 0.4]
    for section_start in np.arange(0.0, LOOP_DURATION, eight_bar_duration):
        for offset in slide_offsets:
            quirk_time = section_start + offset
            if quirk_time >= LOOP_DURATION:
                continue
            start_frequency = note_to_frequency("G5")
            end_frequency = note_to_frequency("D5")
            slide_duration = 0.35
            slide = pitch_slide(start_frequency, end_frequency, slide_duration, duty=0.3)
            envelope = adsr_envelope(len(slide), 0.02, 0.12, 0.4, 0.2)
            mix_into(track, slide * envelope * 0.05, int(quirk_time * SAMPLE_RATE))

    cowbell_bar_offsets = [5.5]
    for section_start in np.arange(0.0, LOOP_DURATION, eight_bar_duration):
        for bar_offset in cowbell_bar_offsets:
            cowbell_time = section_start + bar_offset * BAR_DURATION
            if cowbell_time >= LOOP_DURATION:
                continue
            bell = cowbell_chirp() * 0.07
            mix_into(track, bell, int(cowbell_time * SAMPLE_RATE))

    blip_count = 6
    for _ in range(blip_count):
        onset = random.uniform(1.0, LOOP_DURATION - 1.0)
        pitch = random.choice(["C6", "D6", "E6", "G5", "A5", "E6"])
        frequency = note_to_frequency(pitch)
        blip_duration = random.uniform(0.08, 0.16)
        tone = triangle_wave(frequency, blip_duration)
        envelope = np.exp(-np.linspace(0.0, 7.0, len(tone)))
        mix_into(track, tone * envelope * 0.035, int(onset * SAMPLE_RATE))


def apply_gentle_wah(track: np.ndarray) -> np.ndarray:
    wah_rate_hz = BPM / 60.0 / 4.0
    time_axis = np.arange(len(track)) / SAMPLE_RATE
    lfo = 0.5 + 0.5 * np.sin(2.0 * np.pi * wah_rate_hz * time_axis)
    modulation = 0.75 + 0.25 * lfo
    return track * modulation


def apply_simple_delay(track: np.ndarray, delay_seconds: float = 0.28, feedback: float = 0.28,
                       mix: float = 0.25) -> np.ndarray:
    delay_samples = int(delay_seconds * SAMPLE_RATE)
    output = track.copy()
    buffer = track.copy()
    for tap_index in range(1, 4):
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
    parser = argparse.ArgumentParser(description="Generate a chill ambient chiptune loop for JuiceJuicyJuice.")
    default_output = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "public", "assets", "music", "funky_loop.wav",
    )
    parser.add_argument("--output", "-o", default=default_output, help="Output .wav path")
    parser.add_argument("--seed", type=int, default=1337, help="Random seed")
    arguments = parser.parse_args()

    np.random.seed(arguments.seed)
    random.seed(arguments.seed)

    print(f"Tempo: {BPM} BPM  |  Loop length: {LOOP_DURATION:.2f}s  |  Bars: {LOOP_BARS}")

    pad_track = np.zeros(RENDER_SAMPLES)
    bass_track = np.zeros(RENDER_SAMPLES)
    lead_track = np.zeros(RENDER_SAMPLES)
    arp_track = np.zeros(RENDER_SAMPLES)
    drums_track = np.zeros(RENDER_SAMPLES)
    quirks_track = np.zeros(RENDER_SAMPLES)

    print("Dreamy detuned chord pad...")
    generate_pad(pad_track)
    print("Mellow triangle bass...")
    generate_bass(bass_track)
    print("Soft triangle lead...")
    generate_lead(lead_track)
    print("Gentle arpeggios with slow wah...")
    generate_arp(arp_track)
    arp_track = apply_gentle_wah(arp_track)
    print("Brushed downtempo drums...")
    generate_drums(drums_track)
    print("Subtle blips and cowbell sparkles...")
    generate_quirks(quirks_track)

    lead_track = apply_simple_delay(lead_track, delay_seconds=BEAT_DURATION * 0.75,
                                     feedback=0.32, mix=0.28)
    quirks_track = apply_simple_delay(quirks_track, delay_seconds=BEAT_DURATION * 0.5,
                                       feedback=0.35, mix=0.3)

    mixed = pad_track + bass_track + lead_track + arp_track + drums_track + quirks_track
    mixed = soft_clip(mixed, threshold=0.8)

    print("Crossfading for seamless loop...")
    loop = crossfade_loop(mixed)

    os.makedirs(os.path.dirname(arguments.output), exist_ok=True)
    save_wav(arguments.output, loop)
    duration_seconds = len(loop) / SAMPLE_RATE
    print(f"Saved: {arguments.output}  ({duration_seconds:.2f}s)")


if __name__ == "__main__":
    main()
