import { useEffect } from "react";
import { Header } from "@/components/Header";
import { JobCard } from "@/components/JobCard";
import { ResumeUpload } from "@/components/ResumeUpload";
import { ScorePanel } from "@/components/ScorePanel";
import { useJobData } from "@/hooks/useJobData";
import { useResumeScore } from "@/hooks/useResumeScore";
import { Briefcase } from "@phosphor-icons/react";

export default function App() {
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

    return (
        <div className="flex flex-col h-screen w-[450px] max-h-[550px] bg-background overflow-hidden">
            <Header connectionStatus={connectionStatus} />

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    </div>
                ) : job ? (
                    <>
                        <JobCard job={job} />
                        <ResumeUpload
                            uploadState={resumeScore.uploadState}
                            file={resumeScore.file}
                            error={resumeScore.error}
                            onUpload={handleUpload}
                            onReset={resumeScore.reset}
                            onAnalyze={handleAnalyze}
                            analyzing={resumeScore.isAnalyzing}
                            disabled={!job}
                        />
                        {resumeScore.score && (
                            <ScorePanel score={resumeScore.score} />
                        )}
                    </>
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
                            Navigate to a job posting page and the job details
                            will appear here automatically.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
