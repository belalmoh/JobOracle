import type { JobAnalysisResponse } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
    CheckCircle,
    XCircle,
    ChartPieSlice,
    ArrowRight,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface ScorePanelProps {
    score: JobAnalysisResponse;
}

function ScoreRing({ value, size = 72 }: { value: number; size?: number }) {
    const strokeWidth = 6;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / 100) * circumference;

    const scoreColor =
        value >= 80
            ? "text-green-500"
            : value >= 60
              ? "text-yellow-500"
              : "text-red-500";

    const strokeColor =
        value >= 80
            ? "stroke-green-500"
            : value >= 60
              ? "stroke-yellow-500"
              : "stroke-red-500";

    return (
        <div
            className="relative inline-flex items-center justify-center"
            style={{ width: size, height: size }}
        >
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
                    className={cn("transition-all duration-700", strokeColor)}
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className={cn("text-lg font-bold", scoreColor)}>
                    {value}%
                </span>
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

function parseSentences(text: string): string[] {
    if (!text?.trim()) return [];
    return text.split(/(?<=[.!?])\s+/).filter(Boolean);
}

export function ScorePanel({ score }: ScorePanelProps) {
    const matchScore = score.matchScore;

    const subScores = [
        {
            label: "Skill Alignment",
            value: Math.round(score.skillAlignment * 100),
        },
        {
            label: "Experience Match",
            value: Math.round(score.experienceMatch * 100),
        },
        {
            label: "Keyword Coverage",
            value: Math.round(score.keywordCoverage * 100),
        },
    ];

    const strengthsSentences = parseSentences(score.insights.strengths);
    const gapsSentences = parseSentences(score.insights.gaps);

    return (
        <div className="space-y-4">
            <Card className="border-primary/20 bg-primary/[0.02]">
                <CardHeader className="px-4 pt-4 pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <ChartPieSlice
                            size={16}
                            weight="duotone"
                            className="text-primary"
                        />
                        Match Score
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-4">
                    <div className="flex items-center gap-4">
                        <ScoreRing value={matchScore} />
                        <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                                <Badge
                                    variant={
                                        matchScore >= 80
                                            ? "success"
                                            : matchScore >= 60
                                              ? "warning"
                                              : "destructive"
                                    }
                                    className="text-[10px]"
                                >
                                    {matchScore >= 80
                                        ? "Strong"
                                        : matchScore >= 60
                                          ? "Moderate"
                                          : "Weak"}{" "}
                                    Match
                                </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Your resume compared to this job posting
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {subScores.map(({ label, value }) => (
                            <ScoreLabel
                                key={label}
                                label={label}
                                value={value}
                            />
                        ))}
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4">
                <Card className="border-green-500/20 bg-green-500/5">
                    <CardHeader className="px-4 pt-4 pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <CheckCircle
                                size={16}
                                weight="duotone"
                                className="text-green-500"
                            />
                            Matching Skills
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <div className="flex flex-wrap gap-1.5">
                            {score.matchingSkills.map((skill) => (
                                <Badge
                                    key={skill}
                                    variant="success"
                                    className="text-[10px]"
                                >
                                    {skill}
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-orange-500/20 bg-orange-500/5">
                    <CardHeader className="px-4 pt-4 pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <XCircle
                                size={16}
                                weight="duotone"
                                className="text-orange-500"
                            />
                            Missing Skills
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <div className="flex flex-wrap gap-1.5">
                            {score.missingSkills.map((skill) => (
                                <Badge
                                    key={skill}
                                    variant="warning"
                                    className="text-[10px]"
                                >
                                    {skill}
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-primary/20 bg-primary/[0.02]">
                <CardHeader className="px-4 pt-4 pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <ArrowRight
                            size={16}
                            weight="duotone"
                            className="text-primary"
                        />
                        Recommendations
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                    <ul className="space-y-2">
                        {score.recommendations.map((rec, i) => (
                            <li
                                key={i}
                                className="text-xs text-muted-foreground flex items-start gap-2"
                            >
                                <span className="text-primary mt-0.5">•</span>
                                <span>{rec}</span>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>

            <Card className="border-teal-500/20 bg-gradient-to-br from-teal-500/10 to-emerald-500/5">
                <CardHeader className="px-4 pt-4 pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <CheckCircle
                            size={16}
                            weight="duotone"
                            className="text-teal-500"
                        />
                        Strengths
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                    <ul className="space-y-2">
                        {strengthsSentences.map((sentence, i) => (
                            <li
                                key={i}
                                className="text-xs text-muted-foreground flex items-start gap-2"
                            >
                                <span className="text-teal-500 mt-0.5">•</span>
                                <span>{sentence}</span>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>

            <Card className="border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-amber-500/5">
                <CardHeader className="px-4 pt-4 pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <XCircle
                            size={16}
                            weight="duotone"
                            className="text-orange-500"
                        />
                        Gaps
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                    <ul className="space-y-2">
                        {gapsSentences.map((sentence, i) => (
                            <li
                                key={i}
                                className="text-xs text-muted-foreground flex items-start gap-2"
                            >
                                <span className="text-orange-500 mt-0.5">
                                    •
                                </span>
                                <span>{sentence}</span>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}
