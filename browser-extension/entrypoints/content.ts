import type { JobData } from '@/types';
import { GreenhouseDetector } from '@/extractors/greenhouse';

const FLOATING_BTN_ID = 'joboracle-fab';
const POPUP_ID = 'joboracle-popup';

export default defineContentScript({
  matches: [
    '*://*.greenhouse.io/*',
    '*://boards.greenhouse.io/*',
    '*://job-boards.greenhouse.io/*',
    '*://*.lever.co/*',
    '*://jobs.lever.co/*',
    '*://*.workday.com/*',
    '*://*.myworkdayjobs.com/*',
  ],
  main() {
    let popupOpen = false;

    function injectStyles() {
      if (document.getElementById('joboracle-styles')) return;
      const style = document.createElement('style');
      style.id = 'joboracle-styles';
      style.textContent = `
        #${FLOATING_BTN_ID} {
          position: fixed;
          top: 50%;
          right: 0;
          transform: translateY(-50%);
          z-index: 2147483647;
          width: 36px;
          height: 64px;
          border-radius: 12px 0 0 12px;
          border: none;
          background: oklch(0.457 0.24 277.023);
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: -4px 0 16px oklch(0.457 0.24 277.023 / 0.35), 0 1px 3px rgba(0,0,0,0.15);
          font-family: 'Inter', system-ui, sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: -0.02em;
          writing-mode: vertical-rl;
          text-orientation: mixed;
          transition: width 0.15s ease, box-shadow 0.2s ease;
          animation: jobOracleFabIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both;
        }
        #${FLOATING_BTN_ID}:hover {
          width: 44px;
          box-shadow: -6px 0 24px oklch(0.457 0.24 277.023 / 0.45), 0 2px 6px rgba(0,0,0,0.2);
        }
        #${FLOATING_BTN_ID}:active {
          width: 34px;
        }
        @keyframes jobOracleFabIn {
          from { opacity: 0; transform: translateY(-50%) translateX(100%); }
          to { opacity: 1; transform: translateY(-50%) translateX(0); }
        }
        #${POPUP_ID} {
          position: fixed;
          top: 50%;
          right: 40px;
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

    function createFloatingButton() {
      if (document.getElementById(FLOATING_BTN_ID)) return;

      const btn = document.createElement('button');
      btn.id = FLOATING_BTN_ID;
      btn.title = 'Open JobOracle';
      btn.textContent = 'JO';
      btn.addEventListener('click', togglePopup);
      document.body.appendChild(btn);
    }

    function togglePopup() {
      if (popupOpen) {
        closePopup();
      } else {
        openPopup();
      }
    }

    function openPopup() {
      if (document.getElementById(POPUP_ID)) return;

      const overlay = document.createElement('div');
      overlay.id = `${POPUP_ID}-overlay`;
      overlay.addEventListener('click', closePopup);
      document.body.appendChild(overlay);

      const iframe = document.createElement('iframe');
      iframe.id = POPUP_ID;
      iframe.src = browser.runtime.getURL('/popup.html');
      iframe.allow = 'clipboard-write';
      document.body.appendChild(iframe);
      popupOpen = true;

      const fab = document.getElementById(FLOATING_BTN_ID);
      if (fab) {
        fab.style.background = 'oklch(0.398 0.195 277.366)';
        fab.style.width = '6px';
        fab.style.borderRadius = '6px 0 0 6px';
        fab.title = 'Close JobOracle';
      }
    }

    function closePopup() {
      const popup = document.getElementById(POPUP_ID);
      const overlay = document.getElementById(`${POPUP_ID}-overlay`);
      if (popup) {
        popup.classList.add('joboracle-popup-closing');
        popup.addEventListener('animationend', () => popup.remove(), { once: true });
      }
      if (overlay) {
        overlay.classList.add('joboracle-overlay-closing');
        overlay.addEventListener('animationend', () => overlay.remove(), { once: true });
      }
      popupOpen = false;

      const fab = document.getElementById(FLOATING_BTN_ID);
      if (fab) {
        fab.style.background = 'oklch(0.457 0.24 277.023)';
        fab.style.width = '';
        fab.style.borderRadius = '';
        fab.title = 'Open JobOracle';
      }
    }

    function detectAndSendJob() {
      let jobData: JobData | null = null;

      const url = window.location.href;
      if (/greenhouse\.io/.test(url)) {
        jobData = GreenhouseDetector.extractJobData();
      }

      if (jobData) {
        browser.runtime.sendMessage({ type: 'JOB_DETECTED', data: jobData }).catch(() => {});
      }
    }

    browser.runtime.onMessage.addListener((message) => {
      if (message.type === 'CHECK_FOR_JOB') {
        detectAndSendJob();
      }
      if (message.type === 'CLOSE_POPUP') {
        closePopup();
      }
    });

    injectStyles();
    createFloatingButton();
    detectAndSendJob();
  },
});