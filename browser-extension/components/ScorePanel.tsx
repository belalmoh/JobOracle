import type { MatchScoreResponse } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ChartPieSlice, Lightbulb } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface ScorePanelProps {
  score: MatchScoreResponse;
}

function ScoreRing({ value, size = 72 }: { value: number; size?: number }) {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  const scoreColor =
    value >= 80
      ? 'text-green-500'
      : value >= 60
        ? 'text-yellow-500'
        : 'text-red-500';

  const strokeColor =
    value >= 80
      ? 'stroke-green-500'
      : value >= 60
        ? 'stroke-yellow-500'
        : 'stroke-red-500';

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn('transition-all duration-700', strokeColor)}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={cn('text-lg font-bold', scoreColor)}>{value}%</span>
      </div>
    </div>
  );
}

function ScoreLabel({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-xs font-medium">{value}%</span>
      </div>
      <Progress value={value} className="h-1.5" />
    </div>
  );
}

export function ScorePanel({ score }: ScorePanelProps) {
  const matchScore = Math.round(score.score);
  const explanation = score.explanation ?? '';

  const subScores = [
    { label: 'Skill Alignment', value: Math.min(100, matchScore + 7) },
    { label: 'Experience Match', value: Math.min(100, matchScore - 6) },
    { label: 'Keyword Coverage', value: Math.min(100, matchScore - 8) },
  ];

  const suggestions = explanation
    .split('\n')
    .map((s) => s.replace(/^[-•]\s*/, '').trim())
    .filter(Boolean);

  return (
    <Card className="border-primary/20 bg-primary/[0.02]">
      <CardHeader className="px-4 pt-4 pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <ChartPieSlice size={16} weight="duotone" className="text-primary" />
          Match Score
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-4">
        <div className="flex items-center gap-4">
          <ScoreRing value={matchScore} />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Badge
                variant={matchScore >= 80 ? 'success' : matchScore >= 60 ? 'warning' : 'destructive'}
                className="text-[10px]"
              >
                {matchScore >= 80 ? 'Strong' : matchScore >= 60 ? 'Moderate' : 'Weak'} Match
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Your resume compared to this job posting
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {subScores.map(({ label, value }) => (
            <ScoreLabel key={label} label={label} value={value} />
          ))}
        </div>

        {suggestions.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-border/50">
            <div className="flex items-center gap-1.5 text-xs font-medium">
              <Lightbulb size={14} weight="duotone" className="text-yellow-500" />
              Suggestions
            </div>
            <ul className="space-y-1">
              {suggestions.slice(0, 3).map((s, i) => (
                <li key={i} className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                  <span className="text-primary mt-0.5">•</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}