'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Play, FileJson, Calendar, Database } from 'lucide-react'

interface Session {
  filename: string
  size_kb: number
  created_at: string
}

interface ReplayPickerProps {
  open: boolean
  onClose: () => void
  onSelect: (filename: string) => void
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'

export default function ReplayPicker({ open, onClose, onSelect }: ReplayPickerProps) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (open) {
      fetch(`${API_URL}/api/sessions`)
        .then(res => res.json())
        .then(data => {
          setSessions(data)
          setLoading(false)
        })
        .catch(err => {
          console.error('Failed to fetch sessions', err)
          setLoading(false)
        })
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-24">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-base-black/60 backdrop-blur-md"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl bg-base-white border border-accent-metal/20 shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[80vh]"
      >
        <div className="flex items-center justify-between px-24 py-20 border-b border-accent-metal/10">
          <div className="flex items-center gap-12">
            <div className="w-10 h-10 rounded-full bg-accent-wood/10 flex items-center justify-center">
              <Database className="w-5 h-5 text-accent-wood" />
            </div>
            <div>
              <h2 className="text-title-30 font-serif text-base-black">Replay Buffer</h2>
              <p className="text-caption-30 uppercase tracking-widest text-accent-metal">Select recording session</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-8 hover:bg-base-stone-20 rounded-full transition-colors text-accent-metal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-48 gap-16">
              <div className="w-12 h-12 border-2 border-accent-wood/20 border-t-accent-wood rounded-full animate-spin" />
              <span className="text-caption-30 text-accent-metal uppercase tracking-widest">Scanning local storage...</span>
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-48 text-center">
              <FileJson className="w-12 h-12 text-accent-metal/20 mb-16" />
              <span className="text-caption-30 text-accent-metal uppercase tracking-widest">No recordings found</span>
              <p className="text-[0.7rem] text-accent-metal/40 mt-4 max-w-xs uppercase">Recordings will appear here once you start a capture session.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {sessions.map((session) => (
                <button
                  key={session.filename}
                  onClick={() => onSelect(session.filename)}
                  className="group flex items-center justify-between p-16 rounded-xl border border-accent-metal/5 hover:border-accent-wood/30 hover:bg-accent-wood/5 transition-all duration-300 text-left"
                >
                  <div className="flex items-center gap-16">
                    <div className="w-12 h-12 rounded-lg bg-base-stone-20 flex items-center justify-center group-hover:bg-accent-wood/10 transition-colors">
                      <FileJson className="w-6 h-6 text-accent-metal group-hover:text-accent-wood transition-colors" />
                    </div>
                    <div>
                      <span className="block text-[0.85rem] font-medium text-base-black group-hover:text-accent-wood transition-colors">
                        {session.filename}
                      </span>
                      <div className="flex items-center gap-12 mt-4 text-[0.65rem] text-accent-metal uppercase tracking-tighter">
                        <span className="flex items-center gap-4">
                          <Calendar className="w-3 h-3" />
                          {new Date(session.created_at).toLocaleString()}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-accent-metal/30" />
                        <span>{session.size_kb} KB</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-8 rounded-full bg-accent-metal/5 group-hover:bg-accent-wood text-accent-metal group-hover:text-base-white transition-all transform group-hover:translate-x-2">
                    <Play className="w-4 h-4 fill-current" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-16 bg-base-stone-20/50 border-t border-accent-metal/10 text-center">
          <p className="text-[0.6rem] text-accent-metal/60 uppercase tracking-widest">
            {sessions.length} sessions indexed · Ready for replay
          </p>
        </div>
      </motion.div>
    </div>
  )
}
