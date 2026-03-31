'use client'

import { motion, useTransform } from 'framer-motion'
import { Panel } from './Panel'
import { FileText, Cpu, Zap } from 'lucide-react'

interface ProcessPanelProps {
  scrollYProgress: any
  range: { start: number; end: number; label: string }
}

export function ProcessPanel({ scrollYProgress, range }: ProcessPanelProps) {
  const processProgress = useTransform(scrollYProgress as any, (p: number) => {
    if (p < range.start || p > range.end) return 0
    return (p - range.start) / (range.end - range.start)
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
            Step 3 of 12
          </span>
        </motion.div>

        <motion.h2 
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-[clamp(36px,6vw,72px)] font-bold tracking-tight text-white mb-4"
        >
          AI is analyzing
        </motion.h2>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-[17px] leading-relaxed text-[var(--muted-rgb)] max-w-md mx-auto mb-12"
        >
          Machine learning models extract skills, experience patterns, and career trajectory.
        </motion.p>

        <div className="relative h-40 flex items-center justify-center gap-6">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="w-20 h-20 rounded-full border-2 border-dashed border-[rgba(124,111,255,0.3)]"
          />
          
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 rounded-full border-2 border-dashed border-[rgba(176,168,255,0.5)]"
          />

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex items-center gap-4">
              <motion.div
                style={{ opacity: processProgress }}
                className="flex items-center gap-2 text-[var(--accent-purple-light)]"
              >
                <Cpu className="w-5 h-5" />
                <span className="text-sm font-medium">Processing</span>
              </motion.div>
              
              <motion.div
                style={{ opacity: processProgress }}
                className="flex items-center gap-2 text-[var(--success-green)]"
              >
                <Zap className="w-4 h-4" />
                <span className="text-xs">198 skills detected</span>
              </motion.div>
            </div>
          </div>
        </div>

        <motion.div 
          style={{ width: processProgress }}
          className="mt-8 h-1 bg-[var(--accent-purple)] rounded-full mx-auto max-w-xs"
        />

        <motion.p
          style={{ opacity: processProgress }}
          className="mt-4 text-center text-[12px] text-[var(--muted-rgb)]"
        >
          Analyzing experience patterns...
        </motion.p>
      </div>
    </Panel>
  )
}