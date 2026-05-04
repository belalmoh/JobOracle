import type {
    JobData,
    ExtensionSettings,
    ResumeData,
    ResumeAnalysisData,
    JobAnalysisResponse,
    SerializedFile,
} from "@/types";
import { arrayBufferToBase64 } from "@/lib/utils";

const DEFAULT_SETTINGS: ExtensionSettings = {
    theme: "system",
    aiProvider: "ollama",
    ollamaUrl: "http://localhost:11434",
    ollamaModel: "llama3",
    autoDetectForms: true,
    showFloatingButton: true,
    autoOpenSidebar: true,
    smartFieldMatching: true,
    backendUrl: "http://localhost:3000/api",
};

export async function getSettings(): Promise<ExtensionSettings> {
    const result = await browser.storage.local.get("settings");
    return result.settings
        ? { ...DEFAULT_SETTINGS, ...result.settings }
        : DEFAULT_SETTINGS;
}

export async function saveSettings(
    settings: Partial<ExtensionSettings>,
): Promise<void> {
    const current = await getSettings();
    await browser.storage.local.set({ settings: { ...current, ...settings } });
}

export async function getCurrentJob(): Promise<JobData | null> {
    const result = await browser.storage.local.get("currentJob");
    const raw = result.currentJob;
    if (!raw || typeof raw !== "object") return null;
    return raw as JobData;
}

export async function setCurrentJob(job: JobData | null): Promise<void> {
    await browser.storage.local.set({ currentJob: job });
}

async function getBackendUrl(): Promise<string> {
    const settings = await getSettings();
    return settings.backendUrl;
}

export async function uploadResume(
    file: File,
    ownerId: string,
): Promise<{ data: ResumeData }> {
    const arrayBuffer = await file.arrayBuffer();
    const base64 = arrayBufferToBase64(arrayBuffer);

    const serializedFile: SerializedFile = {
        name: file.name,
        type: file.type,
        size: file.size,
        base64,
    };

    const backendUrl = await getBackendUrl();

    const response = await browser.runtime.sendMessage({
        type: "UPLOAD_RESUME",
        file: serializedFile,
        ownerId,
        backendUrl,
    });

    if (!response || !response.success) {
        throw new Error(response?.error || "Upload failed via background");
    }

    return { data: response.data };
}

export async function getResumeAnalysis(
    resumeAnalysisData: ResumeAnalysisData,
): Promise<JobAnalysisResponse> {
    const backendUrl = await getBackendUrl();

    const response = await browser.runtime.sendMessage({
        type: "GET_RESUME_ANALYSIS",
        ...resumeAnalysisData,
        backendUrl,
    });

    if (!response || !response.success) {
        throw new Error(response?.error || "Analysis failed via background");
    }

    return response.data as JobAnalysisResponse;
}