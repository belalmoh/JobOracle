// Field completion progress with list

import type { FieldStatus } from '~types';

interface ProgressSectionProps {
	filled: number;
	total: number;
	fields: FieldStatus[];
}

export function ProgressSection({ filled, total, fields }: ProgressSectionProps) {
	const percentage = total > 0 ? Math.round((filled / total) * 100) : 0;

	return (
		<div
			className="plasmo-mx-4 plasmo-mt-4 plasmo-mb-4 plasmo-p-4 plasmo-rounded-xl"
			style={{
				background: 'var(--bg-secondary)',
				border: '1px solid var(--border-subtle)'
			}}
		>
			<div className="plasmo-flex plasmo-justify-between plasmo-items-center plasmo-mb-3">
				<span className="plasmo-font-medium plasmo-text-text-primary plasmo-text-sm">
					{filled} of {total} fields filled
				</span>
				<span className="plasmo-font-display plasmo-font-bold plasmo-text-lg" style={{ color: 'var(--success)' }}>
					{percentage}%
				</span>
			</div>

			<div className="plasmo-h-1.5 plasmo-rounded-full plasmo-overflow-hidden plasmo-mb-4" style={{ background: 'var(--bg-tertiary)' }}>
				<div
					className="plasmo-h-full plasmo-rounded-full plasmo-relative"
					style={{
						width: `${percentage}%`,
						background: 'linear-gradient(90deg, var(--success), #34D399)'
					}}
				>
					<div
						className="plasmo-absolute plasmo-right-0 plasmo-top-0 plasmo-bottom-0 plasmo-w-5"
						style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3))' }}
					/>
				</div>
			</div>

			<div className="plasmo-flex plasmo-flex-col plasmo-gap-1">
				{fields.map((field) => (
					<div key={field.id} className="plasmo-flex plasmo-items-center plasmo-gap-2 plasmo-py-2 plasmo-border-b plasmo-border-border-subtle last:plasmo-border-b-0">
						<div
							className="plasmo-w-5 plasmo-h-5 plasmo-rounded-full plasmo-flex plasmo-items-center plasmo-justify-center plasmo-text-xs"
							style={{
								background: field.filled ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
								color: field.filled ? 'var(--success)' : 'var(--warning)'
							}}
						>
							{field.filled ? '✓' : '−'}
						</div>
						<span className={`plasmo-text-sm ${field.filled ? 'plasmo-text-text-primary' : 'plasmo-text-text-secondary'}`}>
							{field.label}
						</span>
					</div>
				))}
			</div>
		</div>
	);
}
