'use client'

import React from 'react'

interface Keypoint {
  x: number
  y: number
  confidence: number
}

interface PoseCanvasProps {
  keypoints?: Array<Keypoint>
}

const PoseCanvas: React.FC<PoseCanvasProps> = ({ keypoints }) => {
  return (
    <div className="relative flex h-[120px] w-full items-center justify-center border border-dashed border-white/10 bg-base/50">
      <div className="flex flex-col items-center gap-2">
        <div className="h-6 w-12 rounded border border-white/20 flex items-center justify-center">
            <div className="h-1 w-1 bg-white/20 rounded-full animate-pulse" />
        </div>
        <span className="font-mono text-xs uppercase tracking-widest text-[#5a616e]">
          Pose Estimation — Hardware Required
        </span>
      </div>
      
      {/* Decorative corner indicators for "hardware" look */}
      <div className="absolute top-2 left-2 flex gap-1">
        <div className="h-0.5 w-0.5 bg-white/20" />
        <div className="h-0.5 w-0.5 bg-white/20" />
      </div>
    </div>
  )
}

export default PoseCanvas
