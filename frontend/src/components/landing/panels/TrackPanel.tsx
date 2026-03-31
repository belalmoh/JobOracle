'use client'

import { motion, useTransform } from 'framer-motion'
import { Panel } from './Panel'
import { CheckCircle, Clock, Eye, Heart, XCircle } from 'lucide-react'

interface TrackPanelProps {
  scrollYProgress: any
  range: { start: number; end: number; label: string }
}

const statuses = [
  { icon: CheckCircle, label: 'Applied', time: '2h ago', color: 'var(--accent-purple-light)', delay: 0 },
  { icon: Eye, label: 'Viewed', time: '4h ago', color: 'var(--amber)', delay: 0.15 },
  { icon: Heart, label: 'Shortlisted', time: '1d ago', color: 'var(--success-green)', delay: 0.3 },
  { icon: Clock, label: 'Interview', time: 'Pending', color: 'var(--muted-rgb)', delay: 0.45 },
]

export function TrackPanel({ scrollYProgress, range }: TrackPanelProps) {
  const trackProgress = useTransform(scrollYProgress as any, (p: number) => {
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
            Step 7 of 12
          </span>
        </motion.div>

        <motion.h2 
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[clamp(36px,6vw,72px)] font-bold tracking-tight text-white mb-4"
        >
          Track your applications
        </motion.h2>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[17px] leading-relaxed text-[var(--muted-rgb)] max-w-md mx-auto mb-8"
        >
          No more guessing. See exactly what happened with every application.
        </motion.p>

        <div className="space-y-4">
          {statuses.map((status, index) => {
            const Icon = status.icon
            const isComplete = index < 3
            
            return (
              <motion.div
                key={status.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: status.delay }}
                className="flex items-center gap-4 p-4 bg-[var(--machine-bg)] border border-[rgba(255,255,255,0.05)] rounded-lg"
              >
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isComplete 
                      ? 'bg-[var(--success-green)]/20' 
                      : 'bg-[rgba(255,255,255,0.05)]'
                  }`}
                >
                  <Icon 
                    className="w-5 h-5" 
                    style={{ color: isComplete ? status.color : 'var(--muted-rgb)' }}
                  />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${isComplete ? 'text-white' : 'text-[var(--muted-rgb)]'}`}>
                      {status.label}
                    </span>
                    {isComplete && (
                      <span className="text-[10px] text-[var(--success-green)] bg-[var(--success-green)]/20 px-2 py-0.5 rounded-full">
                        Complete
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-[var(--muted-rgb)]">{status.time}</span>
                </div>
                
                {isComplete && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: status.delay + 0.1, type: 'spring' }}
                    className="w-6 h-6 rounded-full bg-[var(--success-green)] flex items-center justify-center"
                  >
                    <CheckCircle className="w-4 h-4 text-white" />
                  </motion.div>
                )}
              </motion.div>
            )
          })}
        </div>

        <motion.p
          style={{ opacity: trackProgress }}
          className="mt-6 text-center text-[12px] text-[var(--muted-rgb)]"
        >
          Stripe · Senior Backend Engineer
        </motion.p>
      </div>
    </Panel>
  )
}