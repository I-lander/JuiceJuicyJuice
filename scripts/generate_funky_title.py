import argparse
import os
import random
import wave

import numpy as np


SAMPLE_RATE = 44100
BPM = 128
BEAT_DURATION = 60.0 / BPM
SIXTEENTH_DURATION = BEAT_DURATION / 4
LOOP_BARS = 32
BAR_DURATION = 4 * BEAT_DURATION
LOOP_DURATION = LOOP_BARS * BAR_DURATION
TAIL_DURATION = 2.0
RENDER_DURATION = LOOP_DURATION + TAIL_DURATION

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


def sawtooth_wave(frequency: float, duration: float) -> np.ndarray:
    sample_count = int(duration * SAMPLE_RATE)
    time_axis = np.arange(sample_count) / SAMPLE_RATE
    phase = (time_axis * frequency) % 1.0
    return 2.0 * phase - 1.0


def duty_mod_square(frequency: float, duration: float, duty_start: float = 0.2,
                    duty_end: float = 0.75, rate_hz: float = 3.5) -> np.ndarray:
    sample_count = int(duration * SAMPLE_RATE)
    time_axis = np.arange(sample_count) / SAMPLE_RATE
    center = (duty_start + duty_end) / 2.0
    depth = (duty_end - duty_start) / 2.0
    duty_curve = center + depth * np.sin(2.0 * np.pi * rate_hz * time_axis)
    phase = (time_axis * frequency) % 1.0
    return np.where(phase < duty_curve, 1.0, -1.0)


def pitch_slide(start_frequency: float, end_frequency: float, duration: float,
                duty: float = 0.5, exponential: bool = True) -> np.ndarray:
    sample_count = int(duration * SAMPLE_RATE)
    if exponential and start_frequency > 0 and end_frequency > 0:
        ratio_curve = np.linspace(0.0, 1.0, sample_count)
        frequency_curve = start_frequency * (end_frequency / start_frequency) ** ratio_curve
    else:
        frequency_curve = np.linspace(start_frequency, end_frequency, sample_count)
    phase = 2.0 * np.pi * np.cumsum(frequency_curve) / SAMPLE_RATE
    return np.where((phase % (2.0 * np.pi)) < (duty * 2.0 * np.pi), 1.0, -1.0)


def vibrato_square(frequency: float, duration: float, depth_cents: float = 25.0,
                   rate_hz: float = 6.5, duty: float = 0.45) -> np.ndarray:
    sample_count = int(duration * SAMPLE_RATE)
    time_axis = np.arange(sample_count) / SAMPLE_RATE
    depth_ratio = 2.0 ** (depth_cents / 1200.0) - 1.0
    modulation = 1.0 + depth_ratio * np.sin(2.0 * np.pi * rate_hz * time_axis)
    instantaneous_frequency = frequency * modulation
    phase = 2.0 * np.pi * np.cumsum(instantaneous_frequency) / SAMPLE_RATE
    wrapped = (phase / (2.0 * np.pi)) % 1.0
    return np.where(wrapped < duty, 1.0, -1.0)


def adsr_envelope(length_samples: int, attack: float, decay: float,
                  sustain_level: float, release: float) -> np.ndarray:
    attack_samples = min(int(attack * SAMPLE_RATE), length_samples)
    decay_samples = min(int(decay * SAMPLE_RATE), length_samples - attack_samples)
    release_samples = min(int(release * SAMPLE_RATE),
                         length_samples - attack_samples - decay_samples)
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
              waveform: str = "square", duty: float = 0.5, amplitude: float = 0.15,
              attack: float = 0.003, decay: float = 0.05, sustain: float = 0.6, release: float = 0.08,
              vibrato: bool = False, slide_from: str = None) -> None:
    if note_name == "REST" or duration_seconds <= 0:
        return
    frequency = note_to_frequency(note_name)
    if slide_from is not None:
        tone = pitch_slide(note_to_frequency(slide_from), frequency, duration_seconds, duty=duty)
    elif vibrato:
        tone = vibrato_square(frequency, duration_seconds, depth_cents=22.0, rate_hz=6.5, duty=duty)
    elif waveform == "square":
        tone = square_wave(frequency, duration_seconds, duty)
    elif waveform == "triangle":
        tone = triangle_wave(frequency, duration_seconds)
    elif waveform == "saw":
        tone = sawtooth_wave(frequency, duration_seconds)
    elif waveform == "dutymod":
        tone = duty_mod_square(frequency, duration_seconds)
    else:
        tone = square_wave(frequency, duration_seconds, duty)
    envelope = adsr_envelope(len(tone), attack, decay, sustain, release)
    mix_into(track, tone * envelope * amplitude, int(position_seconds * SAMPLE_RATE))


