'use client'

import { motion, useTransform } from 'framer-motion'

interface HeroPanelProps {
  scrollYProgress: any
}

export function HeroPanel({ scrollYProgress }: HeroPanelProps) {
  const opacity = useTransform(scrollYProgress, (p: number) => {
    if (p > 0.05) return 0
    return 1
  })
  const y = useTransform(scrollYProgress, (p: number) => {
    return p * 20
  })

  return (
    <motion.div
      style={{ opacity, y }}
      className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 z-20"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.1 }}
        className="mb-6"
      >
        <h1 className="text-[clamp(56px,10vw,120px)] font-bold tracking-tight text-white">
          <span className="text-[var(--accent-purple-light)]">Job</span>Oracle
        </h1>
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="text-[18px] md:text-[22px] leading-relaxed text-[var(--muted-rgb)] max-w-lg"
      >
        <span className="text-white font-medium">From resume to offer</span> — AI-powered hiring that finds your perfect match, tracks every application, and lands you the job.
      </motion.p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.6 }}
        className="mt-12 flex items-center gap-2 text-[12px] text-[var(--muted-rgb)]"
      >
        <span className="w-1 h-1 rounded-full bg-[var(--accent-purple-light)] animate-pulse" />
        <span>Scroll to begin the journey</span>
        <motion.span
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="ml-2"
        >
          ↓
        </motion.span>
      </motion.div>
    </motion.div>
  )
}