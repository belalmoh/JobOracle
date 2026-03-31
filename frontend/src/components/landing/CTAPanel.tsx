'use client'

import { useState } from 'react'
import { motion, useTransform } from 'framer-motion'
import { Panel } from './panels/Panel'
import { ArrowRight, CheckCircle } from 'lucide-react'

interface CTAPanelProps {
  scrollYProgress: any
  range: { start: number; end: number; label: string }
}

export function CTAPanel({ scrollYProgress, range }: CTAPanelProps) {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const ctaProgress = useTransform(scrollYProgress as any, (p: number) => {
    if (p < range.start || p > range.end) return 0
    return (p - range.start) / (range.end - range.start)
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email.includes('@')) {
      setSubmitted(true)
    }
  }

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
            Step 11 of 12
          </span>
        </motion.div>

        <motion.h2 
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[clamp(36px,6vw,72px)] font-bold tracking-tight text-white mb-4"
        >
          Ready to start?
        </motion.h2>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[17px] leading-relaxed text-[var(--muted-rgb)] max-w-md mx-auto mb-8"
        >
          Join thousands who found their dream job. Drop your resume and let AI do the rest.
        </motion.p>

        {!submitted ? (
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onSubmit={handleSubmit}
            className="flex items-center gap-3 max-w-md mx-auto"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.15)] rounded-full px-5 py-3 text-white placeholder:text-[rgba(255,255,255,0.25)] outline-none focus:border-[rgba(255,255,255,0.35)] transition-colors"
            />
            <button
              type="submit"
              className="bg-white text-black px-6 py-3 rounded-full font-semibold hover:opacity-85 transition-opacity flex items-center gap-2"
            >
              Join
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.form>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center justify-center gap-2 text-[var(--success-green)]"
          >
            <CheckCircle className="w-5 h-5" />
            <span className="text-lg font-medium">You're on the list!</span>
          </motion.div>
        )}

        <motion.p
          style={{ opacity: ctaProgress }}
          className="mt-6 text-center text-[12px] text-[var(--muted-rgb)]"
        >
          Free to start · No credit card required
        </motion.p>
      </div>
    </Panel>
  )
}