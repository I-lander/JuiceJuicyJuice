import numpy as np
import soundfile as sf
from pathlib import Path

SAMPLE_RATE = 44100
BPM = 140
BEAT_DURATION = 60.0 / BPM
SIXTEENTH = BEAT_DURATION / 4
DURATION_SECONDS = 30.0
OUTPUT_PATH = Path(r"C:\Users\IlanVarillon\Downloads\generated_power_up.wav")

A_MINOR_HARMONIC = {
    'A2': 110.00, 'B2': 123.47, 'C3': 130.81, 'D3': 146.83,
    'E3': 164.81, 'F3': 174.61, 'G#3': 207.65,
    'A3': 220.00, 'B3': 246.94, 'C4': 261.63, 'D4': 293.66,
    'E4': 329.63, 'F4': 349.23, 'G#4': 415.30,
    'A4': 440.00, 'B4': 493.88, 'C5': 523.25, 'D5': 587.33,
    'E5': 659.25, 'F5': 698.46, 'G#5': 830.61, 'A5': 880.00,
    'A1': 55.00, 'C2': 65.41, 'E2': 82.41, 'G#2': 103.83,
    'REST': 0.0,
}


def square_wave(frequency: float, duration: float, duty: float = 0.5) -> np.ndarray:
    if frequency <= 0:
        return np.zeros(int(duration * SAMPLE_RATE))
    samples = int(duration * SAMPLE_RATE)
    time_axis = np.arange(samples) / SAMPLE_RATE
    phase = (time_axis * frequency) % 1.0
    return np.where(phase < duty, 1.0, -1.0)


def triangle_wave(frequency: float, duration: float) -> np.ndarray:
    if frequency <= 0:
        return np.zeros(int(duration * SAMPLE_RATE))
    samples = int(duration * SAMPLE_RATE)
    time_axis = np.arange(samples) / SAMPLE_RATE
    phase = (time_axis * frequency) % 1.0
    return 4.0 * np.abs(phase - 0.5) - 1.0


def envelope(length: int, attack: float = 0.005, decay: float = 0.05,
             sustain: float = 0.7, release: float = 0.1) -> np.ndarray:
    attack_samples = int(attack * SAMPLE_RATE)
    decay_samples = int(decay * SAMPLE_RATE)
    release_samples = int(release * SAMPLE_RATE)
    sustain_samples = max(0, length - attack_samples - decay_samples - release_samples)

    attack_curve = np.linspace(0, 1, attack_samples, endpoint=False) if attack_samples else np.array([])
    decay_curve = np.linspace(1, sustain, decay_samples, endpoint=False) if decay_samples else np.array([])
    sustain_curve = np.full(sustain_samples, sustain)
    release_curve = np.linspace(sustain, 0, release_samples) if release_samples else np.array([])

    env = np.concatenate([attack_curve, decay_curve, sustain_curve, release_curve])
    if len(env) < length:
        env = np.pad(env, (0, length - len(env)))
    return env[:length]


def synth_note(note: str, duration: float, waveform: str = 'square',
               duty: float = 0.5, amplitude: float = 0.25,
               attack: float = 0.005, release: float = 0.08) -> np.ndarray:
    frequency = A_MINOR_HARMONIC[note]
    samples = int(duration * SAMPLE_RATE)
    if frequency == 0:
        return np.zeros(samples)

    if waveform == 'square':
        raw = square_wave(frequency, duration, duty)
    elif waveform == 'triangle':
        raw = triangle_wave(frequency, duration)
    else:
        raw = square_wave(frequency, duration, duty)

    raw = raw[:samples] if len(raw) >= samples else np.pad(raw, (0, samples - len(raw)))
    env = envelope(samples, attack=attack, release=release)
    return raw * env * amplitude


def build_track(events: list, total_duration: float) -> np.ndarray:
    total_samples = int(total_duration * SAMPLE_RATE)
    track = np.zeros(total_samples)
    for start_time, note, duration, waveform, duty, amplitude in events:
        start_sample = int(start_time * SAMPLE_RATE)
        audio = synth_note(note, duration, waveform=waveform, duty=duty, amplitude=amplitude)
        end_sample = min(start_sample + len(audio), total_samples)
        track[start_sample:end_sample] += audio[:end_sample - start_sample]
    return track


def noise_hit(duration: float, amplitude: float = 0.15) -> np.ndarray:
    samples = int(duration * SAMPLE_RATE)
    noise = np.random.uniform(-1, 1, samples)
    env = np.exp(-np.linspace(0, 8, samples))
    return noise * env * amplitude


bass_events = []
bass_pattern = ['A1', 'A1', 'E2', 'A1', 'C2', 'C2', 'G#2', 'A1']
bar_duration = 8 * SIXTEENTH
bar_count = int(DURATION_SECONDS / bar_duration) + 1
for bar_index in range(bar_count):
    for step_index, note in enumerate(bass_pattern):
        start = bar_index * bar_duration + step_index * SIXTEENTH
        if start >= DURATION_SECONDS:
            break
        bass_events.append((start, note, SIXTEENTH * 0.95, 'triangle', 0.5, 0.35))

arp_pattern_intro = ['A3', 'C4', 'E4', 'C4']
arp_pattern_main = ['A3', 'C4', 'E4', 'A4', 'G#4', 'E4', 'C4', 'A3']
arp_pattern_climax = ['A4', 'C5', 'E5', 'A5', 'G#5', 'E5', 'C5', 'A4']

