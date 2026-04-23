var content = (function() {
	//#region node_modules/.pnpm/wxt@0.20.25_@types+node@25.6.0_jiti@2.6.1/node_modules/wxt/dist/utils/define-content-script.mjs
	function defineContentScript(definition) {
		return definition;
	}
	//#endregion
	//#region node_modules/.pnpm/wxt@0.20.25_@types+node@25.6.0_jiti@2.6.1/node_modules/wxt/dist/browser.mjs
	/**
	* Contains the `browser` export which you should use to access the extension
	* APIs in your project:
	*
	* ```ts
	* import { browser } from 'wxt/browser';
	*
	* browser.runtime.onInstalled.addListener(() => {
	*   // ...
	* });
	* ```
	*
	* @module wxt/browser
	*/
	var browser = globalThis.browser?.runtime?.id ? globalThis.browser : globalThis.chrome;
	//#endregion
	//#region extractors/greenhouse.ts
	var GreenhouseDetector = class GreenhouseDetector {
		static isJobApplicationPage() {
			const url = window.location.href;
			return /greenhouse\.io\/[^/]+\/jobs\/\d+/.test(url) || /greenhouse\.io\/embed\/job_app/.test(url);
		}
		static getCompanyDetailsFromUrl() {
			const url = new URL(window.location.href);
			let company = null;
			let jobId = null;
			if (/greenhouse\.io\/embed\/job_app/.test(url.href)) {
				company = url.searchParams.get("for");
				jobId = url.searchParams.get("jr_id");
			} else {
				const pathParts = url.pathname.split("/");
				company = pathParts[1] || null;
				jobId = pathParts[3] || null;
			}
			return {
				company,
				jobId
			};
		}
		static async extractFromAPI() {
			new URL(window.location.href);
			const { company, jobId } = this.getCompanyDetailsFromUrl();
			const jobDetailUrl = `https://boards-api.greenhouse.io/v1/boards/${company}/jobs/${jobId}`;
			try {
				const response = await fetch(jobDetailUrl);
				if (!response.ok) throw new Error("Network response was not ok");
				const data = await response.json();
				return {
					company: this.capitalizeCompany(data.company_name),
					title: data.title,
					description: data.content,
					location: data.location.name,
					url: window.location.href,
					salary: data.salary ? `${data.salary.currency} ${data.salary.value}` : void 0,
					source: "greenhouse"
				};
			} catch (error) {
				console.error("Failed to fetch job details from Greenhouse API:", error);
				return null;
			}
		}
		static extractFromDom() {
			const url = window.location.href;
			const parsedUrl = new URL(url);
			let { company } = this.getCompanyDetailsFromUrl();
			if (!company) company = parsedUrl.hostname.split(".")[0];
			const titleSelectors = [
				"h1.app-title",
				".app-title",
				"[data-testid=\"job-title\"]",
				".posting-title",
				"h1.job-title",
				"h1.posting-headline",
				".job-title h1",
				"h1[class*=\"title\"]",
				".jobs-unified-top-card__job-title",
				"h1",
				".posting-headline h2",
				"h2.job-title",
				"[data-automation-id=\"jobTitle\"]"
			];
			let title = "Unknown Position";
			for (const selector of titleSelectors) {
				const el = document.querySelector(selector);
				if (el?.textContent) {
					title = el.textContent.trim();
					break;
				}
			}
			const descriptionSelectors = [
				"[data-testid=\"job-description\"]",
				".posting-description",
				"#job-description",
				".app-description",
				"#content .job-post-content",
				"#content #gh_jid",
				".job__description",
				"[class*=\"job-description\"]",
				"[class*=\"jobDescription\"]",
				"[id*=\"job-description\"]",
				"[id*=\"jobDescription\"]",
				"[class*=\"posting-description\"]",
				"article[class*=\"job\"]",
				".job-details",
				".job-content",
				".description"
			];
			let description = "";
			for (const selector of descriptionSelectors) {
				const el = document.querySelector(selector);
				if (el?.textContent) {
					description = el.textContent.trim();
					break;
				}
			}
			const locationSelectors = [
				".location",
				"[data-testid=\"job-location\"]",
				".posting-location",
				".job-post-location"
			];
			let location = "";
			for (const selector of locationSelectors) {
				const el = document.querySelector(selector);
				if (el?.textContent) {
					location = el.textContent.trim();
					break;
				}
			}
			const salarySelectors = [
				".salary",
				"[data-testid=\"job-salary\"]",
				".posting-salary",
				".job-post-salary",
				"[class*=\"salary\"]",
				"[class*=\"compensation\"]",
				"[class*=\"pay-range\"]",
				"[class*=\"pay_range\"]",
				"[data-field=\"salary\"]",
				"[data-automation-id=\"salary\"]"
			];
			let salary = "";
			for (const selector of salarySelectors) {
				const el = document.querySelector(selector);
				if (el?.textContent) {
					salary = el.textContent.trim();
					break;
				}
			}
			return {
				company: this.capitalizeCompany(company),
				title,
				description,
				location,
				url,
				salary,
				source: "greenhouse"
			};
		}
		static extractFromAI() {
			return {
				company: "Unknown Company",
				title: "Unknown Position",
				description: "",
				url: window.location.href,
				source: "greenhouse"
			};
		}
		/**
		* Extract job data using multiple strategies (order of reliability):
		* 1. API extraction (most reliable)
		* 2. DOM parsing with various selectors
		* 3. AI-based extraction (fallback)
		* @returns JobData object with extracted information
		*/
		static extractJobData() {
			return GreenhouseDetector.extractFromDom();
		}
		static capitalizeCompany(company) {
			return company.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
		}
		static findApplicationForm() {
			for (const selector of [
				"form#application-form",
				"form[action*=\"/applications\"]",
				"[data-testid=\"application-form\"]",
				"form"
			]) {
				const form = document.querySelector(selector);
				if (form) return form;
			}
			return null;
		}
	};
	//#endregion
	//#region entrypoints/content.ts
	var FLOATING_BTN_ID = "joboracle-fab";
	var POPUP_ID = "joboracle-popup";
	var content_default = defineContentScript({
		matches: [
			"*://*.greenhouse.io/*",
			"*://boards.greenhouse.io/*",
			"*://job-boards.greenhouse.io/*",
			"*://*.lever.co/*",
			"*://jobs.lever.co/*",
			"*://*.workday.com/*",
			"*://*.myworkdayjobs.com/*"
		],
		main() {
			let popupOpen = false;
			function injectStyles() {
				if (document.getElementById("joboracle-styles")) return;
				const style = document.createElement("style");
				style.id = "joboracle-styles";
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
				const btn = document.createElement("button");
				btn.id = FLOATING_BTN_ID;
				btn.title = "Open JobOracle";
				btn.textContent = "JO";
				btn.addEventListener("click", togglePopup);
				document.body.appendChild(btn);
			}
			function togglePopup() {
				if (popupOpen) closePopup();
				else openPopup();
			}
			function openPopup() {
				if (document.getElementById(POPUP_ID)) return;
				const overlay = document.createElement("div");
				overlay.id = `${POPUP_ID}-overlay`;
				overlay.addEventListener("click", closePopup);
				document.body.appendChild(overlay);
				const iframe = document.createElement("iframe");
				iframe.id = POPUP_ID;
				iframe.src = browser.runtime.getURL("/popup.html");
				iframe.allow = "clipboard-write";
				document.body.appendChild(iframe);
				popupOpen = true;
				const fab = document.getElementById(FLOATING_BTN_ID);
				if (fab) {
					fab.style.background = "oklch(0.398 0.195 277.366)";
					fab.style.width = "6px";
					fab.style.borderRadius = "6px 0 0 6px";
					fab.title = "Close JobOracle";
				}
			}
			function closePopup() {
				const popup = document.getElementById(POPUP_ID);
				const overlay = document.getElementById(`${POPUP_ID}-overlay`);
				if (popup) {
					popup.classList.add("joboracle-popup-closing");
					popup.addEventListener("animationend", () => popup.remove(), { once: true });
				}
				if (overlay) {
					overlay.classList.add("joboracle-overlay-closing");
					overlay.addEventListener("animationend", () => overlay.remove(), { once: true });
				}
				popupOpen = false;
				const fab = document.getElementById(FLOATING_BTN_ID);
				if (fab) {
					fab.style.background = "oklch(0.457 0.24 277.023)";
					fab.style.width = "";
					fab.style.borderRadius = "";
					fab.title = "Open JobOracle";
				}
			}
			function detectAndSendJob() {
				let jobData = null;
				const url = window.location.href;
				if (/greenhouse\.io/.test(url)) jobData = GreenhouseDetector.extractJobData();
				if (jobData) browser.runtime.sendMessage({
					type: "JOB_DETECTED",
					data: jobData
				}).catch(() => {});
			}
			browser.runtime.onMessage.addListener((message) => {
				if (message.type === "CHECK_FOR_JOB") detectAndSendJob();
				if (message.type === "CLOSE_POPUP") closePopup();
			});
			injectStyles();
			createFloatingButton();
			detectAndSendJob();
		}
	});
	//#endregion
	//#region node_modules/.pnpm/wxt@0.20.25_@types+node@25.6.0_jiti@2.6.1/node_modules/wxt/dist/utils/internal/logger.mjs
	function print$1(method, ...args) {
		if (typeof args[0] === "string") method(`[wxt] ${args.shift()}`, ...args);
		else method("[wxt]", ...args);
	}
	/** Wrapper around `console` with a "[wxt]" prefix */
	var logger$1 = {
		debug: (...args) => print$1(console.debug, ...args),
		log: (...args) => print$1(console.log, ...args),
		warn: (...args) => print$1(console.warn, ...args),
		error: (...args) => print$1(console.error, ...args)
	};
	//#endregion
	//#region node_modules/.pnpm/wxt@0.20.25_@types+node@25.6.0_jiti@2.6.1/node_modules/wxt/dist/utils/internal/custom-events.mjs
	var WxtLocationChangeEvent = class WxtLocationChangeEvent extends Event {
		static EVENT_NAME = getUniqueEventName("wxt:locationchange");
		constructor(newUrl, oldUrl) {
			super(WxtLocationChangeEvent.EVENT_NAME, {});
			this.newUrl = newUrl;
			this.oldUrl = oldUrl;
		}
	};
	/**
	* Returns an event name unique to the extension and content script that's
	* running.
	*/
	function getUniqueEventName(eventName) {
		return `${browser?.runtime?.id}:content:${eventName}`;
	}
	//#endregion
	//#region node_modules/.pnpm/wxt@0.20.25_@types+node@25.6.0_jiti@2.6.1/node_modules/wxt/dist/utils/internal/location-watcher.mjs
	var supportsNavigationApi = typeof globalThis.navigation?.addEventListener === "function";
	/**
	* Create a util that watches for URL changes, dispatching the custom event when
	* detected. Stops watching when content script is invalidated. Uses Navigation
	* API when available, otherwise falls back to polling.
	*/
	function createLocationWatcher(ctx) {
		let lastUrl;
		let watching = false;
		return { run() {
			if (watching) return;
			watching = true;
			lastUrl = new URL(location.href);
			if (supportsNavigationApi) globalThis.navigation.addEventListener("navigate", (event) => {
				const newUrl = new URL(event.destination.url);
				if (newUrl.href === lastUrl.href) return;
				window.dispatchEvent(new WxtLocationChangeEvent(newUrl, lastUrl));
				lastUrl = newUrl;
			}, { signal: ctx.signal });
			else ctx.setInterval(() => {
				const newUrl = new URL(location.href);
				if (newUrl.href !== lastUrl.href) {
					window.dispatchEvent(new WxtLocationChangeEvent(newUrl, lastUrl));
					lastUrl = newUrl;
				}
			}, 1e3);
		} };
	}
	//#endregion
	//#region node_modules/.pnpm/wxt@0.20.25_@types+node@25.6.0_jiti@2.6.1/node_modules/wxt/dist/utils/content-script-context.mjs
	/**
	* Implements
	* [`AbortController`](https://developer.mozilla.org/en-US/docs/Web/API/AbortController).
	* Used to detect and stop content script code when the script is invalidated.
	*
	* It also provides several utilities like `ctx.setTimeout` and
	* `ctx.setInterval` that should be used in content scripts instead of
	* `window.setTimeout` or `window.setInterval`.
	*
	* To create context for testing, you can use the class's constructor:
	*
	* ```ts
	* import { ContentScriptContext } from 'wxt/utils/content-scripts-context';
	*
	* test('storage listener should be removed when context is invalidated', () => {
	*   const ctx = new ContentScriptContext('test');
	*   const item = storage.defineItem('local:count', { defaultValue: 0 });
	*   const watcher = vi.fn();
	*
	*   const unwatch = item.watch(watcher);
	*   ctx.onInvalidated(unwatch); // Listen for invalidate here
	*
	*   await item.setValue(1);
	*   expect(watcher).toBeCalledTimes(1);
	*   expect(watcher).toBeCalledWith(1, 0);
	*
	*   ctx.notifyInvalidated(); // Use this function to invalidate the context
	*   await item.setValue(2);
	*   expect(watcher).toBeCalledTimes(1);
	* });
	* ```
	*/
	var ContentScriptContext = class ContentScriptContext {
		static SCRIPT_STARTED_MESSAGE_TYPE = getUniqueEventName("wxt:content-script-started");
		id;
		abortController;
		locationWatcher = createLocationWatcher(this);
		constructor(contentScriptName, options) {
			this.contentScriptName = contentScriptName;
			this.options = options;
			this.id = Math.random().toString(36).slice(2);
			this.abortController = new AbortController();
			this.stopOldScripts();
			this.listenForNewerScripts();
		}
		get signal() {
			return this.abortController.signal;
		}
		abort(reason) {
			return this.abortController.abort(reason);
		}
		get isInvalid() {
			if (browser.runtime?.id == null) this.notifyInvalidated();
			return this.signal.aborted;
		}
		get isValid() {
			return !this.isInvalid;
		}
		/**
		* Add a listener that is called when the content script's context is
		* invalidated.
		*
		* @example
		*   browser.runtime.onMessage.addListener(cb);
		*   const removeInvalidatedListener = ctx.onInvalidated(() => {
		*     browser.runtime.onMessage.removeListener(cb);
		*   });
		*   // ...
		*   removeInvalidatedListener();
		*
		* @returns A function to remove the listener.
		*/
		onInvalidated(cb) {
			this.signal.addEventListener("abort", cb);
			return () => this.signal.removeEventListener("abort", cb);
		}
		/**
		* Return a promise that never resolves. Useful if you have an async function
		* that shouldn't run after the context is expired.
		*
		* @example
		*   const getValueFromStorage = async () => {
		*     if (ctx.isInvalid) return ctx.block();
		*
		*     // ...
		*   };
		*/
		block() {
			return new Promise(() => {});
		}
		/**
		* Wrapper around `window.setInterval` that automatically clears the interval
		* when invalidated.
		*
		* Intervals can be cleared by calling the normal `clearInterval` function.
		*/
		setInterval(handler, timeout) {
			const id = setInterval(() => {
				if (this.isValid) handler();
			}, timeout);
			this.onInvalidated(() => clearInterval(id));
			return id;
		}
		/**
		* Wrapper around `window.setTimeout` that automatically clears the interval
		* when invalidated.
		*
		* Timeouts can be cleared by calling the normal `setTimeout` function.
		*/
		setTimeout(handler, timeout) {
			const id = setTimeout(() => {
				if (this.isValid) handler();
			}, timeout);
			this.onInvalidated(() => clearTimeout(id));
			return id;
		}
		/**
		* Wrapper around `window.requestAnimationFrame` that automatically cancels
		* the request when invalidated.
		*
		* Callbacks can be canceled by calling the normal `cancelAnimationFrame`
		* function.
		*/
		requestAnimationFrame(callback) {
			const id = requestAnimationFrame((...args) => {
				if (this.isValid) callback(...args);
			});
			this.onInvalidated(() => cancelAnimationFrame(id));
			return id;
		}
		/**
		* Wrapper around `window.requestIdleCallback` that automatically cancels the
		* request when invalidated.
		*
		* Callbacks can be canceled by calling the normal `cancelIdleCallback`
		* function.
		*/
		requestIdleCallback(callback, options) {
			const id = requestIdleCallback((...args) => {
				if (!this.signal.aborted) callback(...args);
			}, options);
			this.onInvalidated(() => cancelIdleCallback(id));
			return id;
		}
		addEventListener(target, type, handler, options) {
			if (type === "wxt:locationchange") {
				if (this.isValid) this.locationWatcher.run();
			}
			target.addEventListener?.(type.startsWith("wxt:") ? getUniqueEventName(type) : type, handler, {
				...options,
				signal: this.signal
			});
		}
		/**
		* @internal
		* Abort the abort controller and execute all `onInvalidated` listeners.
		*/
		notifyInvalidated() {
			this.abort("Content script context invalidated");
			logger$1.debug(`Content script "${this.contentScriptName}" context invalidated`);
		}
		stopOldScripts() {
			document.dispatchEvent(new CustomEvent(ContentScriptContext.SCRIPT_STARTED_MESSAGE_TYPE, { detail: {
				contentScriptName: this.contentScriptName,
				messageId: this.id
			} }));
			window.postMessage({
				type: ContentScriptContext.SCRIPT_STARTED_MESSAGE_TYPE,
				contentScriptName: this.contentScriptName,
				messageId: this.id
			}, "*");
		}
		verifyScriptStartedEvent(event) {
			const isSameContentScript = event.detail?.contentScriptName === this.contentScriptName;
			const isFromSelf = event.detail?.messageId === this.id;
			return isSameContentScript && !isFromSelf;
		}
		listenForNewerScripts() {
			const cb = (event) => {
				if (!(event instanceof CustomEvent) || !this.verifyScriptStartedEvent(event)) return;
				this.notifyInvalidated();
			};
			document.addEventListener(ContentScriptContext.SCRIPT_STARTED_MESSAGE_TYPE, cb);
			this.onInvalidated(() => document.removeEventListener(ContentScriptContext.SCRIPT_STARTED_MESSAGE_TYPE, cb));
		}
	};
	//#endregion
	//#region \0virtual:wxt-content-script-isolated-world-entrypoint?/Users/belal/Desktop/Projects/JobOracle/browser-extension/entrypoints/content.ts
	function print(method, ...args) {
		if (typeof args[0] === "string") method(`[wxt] ${args.shift()}`, ...args);
		else method("[wxt]", ...args);
	}
	/** Wrapper around `console` with a "[wxt]" prefix */
	var logger = {
		debug: (...args) => print(console.debug, ...args),
		log: (...args) => print(console.log, ...args),
		warn: (...args) => print(console.warn, ...args),
		error: (...args) => print(console.error, ...args)
	};
	//#endregion
	return (async () => {
		try {
			const { main, ...options } = content_default;
			return await main(new ContentScriptContext("content", options));
		} catch (err) {
			logger.error(`The content script "content" crashed on startup!`, err);
			throw err;
		}
	})();
})();

