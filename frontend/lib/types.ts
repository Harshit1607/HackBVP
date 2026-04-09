export interface VitalSigns {
  breathing_bpm: number | null
  heart_rate_bpm: number | null
  breathing_confidence: number | null
  hr_confidence: number | null
  confidence: number // Average confidence score 0.0 - 1.0
}

export interface PresenceResult {
  occupied: boolean
  person_count: number
  confidence: number
}

export interface SensingFrame {
  frame_id: string
  timestamp: number
  source: 'simulator' | 'replay' | 'esp32'
  vitals: VitalSigns
  presence: PresenceResult
  amplitude: number // current sample point for real-time charting
  raw_amplitude: number[]
}

export interface Session {
  filename: string
  size_kb: number
  date: string
}
