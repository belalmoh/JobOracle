'use client'

import { motion, useTransform } from 'framer-motion'
import { Panel } from './Panel'
import { Bell, Calendar, MapPin, Clock } from 'lucide-react'

interface InterviewPanelProps {
  scrollYProgress: any
  range: { start: number; end: number; label: string }
}

export function InterviewPanel({ scrollYProgress, range }: InterviewPanelProps) {
  const notifyProgress = useTransform(scrollYProgress as any, (p: number) => {
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
            Step 8 of 12
          </span>
        </motion.div>

        <motion.h2 
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[clamp(36px,6vw,72px)] font-bold tracking-tight text-white mb-4"
        >
          Interview Invitation!
        </motion.h2>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[17px] leading-relaxed text-[var(--muted-rgb)] max-w-md mx-auto mb-8"
        >
          Stripe wants to talk. Your first technical interview is scheduled.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-[var(--machine-bg)] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6 mb-6"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-[var(--accent-purple)]/20 flex items-center justify-center">
              <span className="text-lg font-bold text-[var(--accent-purple-light)]">S</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Stripe</h3>
              <p className="text-sm text-[var(--muted-rgb)]">Senior Backend Engineer</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="w-4 h-4 text-[var(--accent-purple-light)]" />
              <span className="text-white">Wednesday, March 15th</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Clock className="w-4 h-4 text-[var(--accent-purple-light)]" />
              <span className="text-white">2:00 PM - 3:00 PM PST</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="w-4 h-4 text-[var(--accent-purple-light)]" />
              <span className="text-white">Video Call (Zoom)</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          style={{ opacity: notifyProgress }}
          className="flex items-center justify-center gap-2"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
            className="w-10 h-10 rounded-full bg-[var(--amber)]/20 flex items-center justify-center"
          >
            <Bell className="w-5 h-5 text-[var(--amber)]" />
          </motion.div>
          <span className="text-sm font-medium text-[var(--amber)]">Interview request received</span>
        </motion.div>
      </div>
    </Panel>
  )
}