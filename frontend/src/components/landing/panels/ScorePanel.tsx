'use client'

import { motion, useTransform } from 'framer-motion'
import { Panel } from './Panel'
import { CheckCircle } from 'lucide-react'

interface ScorePanelProps {
  scrollYProgress: any
  range: { start: number; end: number; label: string }
}

export function ScorePanel({ scrollYProgress, range }: ScorePanelProps) {
  const scoreProgress = useTransform(scrollYProgress as any, (p: number) => {
    if (p < range.start) return 0
    if (p > range.end) return 1
    return (p - range.start) / (range.end - range.start)
  })

  const score = useTransform(scoreProgress, (p: number) => Math.round(p * 87))
  
  const ringRotation = useTransform(scoreProgress, (p) => p * 360)

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
            Step 4 of 12
          </span>
        </motion.div>

        <motion.h2 
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-[clamp(36px,6vw,72px)] font-bold tracking-tight text-white mb-4"
        >
          Your score: 87%
        </motion.h2>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-[17px] leading-relaxed text-[var(--muted-rgb)] max-w-md mx-auto mb-8"
        >
          Based on skills match, experience level, and role fit. This score determines your job compatibility.
        </motion.p>

        <div className="flex items-center justify-center mb-8">
          <div className="relative w-36 h-36">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="8"
              />
              <motion.circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="url(#scoreGradient)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray="251.2"
                style={{ 
                  strokeDashoffset: useTransform(scoreProgress, p => 251.2 * (1 - p))
                }}
              />
              <defs>
                <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="var(--accent-purple)" />
                  <stop offset="100%" stopColor="var(--accent-purple-light)" />
                </linearGradient>
              </defs>
            </svg>
            
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span 
                style={{ scale: scoreProgress }}
                className="text-5xl font-bold text-white"
              >
                {score}
              </motion.span>
              <span className="text-[10px] text-[var(--muted-rgb)] uppercase tracking-wider">Match Score</span>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex items-center justify-center gap-2 text-[var(--success-green)]"
        >
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm font-medium">Above average for your role</span>
        </motion.div>
      </div>
    </Panel>
  )
}