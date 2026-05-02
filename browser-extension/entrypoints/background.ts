import type { JobData } from "@/types";

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

        return false;
    });

    // Use chrome.action directly for MV3 compatibility
    const actionApi = (browser as any).action || (chrome as any).action;
    if (actionApi?.onClicked) {
        actionApi.onClicked.addListener(async (tab: chrome.tabs.Tab) => {
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
