"""
Jungle Saathi - Audio Sample Generator
Generates realistic demonstration WAV files for all 11 forest sound classes.
Works using standard Python library (wave, math, struct, random).
"""

import os
import wave
import struct
import math
import random

SAMPLE_RATE = 22050  # 22.05 kHz standard for bioacoustic ML
DURATION = 3.5      # 3.5 seconds each

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "server", "public", "samples")

def ensure_dir(path):
    os.makedirs(path, exist_ok=True)

def write_wav(filename, samples, sample_rate=SAMPLE_RATE):
    filepath = os.path.join(OUTPUT_DIR, filename)
    with wave.open(filepath, 'w') as wav_file:
        wav_file.setnchannels(1)  # Mono
        wav_file.setsampwidth(2)  # 16-bit
        wav_file.setframerate(sample_rate)
        # Clip to -1.0 .. 1.0 and convert to 16-bit PCM integer
        raw_data = bytearray()
        for s in samples:
            val = max(-1.0, min(1.0, s))
            int_val = int(val * 32767)
            raw_data.extend(struct.pack('<h', int_val))
        wav_file.writeframes(raw_data)
    print(f"Generated: {filepath} ({len(samples)} samples)")

def generate_bird_calls():
    total_samples = int(SAMPLE_RATE * DURATION)
    samples = [0.0] * total_samples
    # Generate series of high pitch chirps (chirp frequency sweeping from 2500Hz to 5500Hz)
    num_chirps = 7
    for c in range(num_chirps):
        start_time = 0.3 + c * 0.45
        chirp_len = 0.22
        start_sample = int(start_time * SAMPLE_RATE)
        chirp_samples = int(chirp_len * SAMPLE_RATE)
        for i in range(chirp_samples):
            idx = start_sample + i
            if idx >= total_samples:
                break
            t = i / SAMPLE_RATE
            # Sweeping frequency
            freq = 2800 + 2400 * math.sin(math.pi * t / chirp_len)
            # Envelope (attack, decay)
            env = math.sin(math.pi * (i / chirp_samples)) ** 1.5
            s = math.sin(2 * math.pi * freq * t) * env * 0.7
            # Add subtle harmonic
            s += 0.2 * math.sin(4 * math.pi * freq * t) * env
            samples[idx] += s
    # Add light forest ambient breeze
    for i in range(total_samples):
        samples[i] += (random.random() * 2 - 1) * 0.02
    return samples

def generate_chainsaw():
    total_samples = int(SAMPLE_RATE * DURATION)
    samples = [0.0] * total_samples
    # Two-stroke engine base fundamental: ~85Hz with rich saw-tooth harmonics
    # modulated with periodic throttle revs
    phase1 = 0.0
    phase2 = 0.0
    for i in range(total_samples):
        t = i / SAMPLE_RATE
        # Throttle rev modulation (idle -> rev up -> cutting load)
        rev = 1.0 + 0.35 * math.sin(2 * math.pi * 0.8 * t) + 0.15 * math.sin(2 * math.pi * 2.3 * t)
        f0 = 92.0 * rev
        phase1 += 2 * math.pi * f0 / SAMPLE_RATE
        phase2 += 2 * math.pi * (f0 * 2.01) / SAMPLE_RATE
        
        # Sawtooth / square rich harmonics
        s = 0.4 * math.sin(phase1) + 0.3 * math.sin(2 * phase1) + 0.2 * math.sin(3 * phase1)
        s += 0.15 * math.sin(4 * phase1) + 0.1 * math.sin(5 * phase1)
        # Buzzing teeth vibration
        s += 0.18 * ((phase1 % (2 * math.pi)) / math.pi - 1.0)
        # Harsh high-frequency metallic friction
        friction = (random.random() * 2 - 1) * 0.12 * (1.0 + 0.5 * math.sin(phase2))
        s += friction
        samples[i] = s * 0.75
    return samples

def generate_gunshot():
    total_samples = int(SAMPLE_RATE * DURATION)
    samples = [0.0] * total_samples
    # Shot fires at 0.5 seconds
    shot_idx = int(0.5 * SAMPLE_RATE)
    # 1. Sharp muzzle crack (impulse)
    crack_len = int(0.04 * SAMPLE_RATE)
    for i in range(crack_len):
        idx = shot_idx + i
        if idx >= total_samples:
            break
        env = math.exp(-i / (SAMPLE_RATE * 0.008))
        s = (random.random() * 2 - 1) * 1.0 * env
        s += math.sin(2 * math.pi * 320 * (i / SAMPLE_RATE)) * env * 0.8
        samples[idx] += s
    # 2. Explosive bass blast
    boom_len = int(0.35 * SAMPLE_RATE)
    for i in range(boom_len):
        idx = shot_idx + i
        if idx >= total_samples:
            break
        env = math.exp(-i / (SAMPLE_RATE * 0.07))
        t = i / SAMPLE_RATE
        s = math.sin(2 * math.pi * 95 * t) * env * 0.9
        s += (random.random() * 2 - 1) * 0.3 * env
        samples[idx] += s
    # 3. Forest acoustic reverberation and echo decay
    echo_len = int(2.2 * SAMPLE_RATE)
    for i in range(echo_len):
        idx = shot_idx + crack_len + i
        if idx >= total_samples:
            break
        env = math.exp(-i / (SAMPLE_RATE * 0.55))
        # Reverberation filters
        rev = (random.random() * 2 - 1) * 0.25 * env
        rev += 0.15 * math.sin(2 * math.pi * 140 * (i / SAMPLE_RATE)) * env
        samples[idx] += rev
    return samples

