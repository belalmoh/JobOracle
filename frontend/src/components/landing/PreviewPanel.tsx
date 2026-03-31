'use client'

import { motion, useTransform } from 'framer-motion'
import { Panel } from './panels/Panel'
import { ArrowRight, LayoutDashboard, Briefcase, FileText, TrendingUp } from 'lucide-react'

interface PreviewPanelProps {
  scrollYProgress: any
  range: { start: number; end: number; label: string }
  isEnding?: boolean
}

export function PreviewPanel({ scrollYProgress, range, isEnding }: PreviewPanelProps) {
  const previewProgress = useTransform(scrollYProgress as any, (p: number) => {
    if (p < range.start || p > range.end) return 0
    return (p - range.start) / (range.end - range.start)
  })

  if (isEnding) {
    return (
      <div className="w-full max-w-2xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-8"
        >
          <span className="inline-flex items-center gap-2 text-[11px] tracking-[2.5px] uppercase text-[var(--success-green)] font-semibold mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--success-green)] animate-pulse" />
            Congratulations!
          </span>
          <h2 className="text-[clamp(42px,7vw,80px)] font-bold tracking-tight text-white">
            Your journey begins
          </h2>
          <p className="text-[17px] leading-relaxed text-[var(--muted-rgb)] max-w-md mx-auto mt-4">
            Now explore the dashboard and start your real job search journey.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="bg-[var(--machine-bg)] border border-[rgba(255,255,255,0.1)] rounded-2xl p-6 overflow-hidden"
        >
          <div className="flex items-center gap-6 mb-6">
            <div className="flex items-center gap-2 text-white">
              <LayoutDashboard className="w-5 h-5 text-[var(--accent-purple-light)]" />
              <span className="font-semibold">Dashboard</span>
            </div>
            <div className="h-px flex-1 bg-[rgba(255,255,255,0.1)]" />
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-[rgba(255,255,255,0.03)] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Briefcase className="w-4 h-4 text-[var(--accent-purple-light)]" />
                <span className="text-xs text-[var(--muted-rgb)]">Applications</span>
              </div>
              <div className="text-2xl font-bold text-white">12</div>
            </div>
            <div className="bg-[rgba(255,255,255,0.03)] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-[var(--success-green)]" />
                <span className="text-xs text-[var(--muted-rgb)]">Interviews</span>
              </div>
              <div className="text-2xl font-bold text-white">3</div>
            </div>
            <div className="bg-[rgba(255,255,255,0.03)] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-[var(--amber)]" />
                <span className="text-xs text-[var(--muted-rgb)]">Response Rate</span>
              </div>
              <div className="text-2xl font-bold text-white">67%</div>
            </div>
          </div>

          <div className="space-y-2">
            {[
              { company: 'Stripe', role: 'Senior Backend Engineer', status: 'Interview', color: 'var(--success-green)' },
              { company: 'Shopify', role: 'Staff Engineer', status: 'Shortlisted', color: 'var(--amber)' },
              { company: 'Vercel', role: 'Principal Engineer', status: 'Applied', color: 'var(--accent-purple-light)' },
            ].map((app, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-[rgba(255,255,255,0.02)] rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-[var(--accent-purple)]/20 flex items-center justify-center">
                    <span className="text-xs font-bold text-[var(--accent-purple-light)]">{app.company.slice(0,2)}</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{app.role}</div>
                    <div className="text-xs text-[var(--muted-rgb)]">{app.company}</div>
                  </div>
                </div>
                <span 
                  className="text-xs px-2 py-1 rounded-full"
                  style={{ backgroundColor: `${app.color}20`, color: app.color }}
                >
                  {app.status}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 text-center"
        >
          <button className="bg-white text-black px-8 py-4 rounded-full font-semibold hover:opacity-85 transition-opacity flex items-center gap-2 mx-auto">
            Start your journey
            <ArrowRight className="w-5 h-5" />
          </button>
          <p className="mt-4 text-[12px] text-[var(--muted-rgb)]">
            No signup required to preview
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <Panel scrollYProgress={scrollYProgress} range={range}>
      <div className="relative w-full max-w-2xl">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-8"
        >
          <span className="inline-flex items-center gap-2 text-[11px] tracking-[2.5px] uppercase text-[var(--accent-purple-light)] font-semibold mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-purple-light)] animate-pulse" />
            Step 12 of 12
          </span>
        </motion.div>

        <motion.h2 
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[clamp(36px,6vw,72px)] font-bold tracking-tight text-white mb-4"
        >
          Your dashboard awaits
        </motion.h2>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[17px] leading-relaxed text-[var(--muted-rgb)] max-w-md mx-auto mb-8"
        >
          See your applications, track progress, and get personalized recommendations.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[var(--machine-bg)] border border-[rgba(255,255,255,0.1)] rounded-2xl p-6 overflow-hidden relative"
        >
          <div className="flex items-center gap-6 mb-6">
            <div className="flex items-center gap-2 text-white">
              <LayoutDashboard className="w-5 h-5 text-[var(--accent-purple-light)]" />
              <span className="font-semibold">Dashboard</span>
            </div>
            <div className="h-px flex-1 bg-[rgba(255,255,255,0.1)]" />
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-[rgba(255,255,255,0.03)] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Briefcase className="w-4 h-4 text-[var(--accent-purple-light)]" />
                <span className="text-xs text-[var(--muted-rgb)]">Applications</span>
              </div>
              <div className="text-2xl font-bold text-white">12</div>
            </div>
            <div className="bg-[rgba(255,255,255,0.03)] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-[var(--success-green)]" />
                <span className="text-xs text-[var(--muted-rgb)]">Interviews</span>
              </div>
              <div className="text-2xl font-bold text-white">3</div>
            </div>
            <div className="bg-[rgba(255,255,255,0.03)] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-[var(--amber)]" />
                <span className="text-xs text-[var(--muted-rgb)]">Response Rate</span>
              </div>
              <div className="text-2xl font-bold text-white">67%</div>
            </div>
          </div>

          <div className="space-y-2">
            {[
              { company: 'Stripe', role: 'Senior Backend Engineer', status: 'Interview', color: 'var(--success-green)' },
              { company: 'Shopify', role: 'Staff Engineer', status: 'Shortlisted', color: 'var(--amber)' },
              { company: 'Vercel', role: 'Principal Engineer', status: 'Applied', color: 'var(--accent-purple-light)' },
            ].map((app, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-[rgba(255,255,255,0.02)] rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-[var(--accent-purple)]/20 flex items-center justify-center">
                    <span className="text-xs font-bold text-[var(--accent-purple-light)]">{app.company.slice(0,2)}</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{app.role}</div>
                    <div className="text-xs text-[var(--muted-rgb)]">{app.company}</div>
                  </div>
                </div>
                <span 
                  className="text-xs px-2 py-1 rounded-full"
                  style={{ backgroundColor: `${app.color}20`, color: app.color }}
                >
                  {app.status}
                </span>
              </div>
            ))}
          </div>

          <motion.div
            style={{ opacity: previewProgress }}
            className="absolute inset-0 bg-gradient-to-t from-[var(--ink)] via-[var(--ink)]/80 to-transparent flex items-end justify-center pb-6"
          >
            <button className="bg-white text-black px-6 py-3 rounded-full font-semibold hover:opacity-85 transition-opacity flex items-center gap-2">
              Try it now
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        </motion.div>

        <motion.p
          style={{ opacity: previewProgress }}
          className="mt-6 text-center text-[12px] text-[var(--muted-rgb)]"
        >
          No signup required to preview
        </motion.p>
      </div>
    </Panel>
  )
}