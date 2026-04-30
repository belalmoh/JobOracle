import { useCallback, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    FileText,
    UploadSimple,
    Trash,
    Spinner,
    ChartPieSlice,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface ResumeUploadProps {
    uploadState: "idle" | "selected" | "uploading" | "success" | "error";
    file: File | null;
    error: string | null;
    onUpload: (file: File) => void;
    onReset: () => void;
    onAnalyze?: () => void;
    analyzing?: boolean;
    disabled?: boolean;
}

const ACCEPTED_TYPES = ".pdf,.docx,.doc";
const MAX_SIZE_MB = 10;

export function ResumeUpload({
    uploadState,
    file,
    error,
    onUpload,
    onReset,
    onAnalyze,
    analyzing,
    disabled,
}: ResumeUploadProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const validateAndUpload = useCallback(
        (f: File) => {
            const ext = "." + f.name.split(".").pop()?.toLowerCase();
            const allowed = ACCEPTED_TYPES.split(",");
            if (!allowed.includes(ext)) {
                return;
            }
            if (f.size > MAX_SIZE_MB * 1024 * 1024) {
                return;
            }
            onUpload(f);
        },
        [onUpload],
    );

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback(() => {
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragging(false);
            const f = e.dataTransfer.files[0];
            if (f) validateAndUpload(f);
        },
        [validateAndUpload],
    );

    const handleFileSelect = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const f = e.target.files?.[0];
            if (f) validateAndUpload(f);
        },
        [validateAndUpload],
    );

    return (
        <Card className="border-border/50">
            <CardHeader className="px-4 pt-4 pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                    <FileText
                        size={16}
                        weight="duotone"
                        className="text-primary"
                    />
                    Resume
                </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
                {uploadState === "idle" && (
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => inputRef.current?.click()}
                        className={cn(
                            "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 cursor-pointer transition-colors",
                            isDragging
                                ? "border-primary bg-primary/5"
                                : "border-muted hover:border-primary/40 hover:bg-muted/50",
                        )}
                    >
                        <UploadSimple
                            size={24}
                            weight="duotone"
                            className="text-muted-foreground"
                        />
                        <p className="text-xs text-muted-foreground text-center">
                            Drop your resume here or{" "}
                            <span className="text-primary font-medium">
                                browse
                            </span>
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                            PDF, DOCX, or TXT (max {MAX_SIZE_MB}MB)
                        </p>
                        <input
                            ref={inputRef}
                            type="file"
                            accept={ACCEPTED_TYPES}
                            onChange={handleFileSelect}
                            className="hidden"
                            disabled={disabled}
                        />
                    </div>
                )}

                {uploadState !== "idle" && file && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3">
                            <FileText
                                size={18}
                                weight="fill"
                                className="text-primary shrink-0"
                            />
                            <span className="text-xs font-medium truncate flex-1">
                                {file.name}
                            </span>
                            {onAnalyze && uploadState === "success" && (
                                <Button
                                    variant="default"
                                    size="sm"
                                    className="h-6 text-xs gap-1 shrink-0 cursor-pointer"
                                    onClick={onAnalyze}
                                    disabled={analyzing}
                                >
                                    {analyzing ? (
                                        <Spinner
                                            size={12}
                                            className="animate-spin"
                                        />
                                    ) : (
                                        <ChartPieSlice
                                            size={12}
                                            weight="duotone"
                                        />
                                    )}
                                    {analyzing ? "Analyzing..." : "Analyze"}
                                </Button>
                            )}
                            {(uploadState === "success" ||
                                uploadState === "error") && (
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    className="h-6 text-xs gap-1 shrink-0 text-white cursor-pointer"
                                    onClick={onReset}
                                    title="Remove resume"
                                >
                                    <Trash size={12} weight="duotone" />
                                    Delete
                                </Button>
                            )}
                        </div>

                        {uploadState === "uploading" && (
                            <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                                <div className="h-full bg-primary rounded-full animate-pulse w-2/3" />
                            </div>
                        )}

                        {analyzing && (
                            <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                                <div className="h-full bg-primary rounded-full animate-pulse w-2/3" />
                            </div>
                        )}

                        {error && (
                            <p className="text-xs text-destructive">{error}</p>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
