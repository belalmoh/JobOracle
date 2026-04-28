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
	var DISMISS_BTN_ID = "joboracle-dismiss";
	var WRAPPER_ID = "joboracle-fab-wrapper";
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
				return wrapper ? wrapper.getBoundingClientRect().top + wrapper.offsetHeight / 2 : window.innerHeight / 2;
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
				wrapper.addEventListener("animationend", () => wrapper.remove(), { once: true });
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGVudC5qcyIsIm5hbWVzIjpbImJyb3dzZXIiLCJwcmludCIsImxvZ2dlciJdLCJzb3VyY2VzIjpbIi4uLy4uLy4uL25vZGVfbW9kdWxlcy8ucG5wbS93eHRAMC4yMC4yNV9AdHlwZXMrbm9kZUAyNS42LjBfaml0aUAyLjYuMS9ub2RlX21vZHVsZXMvd3h0L2Rpc3QvdXRpbHMvZGVmaW5lLWNvbnRlbnQtc2NyaXB0Lm1qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy8ucG5wbS9Ad3h0LWRlditicm93c2VyQDAuMS40MC9ub2RlX21vZHVsZXMvQHd4dC1kZXYvYnJvd3Nlci9zcmMvaW5kZXgubWpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzLy5wbnBtL3d4dEAwLjIwLjI1X0B0eXBlcytub2RlQDI1LjYuMF9qaXRpQDIuNi4xL25vZGVfbW9kdWxlcy93eHQvZGlzdC9icm93c2VyLm1qcyIsIi4uLy4uLy4uL2V4dHJhY3RvcnMvZ3JlZW5ob3VzZS50cyIsIi4uLy4uLy4uL2VudHJ5cG9pbnRzL2NvbnRlbnQudHMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvLnBucG0vd3h0QDAuMjAuMjVfQHR5cGVzK25vZGVAMjUuNi4wX2ppdGlAMi42LjEvbm9kZV9tb2R1bGVzL3d4dC9kaXN0L3V0aWxzL2ludGVybmFsL2xvZ2dlci5tanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvLnBucG0vd3h0QDAuMjAuMjVfQHR5cGVzK25vZGVAMjUuNi4wX2ppdGlAMi42LjEvbm9kZV9tb2R1bGVzL3d4dC9kaXN0L3V0aWxzL2ludGVybmFsL2N1c3RvbS1ldmVudHMubWpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzLy5wbnBtL3d4dEAwLjIwLjI1X0B0eXBlcytub2RlQDI1LjYuMF9qaXRpQDIuNi4xL25vZGVfbW9kdWxlcy93eHQvZGlzdC91dGlscy9pbnRlcm5hbC9sb2NhdGlvbi13YXRjaGVyLm1qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy8ucG5wbS93eHRAMC4yMC4yNV9AdHlwZXMrbm9kZUAyNS42LjBfaml0aUAyLjYuMS9ub2RlX21vZHVsZXMvd3h0L2Rpc3QvdXRpbHMvY29udGVudC1zY3JpcHQtY29udGV4dC5tanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8jcmVnaW9uIHNyYy91dGlscy9kZWZpbmUtY29udGVudC1zY3JpcHQudHNcbmZ1bmN0aW9uIGRlZmluZUNvbnRlbnRTY3JpcHQoZGVmaW5pdGlvbikge1xuXHRyZXR1cm4gZGVmaW5pdGlvbjtcbn1cbi8vI2VuZHJlZ2lvblxuZXhwb3J0IHsgZGVmaW5lQ29udGVudFNjcmlwdCB9O1xuIiwiLy8gI3JlZ2lvbiBzbmlwcGV0XG5leHBvcnQgY29uc3QgYnJvd3NlciA9IGdsb2JhbFRoaXMuYnJvd3Nlcj8ucnVudGltZT8uaWRcbiAgPyBnbG9iYWxUaGlzLmJyb3dzZXJcbiAgOiBnbG9iYWxUaGlzLmNocm9tZTtcbi8vICNlbmRyZWdpb24gc25pcHBldFxuIiwiaW1wb3J0IHsgYnJvd3NlciBhcyBicm93c2VyJDEgfSBmcm9tIFwiQHd4dC1kZXYvYnJvd3NlclwiO1xuLy8jcmVnaW9uIHNyYy9icm93c2VyLnRzXG4vKipcbiogQ29udGFpbnMgdGhlIGBicm93c2VyYCBleHBvcnQgd2hpY2ggeW91IHNob3VsZCB1c2UgdG8gYWNjZXNzIHRoZSBleHRlbnNpb25cbiogQVBJcyBpbiB5b3VyIHByb2plY3Q6XG4qXG4qIGBgYHRzXG4qIGltcG9ydCB7IGJyb3dzZXIgfSBmcm9tICd3eHQvYnJvd3Nlcic7XG4qXG4qIGJyb3dzZXIucnVudGltZS5vbkluc3RhbGxlZC5hZGRMaXN0ZW5lcigoKSA9PiB7XG4qICAgLy8gLi4uXG4qIH0pO1xuKiBgYGBcbipcbiogQG1vZHVsZSB3eHQvYnJvd3NlclxuKi9cbmNvbnN0IGJyb3dzZXIgPSBicm93c2VyJDE7XG4vLyNlbmRyZWdpb25cbmV4cG9ydCB7IGJyb3dzZXIgfTtcbiIsImltcG9ydCB0eXBlIHsgSm9iRGF0YSB9IGZyb20gJy4uL3R5cGVzJztcblxuZXhwb3J0IGNsYXNzIEdyZWVuaG91c2VEZXRlY3RvciB7XG5cblx0c3RhdGljIGlzSm9iQXBwbGljYXRpb25QYWdlKCk6IGJvb2xlYW4ge1xuXHRcdGNvbnN0IHVybCA9IHdpbmRvdy5sb2NhdGlvbi5ocmVmXG5cdFx0Ly8gUGF0dGVybiAxOiBqb2ItYm9hcmRzLmdyZWVuaG91c2UuaW8ve2NvbXBhbnl9L2pvYnMve2lkfVxuXHRcdGNvbnN0IGJvYXJkc1BhdHRlcm4gPSAvZ3JlZW5ob3VzZVxcLmlvXFwvW14vXStcXC9qb2JzXFwvXFxkKy9cblx0XHQvLyBQYXR0ZXJuIDI6IGpvYi1ib2FyZHMuZ3JlZW5ob3VzZS5pby9lbWJlZC9qb2JfYXBwP2Zvcj17Y29tcGFueX0manJfaWQ9e2lkfVxuXHRcdGNvbnN0IGVtYmVkUGF0dGVybiA9IC9ncmVlbmhvdXNlXFwuaW9cXC9lbWJlZFxcL2pvYl9hcHAvXG5cdFx0cmV0dXJuIGJvYXJkc1BhdHRlcm4udGVzdCh1cmwpIHx8IGVtYmVkUGF0dGVybi50ZXN0KHVybClcblx0fVxuXG5cdHN0YXRpYyBnZXRDb21wYW55RGV0YWlsc0Zyb21VcmwoKTogeyBjb21wYW55OiBzdHJpbmcgfCBudWxsLCBqb2JJZDogc3RyaW5nIHwgbnVsbCB9IHtcblx0XHRjb25zdCB1cmwgPSBuZXcgVVJMKHdpbmRvdy5sb2NhdGlvbi5ocmVmKTtcblx0XHRsZXQgY29tcGFueSA9IG51bGxcblx0XHRsZXQgam9iSWQgPSBudWxsXG5cdFx0aWYgKC9ncmVlbmhvdXNlXFwuaW9cXC9lbWJlZFxcL2pvYl9hcHAvLnRlc3QodXJsLmhyZWYpKSB7XG5cdFx0XHQvLyBQYXR0ZXJuIDI6IHF1ZXJ5IHBhcmFtc1xuXHRcdFx0Y29tcGFueSA9IHVybC5zZWFyY2hQYXJhbXMuZ2V0KCdmb3InKVxuXHRcdFx0am9iSWQgPSB1cmwuc2VhcmNoUGFyYW1zLmdldCgnanJfaWQnKVxuXHRcdH0gZWxzZSB7XG5cdFx0XHQvLyBQYXR0ZXJuIDE6IC97Y29tcGFueX0vam9icy97aWR9XG5cdFx0XHRjb25zdCBwYXRoUGFydHMgPSB1cmwucGF0aG5hbWUuc3BsaXQoJy8nKVxuXHRcdFx0Y29tcGFueSA9IHBhdGhQYXJ0c1sxXSB8fCBudWxsXG5cdFx0XHRqb2JJZCA9IHBhdGhQYXJ0c1szXSB8fCBudWxsXG5cdFx0fVxuXG5cdFx0cmV0dXJuIHtcblx0XHRcdGNvbXBhbnksXG5cdFx0XHRqb2JJZFxuXHRcdH1cblx0fVxuXG5cdHN0YXRpYyBhc3luYyBleHRyYWN0RnJvbUFQSSgpOiBQcm9taXNlPEpvYkRhdGEgfCBudWxsPiB7XG5cdFx0Y29uc3QgdXJsID0gbmV3IFVSTCh3aW5kb3cubG9jYXRpb24uaHJlZilcblx0XHRjb25zdCB7IGNvbXBhbnksIGpvYklkIH0gPSB0aGlzLmdldENvbXBhbnlEZXRhaWxzRnJvbVVybCgpXG5cblx0XHRjb25zdCBqb2JEZXRhaWxVcmwgPSBgaHR0cHM6Ly9ib2FyZHMtYXBpLmdyZWVuaG91c2UuaW8vdjEvYm9hcmRzLyR7Y29tcGFueX0vam9icy8ke2pvYklkfWA7XG5cblx0XHR0cnkge1xuXHRcdFx0Y29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChqb2JEZXRhaWxVcmwpXG5cdFx0XHRpZiAoIXJlc3BvbnNlLm9rKSB0aHJvdyBuZXcgRXJyb3IoJ05ldHdvcmsgcmVzcG9uc2Ugd2FzIG5vdCBvaycpXG5cdFx0XHRjb25zdCBkYXRhID0gYXdhaXQgcmVzcG9uc2UuanNvbigpXG5cblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdGNvbXBhbnk6IHRoaXMuY2FwaXRhbGl6ZUNvbXBhbnkoZGF0YS5jb21wYW55X25hbWUpLFxuXHRcdFx0XHR0aXRsZTogZGF0YS50aXRsZSxcblx0XHRcdFx0ZGVzY3JpcHRpb246IGRhdGEuY29udGVudCxcblx0XHRcdFx0bG9jYXRpb246IGRhdGEubG9jYXRpb24ubmFtZSxcblx0XHRcdFx0dXJsOiB3aW5kb3cubG9jYXRpb24uaHJlZixcblx0XHRcdFx0c2FsYXJ5OiBkYXRhLnNhbGFyeSA/IGAke2RhdGEuc2FsYXJ5LmN1cnJlbmN5fSAke2RhdGEuc2FsYXJ5LnZhbHVlfWAgOiB1bmRlZmluZWQsXG5cdFx0XHRcdHNvdXJjZTogJ2dyZWVuaG91c2UnXG5cdFx0XHR9XG5cdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byBmZXRjaCBqb2IgZGV0YWlscyBmcm9tIEdyZWVuaG91c2UgQVBJOicsIGVycm9yKVxuXHRcdFx0cmV0dXJuIG51bGw7XG5cdFx0fVxuXHR9XG5cblx0c3RhdGljIGV4dHJhY3RGcm9tRG9tKCk6IEpvYkRhdGEge1xuXHRcdGNvbnN0IHVybCA9IHdpbmRvdy5sb2NhdGlvbi5ocmVmXG5cdFx0Y29uc3QgcGFyc2VkVXJsID0gbmV3IFVSTCh1cmwpXG5cdFx0bGV0IHsgY29tcGFueSB9ID0gdGhpcy5nZXRDb21wYW55RGV0YWlsc0Zyb21VcmwoKVxuXHRcdGlmICghY29tcGFueSkgY29tcGFueSA9IHBhcnNlZFVybC5ob3N0bmFtZS5zcGxpdCgnLicpWzBdXG5cblx0XHQvLyBUcnkgdG8gZXh0cmFjdCBqb2IgdGl0bGUgZnJvbSB2YXJpb3VzIHNlbGVjdG9yc1xuXHRcdGNvbnN0IHRpdGxlU2VsZWN0b3JzID0gW1xuXHRcdFx0J2gxLmFwcC10aXRsZScsXG5cdFx0XHQnLmFwcC10aXRsZScsXG5cdFx0XHQnW2RhdGEtdGVzdGlkPVwiam9iLXRpdGxlXCJdJyxcblx0XHRcdCcucG9zdGluZy10aXRsZScsXG5cdFx0XHQnaDEuam9iLXRpdGxlJywgXG5cdFx0XHQnaDEucG9zdGluZy1oZWFkbGluZScsIFxuXHRcdFx0Jy5qb2ItdGl0bGUgaDEnLFxuXHRcdFx0J2gxW2NsYXNzKj1cInRpdGxlXCJdJywgXG5cdFx0XHQnLmpvYnMtdW5pZmllZC10b3AtY2FyZF9fam9iLXRpdGxlJyxcblx0XHRcdCdoMScsIFxuXHRcdFx0Jy5wb3N0aW5nLWhlYWRsaW5lIGgyJyxcbiAgICAgIFx0XHQnaDIuam9iLXRpdGxlJywgXG5cdFx0XHQnW2RhdGEtYXV0b21hdGlvbi1pZD1cImpvYlRpdGxlXCJdJ1xuXHRcdF07XG5cblx0XHRsZXQgdGl0bGUgPSAnVW5rbm93biBQb3NpdGlvbidcblx0XHRmb3IgKGNvbnN0IHNlbGVjdG9yIG9mIHRpdGxlU2VsZWN0b3JzKSB7XG5cdFx0XHRjb25zdCBlbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3IpXG5cdFx0XHRpZiAoZWw/LnRleHRDb250ZW50KSB7XG5cdFx0XHRcdHRpdGxlID0gZWwudGV4dENvbnRlbnQudHJpbSgpXG5cdFx0XHRcdGJyZWFrXG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Ly8gRXh0cmFjdCBqb2IgZGVzY3JpcHRpb25cblx0XHRjb25zdCBkZXNjcmlwdGlvblNlbGVjdG9ycyA9IFtcblx0XHRcdCdbZGF0YS10ZXN0aWQ9XCJqb2ItZGVzY3JpcHRpb25cIl0nLFxuXHRcdFx0Jy5wb3N0aW5nLWRlc2NyaXB0aW9uJyxcblx0XHRcdCcjam9iLWRlc2NyaXB0aW9uJyxcblx0XHRcdCcuYXBwLWRlc2NyaXB0aW9uJyxcblx0XHRcdCcjY29udGVudCAuam9iLXBvc3QtY29udGVudCcsXG5cdFx0XHQnI2NvbnRlbnQgI2doX2ppZCcsXG5cdFx0XHQnLmpvYl9fZGVzY3JpcHRpb24nLFxuXHRcdFx0J1tjbGFzcyo9XCJqb2ItZGVzY3JpcHRpb25cIl0nLFxuXHRcdFx0J1tjbGFzcyo9XCJqb2JEZXNjcmlwdGlvblwiXScsXG5cdFx0XHQnW2lkKj1cImpvYi1kZXNjcmlwdGlvblwiXScsXG5cdFx0XHQnW2lkKj1cImpvYkRlc2NyaXB0aW9uXCJdJyxcblx0XHRcdCdbY2xhc3MqPVwicG9zdGluZy1kZXNjcmlwdGlvblwiXScsXG5cdFx0XHQnYXJ0aWNsZVtjbGFzcyo9XCJqb2JcIl0nLFxuXHRcdFx0Jy5qb2ItZGV0YWlscycsXG5cdFx0XHQnLmpvYi1jb250ZW50Jyxcblx0XHRcdCcuZGVzY3JpcHRpb24nLFxuXHRcdF07XG5cblx0XHRsZXQgZGVzY3JpcHRpb24gPSAnJ1xuXHRcdGZvciAoY29uc3Qgc2VsZWN0b3Igb2YgZGVzY3JpcHRpb25TZWxlY3RvcnMpIHtcblx0XHRcdGNvbnN0IGVsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihzZWxlY3Rvcilcblx0XHRcdGlmIChlbD8udGV4dENvbnRlbnQpIHtcblx0XHRcdFx0ZGVzY3JpcHRpb24gPSBlbC50ZXh0Q29udGVudC50cmltKClcblx0XHRcdFx0YnJlYWtcblx0XHRcdH1cblx0XHR9XG5cblx0XHQvLyBFeHRyYWN0IGxvY2F0aW9uIGlmIGF2YWlsYWJsZVxuXHRcdGNvbnN0IGxvY2F0aW9uU2VsZWN0b3JzID0gW1xuXHRcdFx0Jy5sb2NhdGlvbicsXG5cdFx0XHQnW2RhdGEtdGVzdGlkPVwiam9iLWxvY2F0aW9uXCJdJyxcblx0XHRcdCcucG9zdGluZy1sb2NhdGlvbicsXG5cdFx0XHQnLmpvYi1wb3N0LWxvY2F0aW9uJyxcblx0XHRdXG5cblx0XHRsZXQgbG9jYXRpb24gPSAnJ1xuXHRcdGZvciAoY29uc3Qgc2VsZWN0b3Igb2YgbG9jYXRpb25TZWxlY3RvcnMpIHtcblx0XHRcdGNvbnN0IGVsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihzZWxlY3Rvcilcblx0XHRcdGlmIChlbD8udGV4dENvbnRlbnQpIHtcblx0XHRcdFx0bG9jYXRpb24gPSBlbC50ZXh0Q29udGVudC50cmltKClcblx0XHRcdFx0YnJlYWtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRjb25zdCBzYWxhcnlTZWxlY3RvcnMgPSBbXG5cdFx0XHQnLnNhbGFyeScsXG5cdFx0XHQnW2RhdGEtdGVzdGlkPVwiam9iLXNhbGFyeVwiXScsXG5cdFx0XHQnLnBvc3Rpbmctc2FsYXJ5Jyxcblx0XHRcdCcuam9iLXBvc3Qtc2FsYXJ5Jyxcblx0XHRcdCdbY2xhc3MqPVwic2FsYXJ5XCJdJywgXG5cdFx0XHQnW2NsYXNzKj1cImNvbXBlbnNhdGlvblwiXScsIFxuXHRcdFx0J1tjbGFzcyo9XCJwYXktcmFuZ2VcIl0nLFxuICAgICAgXHRcdCdbY2xhc3MqPVwicGF5X3JhbmdlXCJdJywgXG5cdFx0XHQnW2RhdGEtZmllbGQ9XCJzYWxhcnlcIl0nLFxuXHRcdFx0J1tkYXRhLWF1dG9tYXRpb24taWQ9XCJzYWxhcnlcIl0nLFxuXHRcdF1cblxuXHRcdGxldCBzYWxhcnkgPSAnJ1xuXHRcdGZvciAoY29uc3Qgc2VsZWN0b3Igb2Ygc2FsYXJ5U2VsZWN0b3JzKSB7XG5cdFx0XHRjb25zdCBlbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3IpXG5cdFx0XHRpZiAoZWw/LnRleHRDb250ZW50KSB7XG5cdFx0XHRcdHNhbGFyeSA9IGVsLnRleHRDb250ZW50LnRyaW0oKVxuXHRcdFx0XHRicmVha1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiB7XG5cdFx0XHRjb21wYW55OiB0aGlzLmNhcGl0YWxpemVDb21wYW55KGNvbXBhbnkpLFxuXHRcdFx0dGl0bGUsXG5cdFx0XHRkZXNjcmlwdGlvbixcblx0XHRcdGxvY2F0aW9uLFxuXHRcdFx0dXJsLFxuXHRcdFx0c2FsYXJ5LFxuXHRcdFx0c291cmNlOiAnZ3JlZW5ob3VzZSdcblx0XHR9XG5cdH1cblxuXHRzdGF0aWMgZXh0cmFjdEZyb21BSSgpOiBKb2JEYXRhIHtcblx0XHQvLyBQbGFjZWhvbGRlciBmb3IgZnV0dXJlIEFJLWJhc2VkIGV4dHJhY3Rpb24gaWYgbmVlZGVkXG5cdFx0cmV0dXJuIHtcblx0XHRcdGNvbXBhbnk6ICdVbmtub3duIENvbXBhbnknLFxuXHRcdFx0dGl0bGU6ICdVbmtub3duIFBvc2l0aW9uJyxcblx0XHRcdGRlc2NyaXB0aW9uOiAnJyxcblx0XHRcdHVybDogd2luZG93LmxvY2F0aW9uLmhyZWYsXG5cdFx0XHRzb3VyY2U6ICdncmVlbmhvdXNlJ1xuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBFeHRyYWN0IGpvYiBkYXRhIHVzaW5nIG11bHRpcGxlIHN0cmF0ZWdpZXMgKG9yZGVyIG9mIHJlbGlhYmlsaXR5KTpcblx0ICogMS4gQVBJIGV4dHJhY3Rpb24gKG1vc3QgcmVsaWFibGUpXG5cdCAqIDIuIERPTSBwYXJzaW5nIHdpdGggdmFyaW91cyBzZWxlY3RvcnNcblx0ICogMy4gQUktYmFzZWQgZXh0cmFjdGlvbiAoZmFsbGJhY2spXG5cdCAqIEByZXR1cm5zIEpvYkRhdGEgb2JqZWN0IHdpdGggZXh0cmFjdGVkIGluZm9ybWF0aW9uXG5cdCAqL1xuXHRzdGF0aWMgZXh0cmFjdEpvYkRhdGEoKTogSm9iRGF0YSB7XG5cdFx0Ly8gVHJ5IERPTSBleHRyYWN0aW9uIGZpcnN0XG5cdFx0Y29uc3QgZG9tRGF0YSA9IEdyZWVuaG91c2VEZXRlY3Rvci5leHRyYWN0RnJvbURvbSgpO1xuXHRcdFxuXHRcdC8vIFJldHVybiBET00gZGF0YSBldmVuIGlmIG1pbmltYWwsIHNvIHdpZGdldCBzaG93c1xuXHRcdHJldHVybiBkb21EYXRhXG5cdH1cblxuXHRwcml2YXRlIHN0YXRpYyBjYXBpdGFsaXplQ29tcGFueShjb21wYW55OiBzdHJpbmcpOiBzdHJpbmcge1xuXHRcdHJldHVybiBjb21wYW55XG5cdFx0XHQuc3BsaXQoJy0nKVxuXHRcdFx0Lm1hcCh3b3JkID0+IHdvcmQuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyB3b3JkLnNsaWNlKDEpKVxuXHRcdFx0LmpvaW4oJyAnKVxuXHR9XG5cblx0c3RhdGljIGZpbmRBcHBsaWNhdGlvbkZvcm0oKTogSFRNTEZvcm1FbGVtZW50IHwgbnVsbCB7XG5cdFx0Y29uc3Qgc2VsZWN0b3JzID0gW1xuXHRcdFx0J2Zvcm0jYXBwbGljYXRpb24tZm9ybScsXG5cdFx0XHQnZm9ybVthY3Rpb24qPVwiL2FwcGxpY2F0aW9uc1wiXScsXG5cdFx0XHQnW2RhdGEtdGVzdGlkPVwiYXBwbGljYXRpb24tZm9ybVwiXScsXG5cdFx0XHQnZm9ybSdcblx0XHRdXG5cblx0XHRmb3IgKGNvbnN0IHNlbGVjdG9yIG9mIHNlbGVjdG9ycykge1xuXHRcdFx0Y29uc3QgZm9ybSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3IpIGFzIEhUTUxGb3JtRWxlbWVudFxuXHRcdFx0aWYgKGZvcm0pIHJldHVybiBmb3JtXG5cdFx0fVxuXG5cdFx0cmV0dXJuIG51bGxcblx0fVxufVxuIiwiaW1wb3J0IHR5cGUgeyBKb2JEYXRhIH0gZnJvbSBcIkAvdHlwZXNcIjtcbmltcG9ydCB7IEdyZWVuaG91c2VEZXRlY3RvciB9IGZyb20gXCJAL2V4dHJhY3RvcnMvZ3JlZW5ob3VzZVwiO1xuXG5jb25zdCBGTE9BVElOR19CVE5fSUQgPSBcImpvYm9yYWNsZS1mYWJcIjtcbmNvbnN0IERJU01JU1NfQlROX0lEID0gXCJqb2JvcmFjbGUtZGlzbWlzc1wiO1xuY29uc3QgV1JBUFBFUl9JRCA9IFwiam9ib3JhY2xlLWZhYi13cmFwcGVyXCI7XG5jb25zdCBQT1BVUF9JRCA9IFwiam9ib3JhY2xlLXBvcHVwXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbnRlbnRTY3JpcHQoe1xuICAgIG1hdGNoZXM6IFtcbiAgICAgICAgXCIqOi8vKi5ncmVlbmhvdXNlLmlvLypcIixcbiAgICAgICAgXCIqOi8vYm9hcmRzLmdyZWVuaG91c2UuaW8vKlwiLFxuICAgICAgICBcIio6Ly9qb2ItYm9hcmRzLmdyZWVuaG91c2UuaW8vKlwiLFxuICAgICAgICBcIio6Ly8qLmxldmVyLmNvLypcIixcbiAgICAgICAgXCIqOi8vam9icy5sZXZlci5jby8qXCIsXG4gICAgICAgIFwiKjovLyoud29ya2RheS5jb20vKlwiLFxuICAgICAgICBcIio6Ly8qLm15d29ya2RheWpvYnMuY29tLypcIixcbiAgICBdLFxuICAgIG1haW4oKSB7XG4gICAgICAgIGxldCBwb3B1cE9wZW4gPSBmYWxzZTtcblxuICAgICAgICBmdW5jdGlvbiBpbmplY3RTdHlsZXMoKSB7XG4gICAgICAgICAgICBpZiAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJqb2JvcmFjbGUtc3R5bGVzXCIpKSByZXR1cm47XG4gICAgICAgICAgICBjb25zdCBzdHlsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzdHlsZVwiKTtcbiAgICAgICAgICAgIHN0eWxlLmlkID0gXCJqb2JvcmFjbGUtc3R5bGVzXCI7XG4gICAgICAgICAgICBzdHlsZS50ZXh0Q29udGVudCA9IGBcbiAgICAgICAgIyR7V1JBUFBFUl9JRH0ge1xuICAgICAgICAgIHBvc2l0aW9uOiBmaXhlZDtcbiAgICAgICAgICB0b3A6IDUwJTtcbiAgICAgICAgICByaWdodDogMTZweDtcbiAgICAgICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVkoLTUwJSk7XG4gICAgICAgICAgei1pbmRleDogMjE0NzQ4MzY0NztcbiAgICAgICAgICBhbmltYXRpb246IGpvYk9yYWNsZUZhYkluIDAuMzVzIGN1YmljLWJlemllcigwLjM0LDEuNTYsMC42NCwxKSBib3RoO1xuICAgICAgICB9XG4gICAgICAgICMke0ZMT0FUSU5HX0JUTl9JRH0ge1xuICAgICAgICAgIHdpZHRoOiA0NHB4O1xuICAgICAgICAgIGhlaWdodDogNDRweDtcbiAgICAgICAgICBib3JkZXItcmFkaXVzOiA1MCU7XG4gICAgICAgICAgYm9yZGVyOiBub25lO1xuICAgICAgICAgIGJhY2tncm91bmQ6IG9rbGNoKDAuNDU3IDAuMjQgMjc3LjAyMyk7XG4gICAgICAgICAgY29sb3I6IHdoaXRlO1xuICAgICAgICAgIGN1cnNvcjogcG9pbnRlcjtcbiAgICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgICAgICAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gICAgICAgICAgYm94LXNoYWRvdzogMCA0cHggMTZweCBva2xjaCgwLjQ1NyAwLjI0IDI3Ny4wMjMgLyAwLjM1KSwgMCAxcHggM3B4IHJnYmEoMCwwLDAsMC4xNSk7XG4gICAgICAgICAgZm9udC1mYW1pbHk6ICdJbnRlcicsIHN5c3RlbS11aSwgc2Fucy1zZXJpZjtcbiAgICAgICAgICBmb250LXNpemU6IDEzcHg7XG4gICAgICAgICAgZm9udC13ZWlnaHQ6IDcwMDtcbiAgICAgICAgICB0cmFuc2l0aW9uOiB0cmFuc2Zvcm0gMC4ycyBjdWJpYy1iZXppZXIoMC4zNCwxLjU2LDAuNjQsMSksIGJveC1zaGFkb3cgMC4ycyBlYXNlO1xuICAgICAgICAgIHBvc2l0aW9uOiByZWxhdGl2ZTtcbiAgICAgICAgfVxuICAgICAgICAjJHtGTE9BVElOR19CVE5fSUR9OmhvdmVyIHtcbiAgICAgICAgICB0cmFuc2Zvcm06IHNjYWxlKDEuMSk7XG4gICAgICAgICAgYm94LXNoYWRvdzogMCA2cHggMjRweCBva2xjaCgwLjQ1NyAwLjI0IDI3Ny4wMjMgLyAwLjQ1KSwgMCAycHggNnB4IHJnYmEoMCwwLDAsMC4yKTtcbiAgICAgICAgfVxuICAgICAgICAjJHtGTE9BVElOR19CVE5fSUR9OmFjdGl2ZSB7XG4gICAgICAgICAgdHJhbnNmb3JtOiBzY2FsZSgwLjk1KTtcbiAgICAgICAgfVxuICAgICAgICAjJHtGTE9BVElOR19CVE5fSUR9IHN2ZyB7XG4gICAgICAgICAgd2lkdGg6IDIwcHg7XG4gICAgICAgICAgaGVpZ2h0OiAyMHB4O1xuICAgICAgICAgIGZpbGw6IG5vbmU7XG4gICAgICAgICAgc3Ryb2tlOiBjdXJyZW50Q29sb3I7XG4gICAgICAgICAgc3Ryb2tlLXdpZHRoOiAyO1xuICAgICAgICAgIHN0cm9rZS1saW5lY2FwOiByb3VuZDtcbiAgICAgICAgICBzdHJva2UtbGluZWpvaW46IHJvdW5kO1xuICAgICAgICB9XG4gICAgICAgICMke0RJU01JU1NfQlROX0lEfSB7XG4gICAgICAgICAgcG9zaXRpb246IGFic29sdXRlO1xuICAgICAgICAgIHRvcDogLTZweDtcbiAgICAgICAgICByaWdodDogLTZweDtcbiAgICAgICAgICB3aWR0aDogMThweDtcbiAgICAgICAgICBoZWlnaHQ6IDE4cHg7XG4gICAgICAgICAgYm9yZGVyLXJhZGl1czogNTAlO1xuICAgICAgICAgIGJvcmRlcjogMnB4IHNvbGlkIHdoaXRlO1xuICAgICAgICAgIGJhY2tncm91bmQ6IG9rbGNoKDAuNTUyIDAuMDE2IDI4NS45MzgpO1xuICAgICAgICAgIGNvbG9yOiB3aGl0ZTtcbiAgICAgICAgICBjdXJzb3I6IHBvaW50ZXI7XG4gICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgICAgIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICAgICAgICAgIHBhZGRpbmc6IDA7XG4gICAgICAgICAgdHJhbnNpdGlvbjogYmFja2dyb3VuZCAwLjE1cyBlYXNlLCB0cmFuc2Zvcm0gMC4xNXMgZWFzZTtcbiAgICAgICAgICBsaW5lLWhlaWdodDogMTtcbiAgICAgICAgICB6LWluZGV4OiAxO1xuICAgICAgICB9XG4gICAgICAgICMke0RJU01JU1NfQlROX0lEfTpob3ZlciB7XG4gICAgICAgICAgYmFja2dyb3VuZDogb2tsY2goMC41NzcgMC4yNDUgMjcuMzI1KTtcbiAgICAgICAgICB0cmFuc2Zvcm06IHNjYWxlKDEuMTUpO1xuICAgICAgICB9XG4gICAgICAgICMke0RJU01JU1NfQlROX0lEfSBzdmcge1xuICAgICAgICAgIHdpZHRoOiA4cHg7XG4gICAgICAgICAgaGVpZ2h0OiA4cHg7XG4gICAgICAgICAgc3Ryb2tlOiBjdXJyZW50Q29sb3I7XG4gICAgICAgICAgc3Ryb2tlLXdpZHRoOiAyLjU7XG4gICAgICAgICAgZmlsbDogbm9uZTtcbiAgICAgICAgICBzdHJva2UtbGluZWNhcDogcm91bmQ7XG4gICAgICAgIH1cbiAgICAgICAgQGtleWZyYW1lcyBqb2JPcmFjbGVGYWJJbiB7XG4gICAgICAgICAgZnJvbSB7IG9wYWNpdHk6IDA7IHRyYW5zZm9ybTogdHJhbnNsYXRlWSgtNTAlKSBzY2FsZSgwLjUpOyB9XG4gICAgICAgICAgdG8geyBvcGFjaXR5OiAxOyB0cmFuc2Zvcm06IHRyYW5zbGF0ZVkoLTUwJSkgc2NhbGUoMSk7IH1cbiAgICAgICAgfVxuICAgICAgICAuam9ib3JhY2xlLXdyYXBwZXItb3V0IHtcbiAgICAgICAgICBhbmltYXRpb246IGpvYk9yYWNsZUZhYk91dCAwLjJzIGVhc2UgYm90aCAhaW1wb3J0YW50O1xuICAgICAgICB9XG4gICAgICAgIEBrZXlmcmFtZXMgam9iT3JhY2xlRmFiT3V0IHtcbiAgICAgICAgICBmcm9tIHsgb3BhY2l0eTogMTsgdHJhbnNmb3JtOiB0cmFuc2xhdGVZKC01MCUpIHNjYWxlKDEpOyB9XG4gICAgICAgICAgdG8geyBvcGFjaXR5OiAwOyB0cmFuc2Zvcm06IHRyYW5zbGF0ZVkoLTUwJSkgc2NhbGUoMC41KTsgfVxuICAgICAgICB9XG4gICAgICAgICMke1BPUFVQX0lEfSB7XG4gICAgICAgICAgcG9zaXRpb246IGZpeGVkO1xuICAgICAgICAgIHRvcDogNTAlO1xuICAgICAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlWSgtNTAlKTtcbiAgICAgICAgICB6LWluZGV4OiAyMTQ3NDgzNjQ2O1xuICAgICAgICAgIHdpZHRoOiA0NTBweDtcbiAgICAgICAgICBoZWlnaHQ6IDU1MHB4O1xuICAgICAgICAgIGJvcmRlcjogbm9uZTtcbiAgICAgICAgICBib3JkZXItcmFkaXVzOiAxNnB4O1xuICAgICAgICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgICAgICAgYmFja2dyb3VuZDogd2hpdGU7XG4gICAgICAgICAgYm94LXNoYWRvdzogMCA4cHggNDBweCByZ2JhKDAsMCwwLDAuMTIpLCAwIDJweCA4cHggcmdiYSgwLDAsMCwwLjA2KTtcbiAgICAgICAgICBhbmltYXRpb246IGpvYk9yYWNsZVBvcHVwSW4gMC4yNXMgY3ViaWMtYmV6aWVyKDAuMjIsMSwwLjM2LDEpIGJvdGg7XG4gICAgICAgIH1cbiAgICAgICAgIyR7UE9QVVBfSUR9LW92ZXJsYXkge1xuICAgICAgICAgIHBvc2l0aW9uOiBmaXhlZDtcbiAgICAgICAgICBpbnNldDogMDtcbiAgICAgICAgICB6LWluZGV4OiAyMTQ3NDgzNjQ1O1xuICAgICAgICAgIGJhY2tncm91bmQ6IHJnYmEoMCwwLDAsMC4xNSk7XG4gICAgICAgICAgYW5pbWF0aW9uOiBqb2JPcmFjbGVPdmVybGF5SW4gMC4ycyBlYXNlIGJvdGg7XG4gICAgICAgIH1cbiAgICAgICAgQGtleWZyYW1lcyBqb2JPcmFjbGVQb3B1cEluIHtcbiAgICAgICAgICBmcm9tIHsgb3BhY2l0eTogMDsgdHJhbnNmb3JtOiB0cmFuc2xhdGVZKC01MCUpIHNjYWxlKDAuOTUpOyB9XG4gICAgICAgICAgdG8geyBvcGFjaXR5OiAxOyB0cmFuc2Zvcm06IHRyYW5zbGF0ZVkoLTUwJSkgc2NhbGUoMSk7IH1cbiAgICAgICAgfVxuICAgICAgICBAa2V5ZnJhbWVzIGpvYk9yYWNsZU92ZXJsYXlJbiB7XG4gICAgICAgICAgZnJvbSB7IG9wYWNpdHk6IDA7IH1cbiAgICAgICAgICB0byB7IG9wYWNpdHk6IDE7IH1cbiAgICAgICAgfVxuICAgICAgICAuam9ib3JhY2xlLXBvcHVwLWNsb3Npbmcge1xuICAgICAgICAgIGFuaW1hdGlvbjogam9iT3JhY2xlUG9wdXBPdXQgMC4xNXMgY3ViaWMtYmV6aWVyKDAuMjIsMSwwLjM2LDEpIGJvdGggIWltcG9ydGFudDtcbiAgICAgICAgfVxuICAgICAgICAuam9ib3JhY2xlLW92ZXJsYXktY2xvc2luZyB7XG4gICAgICAgICAgYW5pbWF0aW9uOiBqb2JPcmFjbGVPdmVybGF5T3V0IDAuMTVzIGVhc2UgYm90aCAhaW1wb3J0YW50O1xuICAgICAgICB9XG4gICAgICAgIEBrZXlmcmFtZXMgam9iT3JhY2xlUG9wdXBPdXQge1xuICAgICAgICAgIGZyb20geyBvcGFjaXR5OiAxOyB0cmFuc2Zvcm06IHRyYW5zbGF0ZVkoLTUwJSkgc2NhbGUoMSk7IH1cbiAgICAgICAgICB0byB7IG9wYWNpdHk6IDA7IHRyYW5zZm9ybTogdHJhbnNsYXRlWSgtNTAlKSBzY2FsZSgwLjk1KTsgfVxuICAgICAgICB9XG4gICAgICAgIEBrZXlmcmFtZXMgam9iT3JhY2xlT3ZlcmxheU91dCB7XG4gICAgICAgICAgZnJvbSB7IG9wYWNpdHk6IDE7IH1cbiAgICAgICAgICB0byB7IG9wYWNpdHk6IDA7IH1cbiAgICAgICAgfVxuICAgICAgYDtcbiAgICAgICAgICAgIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoc3R5bGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gZ2V0V3JhcHBlclkoKSB7XG4gICAgICAgICAgICBjb25zdCB3cmFwcGVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoV1JBUFBFUl9JRCk7XG4gICAgICAgICAgICByZXR1cm4gd3JhcHBlclxuICAgICAgICAgICAgICAgID8gd3JhcHBlci5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS50b3AgKyB3cmFwcGVyLm9mZnNldEhlaWdodCAvIDJcbiAgICAgICAgICAgICAgICA6IHdpbmRvdy5pbm5lckhlaWdodCAvIDI7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBjcmVhdGVGbG9hdGluZ0J1dHRvbigpIHtcbiAgICAgICAgICAgIGlmIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZChXUkFQUEVSX0lEKSkgcmV0dXJuO1xuXG4gICAgICAgICAgICBjb25zdCB3cmFwcGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgICAgIHdyYXBwZXIuaWQgPSBXUkFQUEVSX0lEO1xuXG4gICAgICAgICAgICBjb25zdCBidG4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYnV0dG9uXCIpO1xuICAgICAgICAgICAgYnRuLmlkID0gRkxPQVRJTkdfQlROX0lEO1xuICAgICAgICAgICAgYnRuLnRpdGxlID0gXCJPcGVuIEpvYk9yYWNsZVwiO1xuICAgICAgICAgICAgYnRuLmlubmVySFRNTCA9IGA8c3ZnIHZpZXdCb3g9XCIwIDAgMjQgMjRcIiBzdHJva2UtbGluZWNhcD1cInJvdW5kXCIgc3Ryb2tlLWxpbmVqb2luPVwicm91bmRcIj48cGF0aCBkPVwiTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyczQuNDggMTAgMTAgMTAgMTAtNC40OCAxMC0xMFMxNy41MiAyIDEyIDJ6XCIvPjxwYXRoIGQ9XCJNOCAxMmwyIDIgNC00XCIvPjwvc3ZnPmA7XG4gICAgICAgICAgICBidG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIG9wZW5Qb3B1cCk7XG5cbiAgICAgICAgICAgIGNvbnN0IGRpc21pc3MgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYnV0dG9uXCIpO1xuICAgICAgICAgICAgZGlzbWlzcy5pZCA9IERJU01JU1NfQlROX0lEO1xuICAgICAgICAgICAgZGlzbWlzcy50aXRsZSA9IFwiRGlzbWlzc1wiO1xuICAgICAgICAgICAgZGlzbWlzcy5pbm5lckhUTUwgPSBgPHN2ZyB2aWV3Qm94PVwiMCAwIDEwIDEwXCIgc3Ryb2tlLWxpbmVjYXA9XCJyb3VuZFwiPjxsaW5lIHgxPVwiMlwiIHkxPVwiMlwiIHgyPVwiOFwiIHkyPVwiOFwiLz48bGluZSB4MT1cIjhcIiB5MT1cIjJcIiB4Mj1cIjJcIiB5Mj1cIjhcIi8+PC9zdmc+YDtcbiAgICAgICAgICAgIGRpc21pc3MuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChlKSA9PiB7XG4gICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICBkaXNtaXNzQnV0dG9uKCk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgYnRuLmFwcGVuZENoaWxkKGRpc21pc3MpO1xuICAgICAgICAgICAgd3JhcHBlci5hcHBlbmRDaGlsZChidG4pO1xuICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh3cmFwcGVyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGRpc21pc3NCdXR0b24oKSB7XG4gICAgICAgICAgICBjb25zdCB3cmFwcGVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoV1JBUFBFUl9JRCk7XG4gICAgICAgICAgICBpZiAoIXdyYXBwZXIpIHJldHVybjtcbiAgICAgICAgICAgIHdyYXBwZXIuY2xhc3NMaXN0LmFkZChcImpvYm9yYWNsZS13cmFwcGVyLW91dFwiKTtcbiAgICAgICAgICAgIHdyYXBwZXIuYWRkRXZlbnRMaXN0ZW5lcihcImFuaW1hdGlvbmVuZFwiLCAoKSA9PiB3cmFwcGVyLnJlbW92ZSgpLCB7XG4gICAgICAgICAgICAgICAgb25jZTogdHJ1ZSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gb3BlblBvcHVwKCkge1xuICAgICAgICAgICAgaWYgKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFBPUFVQX0lEKSkgcmV0dXJuO1xuXG4gICAgICAgICAgICBjb25zdCBvdmVybGF5ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgICAgIG92ZXJsYXkuaWQgPSBgJHtQT1BVUF9JRH0tb3ZlcmxheWA7XG4gICAgICAgICAgICBvdmVybGF5LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBjbG9zZVBvcHVwKTtcbiAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQob3ZlcmxheSk7XG5cbiAgICAgICAgICAgIGNvbnN0IHdyYXBwZXJZID0gZ2V0V3JhcHBlclkoKTtcbiAgICAgICAgICAgIGNvbnN0IGlmcmFtZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJpZnJhbWVcIik7XG4gICAgICAgICAgICBpZnJhbWUuaWQgPSBQT1BVUF9JRDtcbiAgICAgICAgICAgIGlmcmFtZS5zcmMgPSBicm93c2VyLnJ1bnRpbWUuZ2V0VVJMKFwiL3BvcHVwLmh0bWxcIik7XG4gICAgICAgICAgICBpZnJhbWUuYWxsb3cgPSBcImNsaXBib2FyZC13cml0ZVwiO1xuICAgICAgICAgICAgaWZyYW1lLnN0eWxlLnRvcCA9IGAke3dyYXBwZXJZfXB4YDtcbiAgICAgICAgICAgIGlmcmFtZS5zdHlsZS5yaWdodCA9IFwiNjhweFwiO1xuICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChpZnJhbWUpO1xuICAgICAgICAgICAgcG9wdXBPcGVuID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGNsb3NlUG9wdXAoKSB7XG4gICAgICAgICAgICBjb25zdCBwb3B1cCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFBPUFVQX0lEKTtcbiAgICAgICAgICAgIGNvbnN0IG92ZXJsYXkgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChgJHtQT1BVUF9JRH0tb3ZlcmxheWApO1xuICAgICAgICAgICAgaWYgKHBvcHVwKSB7XG4gICAgICAgICAgICAgICAgcG9wdXAuY2xhc3NMaXN0LmFkZChcImpvYm9yYWNsZS1wb3B1cC1jbG9zaW5nXCIpO1xuICAgICAgICAgICAgICAgIHBvcHVwLmFkZEV2ZW50TGlzdGVuZXIoXCJhbmltYXRpb25lbmRcIiwgKCkgPT4gcG9wdXAucmVtb3ZlKCksIHtcbiAgICAgICAgICAgICAgICAgICAgb25jZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChvdmVybGF5KSB7XG4gICAgICAgICAgICAgICAgb3ZlcmxheS5jbGFzc0xpc3QuYWRkKFwiam9ib3JhY2xlLW92ZXJsYXktY2xvc2luZ1wiKTtcbiAgICAgICAgICAgICAgICBvdmVybGF5LmFkZEV2ZW50TGlzdGVuZXIoXG4gICAgICAgICAgICAgICAgICAgIFwiYW5pbWF0aW9uZW5kXCIsXG4gICAgICAgICAgICAgICAgICAgICgpID0+IG92ZXJsYXkucmVtb3ZlKCksXG4gICAgICAgICAgICAgICAgICAgIHsgb25jZTogdHJ1ZSB9LFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwb3B1cE9wZW4gPSBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGRldGVjdEFuZFNlbmRKb2IoKSB7XG4gICAgICAgICAgICBsZXQgam9iRGF0YTogSm9iRGF0YSB8IG51bGwgPSBudWxsO1xuXG4gICAgICAgICAgICBjb25zdCB1cmwgPSB3aW5kb3cubG9jYXRpb24uaHJlZjtcbiAgICAgICAgICAgIGlmICgvZ3JlZW5ob3VzZVxcLmlvLy50ZXN0KHVybCkpIHtcbiAgICAgICAgICAgICAgICBqb2JEYXRhID0gR3JlZW5ob3VzZURldGVjdG9yLmV4dHJhY3RKb2JEYXRhKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChqb2JEYXRhKSB7XG4gICAgICAgICAgICAgICAgYnJvd3Nlci5ydW50aW1lXG4gICAgICAgICAgICAgICAgICAgIC5zZW5kTWVzc2FnZSh7IHR5cGU6IFwiSk9CX0RFVEVDVEVEXCIsIGRhdGE6IGpvYkRhdGEgfSlcbiAgICAgICAgICAgICAgICAgICAgLmNhdGNoKCgpID0+IHt9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGJyb3dzZXIucnVudGltZS5vbk1lc3NhZ2UuYWRkTGlzdGVuZXIoKG1lc3NhZ2UpID0+IHtcbiAgICAgICAgICAgIGlmIChtZXNzYWdlLnR5cGUgPT09IFwiQ0hFQ0tfRk9SX0pPQlwiKSB7XG4gICAgICAgICAgICAgICAgZGV0ZWN0QW5kU2VuZEpvYigpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG1lc3NhZ2UudHlwZSA9PT0gXCJDTE9TRV9QT1BVUFwiKSB7XG4gICAgICAgICAgICAgICAgY2xvc2VQb3B1cCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBpbmplY3RTdHlsZXMoKTtcbiAgICAgICAgY3JlYXRlRmxvYXRpbmdCdXR0b24oKTtcbiAgICAgICAgZGV0ZWN0QW5kU2VuZEpvYigpO1xuICAgIH0sXG59KTtcbiIsIi8vI3JlZ2lvbiBzcmMvdXRpbHMvaW50ZXJuYWwvbG9nZ2VyLnRzXG5mdW5jdGlvbiBwcmludChtZXRob2QsIC4uLmFyZ3MpIHtcblx0aWYgKGltcG9ydC5tZXRhLmVudi5NT0RFID09PSBcInByb2R1Y3Rpb25cIikgcmV0dXJuO1xuXHRpZiAodHlwZW9mIGFyZ3NbMF0gPT09IFwic3RyaW5nXCIpIG1ldGhvZChgW3d4dF0gJHthcmdzLnNoaWZ0KCl9YCwgLi4uYXJncyk7XG5cdGVsc2UgbWV0aG9kKFwiW3d4dF1cIiwgLi4uYXJncyk7XG59XG4vKiogV3JhcHBlciBhcm91bmQgYGNvbnNvbGVgIHdpdGggYSBcIlt3eHRdXCIgcHJlZml4ICovXG5jb25zdCBsb2dnZXIgPSB7XG5cdGRlYnVnOiAoLi4uYXJncykgPT4gcHJpbnQoY29uc29sZS5kZWJ1ZywgLi4uYXJncyksXG5cdGxvZzogKC4uLmFyZ3MpID0+IHByaW50KGNvbnNvbGUubG9nLCAuLi5hcmdzKSxcblx0d2FybjogKC4uLmFyZ3MpID0+IHByaW50KGNvbnNvbGUud2FybiwgLi4uYXJncyksXG5cdGVycm9yOiAoLi4uYXJncykgPT4gcHJpbnQoY29uc29sZS5lcnJvciwgLi4uYXJncylcbn07XG4vLyNlbmRyZWdpb25cbmV4cG9ydCB7IGxvZ2dlciB9O1xuIiwiaW1wb3J0IHsgYnJvd3NlciB9IGZyb20gXCJ3eHQvYnJvd3NlclwiO1xuLy8jcmVnaW9uIHNyYy91dGlscy9pbnRlcm5hbC9jdXN0b20tZXZlbnRzLnRzXG52YXIgV3h0TG9jYXRpb25DaGFuZ2VFdmVudCA9IGNsYXNzIFd4dExvY2F0aW9uQ2hhbmdlRXZlbnQgZXh0ZW5kcyBFdmVudCB7XG5cdHN0YXRpYyBFVkVOVF9OQU1FID0gZ2V0VW5pcXVlRXZlbnROYW1lKFwid3h0OmxvY2F0aW9uY2hhbmdlXCIpO1xuXHRjb25zdHJ1Y3RvcihuZXdVcmwsIG9sZFVybCkge1xuXHRcdHN1cGVyKFd4dExvY2F0aW9uQ2hhbmdlRXZlbnQuRVZFTlRfTkFNRSwge30pO1xuXHRcdHRoaXMubmV3VXJsID0gbmV3VXJsO1xuXHRcdHRoaXMub2xkVXJsID0gb2xkVXJsO1xuXHR9XG59O1xuLyoqXG4qIFJldHVybnMgYW4gZXZlbnQgbmFtZSB1bmlxdWUgdG8gdGhlIGV4dGVuc2lvbiBhbmQgY29udGVudCBzY3JpcHQgdGhhdCdzXG4qIHJ1bm5pbmcuXG4qL1xuZnVuY3Rpb24gZ2V0VW5pcXVlRXZlbnROYW1lKGV2ZW50TmFtZSkge1xuXHRyZXR1cm4gYCR7YnJvd3Nlcj8ucnVudGltZT8uaWR9OiR7aW1wb3J0Lm1ldGEuZW52LkVOVFJZUE9JTlR9OiR7ZXZlbnROYW1lfWA7XG59XG4vLyNlbmRyZWdpb25cbmV4cG9ydCB7IFd4dExvY2F0aW9uQ2hhbmdlRXZlbnQsIGdldFVuaXF1ZUV2ZW50TmFtZSB9O1xuIiwiaW1wb3J0IHsgV3h0TG9jYXRpb25DaGFuZ2VFdmVudCB9IGZyb20gXCIuL2N1c3RvbS1ldmVudHMubWpzXCI7XG4vLyNyZWdpb24gc3JjL3V0aWxzL2ludGVybmFsL2xvY2F0aW9uLXdhdGNoZXIudHNcbmNvbnN0IHN1cHBvcnRzTmF2aWdhdGlvbkFwaSA9IHR5cGVvZiBnbG9iYWxUaGlzLm5hdmlnYXRpb24/LmFkZEV2ZW50TGlzdGVuZXIgPT09IFwiZnVuY3Rpb25cIjtcbi8qKlxuKiBDcmVhdGUgYSB1dGlsIHRoYXQgd2F0Y2hlcyBmb3IgVVJMIGNoYW5nZXMsIGRpc3BhdGNoaW5nIHRoZSBjdXN0b20gZXZlbnQgd2hlblxuKiBkZXRlY3RlZC4gU3RvcHMgd2F0Y2hpbmcgd2hlbiBjb250ZW50IHNjcmlwdCBpcyBpbnZhbGlkYXRlZC4gVXNlcyBOYXZpZ2F0aW9uXG4qIEFQSSB3aGVuIGF2YWlsYWJsZSwgb3RoZXJ3aXNlIGZhbGxzIGJhY2sgdG8gcG9sbGluZy5cbiovXG5mdW5jdGlvbiBjcmVhdGVMb2NhdGlvbldhdGNoZXIoY3R4KSB7XG5cdGxldCBsYXN0VXJsO1xuXHRsZXQgd2F0Y2hpbmcgPSBmYWxzZTtcblx0cmV0dXJuIHsgcnVuKCkge1xuXHRcdGlmICh3YXRjaGluZykgcmV0dXJuO1xuXHRcdHdhdGNoaW5nID0gdHJ1ZTtcblx0XHRsYXN0VXJsID0gbmV3IFVSTChsb2NhdGlvbi5ocmVmKTtcblx0XHRpZiAoc3VwcG9ydHNOYXZpZ2F0aW9uQXBpKSBnbG9iYWxUaGlzLm5hdmlnYXRpb24uYWRkRXZlbnRMaXN0ZW5lcihcIm5hdmlnYXRlXCIsIChldmVudCkgPT4ge1xuXHRcdFx0Y29uc3QgbmV3VXJsID0gbmV3IFVSTChldmVudC5kZXN0aW5hdGlvbi51cmwpO1xuXHRcdFx0aWYgKG5ld1VybC5ocmVmID09PSBsYXN0VXJsLmhyZWYpIHJldHVybjtcblx0XHRcdHdpbmRvdy5kaXNwYXRjaEV2ZW50KG5ldyBXeHRMb2NhdGlvbkNoYW5nZUV2ZW50KG5ld1VybCwgbGFzdFVybCkpO1xuXHRcdFx0bGFzdFVybCA9IG5ld1VybDtcblx0XHR9LCB7IHNpZ25hbDogY3R4LnNpZ25hbCB9KTtcblx0XHRlbHNlIGN0eC5zZXRJbnRlcnZhbCgoKSA9PiB7XG5cdFx0XHRjb25zdCBuZXdVcmwgPSBuZXcgVVJMKGxvY2F0aW9uLmhyZWYpO1xuXHRcdFx0aWYgKG5ld1VybC5ocmVmICE9PSBsYXN0VXJsLmhyZWYpIHtcblx0XHRcdFx0d2luZG93LmRpc3BhdGNoRXZlbnQobmV3IFd4dExvY2F0aW9uQ2hhbmdlRXZlbnQobmV3VXJsLCBsYXN0VXJsKSk7XG5cdFx0XHRcdGxhc3RVcmwgPSBuZXdVcmw7XG5cdFx0XHR9XG5cdFx0fSwgMWUzKTtcblx0fSB9O1xufVxuLy8jZW5kcmVnaW9uXG5leHBvcnQgeyBjcmVhdGVMb2NhdGlvbldhdGNoZXIgfTtcbiIsImltcG9ydCB7IGxvZ2dlciB9IGZyb20gXCIuL2ludGVybmFsL2xvZ2dlci5tanNcIjtcbmltcG9ydCB7IGdldFVuaXF1ZUV2ZW50TmFtZSB9IGZyb20gXCIuL2ludGVybmFsL2N1c3RvbS1ldmVudHMubWpzXCI7XG5pbXBvcnQgeyBjcmVhdGVMb2NhdGlvbldhdGNoZXIgfSBmcm9tIFwiLi9pbnRlcm5hbC9sb2NhdGlvbi13YXRjaGVyLm1qc1wiO1xuaW1wb3J0IHsgYnJvd3NlciB9IGZyb20gXCJ3eHQvYnJvd3NlclwiO1xuLy8jcmVnaW9uIHNyYy91dGlscy9jb250ZW50LXNjcmlwdC1jb250ZXh0LnRzXG4vKipcbiogSW1wbGVtZW50c1xuKiBbYEFib3J0Q29udHJvbGxlcmBdKGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9BYm9ydENvbnRyb2xsZXIpLlxuKiBVc2VkIHRvIGRldGVjdCBhbmQgc3RvcCBjb250ZW50IHNjcmlwdCBjb2RlIHdoZW4gdGhlIHNjcmlwdCBpcyBpbnZhbGlkYXRlZC5cbipcbiogSXQgYWxzbyBwcm92aWRlcyBzZXZlcmFsIHV0aWxpdGllcyBsaWtlIGBjdHguc2V0VGltZW91dGAgYW5kXG4qIGBjdHguc2V0SW50ZXJ2YWxgIHRoYXQgc2hvdWxkIGJlIHVzZWQgaW4gY29udGVudCBzY3JpcHRzIGluc3RlYWQgb2ZcbiogYHdpbmRvdy5zZXRUaW1lb3V0YCBvciBgd2luZG93LnNldEludGVydmFsYC5cbipcbiogVG8gY3JlYXRlIGNvbnRleHQgZm9yIHRlc3RpbmcsIHlvdSBjYW4gdXNlIHRoZSBjbGFzcydzIGNvbnN0cnVjdG9yOlxuKlxuKiBgYGB0c1xuKiBpbXBvcnQgeyBDb250ZW50U2NyaXB0Q29udGV4dCB9IGZyb20gJ3d4dC91dGlscy9jb250ZW50LXNjcmlwdHMtY29udGV4dCc7XG4qXG4qIHRlc3QoJ3N0b3JhZ2UgbGlzdGVuZXIgc2hvdWxkIGJlIHJlbW92ZWQgd2hlbiBjb250ZXh0IGlzIGludmFsaWRhdGVkJywgKCkgPT4ge1xuKiAgIGNvbnN0IGN0eCA9IG5ldyBDb250ZW50U2NyaXB0Q29udGV4dCgndGVzdCcpO1xuKiAgIGNvbnN0IGl0ZW0gPSBzdG9yYWdlLmRlZmluZUl0ZW0oJ2xvY2FsOmNvdW50JywgeyBkZWZhdWx0VmFsdWU6IDAgfSk7XG4qICAgY29uc3Qgd2F0Y2hlciA9IHZpLmZuKCk7XG4qXG4qICAgY29uc3QgdW53YXRjaCA9IGl0ZW0ud2F0Y2god2F0Y2hlcik7XG4qICAgY3R4Lm9uSW52YWxpZGF0ZWQodW53YXRjaCk7IC8vIExpc3RlbiBmb3IgaW52YWxpZGF0ZSBoZXJlXG4qXG4qICAgYXdhaXQgaXRlbS5zZXRWYWx1ZSgxKTtcbiogICBleHBlY3Qod2F0Y2hlcikudG9CZUNhbGxlZFRpbWVzKDEpO1xuKiAgIGV4cGVjdCh3YXRjaGVyKS50b0JlQ2FsbGVkV2l0aCgxLCAwKTtcbipcbiogICBjdHgubm90aWZ5SW52YWxpZGF0ZWQoKTsgLy8gVXNlIHRoaXMgZnVuY3Rpb24gdG8gaW52YWxpZGF0ZSB0aGUgY29udGV4dFxuKiAgIGF3YWl0IGl0ZW0uc2V0VmFsdWUoMik7XG4qICAgZXhwZWN0KHdhdGNoZXIpLnRvQmVDYWxsZWRUaW1lcygxKTtcbiogfSk7XG4qIGBgYFxuKi9cbnZhciBDb250ZW50U2NyaXB0Q29udGV4dCA9IGNsYXNzIENvbnRlbnRTY3JpcHRDb250ZXh0IHtcblx0c3RhdGljIFNDUklQVF9TVEFSVEVEX01FU1NBR0VfVFlQRSA9IGdldFVuaXF1ZUV2ZW50TmFtZShcInd4dDpjb250ZW50LXNjcmlwdC1zdGFydGVkXCIpO1xuXHRpZDtcblx0YWJvcnRDb250cm9sbGVyO1xuXHRsb2NhdGlvbldhdGNoZXIgPSBjcmVhdGVMb2NhdGlvbldhdGNoZXIodGhpcyk7XG5cdGNvbnN0cnVjdG9yKGNvbnRlbnRTY3JpcHROYW1lLCBvcHRpb25zKSB7XG5cdFx0dGhpcy5jb250ZW50U2NyaXB0TmFtZSA9IGNvbnRlbnRTY3JpcHROYW1lO1xuXHRcdHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG5cdFx0dGhpcy5pZCA9IE1hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnNsaWNlKDIpO1xuXHRcdHRoaXMuYWJvcnRDb250cm9sbGVyID0gbmV3IEFib3J0Q29udHJvbGxlcigpO1xuXHRcdHRoaXMuc3RvcE9sZFNjcmlwdHMoKTtcblx0XHR0aGlzLmxpc3RlbkZvck5ld2VyU2NyaXB0cygpO1xuXHR9XG5cdGdldCBzaWduYWwoKSB7XG5cdFx0cmV0dXJuIHRoaXMuYWJvcnRDb250cm9sbGVyLnNpZ25hbDtcblx0fVxuXHRhYm9ydChyZWFzb24pIHtcblx0XHRyZXR1cm4gdGhpcy5hYm9ydENvbnRyb2xsZXIuYWJvcnQocmVhc29uKTtcblx0fVxuXHRnZXQgaXNJbnZhbGlkKCkge1xuXHRcdGlmIChicm93c2VyLnJ1bnRpbWU/LmlkID09IG51bGwpIHRoaXMubm90aWZ5SW52YWxpZGF0ZWQoKTtcblx0XHRyZXR1cm4gdGhpcy5zaWduYWwuYWJvcnRlZDtcblx0fVxuXHRnZXQgaXNWYWxpZCgpIHtcblx0XHRyZXR1cm4gIXRoaXMuaXNJbnZhbGlkO1xuXHR9XG5cdC8qKlxuXHQqIEFkZCBhIGxpc3RlbmVyIHRoYXQgaXMgY2FsbGVkIHdoZW4gdGhlIGNvbnRlbnQgc2NyaXB0J3MgY29udGV4dCBpc1xuXHQqIGludmFsaWRhdGVkLlxuXHQqXG5cdCogQGV4YW1wbGVcblx0KiAgIGJyb3dzZXIucnVudGltZS5vbk1lc3NhZ2UuYWRkTGlzdGVuZXIoY2IpO1xuXHQqICAgY29uc3QgcmVtb3ZlSW52YWxpZGF0ZWRMaXN0ZW5lciA9IGN0eC5vbkludmFsaWRhdGVkKCgpID0+IHtcblx0KiAgICAgYnJvd3Nlci5ydW50aW1lLm9uTWVzc2FnZS5yZW1vdmVMaXN0ZW5lcihjYik7XG5cdCogICB9KTtcblx0KiAgIC8vIC4uLlxuXHQqICAgcmVtb3ZlSW52YWxpZGF0ZWRMaXN0ZW5lcigpO1xuXHQqXG5cdCogQHJldHVybnMgQSBmdW5jdGlvbiB0byByZW1vdmUgdGhlIGxpc3RlbmVyLlxuXHQqL1xuXHRvbkludmFsaWRhdGVkKGNiKSB7XG5cdFx0dGhpcy5zaWduYWwuYWRkRXZlbnRMaXN0ZW5lcihcImFib3J0XCIsIGNiKTtcblx0XHRyZXR1cm4gKCkgPT4gdGhpcy5zaWduYWwucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImFib3J0XCIsIGNiKTtcblx0fVxuXHQvKipcblx0KiBSZXR1cm4gYSBwcm9taXNlIHRoYXQgbmV2ZXIgcmVzb2x2ZXMuIFVzZWZ1bCBpZiB5b3UgaGF2ZSBhbiBhc3luYyBmdW5jdGlvblxuXHQqIHRoYXQgc2hvdWxkbid0IHJ1biBhZnRlciB0aGUgY29udGV4dCBpcyBleHBpcmVkLlxuXHQqXG5cdCogQGV4YW1wbGVcblx0KiAgIGNvbnN0IGdldFZhbHVlRnJvbVN0b3JhZ2UgPSBhc3luYyAoKSA9PiB7XG5cdCogICAgIGlmIChjdHguaXNJbnZhbGlkKSByZXR1cm4gY3R4LmJsb2NrKCk7XG5cdCpcblx0KiAgICAgLy8gLi4uXG5cdCogICB9O1xuXHQqL1xuXHRibG9jaygpIHtcblx0XHRyZXR1cm4gbmV3IFByb21pc2UoKCkgPT4ge30pO1xuXHR9XG5cdC8qKlxuXHQqIFdyYXBwZXIgYXJvdW5kIGB3aW5kb3cuc2V0SW50ZXJ2YWxgIHRoYXQgYXV0b21hdGljYWxseSBjbGVhcnMgdGhlIGludGVydmFsXG5cdCogd2hlbiBpbnZhbGlkYXRlZC5cblx0KlxuXHQqIEludGVydmFscyBjYW4gYmUgY2xlYXJlZCBieSBjYWxsaW5nIHRoZSBub3JtYWwgYGNsZWFySW50ZXJ2YWxgIGZ1bmN0aW9uLlxuXHQqL1xuXHRzZXRJbnRlcnZhbChoYW5kbGVyLCB0aW1lb3V0KSB7XG5cdFx0Y29uc3QgaWQgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XG5cdFx0XHRpZiAodGhpcy5pc1ZhbGlkKSBoYW5kbGVyKCk7XG5cdFx0fSwgdGltZW91dCk7XG5cdFx0dGhpcy5vbkludmFsaWRhdGVkKCgpID0+IGNsZWFySW50ZXJ2YWwoaWQpKTtcblx0XHRyZXR1cm4gaWQ7XG5cdH1cblx0LyoqXG5cdCogV3JhcHBlciBhcm91bmQgYHdpbmRvdy5zZXRUaW1lb3V0YCB0aGF0IGF1dG9tYXRpY2FsbHkgY2xlYXJzIHRoZSBpbnRlcnZhbFxuXHQqIHdoZW4gaW52YWxpZGF0ZWQuXG5cdCpcblx0KiBUaW1lb3V0cyBjYW4gYmUgY2xlYXJlZCBieSBjYWxsaW5nIHRoZSBub3JtYWwgYHNldFRpbWVvdXRgIGZ1bmN0aW9uLlxuXHQqL1xuXHRzZXRUaW1lb3V0KGhhbmRsZXIsIHRpbWVvdXQpIHtcblx0XHRjb25zdCBpZCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuXHRcdFx0aWYgKHRoaXMuaXNWYWxpZCkgaGFuZGxlcigpO1xuXHRcdH0sIHRpbWVvdXQpO1xuXHRcdHRoaXMub25JbnZhbGlkYXRlZCgoKSA9PiBjbGVhclRpbWVvdXQoaWQpKTtcblx0XHRyZXR1cm4gaWQ7XG5cdH1cblx0LyoqXG5cdCogV3JhcHBlciBhcm91bmQgYHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWVgIHRoYXQgYXV0b21hdGljYWxseSBjYW5jZWxzXG5cdCogdGhlIHJlcXVlc3Qgd2hlbiBpbnZhbGlkYXRlZC5cblx0KlxuXHQqIENhbGxiYWNrcyBjYW4gYmUgY2FuY2VsZWQgYnkgY2FsbGluZyB0aGUgbm9ybWFsIGBjYW5jZWxBbmltYXRpb25GcmFtZWBcblx0KiBmdW5jdGlvbi5cblx0Ki9cblx0cmVxdWVzdEFuaW1hdGlvbkZyYW1lKGNhbGxiYWNrKSB7XG5cdFx0Y29uc3QgaWQgPSByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKC4uLmFyZ3MpID0+IHtcblx0XHRcdGlmICh0aGlzLmlzVmFsaWQpIGNhbGxiYWNrKC4uLmFyZ3MpO1xuXHRcdH0pO1xuXHRcdHRoaXMub25JbnZhbGlkYXRlZCgoKSA9PiBjYW5jZWxBbmltYXRpb25GcmFtZShpZCkpO1xuXHRcdHJldHVybiBpZDtcblx0fVxuXHQvKipcblx0KiBXcmFwcGVyIGFyb3VuZCBgd2luZG93LnJlcXVlc3RJZGxlQ2FsbGJhY2tgIHRoYXQgYXV0b21hdGljYWxseSBjYW5jZWxzIHRoZVxuXHQqIHJlcXVlc3Qgd2hlbiBpbnZhbGlkYXRlZC5cblx0KlxuXHQqIENhbGxiYWNrcyBjYW4gYmUgY2FuY2VsZWQgYnkgY2FsbGluZyB0aGUgbm9ybWFsIGBjYW5jZWxJZGxlQ2FsbGJhY2tgXG5cdCogZnVuY3Rpb24uXG5cdCovXG5cdHJlcXVlc3RJZGxlQ2FsbGJhY2soY2FsbGJhY2ssIG9wdGlvbnMpIHtcblx0XHRjb25zdCBpZCA9IHJlcXVlc3RJZGxlQ2FsbGJhY2soKC4uLmFyZ3MpID0+IHtcblx0XHRcdGlmICghdGhpcy5zaWduYWwuYWJvcnRlZCkgY2FsbGJhY2soLi4uYXJncyk7XG5cdFx0fSwgb3B0aW9ucyk7XG5cdFx0dGhpcy5vbkludmFsaWRhdGVkKCgpID0+IGNhbmNlbElkbGVDYWxsYmFjayhpZCkpO1xuXHRcdHJldHVybiBpZDtcblx0fVxuXHRhZGRFdmVudExpc3RlbmVyKHRhcmdldCwgdHlwZSwgaGFuZGxlciwgb3B0aW9ucykge1xuXHRcdGlmICh0eXBlID09PSBcInd4dDpsb2NhdGlvbmNoYW5nZVwiKSB7XG5cdFx0XHRpZiAodGhpcy5pc1ZhbGlkKSB0aGlzLmxvY2F0aW9uV2F0Y2hlci5ydW4oKTtcblx0XHR9XG5cdFx0dGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXI/Lih0eXBlLnN0YXJ0c1dpdGgoXCJ3eHQ6XCIpID8gZ2V0VW5pcXVlRXZlbnROYW1lKHR5cGUpIDogdHlwZSwgaGFuZGxlciwge1xuXHRcdFx0Li4ub3B0aW9ucyxcblx0XHRcdHNpZ25hbDogdGhpcy5zaWduYWxcblx0XHR9KTtcblx0fVxuXHQvKipcblx0KiBAaW50ZXJuYWxcblx0KiBBYm9ydCB0aGUgYWJvcnQgY29udHJvbGxlciBhbmQgZXhlY3V0ZSBhbGwgYG9uSW52YWxpZGF0ZWRgIGxpc3RlbmVycy5cblx0Ki9cblx0bm90aWZ5SW52YWxpZGF0ZWQoKSB7XG5cdFx0dGhpcy5hYm9ydChcIkNvbnRlbnQgc2NyaXB0IGNvbnRleHQgaW52YWxpZGF0ZWRcIik7XG5cdFx0bG9nZ2VyLmRlYnVnKGBDb250ZW50IHNjcmlwdCBcIiR7dGhpcy5jb250ZW50U2NyaXB0TmFtZX1cIiBjb250ZXh0IGludmFsaWRhdGVkYCk7XG5cdH1cblx0c3RvcE9sZFNjcmlwdHMoKSB7XG5cdFx0ZG9jdW1lbnQuZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQoQ29udGVudFNjcmlwdENvbnRleHQuU0NSSVBUX1NUQVJURURfTUVTU0FHRV9UWVBFLCB7IGRldGFpbDoge1xuXHRcdFx0Y29udGVudFNjcmlwdE5hbWU6IHRoaXMuY29udGVudFNjcmlwdE5hbWUsXG5cdFx0XHRtZXNzYWdlSWQ6IHRoaXMuaWRcblx0XHR9IH0pKTtcblx0XHR3aW5kb3cucG9zdE1lc3NhZ2Uoe1xuXHRcdFx0dHlwZTogQ29udGVudFNjcmlwdENvbnRleHQuU0NSSVBUX1NUQVJURURfTUVTU0FHRV9UWVBFLFxuXHRcdFx0Y29udGVudFNjcmlwdE5hbWU6IHRoaXMuY29udGVudFNjcmlwdE5hbWUsXG5cdFx0XHRtZXNzYWdlSWQ6IHRoaXMuaWRcblx0XHR9LCBcIipcIik7XG5cdH1cblx0dmVyaWZ5U2NyaXB0U3RhcnRlZEV2ZW50KGV2ZW50KSB7XG5cdFx0Y29uc3QgaXNTYW1lQ29udGVudFNjcmlwdCA9IGV2ZW50LmRldGFpbD8uY29udGVudFNjcmlwdE5hbWUgPT09IHRoaXMuY29udGVudFNjcmlwdE5hbWU7XG5cdFx0Y29uc3QgaXNGcm9tU2VsZiA9IGV2ZW50LmRldGFpbD8ubWVzc2FnZUlkID09PSB0aGlzLmlkO1xuXHRcdHJldHVybiBpc1NhbWVDb250ZW50U2NyaXB0ICYmICFpc0Zyb21TZWxmO1xuXHR9XG5cdGxpc3RlbkZvck5ld2VyU2NyaXB0cygpIHtcblx0XHRjb25zdCBjYiA9IChldmVudCkgPT4ge1xuXHRcdFx0aWYgKCEoZXZlbnQgaW5zdGFuY2VvZiBDdXN0b21FdmVudCkgfHwgIXRoaXMudmVyaWZ5U2NyaXB0U3RhcnRlZEV2ZW50KGV2ZW50KSkgcmV0dXJuO1xuXHRcdFx0dGhpcy5ub3RpZnlJbnZhbGlkYXRlZCgpO1xuXHRcdH07XG5cdFx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihDb250ZW50U2NyaXB0Q29udGV4dC5TQ1JJUFRfU1RBUlRFRF9NRVNTQUdFX1RZUEUsIGNiKTtcblx0XHR0aGlzLm9uSW52YWxpZGF0ZWQoKCkgPT4gZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihDb250ZW50U2NyaXB0Q29udGV4dC5TQ1JJUFRfU1RBUlRFRF9NRVNTQUdFX1RZUEUsIGNiKSk7XG5cdH1cbn07XG4vLyNlbmRyZWdpb25cbmV4cG9ydCB7IENvbnRlbnRTY3JpcHRDb250ZXh0IH07XG4iXSwieF9nb29nbGVfaWdub3JlTGlzdCI6WzAsMSwyLDUsNiw3LDhdLCJtYXBwaW5ncyI6Ijs7Q0FDQSxTQUFTLG9CQUFvQixZQUFZO0FBQ3hDLFNBQU87Ozs7Ozs7Ozs7Ozs7Ozs7OztDRWNSLElBQU0sVURmaUIsV0FBVyxTQUFTLFNBQVMsS0FDaEQsV0FBVyxVQUNYLFdBQVc7OztDRURmLElBQWEscUJBQWIsTUFBYSxtQkFBbUI7RUFFL0IsT0FBTyx1QkFBZ0M7R0FDdEMsTUFBTSxNQUFNLE9BQU8sU0FBUztBQUs1QixVQUhzQixtQ0FHRCxLQUFLLElBQUksSUFEVCxpQ0FDMEIsS0FBSyxJQUFJOztFQUd6RCxPQUFPLDJCQUE2RTtHQUNuRixNQUFNLE1BQU0sSUFBSSxJQUFJLE9BQU8sU0FBUyxLQUFLO0dBQ3pDLElBQUksVUFBVTtHQUNkLElBQUksUUFBUTtBQUNaLE9BQUksaUNBQWlDLEtBQUssSUFBSSxLQUFLLEVBQUU7QUFFcEQsY0FBVSxJQUFJLGFBQWEsSUFBSSxNQUFNO0FBQ3JDLFlBQVEsSUFBSSxhQUFhLElBQUksUUFBUTtVQUMvQjtJQUVOLE1BQU0sWUFBWSxJQUFJLFNBQVMsTUFBTSxJQUFJO0FBQ3pDLGNBQVUsVUFBVSxNQUFNO0FBQzFCLFlBQVEsVUFBVSxNQUFNOztBQUd6QixVQUFPO0lBQ047SUFDQTtJQUNBOztFQUdGLGFBQWEsaUJBQTBDO0FBQzFDLE9BQUksSUFBSSxPQUFPLFNBQVMsS0FBSztHQUN6QyxNQUFNLEVBQUUsU0FBUyxVQUFVLEtBQUssMEJBQTBCO0dBRTFELE1BQU0sZUFBZSw4Q0FBOEMsUUFBUSxRQUFRO0FBRW5GLE9BQUk7SUFDSCxNQUFNLFdBQVcsTUFBTSxNQUFNLGFBQWE7QUFDMUMsUUFBSSxDQUFDLFNBQVMsR0FBSSxPQUFNLElBQUksTUFBTSw4QkFBOEI7SUFDaEUsTUFBTSxPQUFPLE1BQU0sU0FBUyxNQUFNO0FBRWxDLFdBQU87S0FDTixTQUFTLEtBQUssa0JBQWtCLEtBQUssYUFBYTtLQUNsRCxPQUFPLEtBQUs7S0FDWixhQUFhLEtBQUs7S0FDbEIsVUFBVSxLQUFLLFNBQVM7S0FDeEIsS0FBSyxPQUFPLFNBQVM7S0FDckIsUUFBUSxLQUFLLFNBQVMsR0FBRyxLQUFLLE9BQU8sU0FBUyxHQUFHLEtBQUssT0FBTyxVQUFVLEtBQUE7S0FDdkUsUUFBUTtLQUNSO1lBQ08sT0FBTztBQUNmLFlBQVEsTUFBTSxvREFBb0QsTUFBTTtBQUN4RSxXQUFPOzs7RUFJVCxPQUFPLGlCQUEwQjtHQUNoQyxNQUFNLE1BQU0sT0FBTyxTQUFTO0dBQzVCLE1BQU0sWUFBWSxJQUFJLElBQUksSUFBSTtHQUM5QixJQUFJLEVBQUUsWUFBWSxLQUFLLDBCQUEwQjtBQUNqRCxPQUFJLENBQUMsUUFBUyxXQUFVLFVBQVUsU0FBUyxNQUFNLElBQUksQ0FBQztHQUd0RCxNQUFNLGlCQUFpQjtJQUN0QjtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0s7SUFDTDtJQUNBO0dBRUQsSUFBSSxRQUFRO0FBQ1osUUFBSyxNQUFNLFlBQVksZ0JBQWdCO0lBQ3RDLE1BQU0sS0FBSyxTQUFTLGNBQWMsU0FBUztBQUMzQyxRQUFJLElBQUksYUFBYTtBQUNwQixhQUFRLEdBQUcsWUFBWSxNQUFNO0FBQzdCOzs7R0FLRixNQUFNLHVCQUF1QjtJQUM1QjtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0dBRUQsSUFBSSxjQUFjO0FBQ2xCLFFBQUssTUFBTSxZQUFZLHNCQUFzQjtJQUM1QyxNQUFNLEtBQUssU0FBUyxjQUFjLFNBQVM7QUFDM0MsUUFBSSxJQUFJLGFBQWE7QUFDcEIsbUJBQWMsR0FBRyxZQUFZLE1BQU07QUFDbkM7OztHQUtGLE1BQU0sb0JBQW9CO0lBQ3pCO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7R0FFRCxJQUFJLFdBQVc7QUFDZixRQUFLLE1BQU0sWUFBWSxtQkFBbUI7SUFDekMsTUFBTSxLQUFLLFNBQVMsY0FBYyxTQUFTO0FBQzNDLFFBQUksSUFBSSxhQUFhO0FBQ3BCLGdCQUFXLEdBQUcsWUFBWSxNQUFNO0FBQ2hDOzs7R0FJRixNQUFNLGtCQUFrQjtJQUN2QjtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNLO0lBQ0w7SUFDQTtJQUNBO0dBRUQsSUFBSSxTQUFTO0FBQ2IsUUFBSyxNQUFNLFlBQVksaUJBQWlCO0lBQ3ZDLE1BQU0sS0FBSyxTQUFTLGNBQWMsU0FBUztBQUMzQyxRQUFJLElBQUksYUFBYTtBQUNwQixjQUFTLEdBQUcsWUFBWSxNQUFNO0FBQzlCOzs7QUFJRixVQUFPO0lBQ04sU0FBUyxLQUFLLGtCQUFrQixRQUFRO0lBQ3hDO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQSxRQUFRO0lBQ1I7O0VBR0YsT0FBTyxnQkFBeUI7QUFFL0IsVUFBTztJQUNOLFNBQVM7SUFDVCxPQUFPO0lBQ1AsYUFBYTtJQUNiLEtBQUssT0FBTyxTQUFTO0lBQ3JCLFFBQVE7SUFDUjs7Ozs7Ozs7O0VBVUYsT0FBTyxpQkFBMEI7QUFLaEMsVUFIZ0IsbUJBQW1CLGdCQUFnQjs7RUFNcEQsT0FBZSxrQkFBa0IsU0FBeUI7QUFDekQsVUFBTyxRQUNMLE1BQU0sSUFBSSxDQUNWLEtBQUksU0FBUSxLQUFLLE9BQU8sRUFBRSxDQUFDLGFBQWEsR0FBRyxLQUFLLE1BQU0sRUFBRSxDQUFDLENBQ3pELEtBQUssSUFBSTs7RUFHWixPQUFPLHNCQUE4QztBQVFwRCxRQUFLLE1BQU0sWUFQTztJQUNqQjtJQUNBO0lBQ0E7SUFDQTtJQUNBLEVBRWlDO0lBQ2pDLE1BQU0sT0FBTyxTQUFTLGNBQWMsU0FBUztBQUM3QyxRQUFJLEtBQU0sUUFBTzs7QUFHbEIsVUFBTzs7Ozs7Q0N0TlQsSUFBQSxrQkFBQTtDQUNBLElBQUEsaUJBQUE7Q0FDQSxJQUFBLGFBQUE7Q0FDQSxJQUFBLFdBQUE7Q0FFQSxJQUFBLGtCQUFBLG9CQUFBOzs7Ozs7Ozs7Ozs7QUFjWSxRQUFBLFNBQUEsZUFBQSxtQkFBQSxDQUFBOztBQUVBLFVBQUEsS0FBQTtBQUNBLFVBQUEsY0FBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBaUlBLGFBQUEsS0FBQSxZQUFBLE1BQUE7Ozs7QUFLQSxXQUFBLFVBQUEsUUFBQSx1QkFBQSxDQUFBLE1BQUEsUUFBQSxlQUFBLElBQUEsT0FBQSxjQUFBOzs7QUFNQSxRQUFBLFNBQUEsZUFBQSxXQUFBLENBQUE7O0FBR0EsWUFBQSxLQUFBOztBQUdBLFFBQUEsS0FBQTtBQUNBLFFBQUEsUUFBQTtBQUNBLFFBQUEsWUFBQTtBQUNBLFFBQUEsaUJBQUEsU0FBQSxVQUFBOztBQUdBLFlBQUEsS0FBQTtBQUNBLFlBQUEsUUFBQTtBQUNBLFlBQUEsWUFBQTtBQUNBLFlBQUEsaUJBQUEsVUFBQSxNQUFBO0FBQ0ksT0FBQSxpQkFBQTtBQUNBLG9CQUFBOztBQUdKLFFBQUEsWUFBQSxRQUFBO0FBQ0EsWUFBQSxZQUFBLElBQUE7QUFDQSxhQUFBLEtBQUEsWUFBQSxRQUFBOzs7O0FBS0EsUUFBQSxDQUFBLFFBQUE7QUFDQSxZQUFBLFVBQUEsSUFBQSx3QkFBQTtBQUNBLFlBQUEsaUJBQUEsc0JBQUEsUUFBQSxRQUFBLEVBQUEsRUFBQSxNQUFBLE1BQUEsQ0FBQTs7O0FBTUEsUUFBQSxTQUFBLGVBQUEsU0FBQSxDQUFBOztBQUdBLFlBQUEsS0FBQSxHQUFBLFNBQUE7QUFDQSxZQUFBLGlCQUFBLFNBQUEsV0FBQTtBQUNBLGFBQUEsS0FBQSxZQUFBLFFBQUE7OztBQUlBLFdBQUEsS0FBQTtBQUNBLFdBQUEsTUFBQSxRQUFBLFFBQUEsT0FBQSxjQUFBO0FBQ0EsV0FBQSxRQUFBO0FBQ0EsV0FBQSxNQUFBLE1BQUEsR0FBQSxTQUFBO0FBQ0EsV0FBQSxNQUFBLFFBQUE7QUFDQSxhQUFBLEtBQUEsWUFBQSxPQUFBOzs7OztBQU9BLFFBQUEsT0FBQTtBQUNJLFdBQUEsVUFBQSxJQUFBLDBCQUFBO0FBQ0EsV0FBQSxpQkFBQSxzQkFBQSxNQUFBLFFBQUEsRUFBQSxFQUFBLE1BQUEsTUFBQSxDQUFBOztBQUlKLFFBQUEsU0FBQTtBQUNJLGFBQUEsVUFBQSxJQUFBLDRCQUFBO0FBQ0EsYUFBQSxpQkFBQSxzQkFBQSxRQUFBLFFBQUEsRUFBQSxFQUFBLE1BQUEsTUFBQSxDQUFBOzs7Ozs7QUFhSixRQUFBLGlCQUFBLEtBQUEsSUFBQSxDQUNJLFdBQUEsbUJBQUEsZ0JBQUE7QUFHSixRQUFBLFFBQ0ksU0FBQSxRQUFBLFlBQUE7Ozs7O0FBTVIsV0FBQSxRQUFBLFVBQUEsYUFBQSxZQUFBO0FBQ0ksUUFBQSxRQUFBLFNBQUEsZ0JBQ0ksbUJBQUE7QUFFSixRQUFBLFFBQUEsU0FBQSxjQUNJLGFBQUE7O0FBSVIsaUJBQUE7QUFDQSx5QkFBQTtBQUNBLHFCQUFBOzs7OztDQ3ZRUixTQUFTQyxRQUFNLFFBQVEsR0FBRyxNQUFNO0FBRS9CLE1BQUksT0FBTyxLQUFLLE9BQU8sU0FBVSxRQUFPLFNBQVMsS0FBSyxPQUFPLElBQUksR0FBRyxLQUFLO01BQ3BFLFFBQU8sU0FBUyxHQUFHLEtBQUs7OztDQUc5QixJQUFNQyxXQUFTO0VBQ2QsUUFBUSxHQUFHLFNBQVNELFFBQU0sUUFBUSxPQUFPLEdBQUcsS0FBSztFQUNqRCxNQUFNLEdBQUcsU0FBU0EsUUFBTSxRQUFRLEtBQUssR0FBRyxLQUFLO0VBQzdDLE9BQU8sR0FBRyxTQUFTQSxRQUFNLFFBQVEsTUFBTSxHQUFHLEtBQUs7RUFDL0MsUUFBUSxHQUFHLFNBQVNBLFFBQU0sUUFBUSxPQUFPLEdBQUcsS0FBSztFQUNqRDs7O0NDVkQsSUFBSSx5QkFBeUIsTUFBTSwrQkFBK0IsTUFBTTtFQUN2RSxPQUFPLGFBQWEsbUJBQW1CLHFCQUFxQjtFQUM1RCxZQUFZLFFBQVEsUUFBUTtBQUMzQixTQUFNLHVCQUF1QixZQUFZLEVBQUUsQ0FBQztBQUM1QyxRQUFLLFNBQVM7QUFDZCxRQUFLLFNBQVM7Ozs7Ozs7Q0FPaEIsU0FBUyxtQkFBbUIsV0FBVztBQUN0QyxTQUFPLEdBQUcsU0FBUyxTQUFTLEdBQUcsV0FBaUM7Ozs7Q0NiakUsSUFBTSx3QkFBd0IsT0FBTyxXQUFXLFlBQVkscUJBQXFCOzs7Ozs7Q0FNakYsU0FBUyxzQkFBc0IsS0FBSztFQUNuQyxJQUFJO0VBQ0osSUFBSSxXQUFXO0FBQ2YsU0FBTyxFQUFFLE1BQU07QUFDZCxPQUFJLFNBQVU7QUFDZCxjQUFXO0FBQ1gsYUFBVSxJQUFJLElBQUksU0FBUyxLQUFLO0FBQ2hDLE9BQUksc0JBQXVCLFlBQVcsV0FBVyxpQkFBaUIsYUFBYSxVQUFVO0lBQ3hGLE1BQU0sU0FBUyxJQUFJLElBQUksTUFBTSxZQUFZLElBQUk7QUFDN0MsUUFBSSxPQUFPLFNBQVMsUUFBUSxLQUFNO0FBQ2xDLFdBQU8sY0FBYyxJQUFJLHVCQUF1QixRQUFRLFFBQVEsQ0FBQztBQUNqRSxjQUFVO01BQ1IsRUFBRSxRQUFRLElBQUksUUFBUSxDQUFDO09BQ3JCLEtBQUksa0JBQWtCO0lBQzFCLE1BQU0sU0FBUyxJQUFJLElBQUksU0FBUyxLQUFLO0FBQ3JDLFFBQUksT0FBTyxTQUFTLFFBQVEsTUFBTTtBQUNqQyxZQUFPLGNBQWMsSUFBSSx1QkFBdUIsUUFBUSxRQUFRLENBQUM7QUFDakUsZUFBVTs7TUFFVCxJQUFJO0tBQ0w7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQ1NKLElBQUksdUJBQXVCLE1BQU0scUJBQXFCO0VBQ3JELE9BQU8sOEJBQThCLG1CQUFtQiw2QkFBNkI7RUFDckY7RUFDQTtFQUNBLGtCQUFrQixzQkFBc0IsS0FBSztFQUM3QyxZQUFZLG1CQUFtQixTQUFTO0FBQ3ZDLFFBQUssb0JBQW9CO0FBQ3pCLFFBQUssVUFBVTtBQUNmLFFBQUssS0FBSyxLQUFLLFFBQVEsQ0FBQyxTQUFTLEdBQUcsQ0FBQyxNQUFNLEVBQUU7QUFDN0MsUUFBSyxrQkFBa0IsSUFBSSxpQkFBaUI7QUFDNUMsUUFBSyxnQkFBZ0I7QUFDckIsUUFBSyx1QkFBdUI7O0VBRTdCLElBQUksU0FBUztBQUNaLFVBQU8sS0FBSyxnQkFBZ0I7O0VBRTdCLE1BQU0sUUFBUTtBQUNiLFVBQU8sS0FBSyxnQkFBZ0IsTUFBTSxPQUFPOztFQUUxQyxJQUFJLFlBQVk7QUFDZixPQUFJLFFBQVEsU0FBUyxNQUFNLEtBQU0sTUFBSyxtQkFBbUI7QUFDekQsVUFBTyxLQUFLLE9BQU87O0VBRXBCLElBQUksVUFBVTtBQUNiLFVBQU8sQ0FBQyxLQUFLOzs7Ozs7Ozs7Ozs7Ozs7O0VBZ0JkLGNBQWMsSUFBSTtBQUNqQixRQUFLLE9BQU8saUJBQWlCLFNBQVMsR0FBRztBQUN6QyxnQkFBYSxLQUFLLE9BQU8sb0JBQW9CLFNBQVMsR0FBRzs7Ozs7Ozs7Ozs7OztFQWExRCxRQUFRO0FBQ1AsVUFBTyxJQUFJLGNBQWMsR0FBRzs7Ozs7Ozs7RUFRN0IsWUFBWSxTQUFTLFNBQVM7R0FDN0IsTUFBTSxLQUFLLGtCQUFrQjtBQUM1QixRQUFJLEtBQUssUUFBUyxVQUFTO01BQ3pCLFFBQVE7QUFDWCxRQUFLLG9CQUFvQixjQUFjLEdBQUcsQ0FBQztBQUMzQyxVQUFPOzs7Ozs7OztFQVFSLFdBQVcsU0FBUyxTQUFTO0dBQzVCLE1BQU0sS0FBSyxpQkFBaUI7QUFDM0IsUUFBSSxLQUFLLFFBQVMsVUFBUztNQUN6QixRQUFRO0FBQ1gsUUFBSyxvQkFBb0IsYUFBYSxHQUFHLENBQUM7QUFDMUMsVUFBTzs7Ozs7Ozs7O0VBU1Isc0JBQXNCLFVBQVU7R0FDL0IsTUFBTSxLQUFLLHVCQUF1QixHQUFHLFNBQVM7QUFDN0MsUUFBSSxLQUFLLFFBQVMsVUFBUyxHQUFHLEtBQUs7S0FDbEM7QUFDRixRQUFLLG9CQUFvQixxQkFBcUIsR0FBRyxDQUFDO0FBQ2xELFVBQU87Ozs7Ozs7OztFQVNSLG9CQUFvQixVQUFVLFNBQVM7R0FDdEMsTUFBTSxLQUFLLHFCQUFxQixHQUFHLFNBQVM7QUFDM0MsUUFBSSxDQUFDLEtBQUssT0FBTyxRQUFTLFVBQVMsR0FBRyxLQUFLO01BQ3pDLFFBQVE7QUFDWCxRQUFLLG9CQUFvQixtQkFBbUIsR0FBRyxDQUFDO0FBQ2hELFVBQU87O0VBRVIsaUJBQWlCLFFBQVEsTUFBTSxTQUFTLFNBQVM7QUFDaEQsT0FBSSxTQUFTO1FBQ1IsS0FBSyxRQUFTLE1BQUssZ0JBQWdCLEtBQUs7O0FBRTdDLFVBQU8sbUJBQW1CLEtBQUssV0FBVyxPQUFPLEdBQUcsbUJBQW1CLEtBQUssR0FBRyxNQUFNLFNBQVM7SUFDN0YsR0FBRztJQUNILFFBQVEsS0FBSztJQUNiLENBQUM7Ozs7OztFQU1ILG9CQUFvQjtBQUNuQixRQUFLLE1BQU0scUNBQXFDO0FBQ2hELFlBQU8sTUFBTSxtQkFBbUIsS0FBSyxrQkFBa0IsdUJBQXVCOztFQUUvRSxpQkFBaUI7QUFDaEIsWUFBUyxjQUFjLElBQUksWUFBWSxxQkFBcUIsNkJBQTZCLEVBQUUsUUFBUTtJQUNsRyxtQkFBbUIsS0FBSztJQUN4QixXQUFXLEtBQUs7SUFDaEIsRUFBRSxDQUFDLENBQUM7QUFDTCxVQUFPLFlBQVk7SUFDbEIsTUFBTSxxQkFBcUI7SUFDM0IsbUJBQW1CLEtBQUs7SUFDeEIsV0FBVyxLQUFLO0lBQ2hCLEVBQUUsSUFBSTs7RUFFUix5QkFBeUIsT0FBTztHQUMvQixNQUFNLHNCQUFzQixNQUFNLFFBQVEsc0JBQXNCLEtBQUs7R0FDckUsTUFBTSxhQUFhLE1BQU0sUUFBUSxjQUFjLEtBQUs7QUFDcEQsVUFBTyx1QkFBdUIsQ0FBQzs7RUFFaEMsd0JBQXdCO0dBQ3ZCLE1BQU0sTUFBTSxVQUFVO0FBQ3JCLFFBQUksRUFBRSxpQkFBaUIsZ0JBQWdCLENBQUMsS0FBSyx5QkFBeUIsTUFBTSxDQUFFO0FBQzlFLFNBQUssbUJBQW1COztBQUV6QixZQUFTLGlCQUFpQixxQkFBcUIsNkJBQTZCLEdBQUc7QUFDL0UsUUFBSyxvQkFBb0IsU0FBUyxvQkFBb0IscUJBQXFCLDZCQUE2QixHQUFHLENBQUMifQ==