def generate_tiger_roar():
    total_samples = int(SAMPLE_RATE * DURATION)
    samples = [0.0] * total_samples
    # Low guttural roar from 0.4s to 2.8s
    start_sample = int(0.4 * SAMPLE_RATE)
    roar_len = int(2.4 * SAMPLE_RATE)
    phase = 0.0
    for i in range(roar_len):
        idx = start_sample + i
        if idx >= total_samples:
            break
        t = i / SAMPLE_RATE
        # Envelope: swell up and slow decrescendo
        env = math.sin(math.pi * (i / roar_len)) ** 1.2
        # Fundamental frequency: 110Hz to 160Hz with chest resonance
        f0 = 115 + 35 * math.sin(math.pi * t / (roar_len / SAMPLE_RATE))
        phase += 2 * math.pi * f0 / SAMPLE_RATE
        
        # Vocal tract formants and growl roughness (amplitude modulation by 25Hz growl flutter)
        flutter = 1.0 + 0.4 * math.sin(2 * math.pi * 28 * t)
        s = 0.5 * math.sin(phase) + 0.35 * math.sin(2 * phase) + 0.25 * math.sin(3 * phase)
        s *= flutter
        # Throat rasp noise
        s += (random.random() * 2 - 1) * 0.22 * flutter
        samples[idx] += s * env * 0.85
    return samples

def generate_elephant_sounds():
    total_samples = int(SAMPLE_RATE * DURATION)
    samples = [0.0] * total_samples
    # Trumpet starting at 0.5s, lasting 2 seconds
    start_sample = int(0.5 * SAMPLE_RATE)
    trumpet_len = int(2.0 * SAMPLE_RATE)
    phase = 0.0
    for i in range(trumpet_len):
        idx = start_sample + i
        if idx >= total_samples:
            break
        t = i / SAMPLE_RATE
        env = math.sin(math.pi * (i / trumpet_len)) ** 0.8
        # High brassy trumpet glissando (450Hz sweeping up to 880Hz then down)
        f0 = 420 + 380 * math.sin(math.pi * (i / trumpet_len))
        phase += 2 * math.pi * f0 / SAMPLE_RATE
        s = 0.45 * math.sin(phase) + 0.3 * math.sin(2 * phase) + 0.2 * math.sin(3 * phase) + 0.15 * math.sin(4 * phase)
        # Infrasound low harmonic rumble underneath
        s += 0.3 * math.sin(2 * math.pi * 35 * t)
        samples[idx] += s * env * 0.8
    return samples

def generate_human_speech():
    total_samples = int(SAMPLE_RATE * DURATION)
    samples = [0.0] * total_samples
    # Cadence syllables
    num_syllables = 6
    for syl in range(num_syllables):
        start = 0.4 + syl * 0.42
        syl_samples = int(0.28 * SAMPLE_RATE)
        start_idx = int(start * SAMPLE_RATE)
        for i in range(syl_samples):
            idx = start_idx + i
            if idx >= total_samples:
                break
            t = i / SAMPLE_RATE
            env = math.sin(math.pi * (i / syl_samples))
            f0 = 135 + 20 * math.sin(math.pi * t / 0.28)
            # Formant resonances (F1 ~ 600Hz, F2 ~ 1400Hz, F3 ~ 2400Hz)
            s = 0.3 * math.sin(2 * math.pi * f0 * t)
            s += 0.35 * math.sin(2 * math.pi * 600 * t)
            s += 0.25 * math.sin(2 * math.pi * 1450 * t)
            s += 0.15 * math.sin(2 * math.pi * 2400 * t)
            samples[idx] += s * env * 0.7
    return samples

def generate_human_shouting():
    total_samples = int(SAMPLE_RATE * DURATION)
    samples = [0.0] * total_samples
    # Two urgent shouting distress calls
    for call in [0.4, 1.8]:
        start_idx = int(call * SAMPLE_RATE)
        call_len = int(1.1 * SAMPLE_RATE)
        for i in range(call_len):
            idx = start_idx + i
            if idx >= total_samples:
                break
            t = i / SAMPLE_RATE
            env = math.sin(math.pi * (i / call_len)) ** 1.3
            f0 = 550 + 120 * math.sin(2 * math.pi * 3.5 * t)
            s = 0.5 * math.sin(2 * math.pi * f0 * t)
            s += 0.3 * math.sin(2 * math.pi * (f0 * 2) * t)
            s += 0.2 * (random.random() * 2 - 1)
            samples[idx] += s * env * 0.85
    return samples