content;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGVudC5qcyIsIm5hbWVzIjpbImJyb3dzZXIiLCJwcmludCIsImxvZ2dlciJdLCJzb3VyY2VzIjpbIi4uLy4uLy4uL25vZGVfbW9kdWxlcy8ucG5wbS93eHRAMC4yMC4yNV9AdHlwZXMrbm9kZUAyNS42LjBfaml0aUAyLjYuMS9ub2RlX21vZHVsZXMvd3h0L2Rpc3QvdXRpbHMvZGVmaW5lLWNvbnRlbnQtc2NyaXB0Lm1qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy8ucG5wbS9Ad3h0LWRlditicm93c2VyQDAuMS40MC9ub2RlX21vZHVsZXMvQHd4dC1kZXYvYnJvd3Nlci9zcmMvaW5kZXgubWpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzLy5wbnBtL3d4dEAwLjIwLjI1X0B0eXBlcytub2RlQDI1LjYuMF9qaXRpQDIuNi4xL25vZGVfbW9kdWxlcy93eHQvZGlzdC9icm93c2VyLm1qcyIsIi4uLy4uLy4uL2V4dHJhY3RvcnMvZ3JlZW5ob3VzZS50cyIsIi4uLy4uLy4uL2VudHJ5cG9pbnRzL2NvbnRlbnQudHMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvLnBucG0vd3h0QDAuMjAuMjVfQHR5cGVzK25vZGVAMjUuNi4wX2ppdGlAMi42LjEvbm9kZV9tb2R1bGVzL3d4dC9kaXN0L3V0aWxzL2ludGVybmFsL2xvZ2dlci5tanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvLnBucG0vd3h0QDAuMjAuMjVfQHR5cGVzK25vZGVAMjUuNi4wX2ppdGlAMi42LjEvbm9kZV9tb2R1bGVzL3d4dC9kaXN0L3V0aWxzL2ludGVybmFsL2N1c3RvbS1ldmVudHMubWpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzLy5wbnBtL3d4dEAwLjIwLjI1X0B0eXBlcytub2RlQDI1LjYuMF9qaXRpQDIuNi4xL25vZGVfbW9kdWxlcy93eHQvZGlzdC91dGlscy9pbnRlcm5hbC9sb2NhdGlvbi13YXRjaGVyLm1qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy8ucG5wbS93eHRAMC4yMC4yNV9AdHlwZXMrbm9kZUAyNS42LjBfaml0aUAyLjYuMS9ub2RlX21vZHVsZXMvd3h0L2Rpc3QvdXRpbHMvY29udGVudC1zY3JpcHQtY29udGV4dC5tanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8jcmVnaW9uIHNyYy91dGlscy9kZWZpbmUtY29udGVudC1zY3JpcHQudHNcbmZ1bmN0aW9uIGRlZmluZUNvbnRlbnRTY3JpcHQoZGVmaW5pdGlvbikge1xuXHRyZXR1cm4gZGVmaW5pdGlvbjtcbn1cbi8vI2VuZHJlZ2lvblxuZXhwb3J0IHsgZGVmaW5lQ29udGVudFNjcmlwdCB9O1xuIiwiLy8gI3JlZ2lvbiBzbmlwcGV0XG5leHBvcnQgY29uc3QgYnJvd3NlciA9IGdsb2JhbFRoaXMuYnJvd3Nlcj8ucnVudGltZT8uaWRcbiAgPyBnbG9iYWxUaGlzLmJyb3dzZXJcbiAgOiBnbG9iYWxUaGlzLmNocm9tZTtcbi8vICNlbmRyZWdpb24gc25pcHBldFxuIiwiaW1wb3J0IHsgYnJvd3NlciBhcyBicm93c2VyJDEgfSBmcm9tIFwiQHd4dC1kZXYvYnJvd3NlclwiO1xuLy8jcmVnaW9uIHNyYy9icm93c2VyLnRzXG4vKipcbiogQ29udGFpbnMgdGhlIGBicm93c2VyYCBleHBvcnQgd2hpY2ggeW91IHNob3VsZCB1c2UgdG8gYWNjZXNzIHRoZSBleHRlbnNpb25cbiogQVBJcyBpbiB5b3VyIHByb2plY3Q6XG4qXG4qIGBgYHRzXG4qIGltcG9ydCB7IGJyb3dzZXIgfSBmcm9tICd3eHQvYnJvd3Nlcic7XG4qXG4qIGJyb3dzZXIucnVudGltZS5vbkluc3RhbGxlZC5hZGRMaXN0ZW5lcigoKSA9PiB7XG4qICAgLy8gLi4uXG4qIH0pO1xuKiBgYGBcbipcbiogQG1vZHVsZSB3eHQvYnJvd3NlclxuKi9cbmNvbnN0IGJyb3dzZXIgPSBicm93c2VyJDE7XG4vLyNlbmRyZWdpb25cbmV4cG9ydCB7IGJyb3dzZXIgfTtcbiIsImltcG9ydCB0eXBlIHsgSm9iRGF0YSB9IGZyb20gJy4uL3R5cGVzJztcblxuZXhwb3J0IGNsYXNzIEdyZWVuaG91c2VEZXRlY3RvciB7XG5cblx0c3RhdGljIGlzSm9iQXBwbGljYXRpb25QYWdlKCk6IGJvb2xlYW4ge1xuXHRcdGNvbnN0IHVybCA9IHdpbmRvdy5sb2NhdGlvbi5ocmVmXG5cdFx0Ly8gUGF0dGVybiAxOiBqb2ItYm9hcmRzLmdyZWVuaG91c2UuaW8ve2NvbXBhbnl9L2pvYnMve2lkfVxuXHRcdGNvbnN0IGJvYXJkc1BhdHRlcm4gPSAvZ3JlZW5ob3VzZVxcLmlvXFwvW14vXStcXC9qb2JzXFwvXFxkKy9cblx0XHQvLyBQYXR0ZXJuIDI6IGpvYi1ib2FyZHMuZ3JlZW5ob3VzZS5pby9lbWJlZC9qb2JfYXBwP2Zvcj17Y29tcGFueX0manJfaWQ9e2lkfVxuXHRcdGNvbnN0IGVtYmVkUGF0dGVybiA9IC9ncmVlbmhvdXNlXFwuaW9cXC9lbWJlZFxcL2pvYl9hcHAvXG5cdFx0cmV0dXJuIGJvYXJkc1BhdHRlcm4udGVzdCh1cmwpIHx8IGVtYmVkUGF0dGVybi50ZXN0KHVybClcblx0fVxuXG5cdHN0YXRpYyBnZXRDb21wYW55RGV0YWlsc0Zyb21VcmwoKTogeyBjb21wYW55OiBzdHJpbmcgfCBudWxsLCBqb2JJZDogc3RyaW5nIHwgbnVsbCB9IHtcblx0XHRjb25zdCB1cmwgPSBuZXcgVVJMKHdpbmRvdy5sb2NhdGlvbi5ocmVmKTtcblx0XHRsZXQgY29tcGFueSA9IG51bGxcblx0XHRsZXQgam9iSWQgPSBudWxsXG5cdFx0aWYgKC9ncmVlbmhvdXNlXFwuaW9cXC9lbWJlZFxcL2pvYl9hcHAvLnRlc3QodXJsLmhyZWYpKSB7XG5cdFx0XHQvLyBQYXR0ZXJuIDI6IHF1ZXJ5IHBhcmFtc1xuXHRcdFx0Y29tcGFueSA9IHVybC5zZWFyY2hQYXJhbXMuZ2V0KCdmb3InKVxuXHRcdFx0am9iSWQgPSB1cmwuc2VhcmNoUGFyYW1zLmdldCgnanJfaWQnKVxuXHRcdH0gZWxzZSB7XG5cdFx0XHQvLyBQYXR0ZXJuIDE6IC97Y29tcGFueX0vam9icy97aWR9XG5cdFx0XHRjb25zdCBwYXRoUGFydHMgPSB1cmwucGF0aG5hbWUuc3BsaXQoJy8nKVxuXHRcdFx0Y29tcGFueSA9IHBhdGhQYXJ0c1sxXSB8fCBudWxsXG5cdFx0XHRqb2JJZCA9IHBhdGhQYXJ0c1szXSB8fCBudWxsXG5cdFx0fVxuXG5cdFx0cmV0dXJuIHtcblx0XHRcdGNvbXBhbnksXG5cdFx0XHRqb2JJZFxuXHRcdH1cblx0fVxuXG5cdHN0YXRpYyBhc3luYyBleHRyYWN0RnJvbUFQSSgpOiBQcm9taXNlPEpvYkRhdGEgfCBudWxsPiB7XG5cdFx0Y29uc3QgdXJsID0gbmV3IFVSTCh3aW5kb3cubG9jYXRpb24uaHJlZilcblx0XHRjb25zdCB7IGNvbXBhbnksIGpvYklkIH0gPSB0aGlzLmdldENvbXBhbnlEZXRhaWxzRnJvbVVybCgpXG5cblx0XHRjb25zdCBqb2JEZXRhaWxVcmwgPSBgaHR0cHM6Ly9ib2FyZHMtYXBpLmdyZWVuaG91c2UuaW8vdjEvYm9hcmRzLyR7Y29tcGFueX0vam9icy8ke2pvYklkfWA7XG5cblx0XHR0cnkge1xuXHRcdFx0Y29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChqb2JEZXRhaWxVcmwpXG5cdFx0XHRpZiAoIXJlc3BvbnNlLm9rKSB0aHJvdyBuZXcgRXJyb3IoJ05ldHdvcmsgcmVzcG9uc2Ugd2FzIG5vdCBvaycpXG5cdFx0XHRjb25zdCBkYXRhID0gYXdhaXQgcmVzcG9uc2UuanNvbigpXG5cblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdGNvbXBhbnk6IHRoaXMuY2FwaXRhbGl6ZUNvbXBhbnkoZGF0YS5jb21wYW55X25hbWUpLFxuXHRcdFx0XHR0aXRsZTogZGF0YS50aXRsZSxcblx0XHRcdFx0ZGVzY3JpcHRpb246IGRhdGEuY29udGVudCxcblx0XHRcdFx0bG9jYXRpb246IGRhdGEubG9jYXRpb24ubmFtZSxcblx0XHRcdFx0dXJsOiB3aW5kb3cubG9jYXRpb24uaHJlZixcblx0XHRcdFx0c2FsYXJ5OiBkYXRhLnNhbGFyeSA/IGAke2RhdGEuc2FsYXJ5LmN1cnJlbmN5fSAke2RhdGEuc2FsYXJ5LnZhbHVlfWAgOiB1bmRlZmluZWQsXG5cdFx0XHRcdHNvdXJjZTogJ2dyZWVuaG91c2UnXG5cdFx0XHR9XG5cdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byBmZXRjaCBqb2IgZGV0YWlscyBmcm9tIEdyZWVuaG91c2UgQVBJOicsIGVycm9yKVxuXHRcdFx0cmV0dXJuIG51bGw7XG5cdFx0fVxuXHR9XG5cblx0c3RhdGljIGV4dHJhY3RGcm9tRG9tKCk6IEpvYkRhdGEge1xuXHRcdGNvbnN0IHVybCA9IHdpbmRvdy5sb2NhdGlvbi5ocmVmXG5cdFx0Y29uc3QgcGFyc2VkVXJsID0gbmV3IFVSTCh1cmwpXG5cdFx0bGV0IHsgY29tcGFueSB9ID0gdGhpcy5nZXRDb21wYW55RGV0YWlsc0Zyb21VcmwoKVxuXHRcdGlmICghY29tcGFueSkgY29tcGFueSA9IHBhcnNlZFVybC5ob3N0bmFtZS5zcGxpdCgnLicpWzBdXG5cblx0XHQvLyBUcnkgdG8gZXh0cmFjdCBqb2IgdGl0bGUgZnJvbSB2YXJpb3VzIHNlbGVjdG9yc1xuXHRcdGNvbnN0IHRpdGxlU2VsZWN0b3JzID0gW1xuXHRcdFx0J2gxLmFwcC10aXRsZScsXG5cdFx0XHQnLmFwcC10aXRsZScsXG5cdFx0XHQnW2RhdGEtdGVzdGlkPVwiam9iLXRpdGxlXCJdJyxcblx0XHRcdCcucG9zdGluZy10aXRsZScsXG5cdFx0XHQnaDEuam9iLXRpdGxlJywgXG5cdFx0XHQnaDEucG9zdGluZy1oZWFkbGluZScsIFxuXHRcdFx0Jy5qb2ItdGl0bGUgaDEnLFxuXHRcdFx0J2gxW2NsYXNzKj1cInRpdGxlXCJdJywgXG5cdFx0XHQnLmpvYnMtdW5pZmllZC10b3AtY2FyZF9fam9iLXRpdGxlJyxcblx0XHRcdCdoMScsIFxuXHRcdFx0Jy5wb3N0aW5nLWhlYWRsaW5lIGgyJyxcbiAgICAgIFx0XHQnaDIuam9iLXRpdGxlJywgXG5cdFx0XHQnW2RhdGEtYXV0b21hdGlvbi1pZD1cImpvYlRpdGxlXCJdJ1xuXHRcdF07XG5cblx0XHRsZXQgdGl0bGUgPSAnVW5rbm93biBQb3NpdGlvbidcblx0XHRmb3IgKGNvbnN0IHNlbGVjdG9yIG9mIHRpdGxlU2VsZWN0b3JzKSB7XG5cdFx0XHRjb25zdCBlbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3IpXG5cdFx0XHRpZiAoZWw/LnRleHRDb250ZW50KSB7XG5cdFx0XHRcdHRpdGxlID0gZWwudGV4dENvbnRlbnQudHJpbSgpXG5cdFx0XHRcdGJyZWFrXG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Ly8gRXh0cmFjdCBqb2IgZGVzY3JpcHRpb25cblx0XHRjb25zdCBkZXNjcmlwdGlvblNlbGVjdG9ycyA9IFtcblx0XHRcdCdbZGF0YS10ZXN0aWQ9XCJqb2ItZGVzY3JpcHRpb25cIl0nLFxuXHRcdFx0Jy5wb3N0aW5nLWRlc2NyaXB0aW9uJyxcblx0XHRcdCcjam9iLWRlc2NyaXB0aW9uJyxcblx0XHRcdCcuYXBwLWRlc2NyaXB0aW9uJyxcblx0XHRcdCcjY29udGVudCAuam9iLXBvc3QtY29udGVudCcsXG5cdFx0XHQnI2NvbnRlbnQgI2doX2ppZCcsXG5cdFx0XHQnLmpvYl9fZGVzY3JpcHRpb24nLFxuXHRcdFx0J1tjbGFzcyo9XCJqb2ItZGVzY3JpcHRpb25cIl0nLFxuXHRcdFx0J1tjbGFzcyo9XCJqb2JEZXNjcmlwdGlvblwiXScsXG5cdFx0XHQnW2lkKj1cImpvYi1kZXNjcmlwdGlvblwiXScsXG5cdFx0XHQnW2lkKj1cImpvYkRlc2NyaXB0aW9uXCJdJyxcblx0XHRcdCdbY2xhc3MqPVwicG9zdGluZy1kZXNjcmlwdGlvblwiXScsXG5cdFx0XHQnYXJ0aWNsZVtjbGFzcyo9XCJqb2JcIl0nLFxuXHRcdFx0Jy5qb2ItZGV0YWlscycsXG5cdFx0XHQnLmpvYi1jb250ZW50Jyxcblx0XHRcdCcuZGVzY3JpcHRpb24nLFxuXHRcdF07XG5cblx0XHRsZXQgZGVzY3JpcHRpb24gPSAnJ1xuXHRcdGZvciAoY29uc3Qgc2VsZWN0b3Igb2YgZGVzY3JpcHRpb25TZWxlY3RvcnMpIHtcblx0XHRcdGNvbnN0IGVsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihzZWxlY3Rvcilcblx0XHRcdGlmIChlbD8udGV4dENvbnRlbnQpIHtcblx0XHRcdFx0ZGVzY3JpcHRpb24gPSBlbC50ZXh0Q29udGVudC50cmltKClcblx0XHRcdFx0YnJlYWtcblx0XHRcdH1cblx0XHR9XG5cblx0XHQvLyBFeHRyYWN0IGxvY2F0aW9uIGlmIGF2YWlsYWJsZVxuXHRcdGNvbnN0IGxvY2F0aW9uU2VsZWN0b3JzID0gW1xuXHRcdFx0Jy5sb2NhdGlvbicsXG5cdFx0XHQnW2RhdGEtdGVzdGlkPVwiam9iLWxvY2F0aW9uXCJdJyxcblx0XHRcdCcucG9zdGluZy1sb2NhdGlvbicsXG5cdFx0XHQnLmpvYi1wb3N0LWxvY2F0aW9uJyxcblx0XHRdXG5cblx0XHRsZXQgbG9jYXRpb24gPSAnJ1xuXHRcdGZvciAoY29uc3Qgc2VsZWN0b3Igb2YgbG9jYXRpb25TZWxlY3RvcnMpIHtcblx0XHRcdGNvbnN0IGVsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihzZWxlY3Rvcilcblx0XHRcdGlmIChlbD8udGV4dENvbnRlbnQpIHtcblx0XHRcdFx0bG9jYXRpb24gPSBlbC50ZXh0Q29udGVudC50cmltKClcblx0XHRcdFx0YnJlYWtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRjb25zdCBzYWxhcnlTZWxlY3RvcnMgPSBbXG5cdFx0XHQnLnNhbGFyeScsXG5cdFx0XHQnW2RhdGEtdGVzdGlkPVwiam9iLXNhbGFyeVwiXScsXG5cdFx0XHQnLnBvc3Rpbmctc2FsYXJ5Jyxcblx0XHRcdCcuam9iLXBvc3Qtc2FsYXJ5Jyxcblx0XHRcdCdbY2xhc3MqPVwic2FsYXJ5XCJdJywgXG5cdFx0XHQnW2NsYXNzKj1cImNvbXBlbnNhdGlvblwiXScsIFxuXHRcdFx0J1tjbGFzcyo9XCJwYXktcmFuZ2VcIl0nLFxuICAgICAgXHRcdCdbY2xhc3MqPVwicGF5X3JhbmdlXCJdJywgXG5cdFx0XHQnW2RhdGEtZmllbGQ9XCJzYWxhcnlcIl0nLFxuXHRcdFx0J1tkYXRhLWF1dG9tYXRpb24taWQ9XCJzYWxhcnlcIl0nLFxuXHRcdF1cblxuXHRcdGxldCBzYWxhcnkgPSAnJ1xuXHRcdGZvciAoY29uc3Qgc2VsZWN0b3Igb2Ygc2FsYXJ5U2VsZWN0b3JzKSB7XG5cdFx0XHRjb25zdCBlbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3IpXG5cdFx0XHRpZiAoZWw/LnRleHRDb250ZW50KSB7XG5cdFx0XHRcdHNhbGFyeSA9IGVsLnRleHRDb250ZW50LnRyaW0oKVxuXHRcdFx0XHRicmVha1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiB7XG5cdFx0XHRjb21wYW55OiB0aGlzLmNhcGl0YWxpemVDb21wYW55KGNvbXBhbnkpLFxuXHRcdFx0dGl0bGUsXG5cdFx0XHRkZXNjcmlwdGlvbixcblx0XHRcdGxvY2F0aW9uLFxuXHRcdFx0dXJsLFxuXHRcdFx0c2FsYXJ5LFxuXHRcdFx0c291cmNlOiAnZ3JlZW5ob3VzZSdcblx0XHR9XG5cdH1cblxuXHRzdGF0aWMgZXh0cmFjdEZyb21BSSgpOiBKb2JEYXRhIHtcblx0XHQvLyBQbGFjZWhvbGRlciBmb3IgZnV0dXJlIEFJLWJhc2VkIGV4dHJhY3Rpb24gaWYgbmVlZGVkXG5cdFx0cmV0dXJuIHtcblx0XHRcdGNvbXBhbnk6ICdVbmtub3duIENvbXBhbnknLFxuXHRcdFx0dGl0bGU6ICdVbmtub3duIFBvc2l0aW9uJyxcblx0XHRcdGRlc2NyaXB0aW9uOiAnJyxcblx0XHRcdHVybDogd2luZG93LmxvY2F0aW9uLmhyZWYsXG5cdFx0XHRzb3VyY2U6ICdncmVlbmhvdXNlJ1xuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBFeHRyYWN0IGpvYiBkYXRhIHVzaW5nIG11bHRpcGxlIHN0cmF0ZWdpZXMgKG9yZGVyIG9mIHJlbGlhYmlsaXR5KTpcblx0ICogMS4gQVBJIGV4dHJhY3Rpb24gKG1vc3QgcmVsaWFibGUpXG5cdCAqIDIuIERPTSBwYXJzaW5nIHdpdGggdmFyaW91cyBzZWxlY3RvcnNcblx0ICogMy4gQUktYmFzZWQgZXh0cmFjdGlvbiAoZmFsbGJhY2spXG5cdCAqIEByZXR1cm5zIEpvYkRhdGEgb2JqZWN0IHdpdGggZXh0cmFjdGVkIGluZm9ybWF0aW9uXG5cdCAqL1xuXHRzdGF0aWMgZXh0cmFjdEpvYkRhdGEoKTogSm9iRGF0YSB7XG5cdFx0Ly8gVHJ5IERPTSBleHRyYWN0aW9uIGZpcnN0XG5cdFx0Y29uc3QgZG9tRGF0YSA9IEdyZWVuaG91c2VEZXRlY3Rvci5leHRyYWN0RnJvbURvbSgpO1xuXHRcdFxuXHRcdC8vIFJldHVybiBET00gZGF0YSBldmVuIGlmIG1pbmltYWwsIHNvIHdpZGdldCBzaG93c1xuXHRcdHJldHVybiBkb21EYXRhXG5cdH1cblxuXHRwcml2YXRlIHN0YXRpYyBjYXBpdGFsaXplQ29tcGFueShjb21wYW55OiBzdHJpbmcpOiBzdHJpbmcge1xuXHRcdHJldHVybiBjb21wYW55XG5cdFx0XHQuc3BsaXQoJy0nKVxuXHRcdFx0Lm1hcCh3b3JkID0+IHdvcmQuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyB3b3JkLnNsaWNlKDEpKVxuXHRcdFx0LmpvaW4oJyAnKVxuXHR9XG5cblx0c3RhdGljIGZpbmRBcHBsaWNhdGlvbkZvcm0oKTogSFRNTEZvcm1FbGVtZW50IHwgbnVsbCB7XG5cdFx0Y29uc3Qgc2VsZWN0b3JzID0gW1xuXHRcdFx0J2Zvcm0jYXBwbGljYXRpb24tZm9ybScsXG5cdFx0XHQnZm9ybVthY3Rpb24qPVwiL2FwcGxpY2F0aW9uc1wiXScsXG5cdFx0XHQnW2RhdGEtdGVzdGlkPVwiYXBwbGljYXRpb24tZm9ybVwiXScsXG5cdFx0XHQnZm9ybSdcblx0XHRdXG5cblx0XHRmb3IgKGNvbnN0IHNlbGVjdG9yIG9mIHNlbGVjdG9ycykge1xuXHRcdFx0Y29uc3QgZm9ybSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3IpIGFzIEhUTUxGb3JtRWxlbWVudFxuXHRcdFx0aWYgKGZvcm0pIHJldHVybiBmb3JtXG5cdFx0fVxuXG5cdFx0cmV0dXJuIG51bGxcblx0fVxufVxuIiwiaW1wb3J0IHR5cGUgeyBKb2JEYXRhIH0gZnJvbSAnQC90eXBlcyc7XG5pbXBvcnQgeyBHcmVlbmhvdXNlRGV0ZWN0b3IgfSBmcm9tICdAL2V4dHJhY3RvcnMvZ3JlZW5ob3VzZSc7XG5cbmNvbnN0IEZMT0FUSU5HX0JUTl9JRCA9ICdqb2JvcmFjbGUtZmFiJztcbmNvbnN0IFBPUFVQX0lEID0gJ2pvYm9yYWNsZS1wb3B1cCc7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbnRlbnRTY3JpcHQoe1xuICBtYXRjaGVzOiBbXG4gICAgJyo6Ly8qLmdyZWVuaG91c2UuaW8vKicsXG4gICAgJyo6Ly9ib2FyZHMuZ3JlZW5ob3VzZS5pby8qJyxcbiAgICAnKjovL2pvYi1ib2FyZHMuZ3JlZW5ob3VzZS5pby8qJyxcbiAgICAnKjovLyoubGV2ZXIuY28vKicsXG4gICAgJyo6Ly9qb2JzLmxldmVyLmNvLyonLFxuICAgICcqOi8vKi53b3JrZGF5LmNvbS8qJyxcbiAgICAnKjovLyoubXl3b3JrZGF5am9icy5jb20vKicsXG4gIF0sXG4gIG1haW4oKSB7XG4gICAgbGV0IHBvcHVwT3BlbiA9IGZhbHNlO1xuXG4gICAgZnVuY3Rpb24gaW5qZWN0U3R5bGVzKCkge1xuICAgICAgaWYgKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdqb2JvcmFjbGUtc3R5bGVzJykpIHJldHVybjtcbiAgICAgIGNvbnN0IHN0eWxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcbiAgICAgIHN0eWxlLmlkID0gJ2pvYm9yYWNsZS1zdHlsZXMnO1xuICAgICAgc3R5bGUudGV4dENvbnRlbnQgPSBgXG4gICAgICAgICMke0ZMT0FUSU5HX0JUTl9JRH0ge1xuICAgICAgICAgIHBvc2l0aW9uOiBmaXhlZDtcbiAgICAgICAgICB0b3A6IDUwJTtcbiAgICAgICAgICByaWdodDogMDtcbiAgICAgICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVkoLTUwJSk7XG4gICAgICAgICAgei1pbmRleDogMjE0NzQ4MzY0NztcbiAgICAgICAgICB3aWR0aDogMzZweDtcbiAgICAgICAgICBoZWlnaHQ6IDY0cHg7XG4gICAgICAgICAgYm9yZGVyLXJhZGl1czogMTJweCAwIDAgMTJweDtcbiAgICAgICAgICBib3JkZXI6IG5vbmU7XG4gICAgICAgICAgYmFja2dyb3VuZDogb2tsY2goMC40NTcgMC4yNCAyNzcuMDIzKTtcbiAgICAgICAgICBjb2xvcjogd2hpdGU7XG4gICAgICAgICAgY3Vyc29yOiBwb2ludGVyO1xuICAgICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbiAgICAgICAgICBib3gtc2hhZG93OiAtNHB4IDAgMTZweCBva2xjaCgwLjQ1NyAwLjI0IDI3Ny4wMjMgLyAwLjM1KSwgMCAxcHggM3B4IHJnYmEoMCwwLDAsMC4xNSk7XG4gICAgICAgICAgZm9udC1mYW1pbHk6ICdJbnRlcicsIHN5c3RlbS11aSwgc2Fucy1zZXJpZjtcbiAgICAgICAgICBmb250LXNpemU6IDExcHg7XG4gICAgICAgICAgZm9udC13ZWlnaHQ6IDcwMDtcbiAgICAgICAgICBsZXR0ZXItc3BhY2luZzogLTAuMDJlbTtcbiAgICAgICAgICB3cml0aW5nLW1vZGU6IHZlcnRpY2FsLXJsO1xuICAgICAgICAgIHRleHQtb3JpZW50YXRpb246IG1peGVkO1xuICAgICAgICAgIHRyYW5zaXRpb246IHdpZHRoIDAuMTVzIGVhc2UsIGJveC1zaGFkb3cgMC4ycyBlYXNlO1xuICAgICAgICAgIGFuaW1hdGlvbjogam9iT3JhY2xlRmFiSW4gMC4zcyBjdWJpYy1iZXppZXIoMC4zNCwxLjU2LDAuNjQsMSkgYm90aDtcbiAgICAgICAgfVxuICAgICAgICAjJHtGTE9BVElOR19CVE5fSUR9OmhvdmVyIHtcbiAgICAgICAgICB3aWR0aDogNDRweDtcbiAgICAgICAgICBib3gtc2hhZG93OiAtNnB4IDAgMjRweCBva2xjaCgwLjQ1NyAwLjI0IDI3Ny4wMjMgLyAwLjQ1KSwgMCAycHggNnB4IHJnYmEoMCwwLDAsMC4yKTtcbiAgICAgICAgfVxuICAgICAgICAjJHtGTE9BVElOR19CVE5fSUR9OmFjdGl2ZSB7XG4gICAgICAgICAgd2lkdGg6IDM0cHg7XG4gICAgICAgIH1cbiAgICAgICAgQGtleWZyYW1lcyBqb2JPcmFjbGVGYWJJbiB7XG4gICAgICAgICAgZnJvbSB7IG9wYWNpdHk6IDA7IHRyYW5zZm9ybTogdHJhbnNsYXRlWSgtNTAlKSB0cmFuc2xhdGVYKDEwMCUpOyB9XG4gICAgICAgICAgdG8geyBvcGFjaXR5OiAxOyB0cmFuc2Zvcm06IHRyYW5zbGF0ZVkoLTUwJSkgdHJhbnNsYXRlWCgwKTsgfVxuICAgICAgICB9XG4gICAgICAgICMke1BPUFVQX0lEfSB7XG4gICAgICAgICAgcG9zaXRpb246IGZpeGVkO1xuICAgICAgICAgIHRvcDogNTAlO1xuICAgICAgICAgIHJpZ2h0OiA0MHB4O1xuICAgICAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlWSgtNTAlKTtcbiAgICAgICAgICB6LWluZGV4OiAyMTQ3NDgzNjQ2O1xuICAgICAgICAgIHdpZHRoOiA0NTBweDtcbiAgICAgICAgICBoZWlnaHQ6IDU1MHB4O1xuICAgICAgICAgIGJvcmRlcjogbm9uZTtcbiAgICAgICAgICBib3JkZXItcmFkaXVzOiAxNnB4O1xuICAgICAgICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgICAgICAgYmFja2dyb3VuZDogd2hpdGU7XG4gICAgICAgICAgYm94LXNoYWRvdzogMCA4cHggNDBweCByZ2JhKDAsMCwwLDAuMTIpLCAwIDJweCA4cHggcmdiYSgwLDAsMCwwLjA2KTtcbiAgICAgICAgICBhbmltYXRpb246IGpvYk9yYWNsZVBvcHVwSW4gMC4yNXMgY3ViaWMtYmV6aWVyKDAuMjIsMSwwLjM2LDEpIGJvdGg7XG4gICAgICAgIH1cbiAgICAgICAgIyR7UE9QVVBfSUR9LW92ZXJsYXkge1xuICAgICAgICAgIHBvc2l0aW9uOiBmaXhlZDtcbiAgICAgICAgICBpbnNldDogMDtcbiAgICAgICAgICB6LWluZGV4OiAyMTQ3NDgzNjQ1O1xuICAgICAgICAgIGJhY2tncm91bmQ6IHJnYmEoMCwwLDAsMC4xNSk7XG4gICAgICAgICAgYW5pbWF0aW9uOiBqb2JPcmFjbGVPdmVybGF5SW4gMC4ycyBlYXNlIGJvdGg7XG4gICAgICAgIH1cbiAgICAgICAgQGtleWZyYW1lcyBqb2JPcmFjbGVQb3B1cEluIHtcbiAgICAgICAgICBmcm9tIHsgb3BhY2l0eTogMDsgdHJhbnNmb3JtOiB0cmFuc2xhdGVZKC01MCUpIHNjYWxlKDAuOTUpOyB9XG4gICAgICAgICAgdG8geyBvcGFjaXR5OiAxOyB0cmFuc2Zvcm06IHRyYW5zbGF0ZVkoLTUwJSkgc2NhbGUoMSk7IH1cbiAgICAgICAgfVxuICAgICAgICBAa2V5ZnJhbWVzIGpvYk9yYWNsZU92ZXJsYXlJbiB7XG4gICAgICAgICAgZnJvbSB7IG9wYWNpdHk6IDA7IH1cbiAgICAgICAgICB0byB7IG9wYWNpdHk6IDE7IH1cbiAgICAgICAgfVxuICAgICAgICAuam9ib3JhY2xlLXBvcHVwLWNsb3Npbmcge1xuICAgICAgICAgIGFuaW1hdGlvbjogam9iT3JhY2xlUG9wdXBPdXQgMC4xNXMgY3ViaWMtYmV6aWVyKDAuMjIsMSwwLjM2LDEpIGJvdGggIWltcG9ydGFudDtcbiAgICAgICAgfVxuICAgICAgICAuam9ib3JhY2xlLW92ZXJsYXktY2xvc2luZyB7XG4gICAgICAgICAgYW5pbWF0aW9uOiBqb2JPcmFjbGVPdmVybGF5T3V0IDAuMTVzIGVhc2UgYm90aCAhaW1wb3J0YW50O1xuICAgICAgICB9XG4gICAgICAgIEBrZXlmcmFtZXMgam9iT3JhY2xlUG9wdXBPdXQge1xuICAgICAgICAgIGZyb20geyBvcGFjaXR5OiAxOyB0cmFuc2Zvcm06IHRyYW5zbGF0ZVkoLTUwJSkgc2NhbGUoMSk7IH1cbiAgICAgICAgICB0byB7IG9wYWNpdHk6IDA7IHRyYW5zZm9ybTogdHJhbnNsYXRlWSgtNTAlKSBzY2FsZSgwLjk1KTsgfVxuICAgICAgICB9XG4gICAgICAgIEBrZXlmcmFtZXMgam9iT3JhY2xlT3ZlcmxheU91dCB7XG4gICAgICAgICAgZnJvbSB7IG9wYWNpdHk6IDE7IH1cbiAgICAgICAgICB0byB7IG9wYWNpdHk6IDA7IH1cbiAgICAgICAgfVxuICAgICAgYDtcbiAgICAgIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoc3R5bGUpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNyZWF0ZUZsb2F0aW5nQnV0dG9uKCkge1xuICAgICAgaWYgKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKEZMT0FUSU5HX0JUTl9JRCkpIHJldHVybjtcblxuICAgICAgY29uc3QgYnRuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnV0dG9uJyk7XG4gICAgICBidG4uaWQgPSBGTE9BVElOR19CVE5fSUQ7XG4gICAgICBidG4udGl0bGUgPSAnT3BlbiBKb2JPcmFjbGUnO1xuICAgICAgYnRuLnRleHRDb250ZW50ID0gJ0pPJztcbiAgICAgIGJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRvZ2dsZVBvcHVwKTtcbiAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoYnRuKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB0b2dnbGVQb3B1cCgpIHtcbiAgICAgIGlmIChwb3B1cE9wZW4pIHtcbiAgICAgICAgY2xvc2VQb3B1cCgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgb3BlblBvcHVwKCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gb3BlblBvcHVwKCkge1xuICAgICAgaWYgKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFBPUFVQX0lEKSkgcmV0dXJuO1xuXG4gICAgICBjb25zdCBvdmVybGF5ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICBvdmVybGF5LmlkID0gYCR7UE9QVVBfSUR9LW92ZXJsYXlgO1xuICAgICAgb3ZlcmxheS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGNsb3NlUG9wdXApO1xuICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChvdmVybGF5KTtcblxuICAgICAgY29uc3QgaWZyYW1lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaWZyYW1lJyk7XG4gICAgICBpZnJhbWUuaWQgPSBQT1BVUF9JRDtcbiAgICAgIGlmcmFtZS5zcmMgPSBicm93c2VyLnJ1bnRpbWUuZ2V0VVJMKCcvcG9wdXAuaHRtbCcpO1xuICAgICAgaWZyYW1lLmFsbG93ID0gJ2NsaXBib2FyZC13cml0ZSc7XG4gICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGlmcmFtZSk7XG4gICAgICBwb3B1cE9wZW4gPSB0cnVlO1xuXG4gICAgICBjb25zdCBmYWIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChGTE9BVElOR19CVE5fSUQpO1xuICAgICAgaWYgKGZhYikge1xuICAgICAgICBmYWIuc3R5bGUuYmFja2dyb3VuZCA9ICdva2xjaCgwLjM5OCAwLjE5NSAyNzcuMzY2KSc7XG4gICAgICAgIGZhYi5zdHlsZS53aWR0aCA9ICc2cHgnO1xuICAgICAgICBmYWIuc3R5bGUuYm9yZGVyUmFkaXVzID0gJzZweCAwIDAgNnB4JztcbiAgICAgICAgZmFiLnRpdGxlID0gJ0Nsb3NlIEpvYk9yYWNsZSc7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY2xvc2VQb3B1cCgpIHtcbiAgICAgIGNvbnN0IHBvcHVwID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoUE9QVVBfSUQpO1xuICAgICAgY29uc3Qgb3ZlcmxheSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGAke1BPUFVQX0lEfS1vdmVybGF5YCk7XG4gICAgICBpZiAocG9wdXApIHtcbiAgICAgICAgcG9wdXAuY2xhc3NMaXN0LmFkZCgnam9ib3JhY2xlLXBvcHVwLWNsb3NpbmcnKTtcbiAgICAgICAgcG9wdXAuYWRkRXZlbnRMaXN0ZW5lcignYW5pbWF0aW9uZW5kJywgKCkgPT4gcG9wdXAucmVtb3ZlKCksIHsgb25jZTogdHJ1ZSB9KTtcbiAgICAgIH1cbiAgICAgIGlmIChvdmVybGF5KSB7XG4gICAgICAgIG92ZXJsYXkuY2xhc3NMaXN0LmFkZCgnam9ib3JhY2xlLW92ZXJsYXktY2xvc2luZycpO1xuICAgICAgICBvdmVybGF5LmFkZEV2ZW50TGlzdGVuZXIoJ2FuaW1hdGlvbmVuZCcsICgpID0+IG92ZXJsYXkucmVtb3ZlKCksIHsgb25jZTogdHJ1ZSB9KTtcbiAgICAgIH1cbiAgICAgIHBvcHVwT3BlbiA9IGZhbHNlO1xuXG4gICAgICBjb25zdCBmYWIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChGTE9BVElOR19CVE5fSUQpO1xuICAgICAgaWYgKGZhYikge1xuICAgICAgICBmYWIuc3R5bGUuYmFja2dyb3VuZCA9ICdva2xjaCgwLjQ1NyAwLjI0IDI3Ny4wMjMpJztcbiAgICAgICAgZmFiLnN0eWxlLndpZHRoID0gJyc7XG4gICAgICAgIGZhYi5zdHlsZS5ib3JkZXJSYWRpdXMgPSAnJztcbiAgICAgICAgZmFiLnRpdGxlID0gJ09wZW4gSm9iT3JhY2xlJztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkZXRlY3RBbmRTZW5kSm9iKCkge1xuICAgICAgbGV0IGpvYkRhdGE6IEpvYkRhdGEgfCBudWxsID0gbnVsbDtcblxuICAgICAgY29uc3QgdXJsID0gd2luZG93LmxvY2F0aW9uLmhyZWY7XG4gICAgICBpZiAoL2dyZWVuaG91c2VcXC5pby8udGVzdCh1cmwpKSB7XG4gICAgICAgIGpvYkRhdGEgPSBHcmVlbmhvdXNlRGV0ZWN0b3IuZXh0cmFjdEpvYkRhdGEoKTtcbiAgICAgIH1cblxuICAgICAgaWYgKGpvYkRhdGEpIHtcbiAgICAgICAgYnJvd3Nlci5ydW50aW1lLnNlbmRNZXNzYWdlKHsgdHlwZTogJ0pPQl9ERVRFQ1RFRCcsIGRhdGE6IGpvYkRhdGEgfSkuY2F0Y2goKCkgPT4ge30pO1xuICAgICAgfVxuICAgIH1cblxuICAgIGJyb3dzZXIucnVudGltZS5vbk1lc3NhZ2UuYWRkTGlzdGVuZXIoKG1lc3NhZ2UpID0+IHtcbiAgICAgIGlmIChtZXNzYWdlLnR5cGUgPT09ICdDSEVDS19GT1JfSk9CJykge1xuICAgICAgICBkZXRlY3RBbmRTZW5kSm9iKCk7XG4gICAgICB9XG4gICAgICBpZiAobWVzc2FnZS50eXBlID09PSAnQ0xPU0VfUE9QVVAnKSB7XG4gICAgICAgIGNsb3NlUG9wdXAoKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGluamVjdFN0eWxlcygpO1xuICAgIGNyZWF0ZUZsb2F0aW5nQnV0dG9uKCk7XG4gICAgZGV0ZWN0QW5kU2VuZEpvYigpO1xuICB9LFxufSk7IiwiLy8jcmVnaW9uIHNyYy91dGlscy9pbnRlcm5hbC9sb2dnZXIudHNcbmZ1bmN0aW9uIHByaW50KG1ldGhvZCwgLi4uYXJncykge1xuXHRpZiAoaW1wb3J0Lm1ldGEuZW52Lk1PREUgPT09IFwicHJvZHVjdGlvblwiKSByZXR1cm47XG5cdGlmICh0eXBlb2YgYXJnc1swXSA9PT0gXCJzdHJpbmdcIikgbWV0aG9kKGBbd3h0XSAke2FyZ3Muc2hpZnQoKX1gLCAuLi5hcmdzKTtcblx0ZWxzZSBtZXRob2QoXCJbd3h0XVwiLCAuLi5hcmdzKTtcbn1cbi8qKiBXcmFwcGVyIGFyb3VuZCBgY29uc29sZWAgd2l0aCBhIFwiW3d4dF1cIiBwcmVmaXggKi9cbmNvbnN0IGxvZ2dlciA9IHtcblx0ZGVidWc6ICguLi5hcmdzKSA9PiBwcmludChjb25zb2xlLmRlYnVnLCAuLi5hcmdzKSxcblx0bG9nOiAoLi4uYXJncykgPT4gcHJpbnQoY29uc29sZS5sb2csIC4uLmFyZ3MpLFxuXHR3YXJuOiAoLi4uYXJncykgPT4gcHJpbnQoY29uc29sZS53YXJuLCAuLi5hcmdzKSxcblx0ZXJyb3I6ICguLi5hcmdzKSA9PiBwcmludChjb25zb2xlLmVycm9yLCAuLi5hcmdzKVxufTtcbi8vI2VuZHJlZ2lvblxuZXhwb3J0IHsgbG9nZ2VyIH07XG4iLCJpbXBvcnQgeyBicm93c2VyIH0gZnJvbSBcInd4dC9icm93c2VyXCI7XG4vLyNyZWdpb24gc3JjL3V0aWxzL2ludGVybmFsL2N1c3RvbS1ldmVudHMudHNcbnZhciBXeHRMb2NhdGlvbkNoYW5nZUV2ZW50ID0gY2xhc3MgV3h0TG9jYXRpb25DaGFuZ2VFdmVudCBleHRlbmRzIEV2ZW50IHtcblx0c3RhdGljIEVWRU5UX05BTUUgPSBnZXRVbmlxdWVFdmVudE5hbWUoXCJ3eHQ6bG9jYXRpb25jaGFuZ2VcIik7XG5cdGNvbnN0cnVjdG9yKG5ld1VybCwgb2xkVXJsKSB7XG5cdFx0c3VwZXIoV3h0TG9jYXRpb25DaGFuZ2VFdmVudC5FVkVOVF9OQU1FLCB7fSk7XG5cdFx0dGhpcy5uZXdVcmwgPSBuZXdVcmw7XG5cdFx0dGhpcy5vbGRVcmwgPSBvbGRVcmw7XG5cdH1cbn07XG4vKipcbiogUmV0dXJucyBhbiBldmVudCBuYW1lIHVuaXF1ZSB0byB0aGUgZXh0ZW5zaW9uIGFuZCBjb250ZW50IHNjcmlwdCB0aGF0J3NcbiogcnVubmluZy5cbiovXG5mdW5jdGlvbiBnZXRVbmlxdWVFdmVudE5hbWUoZXZlbnROYW1lKSB7XG5cdHJldHVybiBgJHticm93c2VyPy5ydW50aW1lPy5pZH06JHtpbXBvcnQubWV0YS5lbnYuRU5UUllQT0lOVH06JHtldmVudE5hbWV9YDtcbn1cbi8vI2VuZHJlZ2lvblxuZXhwb3J0IHsgV3h0TG9jYXRpb25DaGFuZ2VFdmVudCwgZ2V0VW5pcXVlRXZlbnROYW1lIH07XG4iLCJpbXBvcnQgeyBXeHRMb2NhdGlvbkNoYW5nZUV2ZW50IH0gZnJvbSBcIi4vY3VzdG9tLWV2ZW50cy5tanNcIjtcbi8vI3JlZ2lvbiBzcmMvdXRpbHMvaW50ZXJuYWwvbG9jYXRpb24td2F0Y2hlci50c1xuY29uc3Qgc3VwcG9ydHNOYXZpZ2F0aW9uQXBpID0gdHlwZW9mIGdsb2JhbFRoaXMubmF2aWdhdGlvbj8uYWRkRXZlbnRMaXN0ZW5lciA9PT0gXCJmdW5jdGlvblwiO1xuLyoqXG4qIENyZWF0ZSBhIHV0aWwgdGhhdCB3YXRjaGVzIGZvciBVUkwgY2hhbmdlcywgZGlzcGF0Y2hpbmcgdGhlIGN1c3RvbSBldmVudCB3aGVuXG4qIGRldGVjdGVkLiBTdG9wcyB3YXRjaGluZyB3aGVuIGNvbnRlbnQgc2NyaXB0IGlzIGludmFsaWRhdGVkLiBVc2VzIE5hdmlnYXRpb25cbiogQVBJIHdoZW4gYXZhaWxhYmxlLCBvdGhlcndpc2UgZmFsbHMgYmFjayB0byBwb2xsaW5nLlxuKi9cbmZ1bmN0aW9uIGNyZWF0ZUxvY2F0aW9uV2F0Y2hlcihjdHgpIHtcblx0bGV0IGxhc3RVcmw7XG5cdGxldCB3YXRjaGluZyA9IGZhbHNlO1xuXHRyZXR1cm4geyBydW4oKSB7XG5cdFx0aWYgKHdhdGNoaW5nKSByZXR1cm47XG5cdFx0d2F0Y2hpbmcgPSB0cnVlO1xuXHRcdGxhc3RVcmwgPSBuZXcgVVJMKGxvY2F0aW9uLmhyZWYpO1xuXHRcdGlmIChzdXBwb3J0c05hdmlnYXRpb25BcGkpIGdsb2JhbFRoaXMubmF2aWdhdGlvbi5hZGRFdmVudExpc3RlbmVyKFwibmF2aWdhdGVcIiwgKGV2ZW50KSA9PiB7XG5cdFx0XHRjb25zdCBuZXdVcmwgPSBuZXcgVVJMKGV2ZW50LmRlc3RpbmF0aW9uLnVybCk7XG5cdFx0XHRpZiAobmV3VXJsLmhyZWYgPT09IGxhc3RVcmwuaHJlZikgcmV0dXJuO1xuXHRcdFx0d2luZG93LmRpc3BhdGNoRXZlbnQobmV3IFd4dExvY2F0aW9uQ2hhbmdlRXZlbnQobmV3VXJsLCBsYXN0VXJsKSk7XG5cdFx0XHRsYXN0VXJsID0gbmV3VXJsO1xuXHRcdH0sIHsgc2lnbmFsOiBjdHguc2lnbmFsIH0pO1xuXHRcdGVsc2UgY3R4LnNldEludGVydmFsKCgpID0+IHtcblx0XHRcdGNvbnN0IG5ld1VybCA9IG5ldyBVUkwobG9jYXRpb24uaHJlZik7XG5cdFx0XHRpZiAobmV3VXJsLmhyZWYgIT09IGxhc3RVcmwuaHJlZikge1xuXHRcdFx0XHR3aW5kb3cuZGlzcGF0Y2hFdmVudChuZXcgV3h0TG9jYXRpb25DaGFuZ2VFdmVudChuZXdVcmwsIGxhc3RVcmwpKTtcblx0XHRcdFx0bGFzdFVybCA9IG5ld1VybDtcblx0XHRcdH1cblx0XHR9LCAxZTMpO1xuXHR9IH07XG59XG4vLyNlbmRyZWdpb25cbmV4cG9ydCB7IGNyZWF0ZUxvY2F0aW9uV2F0Y2hlciB9O1xuIiwiaW1wb3J0IHsgbG9nZ2VyIH0gZnJvbSBcIi4vaW50ZXJuYWwvbG9nZ2VyLm1qc1wiO1xuaW1wb3J0IHsgZ2V0VW5pcXVlRXZlbnROYW1lIH0gZnJvbSBcIi4vaW50ZXJuYWwvY3VzdG9tLWV2ZW50cy5tanNcIjtcbmltcG9ydCB7IGNyZWF0ZUxvY2F0aW9uV2F0Y2hlciB9IGZyb20gXCIuL2ludGVybmFsL2xvY2F0aW9uLXdhdGNoZXIubWpzXCI7XG5pbXBvcnQgeyBicm93c2VyIH0gZnJvbSBcInd4dC9icm93c2VyXCI7XG4vLyNyZWdpb24gc3JjL3V0aWxzL2NvbnRlbnQtc2NyaXB0LWNvbnRleHQudHNcbi8qKlxuKiBJbXBsZW1lbnRzXG4qIFtgQWJvcnRDb250cm9sbGVyYF0oaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0Fib3J0Q29udHJvbGxlcikuXG4qIFVzZWQgdG8gZGV0ZWN0IGFuZCBzdG9wIGNvbnRlbnQgc2NyaXB0IGNvZGUgd2hlbiB0aGUgc2NyaXB0IGlzIGludmFsaWRhdGVkLlxuKlxuKiBJdCBhbHNvIHByb3ZpZGVzIHNldmVyYWwgdXRpbGl0aWVzIGxpa2UgYGN0eC5zZXRUaW1lb3V0YCBhbmRcbiogYGN0eC5zZXRJbnRlcnZhbGAgdGhhdCBzaG91bGQgYmUgdXNlZCBpbiBjb250ZW50IHNjcmlwdHMgaW5zdGVhZCBvZlxuKiBgd2luZG93LnNldFRpbWVvdXRgIG9yIGB3aW5kb3cuc2V0SW50ZXJ2YWxgLlxuKlxuKiBUbyBjcmVhdGUgY29udGV4dCBmb3IgdGVzdGluZywgeW91IGNhbiB1c2UgdGhlIGNsYXNzJ3MgY29uc3RydWN0b3I6XG4qXG4qIGBgYHRzXG4qIGltcG9ydCB7IENvbnRlbnRTY3JpcHRDb250ZXh0IH0gZnJvbSAnd3h0L3V0aWxzL2NvbnRlbnQtc2NyaXB0cy1jb250ZXh0JztcbipcbiogdGVzdCgnc3RvcmFnZSBsaXN0ZW5lciBzaG91bGQgYmUgcmVtb3ZlZCB3aGVuIGNvbnRleHQgaXMgaW52YWxpZGF0ZWQnLCAoKSA9PiB7XG4qICAgY29uc3QgY3R4ID0gbmV3IENvbnRlbnRTY3JpcHRDb250ZXh0KCd0ZXN0Jyk7XG4qICAgY29uc3QgaXRlbSA9IHN0b3JhZ2UuZGVmaW5lSXRlbSgnbG9jYWw6Y291bnQnLCB7IGRlZmF1bHRWYWx1ZTogMCB9KTtcbiogICBjb25zdCB3YXRjaGVyID0gdmkuZm4oKTtcbipcbiogICBjb25zdCB1bndhdGNoID0gaXRlbS53YXRjaCh3YXRjaGVyKTtcbiogICBjdHgub25JbnZhbGlkYXRlZCh1bndhdGNoKTsgLy8gTGlzdGVuIGZvciBpbnZhbGlkYXRlIGhlcmVcbipcbiogICBhd2FpdCBpdGVtLnNldFZhbHVlKDEpO1xuKiAgIGV4cGVjdCh3YXRjaGVyKS50b0JlQ2FsbGVkVGltZXMoMSk7XG4qICAgZXhwZWN0KHdhdGNoZXIpLnRvQmVDYWxsZWRXaXRoKDEsIDApO1xuKlxuKiAgIGN0eC5ub3RpZnlJbnZhbGlkYXRlZCgpOyAvLyBVc2UgdGhpcyBmdW5jdGlvbiB0byBpbnZhbGlkYXRlIHRoZSBjb250ZXh0XG4qICAgYXdhaXQgaXRlbS5zZXRWYWx1ZSgyKTtcbiogICBleHBlY3Qod2F0Y2hlcikudG9CZUNhbGxlZFRpbWVzKDEpO1xuKiB9KTtcbiogYGBgXG4qL1xudmFyIENvbnRlbnRTY3JpcHRDb250ZXh0ID0gY2xhc3MgQ29udGVudFNjcmlwdENvbnRleHQge1xuXHRzdGF0aWMgU0NSSVBUX1NUQVJURURfTUVTU0FHRV9UWVBFID0gZ2V0VW5pcXVlRXZlbnROYW1lKFwid3h0OmNvbnRlbnQtc2NyaXB0LXN0YXJ0ZWRcIik7XG5cdGlkO1xuXHRhYm9ydENvbnRyb2xsZXI7XG5cdGxvY2F0aW9uV2F0Y2hlciA9IGNyZWF0ZUxvY2F0aW9uV2F0Y2hlcih0aGlzKTtcblx0Y29uc3RydWN0b3IoY29udGVudFNjcmlwdE5hbWUsIG9wdGlvbnMpIHtcblx0XHR0aGlzLmNvbnRlbnRTY3JpcHROYW1lID0gY29udGVudFNjcmlwdE5hbWU7XG5cdFx0dGhpcy5vcHRpb25zID0gb3B0aW9ucztcblx0XHR0aGlzLmlkID0gTWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc2xpY2UoMik7XG5cdFx0dGhpcy5hYm9ydENvbnRyb2xsZXIgPSBuZXcgQWJvcnRDb250cm9sbGVyKCk7XG5cdFx0dGhpcy5zdG9wT2xkU2NyaXB0cygpO1xuXHRcdHRoaXMubGlzdGVuRm9yTmV3ZXJTY3JpcHRzKCk7XG5cdH1cblx0Z2V0IHNpZ25hbCgpIHtcblx0XHRyZXR1cm4gdGhpcy5hYm9ydENvbnRyb2xsZXIuc2lnbmFsO1xuXHR9XG5cdGFib3J0KHJlYXNvbikge1xuXHRcdHJldHVybiB0aGlzLmFib3J0Q29udHJvbGxlci5hYm9ydChyZWFzb24pO1xuXHR9XG5cdGdldCBpc0ludmFsaWQoKSB7XG5cdFx0aWYgKGJyb3dzZXIucnVudGltZT8uaWQgPT0gbnVsbCkgdGhpcy5ub3RpZnlJbnZhbGlkYXRlZCgpO1xuXHRcdHJldHVybiB0aGlzLnNpZ25hbC5hYm9ydGVkO1xuXHR9XG5cdGdldCBpc1ZhbGlkKCkge1xuXHRcdHJldHVybiAhdGhpcy5pc0ludmFsaWQ7XG5cdH1cblx0LyoqXG5cdCogQWRkIGEgbGlzdGVuZXIgdGhhdCBpcyBjYWxsZWQgd2hlbiB0aGUgY29udGVudCBzY3JpcHQncyBjb250ZXh0IGlzXG5cdCogaW52YWxpZGF0ZWQuXG5cdCpcblx0KiBAZXhhbXBsZVxuXHQqICAgYnJvd3Nlci5ydW50aW1lLm9uTWVzc2FnZS5hZGRMaXN0ZW5lcihjYik7XG5cdCogICBjb25zdCByZW1vdmVJbnZhbGlkYXRlZExpc3RlbmVyID0gY3R4Lm9uSW52YWxpZGF0ZWQoKCkgPT4ge1xuXHQqICAgICBicm93c2VyLnJ1bnRpbWUub25NZXNzYWdlLnJlbW92ZUxpc3RlbmVyKGNiKTtcblx0KiAgIH0pO1xuXHQqICAgLy8gLi4uXG5cdCogICByZW1vdmVJbnZhbGlkYXRlZExpc3RlbmVyKCk7XG5cdCpcblx0KiBAcmV0dXJucyBBIGZ1bmN0aW9uIHRvIHJlbW92ZSB0aGUgbGlzdGVuZXIuXG5cdCovXG5cdG9uSW52YWxpZGF0ZWQoY2IpIHtcblx0XHR0aGlzLnNpZ25hbC5hZGRFdmVudExpc3RlbmVyKFwiYWJvcnRcIiwgY2IpO1xuXHRcdHJldHVybiAoKSA9PiB0aGlzLnNpZ25hbC5yZW1vdmVFdmVudExpc3RlbmVyKFwiYWJvcnRcIiwgY2IpO1xuXHR9XG5cdC8qKlxuXHQqIFJldHVybiBhIHByb21pc2UgdGhhdCBuZXZlciByZXNvbHZlcy4gVXNlZnVsIGlmIHlvdSBoYXZlIGFuIGFzeW5jIGZ1bmN0aW9uXG5cdCogdGhhdCBzaG91bGRuJ3QgcnVuIGFmdGVyIHRoZSBjb250ZXh0IGlzIGV4cGlyZWQuXG5cdCpcblx0KiBAZXhhbXBsZVxuXHQqICAgY29uc3QgZ2V0VmFsdWVGcm9tU3RvcmFnZSA9IGFzeW5jICgpID0+IHtcblx0KiAgICAgaWYgKGN0eC5pc0ludmFsaWQpIHJldHVybiBjdHguYmxvY2soKTtcblx0KlxuXHQqICAgICAvLyAuLi5cblx0KiAgIH07XG5cdCovXG5cdGJsb2NrKCkge1xuXHRcdHJldHVybiBuZXcgUHJvbWlzZSgoKSA9PiB7fSk7XG5cdH1cblx0LyoqXG5cdCogV3JhcHBlciBhcm91bmQgYHdpbmRvdy5zZXRJbnRlcnZhbGAgdGhhdCBhdXRvbWF0aWNhbGx5IGNsZWFycyB0aGUgaW50ZXJ2YWxcblx0KiB3aGVuIGludmFsaWRhdGVkLlxuXHQqXG5cdCogSW50ZXJ2YWxzIGNhbiBiZSBjbGVhcmVkIGJ5IGNhbGxpbmcgdGhlIG5vcm1hbCBgY2xlYXJJbnRlcnZhbGAgZnVuY3Rpb24uXG5cdCovXG5cdHNldEludGVydmFsKGhhbmRsZXIsIHRpbWVvdXQpIHtcblx0XHRjb25zdCBpZCA9IHNldEludGVydmFsKCgpID0+IHtcblx0XHRcdGlmICh0aGlzLmlzVmFsaWQpIGhhbmRsZXIoKTtcblx0XHR9LCB0aW1lb3V0KTtcblx0XHR0aGlzLm9uSW52YWxpZGF0ZWQoKCkgPT4gY2xlYXJJbnRlcnZhbChpZCkpO1xuXHRcdHJldHVybiBpZDtcblx0fVxuXHQvKipcblx0KiBXcmFwcGVyIGFyb3VuZCBgd2luZG93LnNldFRpbWVvdXRgIHRoYXQgYXV0b21hdGljYWxseSBjbGVhcnMgdGhlIGludGVydmFsXG5cdCogd2hlbiBpbnZhbGlkYXRlZC5cblx0KlxuXHQqIFRpbWVvdXRzIGNhbiBiZSBjbGVhcmVkIGJ5IGNhbGxpbmcgdGhlIG5vcm1hbCBgc2V0VGltZW91dGAgZnVuY3Rpb24uXG5cdCovXG5cdHNldFRpbWVvdXQoaGFuZGxlciwgdGltZW91dCkge1xuXHRcdGNvbnN0IGlkID0gc2V0VGltZW91dCgoKSA9PiB7XG5cdFx0XHRpZiAodGhpcy5pc1ZhbGlkKSBoYW5kbGVyKCk7XG5cdFx0fSwgdGltZW91dCk7XG5cdFx0dGhpcy5vbkludmFsaWRhdGVkKCgpID0+IGNsZWFyVGltZW91dChpZCkpO1xuXHRcdHJldHVybiBpZDtcblx0fVxuXHQvKipcblx0KiBXcmFwcGVyIGFyb3VuZCBgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZWAgdGhhdCBhdXRvbWF0aWNhbGx5IGNhbmNlbHNcblx0KiB0aGUgcmVxdWVzdCB3aGVuIGludmFsaWRhdGVkLlxuXHQqXG5cdCogQ2FsbGJhY2tzIGNhbiBiZSBjYW5jZWxlZCBieSBjYWxsaW5nIHRoZSBub3JtYWwgYGNhbmNlbEFuaW1hdGlvbkZyYW1lYFxuXHQqIGZ1bmN0aW9uLlxuXHQqL1xuXHRyZXF1ZXN0QW5pbWF0aW9uRnJhbWUoY2FsbGJhY2spIHtcblx0XHRjb25zdCBpZCA9IHJlcXVlc3RBbmltYXRpb25GcmFtZSgoLi4uYXJncykgPT4ge1xuXHRcdFx0aWYgKHRoaXMuaXNWYWxpZCkgY2FsbGJhY2soLi4uYXJncyk7XG5cdFx0fSk7XG5cdFx0dGhpcy5vbkludmFsaWRhdGVkKCgpID0+IGNhbmNlbEFuaW1hdGlvbkZyYW1lKGlkKSk7XG5cdFx0cmV0dXJuIGlkO1xuXHR9XG5cdC8qKlxuXHQqIFdyYXBwZXIgYXJvdW5kIGB3aW5kb3cucmVxdWVzdElkbGVDYWxsYmFja2AgdGhhdCBhdXRvbWF0aWNhbGx5IGNhbmNlbHMgdGhlXG5cdCogcmVxdWVzdCB3aGVuIGludmFsaWRhdGVkLlxuXHQqXG5cdCogQ2FsbGJhY2tzIGNhbiBiZSBjYW5jZWxlZCBieSBjYWxsaW5nIHRoZSBub3JtYWwgYGNhbmNlbElkbGVDYWxsYmFja2Bcblx0KiBmdW5jdGlvbi5cblx0Ki9cblx0cmVxdWVzdElkbGVDYWxsYmFjayhjYWxsYmFjaywgb3B0aW9ucykge1xuXHRcdGNvbnN0IGlkID0gcmVxdWVzdElkbGVDYWxsYmFjaygoLi4uYXJncykgPT4ge1xuXHRcdFx0aWYgKCF0aGlzLnNpZ25hbC5hYm9ydGVkKSBjYWxsYmFjayguLi5hcmdzKTtcblx0XHR9LCBvcHRpb25zKTtcblx0XHR0aGlzLm9uSW52YWxpZGF0ZWQoKCkgPT4gY2FuY2VsSWRsZUNhbGxiYWNrKGlkKSk7XG5cdFx0cmV0dXJuIGlkO1xuXHR9XG5cdGFkZEV2ZW50TGlzdGVuZXIodGFyZ2V0LCB0eXBlLCBoYW5kbGVyLCBvcHRpb25zKSB7XG5cdFx0aWYgKHR5cGUgPT09IFwid3h0OmxvY2F0aW9uY2hhbmdlXCIpIHtcblx0XHRcdGlmICh0aGlzLmlzVmFsaWQpIHRoaXMubG9jYXRpb25XYXRjaGVyLnJ1bigpO1xuXHRcdH1cblx0XHR0YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcj8uKHR5cGUuc3RhcnRzV2l0aChcInd4dDpcIikgPyBnZXRVbmlxdWVFdmVudE5hbWUodHlwZSkgOiB0eXBlLCBoYW5kbGVyLCB7XG5cdFx0XHQuLi5vcHRpb25zLFxuXHRcdFx0c2lnbmFsOiB0aGlzLnNpZ25hbFxuXHRcdH0pO1xuXHR9XG5cdC8qKlxuXHQqIEBpbnRlcm5hbFxuXHQqIEFib3J0IHRoZSBhYm9ydCBjb250cm9sbGVyIGFuZCBleGVjdXRlIGFsbCBgb25JbnZhbGlkYXRlZGAgbGlzdGVuZXJzLlxuXHQqL1xuXHRub3RpZnlJbnZhbGlkYXRlZCgpIHtcblx0XHR0aGlzLmFib3J0KFwiQ29udGVudCBzY3JpcHQgY29udGV4dCBpbnZhbGlkYXRlZFwiKTtcblx0XHRsb2dnZXIuZGVidWcoYENvbnRlbnQgc2NyaXB0IFwiJHt0aGlzLmNvbnRlbnRTY3JpcHROYW1lfVwiIGNvbnRleHQgaW52YWxpZGF0ZWRgKTtcblx0fVxuXHRzdG9wT2xkU2NyaXB0cygpIHtcblx0XHRkb2N1bWVudC5kaXNwYXRjaEV2ZW50KG5ldyBDdXN0b21FdmVudChDb250ZW50U2NyaXB0Q29udGV4dC5TQ1JJUFRfU1RBUlRFRF9NRVNTQUdFX1RZUEUsIHsgZGV0YWlsOiB7XG5cdFx0XHRjb250ZW50U2NyaXB0TmFtZTogdGhpcy5jb250ZW50U2NyaXB0TmFtZSxcblx0XHRcdG1lc3NhZ2VJZDogdGhpcy5pZFxuXHRcdH0gfSkpO1xuXHRcdHdpbmRvdy5wb3N0TWVzc2FnZSh7XG5cdFx0XHR0eXBlOiBDb250ZW50U2NyaXB0Q29udGV4dC5TQ1JJUFRfU1RBUlRFRF9NRVNTQUdFX1RZUEUsXG5cdFx0XHRjb250ZW50U2NyaXB0TmFtZTogdGhpcy5jb250ZW50U2NyaXB0TmFtZSxcblx0XHRcdG1lc3NhZ2VJZDogdGhpcy5pZFxuXHRcdH0sIFwiKlwiKTtcblx0fVxuXHR2ZXJpZnlTY3JpcHRTdGFydGVkRXZlbnQoZXZlbnQpIHtcblx0XHRjb25zdCBpc1NhbWVDb250ZW50U2NyaXB0ID0gZXZlbnQuZGV0YWlsPy5jb250ZW50U2NyaXB0TmFtZSA9PT0gdGhpcy5jb250ZW50U2NyaXB0TmFtZTtcblx0XHRjb25zdCBpc0Zyb21TZWxmID0gZXZlbnQuZGV0YWlsPy5tZXNzYWdlSWQgPT09IHRoaXMuaWQ7XG5cdFx0cmV0dXJuIGlzU2FtZUNvbnRlbnRTY3JpcHQgJiYgIWlzRnJvbVNlbGY7XG5cdH1cblx0bGlzdGVuRm9yTmV3ZXJTY3JpcHRzKCkge1xuXHRcdGNvbnN0IGNiID0gKGV2ZW50KSA9PiB7XG5cdFx0XHRpZiAoIShldmVudCBpbnN0YW5jZW9mIEN1c3RvbUV2ZW50KSB8fCAhdGhpcy52ZXJpZnlTY3JpcHRTdGFydGVkRXZlbnQoZXZlbnQpKSByZXR1cm47XG5cdFx0XHR0aGlzLm5vdGlmeUludmFsaWRhdGVkKCk7XG5cdFx0fTtcblx0XHRkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKENvbnRlbnRTY3JpcHRDb250ZXh0LlNDUklQVF9TVEFSVEVEX01FU1NBR0VfVFlQRSwgY2IpO1xuXHRcdHRoaXMub25JbnZhbGlkYXRlZCgoKSA9PiBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKENvbnRlbnRTY3JpcHRDb250ZXh0LlNDUklQVF9TVEFSVEVEX01FU1NBR0VfVFlQRSwgY2IpKTtcblx0fVxufTtcbi8vI2VuZHJlZ2lvblxuZXhwb3J0IHsgQ29udGVudFNjcmlwdENvbnRleHQgfTtcbiJdLCJ4X2dvb2dsZV9pZ25vcmVMaXN0IjpbMCwxLDIsNSw2LDcsOF0sIm1hcHBpbmdzIjoiOztDQUNBLFNBQVMsb0JBQW9CLFlBQVk7QUFDeEMsU0FBTzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NFY1IsSUFBTSxVRGZpQixXQUFXLFNBQVMsU0FBUyxLQUNoRCxXQUFXLFVBQ1gsV0FBVzs7O0NFRGYsSUFBYSxxQkFBYixNQUFhLG1CQUFtQjtFQUUvQixPQUFPLHVCQUFnQztHQUN0QyxNQUFNLE1BQU0sT0FBTyxTQUFTO0FBSzVCLFVBSHNCLG1DQUdELEtBQUssSUFBSSxJQURULGlDQUMwQixLQUFLLElBQUk7O0VBR3pELE9BQU8sMkJBQTZFO0dBQ25GLE1BQU0sTUFBTSxJQUFJLElBQUksT0FBTyxTQUFTLEtBQUs7R0FDekMsSUFBSSxVQUFVO0dBQ2QsSUFBSSxRQUFRO0FBQ1osT0FBSSxpQ0FBaUMsS0FBSyxJQUFJLEtBQUssRUFBRTtBQUVwRCxjQUFVLElBQUksYUFBYSxJQUFJLE1BQU07QUFDckMsWUFBUSxJQUFJLGFBQWEsSUFBSSxRQUFRO1VBQy9CO0lBRU4sTUFBTSxZQUFZLElBQUksU0FBUyxNQUFNLElBQUk7QUFDekMs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