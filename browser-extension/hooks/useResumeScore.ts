import { useState, useCallback, useRef } from "react";
import type {
    JobAnalysisResponse,
    ResumeData,
    JobData,
    ResumeDataContent,
} from "@/types";
import { getResumeAnalysis, uploadResume } from "@/lib/api";

type UploadState = "idle" | "selected" | "uploading" | "success" | "error";

export function useResumeScore() {
    const [file, setFile] = useState<File | null>(null);
    const [uploadState, setUploadState] = useState<UploadState>("idle");
    const [resumeData, setResumeData] = useState<ResumeData | null>(null);
    const [score, setScore] = useState<JobAnalysisResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const analyzedRef = useRef(false);

    const handleResumeAnalysis = useCallback(
        async (
            jobData: JobData,
            resumeId: number,
            ownerId: string,
            resumeData: ResumeDataContent,
        ) => {
            setError(null);
            setIsAnalyzing(true);

            try {
                const result = await getResumeAnalysis({
                    ownerId,
                    resumeId,
                    resumeData,
                    companyName: jobData.company,
                    title: jobData.title,
                    description: jobData.description,
                    location: jobData.location,
                    url: jobData.url,
                });
                setScore(result);
            } catch (err) {
                const message =
                    err instanceof Error ? err.message : "Analysis failed";
                setError(message);
            } finally {
                setIsAnalyzing(false);
                analyzedRef.current = true;
            }
        },
        [],
    );

    const handleUpload = useCallback(
        async (selectedFile: File, ownerId: string) => {
            setFile(selectedFile);
            setUploadState("uploading");
            setError(null);
            setScore(null);
            analyzedRef.current = false;

            try {
                const result = await uploadResume(selectedFile, ownerId);
                setResumeData(result.data as ResumeData);
                browser.storage.local.set({ resumeData: result.data });
                setUploadState("success");
            } catch (err) {
                const message =
                    err instanceof Error ? err.message : "Upload failed";
                setError(message);
                setUploadState("error");
            }
        },
        [],
    );

    const reset = useCallback(() => {
        setFile(null);
        setUploadState("idle");
        setResumeData(null);
        setScore(null);
        setError(null);
        setIsAnalyzing(false);
        analyzedRef.current = false;
    }, []);

    return {
        file,
        uploadState,
        resumeData,
        score,
        error,
        isAnalyzing,
        analyzedRef,
        upload: handleUpload,
        reset,
        analyze: handleResumeAnalysis,
    };
}