def chord_stab(track: np.ndarray, chord: list, position_seconds: float,
               duration_seconds: float, amplitude: float = 0.07) -> None:
    sample_count = int(duration_seconds * SAMPLE_RATE)
    if sample_count <= 0:
        return
    mixed = np.zeros(sample_count)
    for note_name in chord:
        frequency = note_to_frequency(note_name)
        mixed += square_wave(frequency, duration_seconds, 0.32)
    mixed /= max(len(chord), 1)
    envelope = adsr_envelope(sample_count, 0.003, 0.06, 0.25, 0.1)
    mix_into(track, mixed * envelope * amplitude, int(position_seconds * SAMPLE_RATE))


def kick_drum(duration: float = 0.14) -> np.ndarray:
    sample_count = int(duration * SAMPLE_RATE)
    time_axis = np.arange(sample_count) / SAMPLE_RATE
    frequency_sweep = 160.0 * np.exp(-time_axis * 32.0) + 55.0
    phase = 2.0 * np.pi * np.cumsum(frequency_sweep) / SAMPLE_RATE
    amplitude_curve = np.exp(-time_axis * 13.0)
    click = np.random.uniform(-1.0, 1.0, sample_count) * np.exp(-time_axis * 220.0) * 0.3
    return np.sin(phase) * amplitude_curve + click


def snare_drum(duration: float = 0.16) -> np.ndarray:
    sample_count = int(duration * SAMPLE_RATE)
    time_axis = np.arange(sample_count) / SAMPLE_RATE
    noise = np.random.uniform(-1.0, 1.0, sample_count)
    tonal = triangle_wave(240.0, duration) * 0.3
    tonal += triangle_wave(180.0, duration) * 0.2
    amplitude_curve = np.exp(-time_axis * 18.0)
    return (noise * 0.6 + tonal) * amplitude_curve


def ghost_snare(duration: float = 0.06) -> np.ndarray:
    sample_count = int(duration * SAMPLE_RATE)
    time_axis = np.arange(sample_count) / SAMPLE_RATE
    noise = np.random.uniform(-1.0, 1.0, sample_count) * 0.4
    amplitude_curve = np.exp(-time_axis * 55.0)
    return noise * amplitude_curve


def hat_click(duration: float = 0.05, open_hat: bool = False) -> np.ndarray:
    sample_count = int(duration * SAMPLE_RATE)
    time_axis = np.arange(sample_count) / SAMPLE_RATE
    noise = np.random.uniform(-1.0, 1.0, sample_count)
    tilt = np.sin(2.0 * np.pi * 7500.0 * time_axis) * 0.2
    decay_rate = 35.0 if open_hat else 140.0
    amplitude_curve = np.exp(-time_axis * decay_rate)
    return (noise + tilt) * amplitude_curve


def tom_hit(pitch_hz: float = 200.0, duration: float = 0.18) -> np.ndarray:
    sample_count = int(duration * SAMPLE_RATE)
    time_axis = np.arange(sample_count) / SAMPLE_RATE
    sweep = pitch_hz * (1.0 + 0.7 * np.exp(-time_axis * 9.0))
    phase = 2.0 * np.pi * np.cumsum(sweep) / SAMPLE_RATE
    amplitude_curve = np.exp(-time_axis * 10.0)
    return np.sin(phase) * amplitude_curve


def cowbell_hit(duration: float = 0.1) -> np.ndarray:
    sample_count = int(duration * SAMPLE_RATE)
    time_axis = np.arange(sample_count) / SAMPLE_RATE
    tone_high = square_wave(800.0, duration, 0.4) * 0.4
    tone_low = square_wave(540.0, duration, 0.3) * 0.3
    amplitude_curve = np.exp(-time_axis * 28.0)
    return (tone_high + tone_low) * amplitude_curve


