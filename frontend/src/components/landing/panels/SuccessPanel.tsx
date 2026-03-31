'use client'

import { motion, useTransform } from 'framer-motion'
import { Panel } from './Panel'
import { Trophy, Sparkles } from 'lucide-react'

interface SuccessPanelProps {
  scrollYProgress: any
  range: { start: number; end: number; label: string }
}

export function SuccessPanel({ scrollYProgress, range }: SuccessPanelProps) {
  const successProgress = useTransform(scrollYProgress as any, (p: number) => {
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
          <span className="inline-flex items-center gap-2 text-[11px] tracking-[2.5px] uppercase text-[var(--success-green)] font-semibold mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--success-green)] animate-pulse" />
            Step 10 of 12
          </span>
        </motion.div>

        <motion.h2 
          initial={{ opacity: 0, y: 28, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.1, type: 'spring' }}
          className="text-[clamp(48px,8vw,96px)] font-bold tracking-tight text-white mb-6"
        >
          Job <span className="text-[var(--success-green)]">Landed!</span>
        </motion.h2>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[17px] leading-relaxed text-[var(--muted-rgb)] max-w-md mx-auto mb-8"
        >
          Congratulations! Your journey from resume to offer is complete. Welcome to your new career.
        </motion.p>

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring' }}
          className="relative inline-block mb-8"
        >
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[var(--success-green)] to-[var(--accent-purple)] flex items-center justify-center">
            <Trophy className="w-14 h-14 text-white" />
          </div>
          
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 rounded-full"
          >
            <div className="absolute inset-2 rounded-full border-2 border-[var(--success-green)]" />
          </motion.div>
        </motion.div>

        <motion.div
          style={{ opacity: successProgress }}
          className="flex items-center justify-center gap-2"
        >
          <Sparkles className="w-5 h-5 text-[var(--amber)]" />
          <span className="text-sm font-medium text-[var(--amber)]">Full process: 12 days</span>
        </motion.div>

        <motion.p
          style={{ opacity: successProgress }}
          className="mt-4 text-center text-[12px] text-[var(--muted-rgb)]"
        >
          Average time on JobOracle: 14 days
        </motion.p>
      </div>
    </Panel>
  )
}