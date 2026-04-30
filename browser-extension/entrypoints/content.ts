import type { JobData } from "@/types";
import { GreenhouseDetector } from "@/extractors/greenhouse";

const FLOATING_BTN_ID = "joboracle-fab";
const DISMISS_BTN_ID = "joboracle-dismiss";
const WRAPPER_ID = "joboracle-fab-wrapper";
const POPUP_ID = "joboracle-popup";

export default defineContentScript({
    matches: [
        "*://*.greenhouse.io/*",
        "*://*.lever.co/*",
        "*://*.workday.com/*",
        "*://*.myworkdayjobs.com/*",
    ],
    main() {
        // Guard against double-injection (WXT HMR, overlapping matches, etc.)
        if ((document as any).__jobOracleLoaded) return;
        (document as any).__jobOracleLoaded = true;

        let popupOpen = false;

        function injectStyles() {
            if (document.getElementById("joboracle-styles")) return;
            const style = document.createElement("style");
            style.id = "joboracle-styles";
            style.textContent = `
        #${WRAPPER_ID} {
          position: fixed;
          top: 50%;
          right: 16px;
          transform: translateY(-50%);
          z-index: 2147483647;
          animation: jobOracleFabIn 0.35s cubic-bezier(0.34,1.56,0.64,1) both;
        }
        #${FLOATING_BTN_ID} {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: none;
          background: oklch(0.457 0.24 277.023);
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 16px oklch(0.457 0.24 277.023 / 0.35), 0 1px 3px rgba(0,0,0,0.15);
          font-family: 'Inter', system-ui, sans-serif;
          font-size: 13px;
          font-weight: 700;
          transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s ease;
          position: relative;
        }
        #${FLOATING_BTN_ID}:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 24px oklch(0.457 0.24 277.023 / 0.45), 0 2px 6px rgba(0,0,0,0.2);
        }
        #${FLOATING_BTN_ID}:active {
          transform: scale(0.95);
        }
        #${FLOATING_BTN_ID} svg {
          width: 20px;
          height: 20px;
          fill: none;
          stroke: currentColor;
          stroke-width: 2;
          stroke-linecap: round;
          stroke-linejoin: round;
        }
        #${DISMISS_BTN_ID} {
          position: absolute;
          top: -6px;
          right: -6px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: 2px solid white;
          background: oklch(0.552 0.016 285.938);
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          transition: background 0.15s ease, transform 0.15s ease;
          line-height: 1;
          z-index: 1;
        }
        #${DISMISS_BTN_ID}:hover {
          background: oklch(0.577 0.245 27.325);
          transform: scale(1.15);
        }
        #${DISMISS_BTN_ID} svg {
          width: 8px;
          height: 8px;
          stroke: currentColor;
          stroke-width: 2.5;
          fill: none;
          stroke-linecap: round;
        }
        @keyframes jobOracleFabIn {
          from { opacity: 0; transform: translateY(-50%) scale(0.5); }
          to { opacity: 1; transform: translateY(-50%) scale(1); }
        }
        .joboracle-wrapper-out {
          animation: jobOracleFabOut 0.2s ease both !important;
        }
        @keyframes jobOracleFabOut {
          from { opacity: 1; transform: translateY(-50%) scale(1); }
          to { opacity: 0; transform: translateY(-50%) scale(0.5); }
        }
        #${POPUP_ID} {
          position: fixed;
          top: 50%;
          transform: translateY(-50%);
          z-index: 2147483646;
          width: 450px;
          height: 550px;
          border: none;
          border-radius: 16px;
          overflow: hidden;
          background: white;
          box-shadow: 0 8px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06);
          animation: jobOraclePopupIn 0.25s cubic-bezier(0.22,1,0.36,1) both;
        }
        #${POPUP_ID}-overlay {
          position: fixed;
          inset: 0;
          z-index: 2147483645;
          background: rgba(0,0,0,0.15);
          animation: jobOracleOverlayIn 0.2s ease both;
        }
        @keyframes jobOraclePopupIn {
          from { opacity: 0; transform: translateY(-50%) scale(0.95); }
          to { opacity: 1; transform: translateY(-50%) scale(1); }
        }
        @keyframes jobOracleOverlayIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .joboracle-popup-closing {
          animation: jobOraclePopupOut 0.15s cubic-bezier(0.22,1,0.36,1) both !important;
        }
        .joboracle-overlay-closing {
          animation: jobOracleOverlayOut 0.15s ease both !important;
        }
        @keyframes jobOraclePopupOut {
          from { opacity: 1; transform: translateY(-50%) scale(1); }
          to { opacity: 0; transform: translateY(-50%) scale(0.95); }
        }
        @keyframes jobOracleOverlayOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
      `;
            document.head.appendChild(style);
        }

        function getWrapperY() {
            const wrapper = document.getElementById(WRAPPER_ID);
            return wrapper
                ? wrapper.getBoundingClientRect().top + wrapper.offsetHeight / 2
                : window.innerHeight / 2;
        }

        function createFloatingButton() {
            if (document.getElementById(WRAPPER_ID)) return;

            const wrapper = document.createElement("div");
            wrapper.id = WRAPPER_ID;

            const btn = document.createElement("button");
            btn.id = FLOATING_BTN_ID;
            btn.title = "Open JobOracle";
            btn.innerHTML = `<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="M8 12l2 2 4-4"/></svg>`;
            btn.addEventListener("click", openPopup);

            const dismiss = document.createElement("button");
            dismiss.id = DISMISS_BTN_ID;
            dismiss.title = "Dismiss";
            dismiss.innerHTML = `<svg viewBox="0 0 10 10" stroke-linecap="round"><line x1="2" y1="2" x2="8" y2="8"/><line x1="8" y1="2" x2="2" y2="8"/></svg>`;
            dismiss.addEventListener("click", (e) => {
                e.stopPropagation();
                dismissButton();
            });

            btn.appendChild(dismiss);
            wrapper.appendChild(btn);
            document.body.appendChild(wrapper);
        }

        function dismissButton() {
            const wrapper = document.getElementById(WRAPPER_ID);
            if (!wrapper) return;
            wrapper.classList.add("joboracle-wrapper-out");
            wrapper.addEventListener("animationend", () => wrapper.remove(), {
                once: true,
            });
        }

        function openPopup() {
            if (document.getElementById(POPUP_ID)) return;

            const overlay = document.createElement("div");
            overlay.id = `${POPUP_ID}-overlay`;
            overlay.addEventListener("click", closePopup);
            document.body.appendChild(overlay);

            const wrapperY = getWrapperY();
            const iframe = document.createElement("iframe");
            iframe.id = POPUP_ID;
            iframe.src = browser.runtime.getURL("/popup.html");
            iframe.allow = "clipboard-write";
            iframe.style.top = `${wrapperY}px`;
            iframe.style.right = "68px";
            document.body.appendChild(iframe);
            popupOpen = true;
        }

        function closePopup() {
            const popup = document.getElementById(POPUP_ID);
            const overlay = document.getElementById(`${POPUP_ID}-overlay`);
            if (popup) {
                popup.classList.add("joboracle-popup-closing");
                popup.addEventListener("animationend", () => popup.remove(), {
                    once: true,
                });
            }
            if (overlay) {
                overlay.classList.add("joboracle-overlay-closing");
                overlay.addEventListener(
                    "animationend",
                    () => overlay.remove(),
                    { once: true },
                );
            }
            popupOpen = false;
        }

        async function detectAndSendJob() {
            let jobData: JobData | null = null;

            const url = window.location.href;

            const greenhouseDetector = new GreenhouseDetector();

            if (greenhouseDetector.isJobApplicationPage()) {
                jobData = await greenhouseDetector.extractJobData();
            }

            if (jobData) {
                browser.runtime
                    .sendMessage({ type: "JOB_DETECTED", data: jobData })
                    .catch(() => {});
            }
        }

        browser.runtime.onMessage.addListener((message) => {
            if (message.type === "CHECK_FOR_JOB") {
                detectAndSendJob();
            }
            if (message.type === "CLOSE_POPUP") {
                closePopup();
            }
        });

        injectStyles();
        createFloatingButton();
        detectAndSendJob();
    },
});
