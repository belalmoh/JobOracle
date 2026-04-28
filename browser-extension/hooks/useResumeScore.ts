import { useState, useCallback } from "react";
import type { MatchScoreResponse } from "@/types";
import { uploadResume } from "@/lib/api";
import type { JobData } from "@/types";

type UploadState = "idle" | "selected" | "uploading" | "success" | "error";

export function useResumeScore() {
    const [file, setFile] = useState<File | null>(null);
    const [uploadState, setUploadState] = useState<UploadState>("idle");
    const [score, setScore] = useState<MatchScoreResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleUpload = useCallback(
        async (selectedFile: File, ownerId: string) => {
            setFile(selectedFile);
            setUploadState("uploading");
            setError(null);

            try {
                const result = await uploadResume(selectedFile, ownerId);
                setScore(result);
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
        setScore(null);
        setError(null);
    }, []);

    return {
        file,
        uploadState,
        score,
        error,
        upload: handleUpload,
        reset,
    };
}
