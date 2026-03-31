'use client'

import { motion, useTransform } from 'framer-motion'
import { Panel } from './Panel'
import { PartyPopper, DollarSign, CheckCircle } from 'lucide-react'

interface OfferPanelProps {
  scrollYProgress: any
  range: { start: number; end: number; label: string }
}

export function OfferPanel({ scrollYProgress, range }: OfferPanelProps) {
  const offerProgress = useTransform(scrollYProgress as any, (p: number) => {
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
            Step 9 of 12
          </span>
        </motion.div>

        <motion.h2 
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[clamp(36px,6vw,72px)] font-bold tracking-tight text-white mb-4"
        >
          Offer Received!
        </motion.h2>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[17px] leading-relaxed text-[var(--muted-rgb)] max-w-md mx-auto mb-6"
        >
          Stripe made an offer. Here's what they're offering:
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-[var(--success-green)]/20 to-[var(--accent-purple)]/20 border border-[var(--success-green)]/30 rounded-2xl p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-[var(--muted-rgb)]">Base Salary</span>
            <span className="text-2xl font-bold text-white">$185,000</span>
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-[var(--muted-rgb)]">Equity</span>
            <span className="text-lg font-semibold text-white">$50,000/year</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--muted-rgb)]">Signing Bonus</span>
            <span className="text-lg font-semibold text-white">$25,000</span>
          </div>

          <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.1)]">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white">Total Compensation</span>
              <span className="text-xl font-bold text-[var(--success-green)]">$260,000</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          style={{ opacity: offerProgress }}
          className="flex items-center justify-center gap-2"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
            className="w-10 h-10 rounded-full bg-[var(--success-green)]/20 flex items-center justify-center"
          >
            <DollarSign className="w-5 h-5 text-[var(--success-green)]" />
          </motion.div>
          <span className="text-sm font-medium text-[var(--success-green)]">+47% above market rate</span>
        </motion.div>
      </div>
    </Panel>
  )
}