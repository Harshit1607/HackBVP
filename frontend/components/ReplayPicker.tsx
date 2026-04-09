'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Play, FileJson, Clock, Database, ChevronRight, HardDrive, Cpu, RefreshCcw, Search } from 'lucide-react'

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

// Module-level cache to keep data across remounts without needing a global context
let sessionCache: Session[] | null = null
let isFetching = false

export default function ReplayPicker({ open, onClose, onSelect }: ReplayPickerProps) {
  const [sessions, setSessions] = useState<Session[]>(sessionCache || [])
  const [loading, setLoading] = useState(!sessionCache)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const fetchSessions = async (silent = false) => {
    if (isFetching && !silent) return
    if (!silent) {
      setLoading(true)
      setError(null)
    }
    isFetching = true
    try {
      const res = await fetch(`${API_URL}/api/sessions`)
      if (!res.ok) throw new Error(`HTTP Error: ${res.status}`)
      const data = await res.json()
      sessionCache = data
      setSessions(data)
      setError(null)
    } catch (err: any) {
      console.error('Failed to fetch sessions', err)
      setError(err.message || 'Connection Failed')
    } finally {
      setLoading(false)
      isFetching = false
    }
  }

  // Pre-load on mount
  useEffect(() => {
    if (!sessionCache) {
      fetchSessions(true)
    }
  }, [])

  // Fresh fetch every time it opens to ensure consistency, but it will show cached data instantly
  useEffect(() => {
    if (open) {
      fetchSessions(true)
    }
  }, [open])

  const filteredSessions = useMemo(() => {
    if (!searchQuery) return sessions
    return sessions.filter(s => 
      s.filename.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [sessions, searchQuery])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-24 md:p-64">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#080809]/60 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.99 }}
            transition={{ type: 'spring', damping: 30, stiffness: 250 }}
            className="relative w-full max-w-5xl bg-base-white border border-accent-metal/30 shadow-[0_30px_90px_-20px_rgba(0,0,0,0.7)] overflow-hidden flex flex-col max-h-[90vh] lg:max-h-[85vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-32 py-16 border-b border-accent-metal/20 bg-base-stone-20/20">
              <div className="flex items-center gap-24">
                <div className="flex flex-col gap-0">
                  <div className="flex items-center gap-12">
                    <h2 className="text-title-10 font-serif text-base-black leading-none">Recordings Archive</h2>
                    <span className="text-[0.6rem] uppercase tracking-[0.4em] text-accent-earth font-bold flex items-center gap-6 border-l border-accent-metal/20 pl-12 py-2">
                      <Cpu className="w-3 h-3 animate-pulse" />
                      BUFFER_SCAN_ACTIVE
                    </span>
                  </div>
                  <p className="text-[0.6rem] text-accent-metal/50 mt-4 font-light uppercase tracking-widest">
                    Historical CSI session buffer indexed from local storage.
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-12">
                <button 
                  onClick={() => fetchSessions()}
                  disabled={loading}
                  className="p-10 hover:bg-accent-metal/5 text-accent-metal transition-all rounded-full disabled:opacity-30"
                  title="Force Refresh Archive"
                >
                  <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <div className="w-[1px] h-24 bg-accent-metal/10 mx-4" />
                <button 
                  onClick={onClose}
                  className="p-12 hover:bg-accent-fire text-accent-metal hover:text-white transition-all group"
                >
                  <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                </button>
              </div>
            </div>

            {/* Utility Bar: Search & Status */}
            <div className="px-32 py-12 bg-base-white border-b border-accent-metal/10 flex items-center gap-24">
              <div className="flex-1 relative group">
                <Search className="absolute left-12 top-1/2 -translate-y-1/2 w-4 h-4 text-accent-metal/30 group-focus-within:text-accent-earth transition-colors" />
                <input 
                  type="text"
                  placeholder="Filter sessions by filename..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-base-stone-20/30 border border-accent-metal/5 px-40 py-8 text-[0.7rem] font-mono text-base-black outline-none focus:border-accent-earth/40 focus:bg-white transition-all"
                />
              </div>
              <div className="flex items-center gap-12 text-[0.55rem] font-mono whitespace-nowrap">
                <span className="text-accent-metal/40 uppercase">Results</span>
                <span className="text-base-black">{filteredSessions.length} / {sessions.length}</span>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-base-white/60 min-h-[40vh]">
              {loading && sessions.length === 0 ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-24 bg-base-white/80 z-50">
                  <div className="relative w-48 h-1 bg-accent-metal/10 overflow-hidden">
                    <motion.div 
                      animate={{ x: [-48, 48] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute inset-0 w-24 bg-accent-earth"
                    />
                  </div>
                  <span className="text-caption-30-fixed text-accent-metal uppercase tracking-[0.3em] font-mono animate-pulse">
                    Parsing File Hierarchy...
                  </span>
                </div>
              ) : (filteredSessions.length === 0 || error) ? (
                <div className="py-120 flex flex-col items-center justify-center text-center px-48">
                  <Database className={`w-16 h-16 ${error ? 'text-accent-fire/20' : 'text-accent-metal/10'} mb-24`} />
                  <span className={`text-caption-30 ${error ? 'text-accent-fire' : 'text-accent-metal'} uppercase tracking-[0.3em] block font-bold`}>
                    {error ? 'Handshake Failed' : 'No Matches Found'}
                  </span>
                  <p className="text-body-30 text-accent-metal/40 mt-16 max-w-md uppercase leading-relaxed font-light">
                    {error 
                      ? `Critical: ${error} — Verify backend is active on ${API_URL}`
                      : 'Try adjusting your search criteria or refresh the archive.'
                    }
                  </p>
                  {error && (
                    <button 
                      onClick={() => fetchSessions()}
                      className="mt-32 px-24 py-12 border border-accent-fire/20 text-accent-fire text-[0.6rem] uppercase tracking-widest hover:bg-accent-fire hover:text-white transition-all font-mono"
                    >
                      Retry Connection
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col divide-y divide-accent-metal/15">
                  {filteredSessions.map((session, i) => (
                    <button
                      key={session.filename}
                      onClick={() => onSelect(session.filename)}
                      className="group flex items-center justify-between p-24 lg:px-48 lg:py-32 hover:bg-accent-earth/5 transition-all duration-300 text-left relative overflow-hidden"
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-accent-earth scale-y-0 group-hover:scale-y-100 transition-transform origin-top duration-700" />
                      
                      <div className="flex items-center gap-40 flex-1 overflow-hidden">
                        {/* Index Indicator */}
                        <div className="flex flex-col items-center justify-center text-accent-metal/40 font-mono text-[0.7rem] flex-shrink-0 w-32">
                          <span>{String(i + 1).padStart(2, '0')}</span>
                        </div>
                        
                        <div className="flex-1 overflow-hidden">
                          <h3 className="text-title-10 font-serif text-base-black group-hover:text-accent-earth transition-colors truncate">
                            {session.filename}
                          </h3>
                          
                          <div className="flex items-center gap-24 mt-8">
                            <div className="flex items-center gap-8 text-[0.7rem] text-accent-metal uppercase tracking-widest font-mono">
                              <Clock className="w-3.5 h-3.5 text-accent-earth/40" />
                              {new Date(session.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
                              <span className="opacity-30 mx-4">—</span>
                              {new Date(session.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="w-[1px] h-12 bg-accent-metal/20" />
                            <div className="flex items-center gap-8 text-[0.7rem] text-accent-metal uppercase tracking-widest font-mono">
                              <HardDrive className="w-3.5 h-3.5 text-accent-earth/40" />
                              {(session.size_kb / 1024).toFixed(2)} MB
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-24 flex-shrink-0">
                         <div className="hidden lg:flex flex-col items-end opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[0.55rem] font-mono text-accent-earth uppercase tracking-widest">Select to Load</span>
                            <span className="text-[0.55rem] font-mono text-accent-metal/40 uppercase tracking-tight">INDEX_SECTOR_0</span>
                         </div>
                         <div className="flex items-center justify-center w-48 h-48 rounded-full border border-accent-metal/20 group-hover:border-accent-earth text-accent-metal group-hover:text-accent-earth transition-all transform group-hover:scale-110 flex-shrink-0 bg-white shadow-xl">
                            <Play className="w-5 h-5 fill-current ml-1" />
                         </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-32 py-20 bg-base-stone-20/40 border-t border-accent-metal/20 flex items-center justify-between">
              <div className="flex gap-48">
                <div className="flex flex-col">
                  <span className="text-[0.5rem] text-accent-metal uppercase tracking-widest font-mono mb-2">Total Packets</span>
                  <span className="text-[0.7rem] text-base-black font-mono">{(sessions.length * 1240).toLocaleString()}+</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[0.5rem] text-accent-metal uppercase tracking-widest font-mono mb-2">Drive Path</span>
                  <span className="text-[0.7rem] text-base-black font-mono">~/data/recordings/*</span>
                </div>
                <div className="hidden lg:flex flex-col">
                  <span className="text-[0.5rem] text-accent-metal uppercase tracking-widest font-mono mb-2">Buffer Memory</span>
                  <span className="text-[0.7rem] text-base-black font-mono">{(sessions.reduce((acc, s) => acc + s.size_kb, 0) / 1024).toFixed(2)} MB Indexed</span>
                </div>
              </div>
              <div className="flex items-center gap-12 bg-accent-earth/5 px-12 py-6 border border-accent-earth/10">
                <div className="w-2 h-2 rounded-full bg-accent-earth animate-pulse" />
                <span className="text-[0.6rem] text-accent-metal uppercase tracking-[0.2em] font-medium">Ready for Re-mounting</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
