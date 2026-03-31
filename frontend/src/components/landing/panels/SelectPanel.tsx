'use client'

import { motion, useTransform } from 'framer-motion'
import { Panel } from './Panel'
import { Send, Rocket } from 'lucide-react'

interface SelectPanelProps {
  scrollYProgress: any
  range: { start: number; end: number; label: string }
}

export function SelectPanel({ scrollYProgress, range }: SelectPanelProps) {
  const sendProgress = useTransform(scrollYProgress as any, (p: number) => {
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
            Step 6 of 12
          </span>
        </motion.div>

        <motion.h2 
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[clamp(36px,6vw,72px)] font-bold tracking-tight text-white mb-4"
        >
          Sending to top companies
        </motion.h2>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[17px] leading-relaxed text-[var(--muted-rgb)] max-w-md mx-auto mb-12"
        >
          Your resume is being sent to the 4 best matching companies. They'll review it within 48 hours.
        </motion.p>

        <div className="flex items-center justify-center gap-4 mb-8">
          {['Stripe', 'Shopify', 'Vercel', 'Linear'].map((company, index) => (
            <motion.div
              key={company}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              style={{ 
                opacity: sendProgress,
                x: useTransform(sendProgress, p => (p - 0.5) * (index - 1.5) * 20)
              }}
              className="w-14 h-14 rounded-xl bg-[var(--machine-bg)] border border-[rgba(255,255,255,0.1)] flex items-center justify-center"
            >
              <span className="text-[10px] font-bold text-[var(--accent-purple-light)]">{company.slice(0,2)}</span>
            </motion.div>
          ))}
        </div>

        <motion.div
          style={{ opacity: sendProgress }}
          className="flex items-center justify-center gap-3"
        >
          <div className="flex items-center gap-2 px-4 py-2 bg-[var(--success-green)]/20 border border-[var(--success-green)]/30 rounded-full">
            <Send className="w-4 h-4 text-[var(--success-green)]" />
            <span className="text-sm font-medium text-[var(--success-green)]">Application sent</span>
          </div>
          
          <div className="flex items-center gap-2 px-4 py-2 bg-[var(--amber)]/20 border border-[var(--amber)]/30 rounded-full">
            <Rocket className="w-4 h-4 text-[var(--amber)]" />
            <span className="text-sm font-medium text-[var(--amber)]">4 pending</span>
          </div>
        </motion.div>

        <motion.p
          style={{ opacity: sendProgress }}
          className="mt-6 text-center text-[12px] text-[var(--muted-rgb)]"
        >
          You'll be notified when employers view your application
        </motion.p>
      </div>
    </Panel>
  )
}