import type { JobData, SerializedFile } from "@/types";
import { base64ToArrayBuffer } from "@/lib/utils";

export default defineBackground(() => {
    browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
        if (message.type === "JOB_DETECTED") {
            browser.storage.local.set({ currentJob: message.data });
            browser.runtime
                .sendMessage({ type: "JOB_UPDATED", data: message.data })
                .catch(() => {});
            sendResponse({ ok: true });
            return true;
        }

        if (message.type === "GET_CURRENT_JOB") {
            browser.storage.local.get("currentJob").then((result) => {
                sendResponse({ data: result.currentJob ?? null });
            });
            return true;
        }

        if (message.type === "OPEN_SETTINGS") {
            browser.tabs.create({
                url: browser.runtime.getURL("/settings.html"),
            });
            sendResponse({ ok: true });
            return true;
        }

        if (message.type === "TOGGLE_SIDEBAR") {
            sendResponse({ ok: true });
            return true;
        }

        if (message.type === "UPLOAD_RESUME") {
            handleUploadResume(message, sendResponse);
            return true;
        }

        if (message.type === "GET_RESUME_ANALYSIS") {
            handleResumeAnalysis(message, sendResponse);
            return true;
        }

        return false;
    });

    // Use chrome.action directly for MV3 compatibility
    const actionApi = (browser as any).action || (globalThis as any).chrome?.action;
    if (actionApi?.onClicked) {
        actionApi.onClicked.addListener(async (tab: any) => {
            if (!tab.id) return;
            try {
                await browser.tabs.sendMessage(tab.id, { type: "TOGGLE_SIDEBAR" });
            } catch {
                browser.tabs.create({
                    url: browser.runtime.getURL("/settings.html"),
                });
            }
        });
    }
});

async function handleUploadResume(
    message: {
        file: SerializedFile;
        ownerId: string;
        backendUrl: string;
    },
    sendResponse: (response?: any) => void,
) {
    try {
        const { file, ownerId, backendUrl } = message;

        console.log("[JobOracle BG] Received upload request:", {
            name: file.name,
            type: file.type,
            size: file.size,
            base64Length: file.base64.length,
        });

        // Reconstruct file from base64
        const arrayBuffer = base64ToArrayBuffer(file.base64);

        console.log("[JobOracle BG] Reconstructed ArrayBuffer size:", arrayBuffer.byteLength);

        const reconstructedFile = new File([arrayBuffer], file.name, {
            type: file.type,
            lastModified: Date.now(),
        });

        console.log("[JobOracle BG] Reconstructed File:", {
            name: reconstructedFile.name,
            size: reconstructedFile.size,
            type: reconstructedFile.type,
        });

        // Check first few bytes for PDF magic number
        const firstBytes = new Uint8Array(arrayBuffer.slice(0, 5));
        console.log("[JobOracle BG] First 5 bytes:", Array.from(firstBytes).map(b => b.toString(16).padStart(2, "0")).join(" "));

        const formData = new FormData();
        formData.append("resume", reconstructedFile);
        formData.append("ownerId", ownerId);

        const response = await fetch(`${backendUrl}/resume/upload`, {
            method: "POST",
            body: formData,
        });

        console.log("[JobOracle BG] Server response:", response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error("[JobOracle BG] Server error body:", errorText);
            throw new Error(
                `Upload failed: ${response.status} ${response.statusText}`,
            );
        }

        const serverResponse = await response.json();
        sendResponse({ success: true, data: serverResponse.data });
    } catch (err) {
        const errorMsg =
            err instanceof Error ? err.message : "Upload failed in background";
        console.error("[JobOracle BG] Upload error:", errorMsg);
        sendResponse({ success: false, error: errorMsg });
    }
}

async function handleResumeAnalysis(
    message: {
        backendUrl: string;
        resumeId: number;
        ownerId: string;
        resumeData: any;
        companyName: string;
        title: string;
        description: string;
        location?: string;
        salary?: number;
        url: string;
    },
    sendResponse: (response?: any) => void,
) {
    try {
        const { backendUrl, ...analysisData } = message;

        const response = await fetch(`${backendUrl}/job/analyze`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(analysisData),
        });

        if (!response.ok) {
            throw new Error(
                `Match score failed: ${response.status} ${response.statusText}`,
            );
        }

        const serverResponse = await response.json();
        sendResponse({ success: true, data: serverResponse });
    } catch (err) {
        const errorMsg =
            err instanceof Error ? err.message : "Analysis failed in background";
        sendResponse({ success: false, error: errorMsg });
    }
}