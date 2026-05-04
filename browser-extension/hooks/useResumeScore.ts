import { useState, useCallback, useRef, useEffect } from "react";
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
    const [fileInfo, setFileInfo] = useState<{ name: string; type: string; size: number } | null>(null);
    const [uploadState, setUploadState] = useState<UploadState>("idle");
    const [resumeData, setResumeData] = useState<ResumeData | null>(null);
    const [score, setScore] = useState<JobAnalysisResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [initialized, setInitialized] = useState(false);
    const analyzedRef = useRef(false);

    useEffect(() => {
        browser.storage.local
            .get(["resumeData", "analysisScore", "fileInfo"])
            .then((result: Record<string, any>) => {
                if (result.analysisScore) {
                    setScore(result.analysisScore as JobAnalysisResponse);
                }
                if (result.resumeData) {
                    setResumeData(result.resumeData as ResumeData);
                    setUploadState("success");
                }
                if (result.fileInfo) {
                    setFileInfo(result.fileInfo);
                }
                setInitialized(true);
            })
            .catch(() => {
                setInitialized(true);
            });
    }, []);

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
                browser.storage.local.set({ analysisScore: result });
                analyzedRef.current = true;
            } catch (err) {
                const message =
                    err instanceof Error ? err.message : "Analysis failed";
                setError(message);
                analyzedRef.current = false;
            } finally {
                setIsAnalyzing(false);
            }
        },
        [],
    );

    const handleUpload = useCallback(
        async (selectedFile: File, ownerId: string) => {
            const info = { name: selectedFile.name, type: selectedFile.type, size: selectedFile.size };
            setFile(selectedFile);
            setFileInfo(info);
            setUploadState("uploading");
            setError(null);
            setScore(null);
            analyzedRef.current = false;

            try {
                const result = await uploadResume(selectedFile, ownerId);
                setResumeData(result.data as ResumeData);
                browser.storage.local.set({ resumeData: result.data, fileInfo: info });
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

    const retryUpload = useCallback(
        async (ownerId: string) => {
            if (!file) return;
            setUploadState("uploading");
            setError(null);
            try {
                const result = await uploadResume(file, ownerId);
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
        [file],
    );

    const reset = useCallback(() => {
        setFile(null);
        setFileInfo(null);
        setUploadState("idle");
        setResumeData(null);
        setScore(null);
        setError(null);
        setIsAnalyzing(false);
        analyzedRef.current = false;
        browser.storage.local.remove(["resumeData", "analysisScore", "fileInfo"]);
    }, []);

    return {
        file,
        fileInfo,
        uploadState,
        resumeData,
        score,
        error,
        isAnalyzing,
        analyzedRef,
        initialized,
        upload: handleUpload,
        retryUpload,
        reset,
        analyze: handleResumeAnalysis,
    };
}