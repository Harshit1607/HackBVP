export interface VitalSigns {
  breathing_bpm: number | null
  heart_rate_bpm: number | null
  breathing_confidence: number
  hr_confidence: number
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
  raw_amplitude: number[]
}

export interface Session {
  filename: string
  size_kb: number
}
