'use client'

import { motion, useTransform } from 'framer-motion'

interface PanelRange {
  start: number
  end: number
  label: string
}

interface ProgressBarProps {
  scrollYProgress: any
  panelRanges: PanelRange[]
}

export function ProgressBar({ scrollYProgress, panelRanges }: ProgressBarProps) {
  const currentLabel = useTransform(scrollYProgress as any, (p: number) => {
    for (let i = panelRanges.length - 1; i >= 0; i--) {
      if (p >= panelRanges[i].start) {
        return panelRanges[i].label
      }
    }
    return panelRanges[0].label
  })

  return (
    <motion.div
      style={{ opacity: scrollYProgress }}
      className="absolute bottom-7 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-50 pointer-events-none"
    >
      <motion.span
        style={{ opacity: scrollYProgress }}
        className="text-[10px] tracking-[2px] uppercase text-[rgba(255,255,255,0.28)] font-medium"
      >
        {currentLabel}
      </motion.span>
      <div className="w-[100px] h-[1.5px] bg-[rgba(255,255,255,0.12)] rounded-full overflow-hidden">
        <motion.div
          style={{ scaleX: scrollYProgress, originX: 0 }}
          className="h-full bg-[var(--accent-purple-light)] rounded-full"
        />
      </div>
    </motion.div>
  )
}