def siren_sweep(duration: float = 0.6) -> np.ndarray:
    sample_count = int(duration * SAMPLE_RATE)
    time_axis = np.arange(sample_count) / SAMPLE_RATE
    frequency_curve = 500.0 + 650.0 * (0.5 - 0.5 * np.cos(2.0 * np.pi * 4.0 * time_axis))
    phase = 2.0 * np.pi * np.cumsum(frequency_curve) / SAMPLE_RATE
    tone = np.where((phase % (2.0 * np.pi)) < np.pi, 1.0, -1.0)
    fade_in = np.minimum(time_axis * 12.0, 1.0)
    fade_out = np.exp(-np.maximum(time_axis - 0.35, 0.0) * 8.0)
    return tone * fade_in * fade_out


def bubble_pop(duration: float = 0.14) -> np.ndarray:
    sample_count = int(duration * SAMPLE_RATE)
    time_axis = np.arange(sample_count) / SAMPLE_RATE
    frequency_curve = 250.0 * np.exp(time_axis * 10.0)
    frequency_curve = np.clip(frequency_curve, 250.0, 2000.0)
    phase = 2.0 * np.pi * np.cumsum(frequency_curve) / SAMPLE_RATE
    amplitude_curve = np.exp(-time_axis * 10.0)
    return np.sin(phase) * amplitude_curve


def zap_down(duration: float = 0.22) -> np.ndarray:
    sample_count = int(duration * SAMPLE_RATE)
    time_axis = np.arange(sample_count) / SAMPLE_RATE
    slide = pitch_slide(2200.0, 200.0, duration, duty=0.35)
    amplitude_curve = np.exp(-time_axis * 5.5)
    return slide * amplitude_curve


def whip_sfx(duration: float = 0.16) -> np.ndarray:
    sample_count = int(duration * SAMPLE_RATE)
    time_axis = np.arange(sample_count) / SAMPLE_RATE
    noise = np.random.uniform(-1.0, 1.0, sample_count)
    frequency_curve = 3500.0 * np.exp(-time_axis * 14.0) + 500.0
    filtered_phase = 2.0 * np.pi * np.cumsum(frequency_curve) / SAMPLE_RATE
    modulated = noise * (0.5 + 0.5 * np.sin(filtered_phase))
    amplitude_curve = np.exp(-np.abs(time_axis - duration / 2.0) * 16.0)
    return modulated * amplitude_curve


def generate_bass(track: np.ndarray) -> None:
    patterns_per_chord = [
        ["C2", "REST", "C3", "C2", "REST", "Eb2", "G2", "REST",
         "C2", "Bb1", "C2", "REST", "F2", "REST", "G2", "C3"],
        ["Ab1", "REST", "Ab2", "Ab1", "REST", "C2", "Eb2", "REST",
         "Ab1", "G1", "Ab1", "REST", "Db2", "REST", "Eb2", "Ab2"],
        ["Bb1", "REST", "Bb2", "Bb1", "REST", "D2", "F2", "REST",
         "Bb1", "A1", "Bb1", "REST", "Eb2", "REST", "F2", "Bb2"],
        ["G1", "REST", "G2", "G1", "REST", "B1", "D2", "REST",
         "G1", "F#1", "G1", "REST", "C2", "REST", "D2", "G2"],
    ]
    for bar_index in range(LOOP_BARS):
        pattern = patterns_per_chord[bar_index % 4]
        for step_index, note_name in enumerate(pattern):
            step_time = bar_index * BAR_DURATION + step_index * SIXTEENTH_DURATION
            is_accent = step_index in (0, 4, 8, 12)
            amplitude = 0.22 if is_accent else 0.14
            play_note(
                track, note_name, step_time, SIXTEENTH_DURATION * 0.88,
                waveform="square", duty=0.3, amplitude=amplitude,
                attack=0.002, decay=0.04, sustain=0.55, release=0.04,
            )


