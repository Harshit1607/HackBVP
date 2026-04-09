import React from 'react'

export default function PoseCanvas({ keypoints }: { keypoints?: any }) {
  return (
    <div
      className="relative overflow-hidden w-full"
      style={{ aspectRatio: '1.5' }}
    >
      <div className="absolute inset-0 border border-dashed border-accent-metal
                      bg-base-stone-20 flex items-center justify-center">
        <div className="text-center px-24">
          <span className="block font-serif text-title-10 text-accent-water italic mb-8">
            Pose Tracking Sensor
          </span>
          <span className="text-caption-30 uppercase text-base-black block">
            Awaiting ESP32-S3 Uplink
          </span>
          <span className="text-body-30 text-base-brown block mt-16 font-sans">
            Connect sensor node to enable skeletal triangulation
          </span>
        </div>
      </div>
    </div>
  )
}
