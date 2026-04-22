import sys
import numpy as np
import librosa

PATH = r"C:\Users\IlanVarillon\Downloads\One_Last_Power_Up.mp3"

print(f"Loading {PATH}...")
audio, sample_rate = librosa.load(PATH, sr=None, mono=True)
duration_seconds = librosa.get_duration(y=audio, sr=sample_rate)

print(f"\n=== BASIC ===")
print(f"Sample rate: {sample_rate} Hz")
print(f"Duration:    {duration_seconds:.2f} s")
print(f"Samples:     {len(audio)}")
print(f"Peak amp:    {np.max(np.abs(audio)):.3f}")
print(f"RMS:         {np.sqrt(np.mean(audio**2)):.3f}")

print(f"\n=== TEMPO / BEATS ===")
tempo, beat_frames = librosa.beat.beat_track(y=audio, sr=sample_rate)
tempo_value = float(tempo) if np.isscalar(tempo) else float(tempo[0])
print(f"Estimated tempo: {tempo_value:.1f} BPM")
print(f"Beat count:      {len(beat_frames)}")

print(f"\n=== KEY / TONALITY (chromagram) ===")
chroma = librosa.feature.chroma_cqt(y=audio, sr=sample_rate)
chroma_mean = chroma.mean(axis=1)
note_names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
ranked = sorted(zip(note_names, chroma_mean), key=lambda pair: -pair[1])
print("Note strength ranking:")
for name, weight in ranked:
    bar = "#" * int(weight * 40)
    print(f"  {name:3s} {weight:.3f} {bar}")

major_profile = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
minor_profile = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])
best_score = -1e9
best_key = None
for shift in range(12):
    major_rot = np.roll(major_profile, shift)
    minor_rot = np.roll(minor_profile, shift)
    score_major = np.corrcoef(chroma_mean, major_rot)[0, 1]
    score_minor = np.corrcoef(chroma_mean, minor_rot)[0, 1]
    if score_major > best_score:
        best_score = score_major
        best_key = f"{note_names[shift]} major"
    if score_minor > best_score:
        best_score = score_minor
        best_key = f"{note_names[shift]} minor"
print(f"Best key guess:  {best_key} (corr={best_score:.3f})")

print(f"\n=== SPECTRAL ===")
spectral_centroid = librosa.feature.spectral_centroid(y=audio, sr=sample_rate).mean()
spectral_rolloff = librosa.feature.spectral_rolloff(y=audio, sr=sample_rate).mean()
zero_crossing_rate = librosa.feature.zero_crossing_rate(y=audio).mean()
print(f"Spectral centroid: {spectral_centroid:.0f} Hz  (brightness)")
print(f"Spectral rolloff:  {spectral_rolloff:.0f} Hz  (high-freq energy cutoff)")
print(f"Zero crossing:     {zero_crossing_rate:.3f}   (>0.1 = noisy/percussive)")

print(f"\n=== ONSETS (note events) ===")
onset_times = librosa.onset.onset_detect(y=audio, sr=sample_rate, units='time')
print(f"Onset count: {len(onset_times)}")
if len(onset_times) > 1:
    intervals = np.diff(onset_times)
    print(f"Median interval: {np.median(intervals)*1000:.0f} ms")
print(f"First 20 onsets (s): {', '.join(f'{time:.2f}' for time in onset_times[:20])}")

print(f"\n=== PITCH TRACKING (melody) ===")
f0, voiced_flag, voiced_prob = librosa.pyin(
    audio, fmin=float(librosa.note_to_hz('C2')), fmax=float(librosa.note_to_hz('C7')), sr=sample_rate
)
voiced = f0[~np.isnan(f0)]
print(f"Voiced frames: {len(voiced)}/{len(f0)}")
if len(voiced) > 0:
    print(f"Pitch range: {voiced.min():.0f} Hz -> {voiced.max():.0f} Hz")
    print(f"  ({librosa.hz_to_note(voiced.min())} -> {librosa.hz_to_note(voiced.max())})")
    print(f"Median pitch: {np.median(voiced):.0f} Hz ({librosa.hz_to_note(np.median(voiced))})")

print(f"\n=== STRUCTURE (RMS energy over time) ===")
rms_frames = librosa.feature.rms(y=audio, frame_length=2048, hop_length=512)[0]
segment_count = 20
segment_size = len(rms_frames) // segment_count
print("Energy profile (each block = ~5% of track):")
for segment_index in range(segment_count):
    start = segment_index * segment_size
    end = start + segment_size
    energy = rms_frames[start:end].mean()
    bar = "#" * int(energy * 200)
    second = segment_index * duration_seconds / segment_count
    print(f"  {second:5.1f}s  {energy:.3f}  {bar}")