def generate_vehicle_engine():
    total_samples = int(SAMPLE_RATE * DURATION)
    samples = [0.0] * total_samples
    phase = 0.0
    for i in range(total_samples):
        t = i / SAMPLE_RATE
        # Heavy diesel 4-cylinder rumble ~ 45 Hz idle
        f0 = 46.0 + 3.0 * math.sin(2 * math.pi * 0.5 * t)
        phase += 2 * math.pi * f0 / SAMPLE_RATE
        s = 0.45 * math.sin(phase) + 0.3 * math.sin(2 * phase) + 0.2 * math.sin(3 * phase)
        # Mechanical rattle and exhaust hiss
        s += (random.random() * 2 - 1) * 0.08
        s += 0.15 * math.sin(2 * math.pi * 180 * t)
        samples[i] = s * 0.8
    return samples

def generate_fire_crackling():
    total_samples = int(SAMPLE_RATE * DURATION)
    samples = [0.0] * total_samples
    # Crackles: random sharp pulses + continuous flame roar
    for i in range(total_samples):
        t = i / SAMPLE_RATE
        # Continuous turbulent air roar
        base = (random.random() * 2 - 1) * 0.12
        base += 0.15 * math.sin(2 * math.pi * 110 * t) * (0.8 + 0.4 * random.random())
        samples[i] = base
    # Add 40-60 distinct sharp wood snap transients
    num_snaps = 45
    for _ in range(num_snaps):
        snap_time = random.uniform(0.1, DURATION - 0.1)
        snap_idx = int(snap_time * SAMPLE_RATE)
        snap_len = int(random.uniform(0.01, 0.035) * SAMPLE_RATE)
        snap_amp = random.uniform(0.4, 0.9)
        for i in range(snap_len):
            idx = snap_idx + i
            if idx >= total_samples:
                break
            env = math.exp(-i / (SAMPLE_RATE * 0.005))
            samples[idx] += (random.random() * 2 - 1) * snap_amp * env
    return samples

def generate_animal_calls():
    total_samples = int(SAMPLE_RATE * DURATION)
    samples = [0.0] * total_samples
    # Deer alarm call / monkey chatter
    for call in [0.5, 1.2, 1.9, 2.6]:
        start_idx = int(call * SAMPLE_RATE)
        c_len = int(0.35 * SAMPLE_RATE)
        for i in range(c_len):
            idx = start_idx + i
            if idx >= total_samples:
                break
            t = i / SAMPLE_RATE
            env = math.sin(math.pi * (i / c_len)) ** 1.5
            freq = 680 + 350 * math.sin(math.pi * t / 0.35)
            s = 0.5 * math.sin(2 * math.pi * freq * t) + 0.25 * math.sin(4 * math.pi * freq * t)
            samples[idx] += s * env * 0.75
    return samples

def generate_unknown_suspicious():
    total_samples = int(SAMPLE_RATE * DURATION)
    samples = [0.0] * total_samples
    # Slow stealth footsteps in dry foliage + quiet metallic tool clicks
    for step in [0.6, 1.4, 2.2, 3.0]:
        start_idx = int(step * SAMPLE_RATE)
        step_len = int(0.25 * SAMPLE_RATE)
        for i in range(step_len):
            idx = start_idx + i
            if idx >= total_samples:
                break
            env = math.sin(math.pi * (i / step_len)) ** 2
            # Leaf crunch: filtered noise burst
            crunch = (random.random() * 2 - 1) * 0.35 * env
            samples[idx] += crunch
    # Add quiet muffled metallic clink at 1.8s
    clink_idx = int(1.8 * SAMPLE_RATE)
    for i in range(int(0.12 * SAMPLE_RATE)):
        idx = clink_idx + i
        if idx >= total_samples:
            break
        env = math.exp(-i / (SAMPLE_RATE * 0.02))
        s = math.sin(2 * math.pi * 3200 * (i / SAMPLE_RATE)) * env * 0.3
        samples[idx] += s
    return samples

def main():
    ensure_dir(OUTPUT_DIR)
    print("Synthesizing Jungle Saathi forest acoustic training and demonstration dataset...")
    
    generators = {
        "bird_calls.wav": generate_bird_calls,
        "chainsaw_sound.wav": generate_chainsaw,
        "gunshot_sound.wav": generate_gunshot,
        "tiger_roar.wav": generate_tiger_roar,
        "elephant_sounds.wav": generate_elephant_sounds,
        "human_speech.wav": generate_human_speech,
        "human_shouting.wav": generate_human_shouting,
        "vehicle_engine.wav": generate_vehicle_engine,
        "fire_crackling.wav": generate_fire_crackling,
        "animal_calls.wav": generate_animal_calls,
        "unknown_suspicious.wav": generate_unknown_suspicious,
    }
    
    for filename, gen_fn in generators.items():
        samples = gen_fn()
        write_wav(filename, samples)
        
    print(f"All 11 forest sound classes generated in: {OUTPUT_DIR}")

if __name__ == "__main__":
    main()

