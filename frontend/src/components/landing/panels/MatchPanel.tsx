'use client'

import { motion, useTransform } from 'framer-motion'
import { Panel } from './Panel'
import { Briefcase, TrendingUp, Star } from 'lucide-react'

interface MatchPanelProps {
  scrollYProgress: any
  range: { start: number; end: number; label: string }
}

const mockJobs = [
  { title: 'Senior Backend Engineer', company: 'Stripe', match: 94, location: 'San Francisco, CA' },
  { title: 'Staff Engineer', company: 'Shopify', match: 89, location: 'Ottawa, Canada' },
  { title: 'Principal Engineer', company: 'Vercel', match: 87, location: 'Remote' },
  { title: 'Engineering Lead', company: 'Linear', match: 85, location: 'New York, NY' },
  { title: 'Backend Developer', company: 'Notion', match: 82, location: 'San Francisco, CA' },
  { title: 'Full Stack Engineer', company: 'Figma', match: 79, location: 'Remote' },
]

export function MatchPanel({ scrollYProgress, range }: MatchPanelProps) {
  const listProgress = useTransform(scrollYProgress as any, (p: number) => {
    if (p < range.start || p > range.end) return 0
    return (p - range.start) / (range.end - range.start)
  })

  const visibleCount = useTransform(listProgress, (p: number) => Math.min(6, Math.ceil(p * 8)))

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
            Step 5 of 12
          </span>
        </motion.div>

        <motion.h2 
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[clamp(36px,6vw,72px)] font-bold tracking-tight text-white mb-4"
        >
          Finding your matches
        </motion.h2>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[17px] leading-relaxed text-[var(--muted-rgb)] max-w-md mx-auto mb-8"
        >
          Scanning 2,847 jobs to find the ones that fit your skills and experience.
        </motion.p>

        <div className="space-y-2 max-h-64 overflow-hidden">
          {mockJobs.map((job, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index }}
              style={{ opacity: useTransform(listProgress, (p: number) => p > (index / 6) ? 1 : 0.3) }}
              className="flex items-center justify-between p-3 bg-[var(--machine-bg)] border border-[rgba(255,255,255,0.05)] rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-[var(--accent-purple)]/20 flex items-center justify-center">
                  <Briefcase className="w-4 h-4 text-[var(--accent-purple-light)]" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium text-white">{job.title}</div>
                  <div className="text-xs text-[var(--muted-rgb)]">{job.company} · {job.location}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ 
                    backgroundColor: job.match >= 85 ? 'rgba(26,158,110,0.2)' : 'rgba(124,111,255,0.2)'
                  }}
                  className="px-2 py-1 rounded"
                >
                  <span className={`text-sm font-bold ${job.match >= 85 ? 'text-[var(--success-green)]' : 'text-[var(--accent-purple-light)]'}`}>
                    {job.match}%
                  </span>
                </motion.div>
                {job.match >= 85 && <Star className="w-4 h-4 text-[var(--amber)] fill-[var(--amber)]" />}
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          style={{ opacity: listProgress }}
          className="mt-4 text-center text-sm text-[var(--success-green)]"
        >
          <TrendingUp className="w-4 h-4 inline mr-2" />
          47 jobs match your profile
        </motion.div>
      </div>
    </Panel>
  )
}