'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { HeroPanel } from './panels/HeroPanel'
import { InsertPanel } from './panels/InsertPanel'
import { ScanPanel } from './panels/ScanPanel'
import { ProcessPanel } from './panels/ProcessPanel'
import { ScorePanel } from './panels/ScorePanel'
import { MatchPanel } from './panels/MatchPanel'
import { SelectPanel } from './panels/SelectPanel'
import { TrackPanel } from './panels/TrackPanel'
import { InterviewPanel } from './panels/InterviewPanel'
import { OfferPanel } from './panels/OfferPanel'
import { SuccessPanel } from './panels/SuccessPanel'
import { CTAPanel } from './CTAPanel'
import { PreviewPanel } from './PreviewPanel'
import { ProgressBar } from './ui/ProgressBar'

const PANEL_RANGES = [
  { start: 0.06, end: 0.15, label: 'Insert' },
  { start: 0.16, end: 0.25, label: 'Scanning' },
  { start: 0.26, end: 0.35, label: 'Processing' },
  { start: 0.36, end: 0.45, label: 'Scoring' },
  { start: 0.46, end: 0.56, label: 'Matching' },
  { start: 0.57, end: 0.66, label: 'Sending' },
  { start: 0.67, end: 0.76, label: 'Tracking' },
  { start: 0.77, end: 0.86, label: 'Interview' },
  { start: 0.87, end: 0.94, label: 'Offer' },
  { start: 0.92, end: 0.97, label: 'Success' },
]

const HERO_RANGE = { start: 0, end: 0.06, label: 'Welcome' }
const ENDING_RANGE = { start: 0.96, end: 1.0, label: 'Dashboard' }

export function CinematicScroll() {
  const containerRef = useRef<HTMLDivElement>(null)
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  })

  const endingOpacity = useTransform(scrollYProgress, (p: number) => {
    if (p < 0.96) return 0
    return (p - 0.96) / 0.04
  })

  return (
    <div ref={containerRef} className="relative" style={{ height: '1200vh' }}>
      <div className="sticky top-0 h-screen overflow-hidden bg-[var(--ink)]">
        <BackgroundOrbs scrollYProgress={scrollYProgress} />
        
        <div className="relative z-10 h-full">
          <HeroPanel scrollYProgress={scrollYProgress} />
          
          <div className="absolute inset-0">
            <div className="h-full w-full flex items-center justify-center">
              <div className="absolute inset-0">
                <InsertPanel scrollYProgress={scrollYProgress} range={PANEL_RANGES[0]} />
                <ScanPanel scrollYProgress={scrollYProgress} range={PANEL_RANGES[1]} />
                <ProcessPanel scrollYProgress={scrollYProgress} range={PANEL_RANGES[2]} />
                <ScorePanel scrollYProgress={scrollYProgress} range={PANEL_RANGES[3]} />
                <MatchPanel scrollYProgress={scrollYProgress} range={PANEL_RANGES[4]} />
                <SelectPanel scrollYProgress={scrollYProgress} range={PANEL_RANGES[5]} />
                <TrackPanel scrollYProgress={scrollYProgress} range={PANEL_RANGES[6]} />
                <InterviewPanel scrollYProgress={scrollYProgress} range={PANEL_RANGES[7]} />
                <OfferPanel scrollYProgress={scrollYProgress} range={PANEL_RANGES[8]} />
                <SuccessPanel scrollYProgress={scrollYProgress} range={PANEL_RANGES[9]} />
              </div>
            </div>
          </div>
          
          <motion.div style={{ opacity: endingOpacity }} className="absolute inset-0">
            <div className="h-full w-full flex items-center justify-center">
              <PreviewPanel scrollYProgress={scrollYProgress} range={ENDING_RANGE} isEnding />
            </div>
          </motion.div>
          
          <ProgressBar 
            scrollYProgress={scrollYProgress} 
            panelRanges={[HERO_RANGE, ...PANEL_RANGES, ENDING_RANGE]}
          />
        </div>
      </div>
    </div>
  )
}

function BackgroundOrbs({ scrollYProgress }: { scrollYProgress: any }) {
  const orb1X = useTransform(scrollYProgress, [0, 1], [0, 50])
  const orb1Y = useTransform(scrollYProgress, [0, 1], [0, 25])
  
  const orb2X = useTransform(scrollYProgress, [0, 1], [0, -40])
  const orb2Y = useTransform(scrollYProgress, [0, 1], [0, -20])
  
  const orb3X = useTransform(scrollYProgress, [0, 1], [0, 30])
  const orb3Y = useTransform(scrollYProgress, [0, 1], [0, -15])

  return (
    <>
      <motion.div
        style={{ x: orb1X, y: orb1Y }}
        className="absolute -top-[10%] -left-[5%] w-[600px] h-[600px] rounded-full pointer-events-none"
      >
        <div className="w-full h-full rounded-full bg-[radial-gradient(circle,rgba(124,111,255,0.13)_0%,transparent_70%)]" />
      </motion.div>
      
      <motion.div
        style={{ x: orb2X, y: orb2Y }}
        className="absolute -bottom-[10%] -right-[5%] w-[500px] h-[500px] rounded-full pointer-events-none"
      >
        <div className="w-full h-full rounded-full bg-[radial-gradient(circle,rgba(26,158,110,0.09)_0%,transparent_70%)]" />
      </motion.div>
      
      <motion.div
        style={{ x: orb3X, y: orb3Y }}
        className="absolute top-[20%] right-[10%] w-[400px] h-[400px] rounded-full pointer-events-none"
      >
        <div className="w-full h-full rounded-full bg-[radial-gradient(circle,rgba(212,90,48,0.07)_0%,transparent_70%)]" />
      </motion.div>
    </>
  )
}