'use client'

import { motion, useTransform } from 'framer-motion'
import { Panel } from './Panel'
import { FileText, ScanLine } from 'lucide-react'

interface ScanPanelProps {
  scrollYProgress: any
  range: { start: number; end: number; label: string }
}

export function ScanPanel({ scrollYProgress, range }: ScanPanelProps) {
  const scanLineY = useTransform(scrollYProgress as any, (p: number) => {
    if (p < range.start || p > range.end) return 0
    const progress = (p - range.start) / (range.end - range.start)
    return progress * 160 - 80
  })

  const glowIntensity = useTransform(scrollYProgress as any, (p: number) => {
    if (p < range.start || p > range.end) return 0
    const progress = (p - range.start) / (range.end - range.start)
    return Math.sin(progress * Math.PI) * 0.8
  })

  return (
    <Panel scrollYProgress={scrollYProgress} range={range}>
      <div className="relative w-full max-w-lg">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-8"
        >
          <span className="inline-flex items-center gap-2 text-[11px] tracking-[2.5px] uppercase text-[var(--accent-purple-light)] font-semibold mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-purple-light)] animate-pulse" />
            Step 2 of 12
          </span>
        </motion.div>

        <motion.h2 
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-[clamp(36px,6vw,72px)] font-bold tracking-tight text-white mb-4"
        >
          Scanning your profile
        </motion.h2>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-[17px] leading-relaxed text-[var(--muted-rgb)] max-w-md mx-auto mb-12"
        >
          Our AI scanner reads every detail — skills, experience, education — extracting what matters.
        </motion.p>

        <div className="relative h-48 flex items-center justify-center">
          <div className="relative w-36 h-44 bg-[var(--machine-bg)] border border-[rgba(255,255,255,0.1)] rounded-lg p-4">
            <div className="w-full h-full flex items-center justify-center">
              <FileText className="w-14 h-14 text-[rgba(255,255,255,0.3)]" strokeWidth={1} />
            </div>
            
            <motion.div
              style={{ y: scanLineY }}
              className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[var(--accent-purple)] to-transparent"
            />
            
            <motion.div
              style={{ opacity: glowIntensity }}
              className="absolute inset-0 bg-[var(--accent-purple)]/10 rounded-lg"
            />
          </div>

          <motion.div
            style={{ opacity: glowIntensity }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="w-40 h-48 border-2 border-[var(--accent-purple)] rounded-lg" />
          </motion.div>

          <motion.div
            style={{ opacity: glowIntensity }}
            className="absolute inset-0"
          >
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[var(--accent-purple)] to-transparent opacity-50" />
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-6 flex items-center justify-center gap-2 text-[12px] text-[var(--muted-rgb)]"
        >
          <ScanLine className="w-4 h-4" />
          <span>Optical Character Recognition Active</span>
        </motion.div>
      </div>
    </Panel>
  )
}