'use client'

import { motion, useTransform } from 'framer-motion'
import { Panel } from './Panel'
import { FileText } from 'lucide-react'

interface InsertPanelProps {
  scrollYProgress: any
  range: { start: number; end: number; label: string }
}

export function InsertPanel({ scrollYProgress, range }: InsertPanelProps) {
  const resumeY = useTransform(scrollYProgress as any, (p: number) => {
    if (p < range.start) return -200
    if (p > range.end) return 0
    const progress = (p - range.start) / (range.end - range.start)
    return -200 + progress * 200
  })

  const glowOpacity = useTransform(scrollYProgress as any, (p: number) => {
    if (p < range.start) return 0
    if (p > range.end) return 0
    return Math.min(1, (p - range.start) / 0.05)
  })

  return (
    <Panel scrollYProgress={scrollYProgress} range={range}>
      <div className="relative w-full max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <motion.span 
            className="inline-flex items-center gap-2 text-[11px] tracking-[2.5px] uppercase text-[var(--accent-purple-light)] font-semibold mb-5"
            style={{ opacity: glowOpacity }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-purple-light)] animate-pulse" />
            Step 1 of 12
          </motion.span>
        </motion.div>

        <motion.h2 
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-[clamp(36px,6vw,72px)] font-bold tracking-tight text-white mb-4"
        >
          Drop your resume
        </motion.h2>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-[17px] leading-relaxed text-[var(--muted-rgb)] max-w-md mx-auto mb-12"
        >
          Insert your resume into the machine. We'll analyze it, score it, and find your perfect job matches.
        </motion.p>

        <div className="relative h-48 flex items-center justify-center">
          <motion.div
            style={{ y: resumeY }}
            className="relative z-10"
          >
            <motion.div
              animate={{ 
                boxShadow: ['0 0 20px rgba(124,111,255,0)', '0 0 40px rgba(124,111,255,0.5)', '0 0 20px rgba(124,111,255,0)'] 
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-32 h-40 bg-[var(--machine-bg)] border border-[rgba(255,255,255,0.1)] rounded-lg flex items-center justify-center"
            >
              <FileText className="w-16 h-16 text-[var(--accent-purple-light)]" strokeWidth={1} />
            </motion.div>
          </motion.div>

          <motion.div 
            className="absolute bottom-0 w-48 h-3 bg-gradient-to-t from-[var(--accent-purple)] to-transparent rounded-full blur-xl" 
            style={{ opacity: glowOpacity as any }}
          />

          <motion.div 
            className="absolute bottom-0 w-40 h-4 border-2 border-[var(--accent-purple)] rounded-b-lg opacity-50" 
            style={{ opacity: glowOpacity as any }}
          />
        </div>
      </div>
    </Panel>
  )
}