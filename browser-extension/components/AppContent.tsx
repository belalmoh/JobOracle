import { useEffect } from "react";
import { JobCard } from "@/components/JobCard";
import { ResumeUpload } from "@/components/ResumeUpload";
import { ScorePanel } from "@/components/ScorePanel";
import { useJobData } from "@/hooks/useJobData";
import { useResumeScore } from "@/hooks/useResumeScore";
import { Briefcase } from "@phosphor-icons/react";

interface AppContentProps {
    className?: string;
}

export function AppContent({ className }: AppContentProps) {
    const { job, loading, connectionStatus, uuid } = useJobData();
    const resumeScore = useResumeScore();

    const handleUpload = (file: File) => {
        if (job && uuid) {
            resumeScore.upload(file, uuid);
        }
    };

    const handleAnalyze = () => {
        if (!job || !uuid || !resumeScore.resumeData?.id) return;
        resumeScore.analyze(
            job,
            resumeScore.resumeData.id,
            uuid,
            resumeScore.resumeData.content,
        );
    };

    const handleRetry = () => {
        if (!uuid || !resumeScore.file) return;
        resumeScore.retryUpload(uuid);
    };

    useEffect(() => {
        if (
            resumeScore.uploadState === "success" &&
            resumeScore.resumeData?.id &&
            !resumeScore.score &&
            !resumeScore.isAnalyzing &&
            !resumeScore.analyzedRef.current &&
            job &&
            uuid
        ) {
            resumeScore.analyze(
                job,
                resumeScore.resumeData.id,
                uuid,
                resumeScore.resumeData.content,
            );
        }
    }, [resumeScore.uploadState, resumeScore.resumeData]);

    if (!resumeScore.initialized) {
        return (
            <div className={className}>
                <div className="flex items-center justify-center py-8">
                    <div className="h-6 w-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div className={className}>
            {loading ? (
                <div className="flex items-center justify-center py-8">
                    <div className="h-6 w-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                </div>
            ) : job ? (
                <div className="space-y-3">
                    <JobCard job={job} />
                    <ResumeUpload
                        uploadState={resumeScore.uploadState}
                        file={resumeScore.file}
                        error={resumeScore.error}
                        onUpload={handleUpload}
                        onReset={resumeScore.reset}
                        onAnalyze={handleAnalyze}
                        onRetry={handleRetry}
                        analyzing={resumeScore.isAnalyzing}
                        disabled={!job}
                    />
                    {resumeScore.score && (
                        <ScorePanel score={resumeScore.score} />
                    )}
                </div>
            ) : (
                <>
                    {resumeScore.score ? (
                        <div className="space-y-3">
                        <ResumeUpload
                            uploadState={resumeScore.uploadState}
                            file={resumeScore.file}
                            error={resumeScore.error}
                            onUpload={handleUpload}
                            onReset={resumeScore.reset}
                            onAnalyze={handleAnalyze}
                            onRetry={handleRetry}
                            analyzing={resumeScore.isAnalyzing}
                            disabled={!job}
                        />
                            <ScorePanel score={resumeScore.score} />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-3">
                                <Briefcase
                                    size={24}
                                    weight="duotone"
                                    className="text-muted-foreground"
                                />
                            </div>
                            <p className="text-sm font-medium text-foreground">
                                No job detected
                            </p>
                            <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">
                                Navigate to a job posting page and the job
                                details will appear here automatically.
                            </p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
