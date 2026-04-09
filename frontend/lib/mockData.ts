import type { SensingFrame } from './types'

export const MOCK_FRAME: SensingFrame = {
  frame_id: 'mock-frame-001',
  timestamp: Date.now() / 1000,
  source: 'simulator',
  vitals: {
    breathing_bpm: 14.8,
    heart_rate_bpm: 67.2,
    breathing_confidence: 0.88,
    hr_confidence: 0.76,
    confidence: 0.83,
  },
  presence: {
    occupied: true,
    person_count: 1,
    confidence: 0.94,
  },
  amplitude: 0.85, 
  raw_amplitude: Array.from({ length: 56 }, (_, i) =>
    0.85 + Math.sin(i * 0.3) * 0.15 + Math.random() * 0.05
  ),
}
