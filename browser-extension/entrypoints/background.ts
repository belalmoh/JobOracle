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

        if (message.type === "OPEN_SIDE_PANEL") {
            sendResponse({ ok: true });
            return true;
        }

        return false;
    });

    browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
        if (changeInfo.status === "complete" && tab.url) {
            const url: string = tab.url;
            const jobPagePatterns = [/greenhouse\.io/, /lever\.co/, /workday/];
            const isJobPage = jobPagePatterns.some((p) => p.test(url));
            if (isJobPage) {
                browser.tabs
                    .sendMessage(tabId, { type: "CHECK_FOR_JOB" })
                    .catch(() => {});
            }
        }
    });
});
