// Job information card with match score

import type { JobData } from '~types';

interface JobCardProps {
	job: JobData;
	matchScore: number | null;
}

export function JobCard({ job, matchScore }: JobCardProps) {
	console.log(job);
	const companyInitials = job.company.slice(0, 2).toUpperCase();
	const score = matchScore ?? 0;
	const circumference = 2 * Math.PI * 18;
	const strokeDashoffset = circumference - (score / 100) * circumference;

	return (
		<div
			className="plasmo-mx-4 plasmo-mt-4 plasmo-p-4 plasmo-rounded-xl"
			style={{
				background: 'var(--bg-secondary)',
				border: '1px solid var(--border-subtle)'
			}}
		>
			<div className="plasmo-flex plasmo-gap-3 plasmo-mb-3">
				<div
					className="plasmo-w-11 plasmo-h-11 plasmo-rounded-lg plasmo-flex plasmo-items-center plasmo-justify-center plasmo-font-semibold plasmo-text-sm"
					style={{
						background: 'var(--bg-tertiary)',
						color: 'var(--accent-primary)'
					}}
				>
					{companyInitials}
				</div>
				<div className="plasmo-flex-1 plasmo-min-w-0">
					<div className="plasmo-text-xs plasmo-text-text-secondary plasmo-mb-0.5">
						{job.company}
					</div>
					<div className="plasmo-font-display plasmo-font-semibold plasmo-text-text-primary plasmo-text-sm plasmo-truncate">
						{job.title}
					</div>
				</div>

				{matchScore !== null && (
					<div className="plasmo-flex plasmo-flex-col plasmo-items-center">
						<div className="plasmo-relative plasmo-w-11 plasmo-h-11">
							<svg className="plasmo-w-full plasmo-h-full -plasmo-rotate-90" viewBox="0 0 40 40">
								<circle
									cx="20"
									cy="20"
									r="18"
									fill="none"
									stroke="var(--bg-tertiary)"
									strokeWidth="3"
								/>
								<circle
									cx="20"
									cy="20"
									r="18"
									fill="none"
									stroke={score >= 80 ? 'var(--success)' : score >= 60 ? 'var(--warning)' : 'var(--error)'}
									strokeWidth="3"
									strokeLinecap="round"
									strokeDasharray={circumference}
									strokeDashoffset={strokeDashoffset}
									className="plasmo-transition-all plasmo-duration-1000"
								/>
							</svg>
							<div className="plasmo-absolute plasmo-inset-0 plasmo-flex plasmo-items-center plasmo-justify-center">
								<span
									className="plasmo-font-display plasmo-font-bold plasmo-text-xs"
									style={{
										color: score >= 80 ? 'var(--success)' : score >= 60 ? 'var(--warning)' : 'var(--error)'
									}}
								>
									{Math.round(score)}%
								</span>
							</div>
						</div>
					</div>
				)}
			</div>

			<div className="plasmo-flex plasmo-gap-4 plasmo-text-xs plasmo-text-text-muted">
				<span>🕐 Just now</span>
			</div>
		</div>
	);
}
