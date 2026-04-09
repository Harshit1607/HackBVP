'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { getSessions, playSession, stopSession } from '../../lib/api'
import type { Session } from '../../lib/types'
import { useSensingStream } from '../../hooks/useSensingStream'

export default function ReplayPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [playingFile, setPlayingFile] = useState<string | null>(null)
  
  const state = useSensingStream() // To monitor current source

  useEffect(() => {
    async function loadSessions() {
      try {
        setLoading(true)
        const data = await getSessions()
        setSessions(data)
        setError(null)
      } catch (err) {
        setError('Failed to fetch sessions from RUVIEW—API')
      } finally {
        setLoading(false)
      }
    }
    loadSessions()
  }, [])

  // Sync state.source with playingFile if needed, but simple state is fine
  useEffect(() => {
    if (state.source === 'Disconnected' || state.source === 'none' || !state.source.includes('Replay')) {
      setPlayingFile(null)
    }
  }, [state.source])

  const handlePlay = async (filename: string, speed: number) => {
    setPlayingFile(filename)
    await playSession(filename, speed)
  }

  const handleStop = async () => {
    await stopSession()
    setPlayingFile(null)
  }

  return (
    <div className="flex flex-col h-full bg-base text-white p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-12 border-b border-signal/20 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tighter uppercase mb-1">Session Data Replay</h1>
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#7a818e]">
            Archive Retrieval System v3.2
          </p>
        </div>
        <Link 
          href="/" 
          className="text-[10px] uppercase font-mono tracking-widest text-[#7a818e] hover:text-signal transition-colors border border-signal/20 px-4 py-2 hover:bg-signal/5"
        >
          [ Return to Dashboard ]
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="h-6 w-6 border-2 border-signal border-t-transparent animate-spin rounded-full" />
          <span className="font-mono text-xs uppercase tracking-widest text-signal/60">Fetching Session Index...</span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4 p-8 border border-alert/20 bg-alert/5 text-alert">
          <span className="font-mono text-xs uppercase tracking-widest">{error}</span>
          <button 
            onClick={() => window.location.reload()} 
            className="text-[10px] font-mono border border-alert/40 px-4 py-2 hover:bg-alert/10"
          >
            RETRY CONNECTION
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-12 gap-4 px-4 py-2 border-b border-white/5 font-mono text-[9px] uppercase tracking-widest text-[#7a818e]">
            <div className="col-span-6">Filename</div>
            <div className="col-span-2">Size</div>
            <div className="col-span-4 text-right">Actions</div>
          </div>

          {sessions.length === 0 ? (
            <div className="py-12 text-center border border-dashed border-white/5 bg-panel/30">
              <span className="font-mono text-[10px] text-[#5a616e]">NO SESSION DATA FOUND ON SERVER</span>
            </div>
          ) : (
            sessions.map((session) => (
              <SessionRow 
                key={session.filename} 
                session={session} 
                isPlaying={playingFile === session.filename} 
                onPlay={(speed) => handlePlay(session.filename, speed)}
                onStop={handleStop}
              />
            ))
          )}
        </div>
      )}

      {playingFile && (
        <div className="fixed bottom-0 left-0 right-0 h-16 bg-panel border-t border-signal/20 flex items-center justify-center z-50">
          <div className="flex items-center gap-8 px-8 w-full max-w-5xl justify-between">
            <div className="flex items-center gap-4">
              <div className="h-2 w-2 rounded-full bg-signal animate-pulse" />
              <div className="flex flex-col">
                <span className="font-mono text-[10px] uppercase text-[#7a818e]">Replaying Segment</span>
                <span className="font-mono text-xs text-signal truncate max-w-[300px]">{playingFile}</span>
              </div>
            </div>
            <button 
              onClick={handleStop}
              className="bg-alert text-base font-mono text-[10px] font-bold uppercase tracking-widest px-8 py-2 hover:bg-alert/90 transition-colors"
            >
              Emergency Halt [Stop]
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function SessionRow({ session, isPlaying, onPlay, onStop }: { 
  session: Session, 
  isPlaying: boolean,
  onPlay: (speed: number) => void,
  onStop: () => void
}) {
  const [speed, setSpeed] = useState(1.0)

  return (
    <div className={`grid grid-cols-12 gap-4 px-4 py-4 border border-white/5 items-center transition-all ${
      isPlaying ? 'border-l-4 border-l-signal bg-signal/10' : 'bg-panel hover:bg-white/[0.02]'
    }`}>
      <div className="col-span-6 flex flex-col gap-1">
        <span className="font-mono text-xs font-semibold tracking-tight truncate">{session.filename}</span>
        <span className="font-mono text-[9px] uppercase text-[#5a616e]">LOG RECORD DATASTREAM</span>
      </div>
      <div className="col-span-2 font-mono text-xs text-[#7a818e]">
        {session.size_kb.toLocaleString()} KB
      </div>
      <div className="col-span-4 flex items-center justify-end gap-3">
        {!isPlaying ? (
          <>
            <select 
              className="bg-base border border-white/10 text-[10px] font-mono h-8 px-2 focus:border-signal outline-none uppercase"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
            >
              <option value={0.5}>0.5x SLOW</option>
              <option value={1.0}>1.0x NORMAL</option>
              <option value={2.0}>2.0x FAST</option>
            </select>
            <button 
              onClick={() => onPlay(speed)}
              className="h-8 border border-signal/40 text-signal hover:bg-signal/10 px-4 text-[10px] font-mono uppercase tracking-widest"
            >
              Load & Play
            </button>
          </>
        ) : (
          <div className="h-8 flex items-center px-4 font-mono text-[10px] uppercase text-signal animate-pulse">
            Currently Streaming
          </div>
        )}
      </div>
    </div>
  )
}
