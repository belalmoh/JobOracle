'use client'

import { motion, useTransform } from 'framer-motion'

interface PanelProps {
  scrollYProgress: any
  range: { start: number; end: number; label: string }
  children: React.ReactNode
}

export function Panel({ scrollYProgress, range, children }: PanelProps) {
  const opacity = useTransform(scrollYProgress as any, (p: number) => {
    const { start, end } = range
    const fadeRange = (end - start) * 0.15
    
    if (p < start) return 0
    if (p > end) return 0
    if (p < start + fadeRange) return (p - start) / fadeRange
    if (p > end - fadeRange) return (end - p) / fadeRange
    return 1
  })

  const y = useTransform(scrollYProgress as any, (p: number) => {
    const { start, end } = range
    const center = (start + end) / 2
    if (p < start || p > end) return 30
    return (p - center) * -15
  })

  return (
    <motion.div
      style={{ opacity, y }}
      className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 pointer-events-none"
    >
      {children}
    </motion.div>
  )
}