def generate_lead(track: np.ndarray) -> None:
    bars_sequence = [
        [("C5", 2), ("Eb5", 2), ("G5", 2), ("F5", 2), ("Eb5", 4), ("C5", 2), ("G4", 2)],
        [("Bb4", 2), ("C5", 2), ("Eb5", 4), ("F5", 2), ("G5", 2), ("C6", 4)],
        [("REST", 2), ("G5", 2), ("F5", 1), ("Eb5", 1), ("F5", 2), ("G5", 4), ("Eb5", 2), ("C5", 2)],
        [("D5", 2), ("Eb5", 2), ("F5", 2), ("G5", 2), ("Ab5", 2), ("G5", 2), ("F5", 2), ("Eb5", 2)],
        [("Ab4", 2), ("C5", 2), ("Eb5", 2), ("Ab5", 2), ("G5", 4), ("Eb5", 2), ("C5", 2)],
        [("Ab4", 4), ("REST", 2), ("Eb5", 2), ("Ab5", 4), ("G5", 2), ("F5", 2)],
        [("Bb4", 2), ("D5", 2), ("F5", 2), ("Bb5", 2), ("A5", 4), ("F5", 2), ("D5", 2)],
        [("G5", 1), ("G5", 1), ("G5", 2), ("B5", 2), ("D6", 2), ("G6", 4), ("F6", 2), ("D6", 2)],
        [("C5", 2), ("Eb5", 2), ("G5", 2), ("F5", 2), ("REST", 2), ("Eb5", 2), ("C5", 4)],
        [("Bb4", 1), ("C5", 1), ("Eb5", 2), ("G5", 2), ("Bb5", 2), ("C6", 4), ("Bb5", 2), ("G5", 2)],
        [("REST", 4), ("G5", 1), ("Ab5", 1), ("Bb5", 2), ("C6", 4), ("Eb6", 2), ("C6", 2)],
        [("D5", 2), ("F5", 2), ("Ab5", 2), ("C6", 2), ("Bb5", 4), ("G5", 2), ("F5", 2)],
        [("Ab5", 4), ("G5", 2), ("F5", 2), ("Eb5", 4), ("C5", 4)],
        [("Ab4", 2), ("Eb5", 2), ("Ab5", 4), ("G5", 2), ("Eb5", 2), ("C5", 2), ("REST", 2)],
        [("Bb4", 2), ("F5", 2), ("Bb5", 2), ("A5", 2), ("G5", 2), ("F5", 2), ("Eb5", 2), ("D5", 2)],
        [("G5", 2), ("B5", 2), ("D6", 2), ("G6", 2), ("F6", 4), ("REST", 4)],
    ]
    for bar_index in range(LOOP_BARS):
        bar_notes = bars_sequence[bar_index % len(bars_sequence)]
        position = bar_index * BAR_DURATION
        for note_index, (note_name, sixteenths) in enumerate(bar_notes):
            note_duration = sixteenths * SIXTEENTH_DURATION
            should_vibrato = sixteenths >= 4 and note_name != "REST"
            slide_from = None
            if note_index > 0 and random.random() < 0.08 and note_name != "REST":
                previous_note = bar_notes[note_index - 1][0]
                if previous_note != "REST":
                    slide_from = previous_note
            play_note(
                track, note_name, position, note_duration * 0.92,
                waveform="square", duty=0.45, amplitude=0.13,
                attack=0.005, decay=0.07, sustain=0.55, release=0.1,
                vibrato=should_vibrato, slide_from=slide_from,
            )
            position += note_duration


def generate_arp(track: np.ndarray) -> None:
    chord_progression = [
        ["C4", "Eb4", "G4", "Bb4"],
        ["Ab3", "C4", "Eb4", "Ab4"],
        ["Bb3", "D4", "F4", "Bb4"],
        ["G3", "B3", "D4", "G4"],
    ]
    for bar_index in range(LOOP_BARS):
        chord = chord_progression[bar_index % 4]
        up_down_pattern = chord + chord[::-1][1:-1]
        for step in range(16):
            note_name = up_down_pattern[step % len(up_down_pattern)]
            step_time = bar_index * BAR_DURATION + step * SIXTEENTH_DURATION
            amplitude = 0.055 + 0.02 * (1 if step % 4 == 0 else 0)
            play_note(
                track, note_name, step_time, SIXTEENTH_DURATION * 0.75,
                waveform="square", duty=0.25, amplitude=amplitude,
                attack=0.002, decay=0.03, sustain=0.35, release=0.04,
            )