arp_events = []
time_cursor = 0.0
while time_cursor < DURATION_SECONDS:
    if time_cursor < 6.0:
        pattern = arp_pattern_intro
        amplitude = 0.12
        duty = 0.5
    elif time_cursor < 17.0:
        pattern = arp_pattern_main
        amplitude = 0.18
        duty = 0.25
    elif time_cursor < 24.0:
        pattern = arp_pattern_climax
        amplitude = 0.22
        duty = 0.125
    else:
        pattern = arp_pattern_main
        amplitude = 0.18
        duty = 0.25

    for note in pattern:
        if time_cursor >= DURATION_SECONDS:
            break
        arp_events.append((time_cursor, note, SIXTEENTH * 0.9, 'square', duty, amplitude))
        time_cursor += SIXTEENTH

melody_phrase_a = [
    ('A4', 2), ('C5', 2), ('E5', 2), ('A5', 2),
    ('G#5', 4), ('E5', 2), ('F5', 2),
    ('E5', 4), ('D5', 2), ('C5', 2),
    ('B4', 4), ('A4', 4),
]

melody_phrase_b = [
    ('E5', 2), ('F5', 2), ('G#5', 4),
    ('A5', 4), ('G#5', 2), ('E5', 2),
    ('C5', 2), ('E5', 2), ('A5', 4),
    ('G#5', 8),
]

melody_climax = [
    ('A5', 1), ('G#5', 1), ('A5', 2), ('C5', 2), ('E5', 2),
    ('A5', 4), ('G#5', 2), ('F5', 2),
    ('E5', 2), ('D5', 2), ('C5', 2), ('B4', 2),
    ('A4', 2), ('C5', 2), ('E5', 2), ('A5', 2),
]

melody_events = []


def place_phrase(phrase: list, start_time: float, amplitude: float = 0.2, duty: float = 0.5) -> float:
    cursor = start_time
    for note, sixteenth_count in phrase:
        duration = sixteenth_count * SIXTEENTH
        melody_events.append((cursor, note, duration * 0.95, 'square', duty, amplitude))
        cursor += duration
    return cursor


cursor = 8.0
cursor = place_phrase(melody_phrase_a, cursor, amplitude=0.22, duty=0.5)
cursor = place_phrase(melody_phrase_b, cursor, amplitude=0.24, duty=0.25)
cursor = place_phrase(melody_climax, cursor, amplitude=0.28, duty=0.125)
place_phrase(melody_phrase_a, cursor, amplitude=0.2, duty=0.5)

total_samples = int(DURATION_SECONDS * SAMPLE_RATE)

bass_track = build_track(bass_events, DURATION_SECONDS)
arp_track = build_track(arp_events, DURATION_SECONDS)
melody_track = build_track(melody_events, DURATION_SECONDS)

hat_track = np.zeros(total_samples)
for beat_index in range(int(DURATION_SECONDS / BEAT_DURATION) * 2):
    start_time = beat_index * (BEAT_DURATION / 2)
    start_sample = int(start_time * SAMPLE_RATE)
    hit = noise_hit(0.04, amplitude=0.04)
    end_sample = min(start_sample + len(hit), total_samples)
    hat_track[start_sample:end_sample] += hit[:end_sample - start_sample]

kick_track = np.zeros(total_samples)
for beat_index in range(int(DURATION_SECONDS / BEAT_DURATION)):
    start_time = beat_index * BEAT_DURATION
    start_sample = int(start_time * SAMPLE_RATE)
    kick_duration = 0.08
    kick_samples = int(kick_duration * SAMPLE_RATE)
    time_axis = np.arange(kick_samples) / SAMPLE_RATE
    frequency_sweep = 120 * np.exp(-time_axis * 30) + 40
    phase = 2 * np.pi * np.cumsum(frequency_sweep) / SAMPLE_RATE
    kick = np.sin(phase) * np.exp(-time_axis * 15) * 0.3
    end_sample = min(start_sample + len(kick), total_samples)
    kick_track[start_sample:end_sample] += kick[:end_sample - start_sample]

build_envelope = np.linspace(0.4, 1.0, total_samples)
climax_peak_sample = int(18.5 * SAMPLE_RATE)
climax_window = 2 * SAMPLE_RATE
climax_start = max(0, climax_peak_sample - climax_window)
climax_end = min(total_samples, climax_peak_sample + climax_window)
climax_boost = np.ones(total_samples)
for sample_index in range(climax_start, climax_end):
    distance = abs(sample_index - climax_peak_sample) / climax_window
    climax_boost[sample_index] = 1.0 + 0.25 * (1.0 - distance)

mix = bass_track + arp_track + melody_track + hat_track + kick_track
mix = mix * build_envelope * climax_boost

peak = np.max(np.abs(mix))
if peak > 0:
    mix = mix / peak * 0.92

fade_samples = int(0.15 * SAMPLE_RATE)
mix[:fade_samples] *= np.linspace(0, 1, fade_samples)
mix[-fade_samples:] *= np.linspace(1, 0, fade_samples)

sf.write(str(OUTPUT_PATH), mix, SAMPLE_RATE)
print(f"Written: {OUTPUT_PATH}")
print(f"  duration: {DURATION_SECONDS}s   peak: {np.max(np.abs(mix)):.3f}   rms: {np.sqrt(np.mean(mix**2)):.3f}")
