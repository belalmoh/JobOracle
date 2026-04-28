import type { JobData, ExtensionSettings, MatchScoreResponse } from "@/types";

const DEFAULT_SETTINGS: ExtensionSettings = {
    theme: "system",
    aiProvider: "ollama",
    ollamaUrl: "http://localhost:11434",
    ollamaModel: "llama3",
    autoDetectForms: true,
    showFloatingButton: true,
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

export async function uploadResume(
    file: File,
    ownerId: string,
): Promise<MatchScoreResponse> {
    const settings = await getSettings();
    const formData = new FormData();
    formData.append("resume", file);
    formData.append("ownerId", ownerId);

    const response = await fetch(`${settings.backendUrl}/resume/upload`, {
        method: "POST",
        body: formData,
    });

    if (!response.ok) {
        throw new Error(
            `Upload failed: ${response.status} ${response.statusText}`,
        );
    }

    return response.json();
}

export async function getMatchScore(
    resumeId: number,
    jobData: JobData,
): Promise<MatchScoreResponse> {
    const settings = await getSettings();
    const params = new URLSearchParams({
        jobTitle: jobData.title,
        company: jobData.company,
        jobDescription: jobData.description,
    });
    if (jobData.location) params.append("location", jobData.location);

    const response = await fetch(
        `${settings.backendUrl}/resume/${resumeId}/match?${params.toString()}`,
    );

    if (!response.ok) {
        throw new Error(
            `Match score failed: ${response.status} ${response.statusText}`,
        );
    }

    return response.json();
}