def generate_stabs(track: np.ndarray) -> None:
    chord_progression = [
        ["C4", "Eb4", "G4"],
        ["Ab3", "C4", "Eb4"],
        ["Bb3", "D4", "F4"],
        ["G3", "B3", "D4"],
    ]
    for bar_index in range(LOOP_BARS):
        chord = chord_progression[bar_index % 4]
        stab_positions_sixteenths = [2, 6, 10, 14]
        for sixteenth_offset in stab_positions_sixteenths:
            stab_time = bar_index * BAR_DURATION + sixteenth_offset * SIXTEENTH_DURATION
            chord_stab(track, chord, stab_time, SIXTEENTH_DURATION * 1.5, amplitude=0.07)


def generate_drums(track: np.ndarray) -> None:
    kick_steps = {0, 6, 10}
    snare_steps = {4, 12}
    ghost_steps = {3, 7, 11, 15}
    open_hat_steps = {14}

    for bar_index in range(LOOP_BARS):
        bar_start = bar_index * BAR_DURATION
        for step in range(16):
            step_time = bar_start + step * SIXTEENTH_DURATION
            if step in kick_steps:
                mix_into(track, kick_drum() * 0.55, int(step_time * SAMPLE_RATE))
            if step in snare_steps:
                mix_into(track, snare_drum() * 0.3, int(step_time * SAMPLE_RATE))
            if step in ghost_steps and random.random() < 0.45:
                mix_into(track, ghost_snare() * 0.14, int(step_time * SAMPLE_RATE))
            if step % 2 == 0:
                amplitude = 0.09 if step % 4 == 0 else 0.065
                mix_into(track, hat_click() * amplitude, int(step_time * SAMPLE_RATE))
            if step in open_hat_steps:
                mix_into(track, hat_click(open_hat=True) * 0.11, int(step_time * SAMPLE_RATE))

        if bar_index % 4 == 3:
            fill_pitches = [240.0, 200.0, 170.0, 140.0]
            for fill_index, pitch_hz in enumerate(fill_pitches):
                fill_time = bar_start + (12 + fill_index) * SIXTEENTH_DURATION
                mix_into(track, tom_hit(pitch_hz=pitch_hz) * 0.28, int(fill_time * SAMPLE_RATE))


def generate_quirks(track: np.ndarray) -> None:
    four_bar_duration = 4 * BAR_DURATION

    for section_index in range(LOOP_BARS // 4):
        section_start = section_index * four_bar_duration
        cowbell_offsets_sixteenths = [10, 22, 42, 58]
        for offset in cowbell_offsets_sixteenths:
            cowbell_time = section_start + offset * SIXTEENTH_DURATION
            if cowbell_time < LOOP_DURATION:
                mix_into(track, cowbell_hit() * 0.11, int(cowbell_time * SAMPLE_RATE))

    siren_bars = list(range(3, LOOP_BARS, 8))
    for siren_bar in siren_bars:
        siren_time = siren_bar * BAR_DURATION + 3 * BEAT_DURATION
        if siren_time < LOOP_DURATION:
            mix_into(track, siren_sweep() * 0.09, int(siren_time * SAMPLE_RATE))

    zap_bars = list(range(7, LOOP_BARS, 8))
    for zap_bar in zap_bars:
        zap_time = zap_bar * BAR_DURATION + 3.5 * BEAT_DURATION
        if zap_time < LOOP_DURATION:
            mix_into(track, zap_down() * 0.13, int(zap_time * SAMPLE_RATE))

    whip_bars = list(range(4, LOOP_BARS, 4))
    for whip_bar in whip_bars:
        whip_time = whip_bar * BAR_DURATION - 0.12
        if whip_time > 0 and whip_time < LOOP_DURATION:
            mix_into(track, whip_sfx() * 0.12, int(whip_time * SAMPLE_RATE))

    bubble_count = 2 * LOOP_BARS // 4 + 4
    for _ in range(bubble_count):
        onset = random.uniform(0.5, LOOP_DURATION - 0.5)
        mix_into(track, bubble_pop() * random.uniform(0.04, 0.08), int(onset * SAMPLE_RATE))

    stutter_onsets = [(2 + 8 * cycle_index) * BAR_DURATION + 3.5 * BEAT_DURATION
                      for cycle_index in range(LOOP_BARS // 8)]
    for stutter_start in stutter_onsets:
        for repeat_index in range(4):
            stutter_time = stutter_start + repeat_index * SIXTEENTH_DURATION * 0.5
            if stutter_time >= LOOP_DURATION:
                break
            pitch_choice = random.choice(["G5", "Bb5", "C6", "Eb6"])
            play_note(
                track, pitch_choice, stutter_time, SIXTEENTH_DURATION * 0.4,
                waveform="square", duty=0.2, amplitude=0.07,
                attack=0.001, decay=0.02, sustain=0.3, release=0.03,
            )


def apply_wobble_filter(track: np.ndarray, rate_hz: float = None) -> np.ndarray:
    if rate_hz is None:
        rate_hz = BPM / 60.0 / 2.0
    time_axis = np.arange(len(track)) / SAMPLE_RATE
    lfo = 0.5 + 0.5 * np.sin(2.0 * np.pi * rate_hz * time_axis)
    modulation = 0.7 + 0.3 * lfo
    return track * modulation


def apply_delay(track: np.ndarray, delay_seconds: float, feedback: float = 0.3,
                mix: float = 0.28, taps: int = 3) -> np.ndarray:
    delay_samples = int(delay_seconds * SAMPLE_RATE)
    output = track.copy()
    buffer = track.copy()
    for tap_index in range(1, taps + 1):
        offset = delay_samples * tap_index
        if offset >= len(track):
            break
        amplitude = mix * (feedback ** (tap_index - 1))
        output[offset:] += buffer[:-offset] * amplitude
    return output


def soft_clip(signal: np.ndarray, threshold: float = 0.85) -> np.ndarray:
    return np.tanh(signal / threshold) * threshold


def wrap_tail_loop(signal: np.ndarray) -> np.ndarray:
    output = signal[:LOOP_SAMPLES].copy()
    tail = signal[LOOP_SAMPLES:]
    wrap_length = min(len(tail), LOOP_SAMPLES)
    output[:wrap_length] += tail[:wrap_length]
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
    parser = argparse.ArgumentParser(description="Generate a funky, zany chiptune title loop for JuiceJuicyJuice.")
    default_output = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "public", "assets", "music", "funky_loop_title.wav",
    )
    parser.add_argument("--output", "-o", default=default_output, help="Output .wav path")
    parser.add_argument("--seed", type=int, default=4242, help="Random seed")
    arguments = parser.parse_args()

    np.random.seed(arguments.seed)
    random.seed(arguments.seed)

    print(f"Tempo: {BPM} BPM  |  Loop length: {LOOP_DURATION:.2f}s  |  Bars: {LOOP_BARS}")

    bass_track = np.zeros(RENDER_SAMPLES)
    lead_track = np.zeros(RENDER_SAMPLES)
    arp_track = np.zeros(RENDER_SAMPLES)
    stabs_track = np.zeros(RENDER_SAMPLES)
    drums_track = np.zeros(RENDER_SAMPLES)
    quirks_track = np.zeros(RENDER_SAMPLES)

    print("Funky syncopated square bass...")
    generate_bass(bass_track)
    print("Zany square lead with slides and vibrato...")
    generate_lead(lead_track)
    print("Fast arpeggio with wobble...")
    generate_arp(arp_track)
    arp_track = apply_wobble_filter(arp_track)
    print("Chord stabs on the offbeats...")
    generate_stabs(stabs_track)
    print("Punchy funk drums with tom fills...")
    generate_drums(drums_track)
    print("Quirks: cowbell, siren, zap, whip, bubble pops, stutters...")
    generate_quirks(quirks_track)

    lead_track = apply_delay(lead_track, delay_seconds=BEAT_DURATION * 0.75,
                             feedback=0.3, mix=0.25)
    quirks_track = apply_delay(quirks_track, delay_seconds=BEAT_DURATION * 0.5,
                               feedback=0.35, mix=0.3)

    mixed = (bass_track + lead_track + arp_track + stabs_track
             + drums_track + quirks_track)
    mixed = soft_clip(mixed, threshold=0.82)

    print("Wrapping tail into the start for seamless loop...")
    loop = wrap_tail_loop(mixed)

    os.makedirs(os.path.dirname(arguments.output), exist_ok=True)
    save_wav(arguments.output, loop)
    duration_seconds = len(loop) / SAMPLE_RATE
    print(f"Saved: {arguments.output}  ({duration_seconds:.2f}s)")


if __name__ == "__main__":
    main()
