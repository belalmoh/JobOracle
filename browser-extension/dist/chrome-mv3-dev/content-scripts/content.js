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
	//#region lib/utils.ts
	function stripGreenhouseContent(raw) {
		return raw.replace(/^"|"$/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&quot;/g, "\"").replace(/&#39;/g, "'").replace(/&nbsp;/g, " ").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
	}
	//#endregion
	//#region extractors/extractor.ts
	var Extractor = class {
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
	//#region extractors/greenhouse.ts
	var GreenhouseDetector = class extends Extractor {
		isJobApplicationPage() {
			const url = window.location.href;
			return /greenhouse\.io\/[^/]+\/jobs\/\d+/.test(url) || /greenhouse\.io\/embed\/job_app/.test(url);
		}
		getCompanyDetailsFromUrl() {
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
		async extractFromAPI() {
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
					description: JSON.stringify(stripGreenhouseContent(data.content)),
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
		extractFromDom() {
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
				".job-post-location",
				".job__location"
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
		extractFromAI() {
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
		async extractJobData() {
			const JobData = await this.extractFromAPI();
			if (JobData) return JobData;
			const domData = this.extractFromDom();
			if (domData.description) return domData;
			const aiData = this.extractFromAI();
			if (aiData.description) return aiData;
			return {
				company: "Unknown Company",
				title: "Unknown Position",
				description: "",
				url: window.location.href,
				source: "greenhouse"
			};
		}
		capitalizeCompany(company) {
			return company.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
		}
		findApplicationForm() {
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
			"*://*.lever.co/*",
			"*://*.workday.com/*",
			"*://*.myworkdayjobs.com/*"
		],
		main() {
			if (document.__jobOracleLoaded) return;
			document.__jobOracleLoaded = true;
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
          z-index: 2147483646;
          width: 450px;
          max-height: calc(100vh - 32px);
          height: 600px;
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
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
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
          from { opacity: 1; transform: scale(1); }
          to { opacity: 0; transform: scale(0.95); }
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
				const popupHeight = Math.min(600, window.innerHeight - 32);
				let top = wrapperY - popupHeight / 2;
				if (top < 16) top = 16;
				if (top + popupHeight > window.innerHeight - 16) top = window.innerHeight - 16 - popupHeight;
				const iframe = document.createElement("iframe");
				iframe.id = POPUP_ID;
				iframe.src = browser.runtime.getURL("/popup.html");
				iframe.allow = "clipboard-write";
				iframe.style.top = `${top}px`;
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
			async function detectAndSendJob() {
				let jobData = null;
				window.location.href;
				const greenhouseDetector = new GreenhouseDetector();
				if (greenhouseDetector.isJobApplicationPage()) jobData = await greenhouseDetector.extractJobData();
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGVudC5qcyIsIm5hbWVzIjpbImJyb3dzZXIiLCJwcmludCIsImxvZ2dlciJdLCJzb3VyY2VzIjpbIi4uLy4uLy4uL25vZGVfbW9kdWxlcy8ucG5wbS93eHRAMC4yMC4yNV9AdHlwZXMrbm9kZUAyNS42LjBfaml0aUAyLjYuMS9ub2RlX21vZHVsZXMvd3h0L2Rpc3QvdXRpbHMvZGVmaW5lLWNvbnRlbnQtc2NyaXB0Lm1qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy8ucG5wbS9Ad3h0LWRlditicm93c2VyQDAuMS40MC9ub2RlX21vZHVsZXMvQHd4dC1kZXYvYnJvd3Nlci9zcmMvaW5kZXgubWpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzLy5wbnBtL3d4dEAwLjIwLjI1X0B0eXBlcytub2RlQDI1LjYuMF9qaXRpQDIuNi4xL25vZGVfbW9kdWxlcy93eHQvZGlzdC9icm93c2VyLm1qcyIsIi4uLy4uLy4uL2xpYi91dGlscy50cyIsIi4uLy4uLy4uL2V4dHJhY3RvcnMvZXh0cmFjdG9yLnRzIiwiLi4vLi4vLi4vZXh0cmFjdG9ycy9ncmVlbmhvdXNlLnRzIiwiLi4vLi4vLi4vZW50cnlwb2ludHMvY29udGVudC50cyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy8ucG5wbS93eHRAMC4yMC4yNV9AdHlwZXMrbm9kZUAyNS42LjBfaml0aUAyLjYuMS9ub2RlX21vZHVsZXMvd3h0L2Rpc3QvdXRpbHMvaW50ZXJuYWwvbG9nZ2VyLm1qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy8ucG5wbS93eHRAMC4yMC4yNV9AdHlwZXMrbm9kZUAyNS42LjBfaml0aUAyLjYuMS9ub2RlX21vZHVsZXMvd3h0L2Rpc3QvdXRpbHMvaW50ZXJuYWwvY3VzdG9tLWV2ZW50cy5tanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvLnBucG0vd3h0QDAuMjAuMjVfQHR5cGVzK25vZGVAMjUuNi4wX2ppdGlAMi42LjEvbm9kZV9tb2R1bGVzL3d4dC9kaXN0L3V0aWxzL2ludGVybmFsL2xvY2F0aW9uLXdhdGNoZXIubWpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzLy5wbnBtL3d4dEAwLjIwLjI1X0B0eXBlcytub2RlQDI1LjYuMF9qaXRpQDIuNi4xL25vZGVfbW9kdWxlcy93eHQvZGlzdC91dGlscy9jb250ZW50LXNjcmlwdC1jb250ZXh0Lm1qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyNyZWdpb24gc3JjL3V0aWxzL2RlZmluZS1jb250ZW50LXNjcmlwdC50c1xuZnVuY3Rpb24gZGVmaW5lQ29udGVudFNjcmlwdChkZWZpbml0aW9uKSB7XG5cdHJldHVybiBkZWZpbml0aW9uO1xufVxuLy8jZW5kcmVnaW9uXG5leHBvcnQgeyBkZWZpbmVDb250ZW50U2NyaXB0IH07XG4iLCIvLyAjcmVnaW9uIHNuaXBwZXRcbmV4cG9ydCBjb25zdCBicm93c2VyID0gZ2xvYmFsVGhpcy5icm93c2VyPy5ydW50aW1lPy5pZFxuICA/IGdsb2JhbFRoaXMuYnJvd3NlclxuICA6IGdsb2JhbFRoaXMuY2hyb21lO1xuLy8gI2VuZHJlZ2lvbiBzbmlwcGV0XG4iLCJpbXBvcnQgeyBicm93c2VyIGFzIGJyb3dzZXIkMSB9IGZyb20gXCJAd3h0LWRldi9icm93c2VyXCI7XG4vLyNyZWdpb24gc3JjL2Jyb3dzZXIudHNcbi8qKlxuKiBDb250YWlucyB0aGUgYGJyb3dzZXJgIGV4cG9ydCB3aGljaCB5b3Ugc2hvdWxkIHVzZSB0byBhY2Nlc3MgdGhlIGV4dGVuc2lvblxuKiBBUElzIGluIHlvdXIgcHJvamVjdDpcbipcbiogYGBgdHNcbiogaW1wb3J0IHsgYnJvd3NlciB9IGZyb20gJ3d4dC9icm93c2VyJztcbipcbiogYnJvd3Nlci5ydW50aW1lLm9uSW5zdGFsbGVkLmFkZExpc3RlbmVyKCgpID0+IHtcbiogICAvLyAuLi5cbiogfSk7XG4qIGBgYFxuKlxuKiBAbW9kdWxlIHd4dC9icm93c2VyXG4qL1xuY29uc3QgYnJvd3NlciA9IGJyb3dzZXIkMTtcbi8vI2VuZHJlZ2lvblxuZXhwb3J0IHsgYnJvd3NlciB9O1xuIiwiaW1wb3J0IHsgY2xzeCwgdHlwZSBDbGFzc1ZhbHVlIH0gZnJvbSBcImNsc3hcIjtcbmltcG9ydCB7IHR3TWVyZ2UgfSBmcm9tIFwidGFpbHdpbmQtbWVyZ2VcIjtcblxuZXhwb3J0IGZ1bmN0aW9uIGNuKC4uLmlucHV0czogQ2xhc3NWYWx1ZVtdKSB7XG4gICAgcmV0dXJuIHR3TWVyZ2UoY2xzeChpbnB1dHMpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEJyb3dzZXJJZCgpIHtcbiAgICBjb25zdCBrZXkgPSBcImpvX2JpZFwiO1xuICAgIGxldCBpZCA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKGtleSk7XG4gICAgaWYgKCFpZCkge1xuICAgICAgICBpZCA9IGNyeXB0by5yYW5kb21VVUlEKCk7XG4gICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKGtleSwgaWQpO1xuICAgIH1cbiAgICByZXR1cm4gaWQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzdHJpcEdyZWVuaG91c2VDb250ZW50KHJhdzogc3RyaW5nKTogc3RyaW5nIHtcbiAgICByZXR1cm4gcmF3XG4gICAgICAgIC5yZXBsYWNlKC9eXCJ8XCIkL2csIFwiXCIpXG4gICAgICAgIC5yZXBsYWNlKC8mbHQ7L2csIFwiPFwiKVxuICAgICAgICAucmVwbGFjZSgvJmd0Oy9nLCBcIj5cIilcbiAgICAgICAgLnJlcGxhY2UoLyZhbXA7L2csIFwiJlwiKVxuICAgICAgICAucmVwbGFjZSgvJnF1b3Q7L2csICdcIicpXG4gICAgICAgIC5yZXBsYWNlKC8mIzM5Oy9nLCBcIidcIilcbiAgICAgICAgLnJlcGxhY2UoLyZuYnNwOy9nLCBcIiBcIilcbiAgICAgICAgLnJlcGxhY2UoLzxbXj5dKz4vZywgXCJcIilcbiAgICAgICAgLnJlcGxhY2UoL1xccysvZywgXCIgXCIpXG4gICAgICAgIC50cmltKCk7XG59XG4iLCJpbXBvcnQgdHlwZSB7IEpvYkRhdGEgfSBmcm9tIFwiLi4vdHlwZXNcIjtcbmltcG9ydCB7IHN0cmlwR3JlZW5ob3VzZUNvbnRlbnQgfSBmcm9tIFwiLi4vbGliL3V0aWxzXCI7XG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgRXh0cmFjdG9yIHtcbiAgICBhYnN0cmFjdCBpc0pvYkFwcGxpY2F0aW9uUGFnZSgpOiBib29sZWFuO1xuXG4gICAgYWJzdHJhY3QgZ2V0Q29tcGFueURldGFpbHNGcm9tVXJsKCk6IHtcbiAgICAgICAgY29tcGFueTogc3RyaW5nIHwgbnVsbDtcbiAgICAgICAgam9iSWQ6IHN0cmluZyB8IG51bGw7XG4gICAgfTtcblxuICAgIGFic3RyYWN0IGV4dHJhY3RGcm9tQVBJKCk6IFByb21pc2U8Sm9iRGF0YSB8IG51bGw+O1xuXG4gICAgYWJzdHJhY3QgZXh0cmFjdEZyb21Eb20oKTogSm9iRGF0YTtcblxuICAgIGFic3RyYWN0IGV4dHJhY3RGcm9tQUkoKTogSm9iRGF0YTtcblxuICAgIGFic3RyYWN0IGV4dHJhY3RKb2JEYXRhKCk6IFByb21pc2U8Sm9iRGF0YT47XG5cbiAgICBwcml2YXRlIHN0YXRpYyBjYXBpdGFsaXplQ29tcGFueShjb21wYW55OiBzdHJpbmcpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gY29tcGFueVxuICAgICAgICAgICAgLnNwbGl0KFwiLVwiKVxuICAgICAgICAgICAgLm1hcCgod29yZCkgPT4gd29yZC5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHdvcmQuc2xpY2UoMSkpXG4gICAgICAgICAgICAuam9pbihcIiBcIik7XG4gICAgfVxuXG4gICAgc3RhdGljIGZpbmRBcHBsaWNhdGlvbkZvcm0oKTogSFRNTEZvcm1FbGVtZW50IHwgbnVsbCB7XG4gICAgICAgIGNvbnN0IHNlbGVjdG9ycyA9IFtcbiAgICAgICAgICAgIFwiZm9ybSNhcHBsaWNhdGlvbi1mb3JtXCIsXG4gICAgICAgICAgICAnZm9ybVthY3Rpb24qPVwiL2FwcGxpY2F0aW9uc1wiXScsXG4gICAgICAgICAgICAnW2RhdGEtdGVzdGlkPVwiYXBwbGljYXRpb24tZm9ybVwiXScsXG4gICAgICAgICAgICBcImZvcm1cIixcbiAgICAgICAgXTtcblxuICAgICAgICBmb3IgKGNvbnN0IHNlbGVjdG9yIG9mIHNlbGVjdG9ycykge1xuICAgICAgICAgICAgY29uc3QgZm9ybSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3IpIGFzIEhUTUxGb3JtRWxlbWVudDtcbiAgICAgICAgICAgIGlmIChmb3JtKSByZXR1cm4gZm9ybTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn1cbiIsImltcG9ydCB0eXBlIHsgSm9iRGF0YSB9IGZyb20gXCIuLi90eXBlc1wiO1xuaW1wb3J0IHsgc3RyaXBHcmVlbmhvdXNlQ29udGVudCB9IGZyb20gXCIuLi9saWIvdXRpbHNcIjtcbmltcG9ydCB7IEV4dHJhY3RvciB9IGZyb20gXCIuL2V4dHJhY3RvclwiO1xuZXhwb3J0IGNsYXNzIEdyZWVuaG91c2VEZXRlY3RvciBleHRlbmRzIEV4dHJhY3RvciB7XG4gICAgaXNKb2JBcHBsaWNhdGlvblBhZ2UoKTogYm9vbGVhbiB7XG4gICAgICAgIGNvbnN0IHVybCA9IHdpbmRvdy5sb2NhdGlvbi5ocmVmO1xuICAgICAgICAvLyBQYXR0ZXJuIDE6IGpvYi1ib2FyZHMuZ3JlZW5ob3VzZS5pby97Y29tcGFueX0vam9icy97aWR9XG4gICAgICAgIGNvbnN0IGJvYXJkc1BhdHRlcm4gPSAvZ3JlZW5ob3VzZVxcLmlvXFwvW14vXStcXC9qb2JzXFwvXFxkKy87XG4gICAgICAgIC8vIFBhdHRlcm4gMjogam9iLWJvYXJkcy5ncmVlbmhvdXNlLmlvL2VtYmVkL2pvYl9hcHA/Zm9yPXtjb21wYW55fSZqcl9pZD17aWR9XG4gICAgICAgIGNvbnN0IGVtYmVkUGF0dGVybiA9IC9ncmVlbmhvdXNlXFwuaW9cXC9lbWJlZFxcL2pvYl9hcHAvO1xuICAgICAgICByZXR1cm4gYm9hcmRzUGF0dGVybi50ZXN0KHVybCkgfHwgZW1iZWRQYXR0ZXJuLnRlc3QodXJsKTtcbiAgICB9XG5cbiAgICBnZXRDb21wYW55RGV0YWlsc0Zyb21VcmwoKToge1xuICAgICAgICBjb21wYW55OiBzdHJpbmcgfCBudWxsO1xuICAgICAgICBqb2JJZDogc3RyaW5nIHwgbnVsbDtcbiAgICB9IHtcbiAgICAgICAgY29uc3QgdXJsID0gbmV3IFVSTCh3aW5kb3cubG9jYXRpb24uaHJlZik7XG4gICAgICAgIGxldCBjb21wYW55ID0gbnVsbDtcbiAgICAgICAgbGV0IGpvYklkID0gbnVsbDtcbiAgICAgICAgaWYgKC9ncmVlbmhvdXNlXFwuaW9cXC9lbWJlZFxcL2pvYl9hcHAvLnRlc3QodXJsLmhyZWYpKSB7XG4gICAgICAgICAgICAvLyBQYXR0ZXJuIDI6IHF1ZXJ5IHBhcmFtc1xuICAgICAgICAgICAgY29tcGFueSA9IHVybC5zZWFyY2hQYXJhbXMuZ2V0KFwiZm9yXCIpO1xuICAgICAgICAgICAgam9iSWQgPSB1cmwuc2VhcmNoUGFyYW1zLmdldChcImpyX2lkXCIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gUGF0dGVybiAxOiAve2NvbXBhbnl9L2pvYnMve2lkfVxuICAgICAgICAgICAgY29uc3QgcGF0aFBhcnRzID0gdXJsLnBhdGhuYW1lLnNwbGl0KFwiL1wiKTtcbiAgICAgICAgICAgIGNvbXBhbnkgPSBwYXRoUGFydHNbMV0gfHwgbnVsbDtcbiAgICAgICAgICAgIGpvYklkID0gcGF0aFBhcnRzWzNdIHx8IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgY29tcGFueSxcbiAgICAgICAgICAgIGpvYklkLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGFzeW5jIGV4dHJhY3RGcm9tQVBJKCk6IFByb21pc2U8Sm9iRGF0YSB8IG51bGw+IHtcbiAgICAgICAgY29uc3QgdXJsID0gbmV3IFVSTCh3aW5kb3cubG9jYXRpb24uaHJlZik7XG4gICAgICAgIGNvbnN0IHsgY29tcGFueSwgam9iSWQgfSA9IHRoaXMuZ2V0Q29tcGFueURldGFpbHNGcm9tVXJsKCk7XG5cbiAgICAgICAgY29uc3Qgam9iRGV0YWlsVXJsID0gYGh0dHBzOi8vYm9hcmRzLWFwaS5ncmVlbmhvdXNlLmlvL3YxL2JvYXJkcy8ke2NvbXBhbnl9L2pvYnMvJHtqb2JJZH1gO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKGpvYkRldGFpbFVybCk7XG4gICAgICAgICAgICBpZiAoIXJlc3BvbnNlLm9rKSB0aHJvdyBuZXcgRXJyb3IoXCJOZXR3b3JrIHJlc3BvbnNlIHdhcyBub3Qgb2tcIik7XG4gICAgICAgICAgICBjb25zdCBkYXRhID0gYXdhaXQgcmVzcG9uc2UuanNvbigpO1xuXG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGNvbXBhbnk6IHRoaXMuY2FwaXRhbGl6ZUNvbXBhbnkoZGF0YS5jb21wYW55X25hbWUpLFxuICAgICAgICAgICAgICAgIHRpdGxlOiBkYXRhLnRpdGxlLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBKU09OLnN0cmluZ2lmeShcbiAgICAgICAgICAgICAgICAgICAgc3RyaXBHcmVlbmhvdXNlQ29udGVudChkYXRhLmNvbnRlbnQpLFxuICAgICAgICAgICAgICAgICksXG4gICAgICAgICAgICAgICAgbG9jYXRpb246IGRhdGEubG9jYXRpb24ubmFtZSxcbiAgICAgICAgICAgICAgICB1cmw6IHdpbmRvdy5sb2NhdGlvbi5ocmVmLFxuICAgICAgICAgICAgICAgIHNhbGFyeTogZGF0YS5zYWxhcnlcbiAgICAgICAgICAgICAgICAgICAgPyBgJHtkYXRhLnNhbGFyeS5jdXJyZW5jeX0gJHtkYXRhLnNhbGFyeS52YWx1ZX1gXG4gICAgICAgICAgICAgICAgICAgIDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgIHNvdXJjZTogXCJncmVlbmhvdXNlXCIsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcbiAgICAgICAgICAgICAgICBcIkZhaWxlZCB0byBmZXRjaCBqb2IgZGV0YWlscyBmcm9tIEdyZWVuaG91c2UgQVBJOlwiLFxuICAgICAgICAgICAgICAgIGVycm9yLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZXh0cmFjdEZyb21Eb20oKTogSm9iRGF0YSB7XG4gICAgICAgIGNvbnN0IHVybCA9IHdpbmRvdy5sb2NhdGlvbi5ocmVmO1xuICAgICAgICBjb25zdCBwYXJzZWRVcmwgPSBuZXcgVVJMKHVybCk7XG4gICAgICAgIGxldCB7IGNvbXBhbnkgfSA9IHRoaXMuZ2V0Q29tcGFueURldGFpbHNGcm9tVXJsKCk7XG4gICAgICAgIGlmICghY29tcGFueSkgY29tcGFueSA9IHBhcnNlZFVybC5ob3N0bmFtZS5zcGxpdChcIi5cIilbMF07XG5cbiAgICAgICAgLy8gVHJ5IHRvIGV4dHJhY3Qgam9iIHRpdGxlIGZyb20gdmFyaW91cyBzZWxlY3RvcnNcbiAgICAgICAgY29uc3QgdGl0bGVTZWxlY3RvcnMgPSBbXG4gICAgICAgICAgICBcImgxLmFwcC10aXRsZVwiLFxuICAgICAgICAgICAgXCIuYXBwLXRpdGxlXCIsXG4gICAgICAgICAgICAnW2RhdGEtdGVzdGlkPVwiam9iLXRpdGxlXCJdJyxcbiAgICAgICAgICAgIFwiLnBvc3RpbmctdGl0bGVcIixcbiAgICAgICAgICAgIFwiaDEuam9iLXRpdGxlXCIsXG4gICAgICAgICAgICBcImgxLnBvc3RpbmctaGVhZGxpbmVcIixcbiAgICAgICAgICAgIFwiLmpvYi10aXRsZSBoMVwiLFxuICAgICAgICAgICAgJ2gxW2NsYXNzKj1cInRpdGxlXCJdJyxcbiAgICAgICAgICAgIFwiLmpvYnMtdW5pZmllZC10b3AtY2FyZF9fam9iLXRpdGxlXCIsXG4gICAgICAgICAgICBcImgxXCIsXG4gICAgICAgICAgICBcIi5wb3N0aW5nLWhlYWRsaW5lIGgyXCIsXG4gICAgICAgICAgICBcImgyLmpvYi10aXRsZVwiLFxuICAgICAgICAgICAgJ1tkYXRhLWF1dG9tYXRpb24taWQ9XCJqb2JUaXRsZVwiXScsXG4gICAgICAgIF07XG5cbiAgICAgICAgbGV0IHRpdGxlID0gXCJVbmtub3duIFBvc2l0aW9uXCI7XG4gICAgICAgIGZvciAoY29uc3Qgc2VsZWN0b3Igb2YgdGl0bGVTZWxlY3RvcnMpIHtcbiAgICAgICAgICAgIGNvbnN0IGVsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihzZWxlY3Rvcik7XG4gICAgICAgICAgICBpZiAoZWw/LnRleHRDb250ZW50KSB7XG4gICAgICAgICAgICAgICAgdGl0bGUgPSBlbC50ZXh0Q29udGVudC50cmltKCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBFeHRyYWN0IGpvYiBkZXNjcmlwdGlvblxuICAgICAgICBjb25zdCBkZXNjcmlwdGlvblNlbGVjdG9ycyA9IFtcbiAgICAgICAgICAgICdbZGF0YS10ZXN0aWQ9XCJqb2ItZGVzY3JpcHRpb25cIl0nLFxuICAgICAgICAgICAgXCIucG9zdGluZy1kZXNjcmlwdGlvblwiLFxuICAgICAgICAgICAgXCIjam9iLWRlc2NyaXB0aW9uXCIsXG4gICAgICAgICAgICBcIi5hcHAtZGVzY3JpcHRpb25cIixcbiAgICAgICAgICAgIFwiI2NvbnRlbnQgLmpvYi1wb3N0LWNvbnRlbnRcIixcbiAgICAgICAgICAgIFwiI2NvbnRlbnQgI2doX2ppZFwiLFxuICAgICAgICAgICAgXCIuam9iX19kZXNjcmlwdGlvblwiLFxuICAgICAgICAgICAgJ1tjbGFzcyo9XCJqb2ItZGVzY3JpcHRpb25cIl0nLFxuICAgICAgICAgICAgJ1tjbGFzcyo9XCJqb2JEZXNjcmlwdGlvblwiXScsXG4gICAgICAgICAgICAnW2lkKj1cImpvYi1kZXNjcmlwdGlvblwiXScsXG4gICAgICAgICAgICAnW2lkKj1cImpvYkRlc2NyaXB0aW9uXCJdJyxcbiAgICAgICAgICAgICdbY2xhc3MqPVwicG9zdGluZy1kZXNjcmlwdGlvblwiXScsXG4gICAgICAgICAgICAnYXJ0aWNsZVtjbGFzcyo9XCJqb2JcIl0nLFxuICAgICAgICAgICAgXCIuam9iLWRldGFpbHNcIixcbiAgICAgICAgICAgIFwiLmpvYi1jb250ZW50XCIsXG4gICAgICAgICAgICBcIi5kZXNjcmlwdGlvblwiLFxuICAgICAgICBdO1xuXG4gICAgICAgIGxldCBkZXNjcmlwdGlvbiA9IFwiXCI7XG4gICAgICAgIGZvciAoY29uc3Qgc2VsZWN0b3Igb2YgZGVzY3JpcHRpb25TZWxlY3RvcnMpIHtcbiAgICAgICAgICAgIGNvbnN0IGVsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihzZWxlY3Rvcik7XG4gICAgICAgICAgICBpZiAoZWw/LnRleHRDb250ZW50KSB7XG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb24gPSBlbC50ZXh0Q29udGVudC50cmltKCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBFeHRyYWN0IGxvY2F0aW9uIGlmIGF2YWlsYWJsZVxuICAgICAgICBjb25zdCBsb2NhdGlvblNlbGVjdG9ycyA9IFtcbiAgICAgICAgICAgIFwiLmxvY2F0aW9uXCIsXG4gICAgICAgICAgICAnW2RhdGEtdGVzdGlkPVwiam9iLWxvY2F0aW9uXCJdJyxcbiAgICAgICAgICAgIFwiLnBvc3RpbmctbG9jYXRpb25cIixcbiAgICAgICAgICAgIFwiLmpvYi1wb3N0LWxvY2F0aW9uXCIsXG4gICAgICAgICAgICBcIi5qb2JfX2xvY2F0aW9uXCIsXG4gICAgICAgIF07XG5cbiAgICAgICAgbGV0IGxvY2F0aW9uID0gXCJcIjtcbiAgICAgICAgZm9yIChjb25zdCBzZWxlY3RvciBvZiBsb2NhdGlvblNlbGVjdG9ycykge1xuICAgICAgICAgICAgY29uc3QgZWwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHNlbGVjdG9yKTtcbiAgICAgICAgICAgIGlmIChlbD8udGV4dENvbnRlbnQpIHtcbiAgICAgICAgICAgICAgICBsb2NhdGlvbiA9IGVsLnRleHRDb250ZW50LnRyaW0oKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHNhbGFyeVNlbGVjdG9ycyA9IFtcbiAgICAgICAgICAgIFwiLnNhbGFyeVwiLFxuICAgICAgICAgICAgJ1tkYXRhLXRlc3RpZD1cImpvYi1zYWxhcnlcIl0nLFxuICAgICAgICAgICAgXCIucG9zdGluZy1zYWxhcnlcIixcbiAgICAgICAgICAgIFwiLmpvYi1wb3N0LXNhbGFyeVwiLFxuICAgICAgICAgICAgJ1tjbGFzcyo9XCJzYWxhcnlcIl0nLFxuICAgICAgICAgICAgJ1tjbGFzcyo9XCJjb21wZW5zYXRpb25cIl0nLFxuICAgICAgICAgICAgJ1tjbGFzcyo9XCJwYXktcmFuZ2VcIl0nLFxuICAgICAgICAgICAgJ1tjbGFzcyo9XCJwYXlfcmFuZ2VcIl0nLFxuICAgICAgICAgICAgJ1tkYXRhLWZpZWxkPVwic2FsYXJ5XCJdJyxcbiAgICAgICAgICAgICdbZGF0YS1hdXRvbWF0aW9uLWlkPVwic2FsYXJ5XCJdJyxcbiAgICAgICAgXTtcblxuICAgICAgICBsZXQgc2FsYXJ5ID0gXCJcIjtcbiAgICAgICAgZm9yIChjb25zdCBzZWxlY3RvciBvZiBzYWxhcnlTZWxlY3RvcnMpIHtcbiAgICAgICAgICAgIGNvbnN0IGVsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihzZWxlY3Rvcik7XG4gICAgICAgICAgICBpZiAoZWw/LnRleHRDb250ZW50KSB7XG4gICAgICAgICAgICAgICAgc2FsYXJ5ID0gZWwudGV4dENvbnRlbnQudHJpbSgpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGNvbXBhbnk6IHRoaXMuY2FwaXRhbGl6ZUNvbXBhbnkoY29tcGFueSksXG4gICAgICAgICAgICB0aXRsZSxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uLFxuICAgICAgICAgICAgbG9jYXRpb24sXG4gICAgICAgICAgICB1cmwsXG4gICAgICAgICAgICBzYWxhcnksXG4gICAgICAgICAgICBzb3VyY2U6IFwiZ3JlZW5ob3VzZVwiLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGV4dHJhY3RGcm9tQUkoKTogSm9iRGF0YSB7XG4gICAgICAgIC8vIFBsYWNlaG9sZGVyIGZvciBmdXR1cmUgQUktYmFzZWQgZXh0cmFjdGlvbiBpZiBuZWVkZWRcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGNvbXBhbnk6IFwiVW5rbm93biBDb21wYW55XCIsXG4gICAgICAgICAgICB0aXRsZTogXCJVbmtub3duIFBvc2l0aW9uXCIsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJcIixcbiAgICAgICAgICAgIHVybDogd2luZG93LmxvY2F0aW9uLmhyZWYsXG4gICAgICAgICAgICBzb3VyY2U6IFwiZ3JlZW5ob3VzZVwiLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEV4dHJhY3Qgam9iIGRhdGEgdXNpbmcgbXVsdGlwbGUgc3RyYXRlZ2llcyAob3JkZXIgb2YgcmVsaWFiaWxpdHkpOlxuICAgICAqIDEuIEFQSSBleHRyYWN0aW9uIChtb3N0IHJlbGlhYmxlKVxuICAgICAqIDIuIERPTSBwYXJzaW5nIHdpdGggdmFyaW91cyBzZWxlY3RvcnNcbiAgICAgKiAzLiBBSS1iYXNlZCBleHRyYWN0aW9uIChmYWxsYmFjaylcbiAgICAgKiBAcmV0dXJucyBKb2JEYXRhIG9iamVjdCB3aXRoIGV4dHJhY3RlZCBpbmZvcm1hdGlvblxuICAgICAqL1xuICAgIGFzeW5jIGV4dHJhY3RKb2JEYXRhKCk6IFByb21pc2U8Sm9iRGF0YT4ge1xuICAgICAgICBjb25zdCBKb2JEYXRhID0gYXdhaXQgdGhpcy5leHRyYWN0RnJvbUFQSSgpO1xuICAgICAgICBpZiAoSm9iRGF0YSkge1xuICAgICAgICAgICAgcmV0dXJuIEpvYkRhdGEgYXMgSm9iRGF0YTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGRvbURhdGEgPSB0aGlzLmV4dHJhY3RGcm9tRG9tKCk7XG4gICAgICAgIGlmIChkb21EYXRhLmRlc2NyaXB0aW9uKSB7XG4gICAgICAgICAgICByZXR1cm4gZG9tRGF0YSBhcyBKb2JEYXRhO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgYWlEYXRhID0gdGhpcy5leHRyYWN0RnJvbUFJKCk7XG4gICAgICAgIGlmIChhaURhdGEuZGVzY3JpcHRpb24pIHtcbiAgICAgICAgICAgIHJldHVybiBhaURhdGEgYXMgSm9iRGF0YTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIElmIGFsbCBlbHNlIGZhaWxzLCByZXR1cm4gYSBtaW5pbWFsIG9iamVjdCB3aXRoIFVSTCBhbmQgc291cmNlXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBjb21wYW55OiBcIlVua25vd24gQ29tcGFueVwiLFxuICAgICAgICAgICAgdGl0bGU6IFwiVW5rbm93biBQb3NpdGlvblwiLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiXCIsXG4gICAgICAgICAgICB1cmw6IHdpbmRvdy5sb2NhdGlvbi5ocmVmLFxuICAgICAgICAgICAgc291cmNlOiBcImdyZWVuaG91c2VcIixcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBjYXBpdGFsaXplQ29tcGFueShjb21wYW55OiBzdHJpbmcpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gY29tcGFueVxuICAgICAgICAgICAgLnNwbGl0KFwiLVwiKVxuICAgICAgICAgICAgLm1hcCgod29yZCkgPT4gd29yZC5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHdvcmQuc2xpY2UoMSkpXG4gICAgICAgICAgICAuam9pbihcIiBcIik7XG4gICAgfVxuXG4gICAgZmluZEFwcGxpY2F0aW9uRm9ybSgpOiBIVE1MRm9ybUVsZW1lbnQgfCBudWxsIHtcbiAgICAgICAgY29uc3Qgc2VsZWN0b3JzID0gW1xuICAgICAgICAgICAgXCJmb3JtI2FwcGxpY2F0aW9uLWZvcm1cIixcbiAgICAgICAgICAgICdmb3JtW2FjdGlvbio9XCIvYXBwbGljYXRpb25zXCJdJyxcbiAgICAgICAgICAgICdbZGF0YS10ZXN0aWQ9XCJhcHBsaWNhdGlvbi1mb3JtXCJdJyxcbiAgICAgICAgICAgIFwiZm9ybVwiLFxuICAgICAgICBdO1xuXG4gICAgICAgIGZvciAoY29uc3Qgc2VsZWN0b3Igb2Ygc2VsZWN0b3JzKSB7XG4gICAgICAgICAgICBjb25zdCBmb3JtID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihzZWxlY3RvcikgYXMgSFRNTEZvcm1FbGVtZW50O1xuICAgICAgICAgICAgaWYgKGZvcm0pIHJldHVybiBmb3JtO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufVxuIiwiaW1wb3J0IHR5cGUgeyBKb2JEYXRhIH0gZnJvbSBcIkAvdHlwZXNcIjtcbmltcG9ydCB7IEdyZWVuaG91c2VEZXRlY3RvciB9IGZyb20gXCJAL2V4dHJhY3RvcnMvZ3JlZW5ob3VzZVwiO1xuXG5jb25zdCBGTE9BVElOR19CVE5fSUQgPSBcImpvYm9yYWNsZS1mYWJcIjtcbmNvbnN0IERJU01JU1NfQlROX0lEID0gXCJqb2JvcmFjbGUtZGlzbWlzc1wiO1xuY29uc3QgV1JBUFBFUl9JRCA9IFwiam9ib3JhY2xlLWZhYi13cmFwcGVyXCI7XG5jb25zdCBQT1BVUF9JRCA9IFwiam9ib3JhY2xlLXBvcHVwXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbnRlbnRTY3JpcHQoe1xuICAgIG1hdGNoZXM6IFtcbiAgICAgICAgXCIqOi8vKi5ncmVlbmhvdXNlLmlvLypcIixcbiAgICAgICAgXCIqOi8vKi5sZXZlci5jby8qXCIsXG4gICAgICAgIFwiKjovLyoud29ya2RheS5jb20vKlwiLFxuICAgICAgICBcIio6Ly8qLm15d29ya2RheWpvYnMuY29tLypcIixcbiAgICBdLFxuICAgIG1haW4oKSB7XG4gICAgICAgIC8vIEd1YXJkIGFnYWluc3QgZG91YmxlLWluamVjdGlvbiAoV1hUIEhNUiwgb3ZlcmxhcHBpbmcgbWF0Y2hlcywgZXRjLilcbiAgICAgICAgaWYgKChkb2N1bWVudCBhcyBhbnkpLl9fam9iT3JhY2xlTG9hZGVkKSByZXR1cm47XG4gICAgICAgIChkb2N1bWVudCBhcyBhbnkpLl9fam9iT3JhY2xlTG9hZGVkID0gdHJ1ZTtcblxuICAgICAgICBsZXQgcG9wdXBPcGVuID0gZmFsc2U7XG5cbiAgICAgICAgZnVuY3Rpb24gaW5qZWN0U3R5bGVzKCkge1xuICAgICAgICAgICAgaWYgKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiam9ib3JhY2xlLXN0eWxlc1wiKSkgcmV0dXJuO1xuICAgICAgICAgICAgY29uc3Qgc3R5bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3R5bGVcIik7XG4gICAgICAgICAgICBzdHlsZS5pZCA9IFwiam9ib3JhY2xlLXN0eWxlc1wiO1xuICAgICAgICAgICAgc3R5bGUudGV4dENvbnRlbnQgPSBgXG4gICAgICAgICMke1dSQVBQRVJfSUR9IHtcbiAgICAgICAgICBwb3NpdGlvbjogZml4ZWQ7XG4gICAgICAgICAgdG9wOiA1MCU7XG4gICAgICAgICAgcmlnaHQ6IDE2cHg7XG4gICAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGVZKC01MCUpO1xuICAgICAgICAgIHotaW5kZXg6IDIxNDc0ODM2NDc7XG4gICAgICAgICAgYW5pbWF0aW9uOiBqb2JPcmFjbGVGYWJJbiAwLjM1cyBjdWJpYy1iZXppZXIoMC4zNCwxLjU2LDAuNjQsMSkgYm90aDtcbiAgICAgICAgfVxuICAgICAgICAjJHtGTE9BVElOR19CVE5fSUR9IHtcbiAgICAgICAgICB3aWR0aDogNDRweDtcbiAgICAgICAgICBoZWlnaHQ6IDQ0cHg7XG4gICAgICAgICAgYm9yZGVyLXJhZGl1czogNTAlO1xuICAgICAgICAgIGJvcmRlcjogbm9uZTtcbiAgICAgICAgICBiYWNrZ3JvdW5kOiBva2xjaCgwLjQ1NyAwLjI0IDI3Ny4wMjMpO1xuICAgICAgICAgIGNvbG9yOiB3aGl0ZTtcbiAgICAgICAgICBjdXJzb3I6IHBvaW50ZXI7XG4gICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgICAgIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICAgICAgICAgIGJveC1zaGFkb3c6IDAgNHB4IDE2cHggb2tsY2goMC40NTcgMC4yNCAyNzcuMDIzIC8gMC4zNSksIDAgMXB4IDNweCByZ2JhKDAsMCwwLDAuMTUpO1xuICAgICAgICAgIGZvbnQtZmFtaWx5OiAnSW50ZXInLCBzeXN0ZW0tdWksIHNhbnMtc2VyaWY7XG4gICAgICAgICAgZm9udC1zaXplOiAxM3B4O1xuICAgICAgICAgIGZvbnQtd2VpZ2h0OiA3MDA7XG4gICAgICAgICAgdHJhbnNpdGlvbjogdHJhbnNmb3JtIDAuMnMgY3ViaWMtYmV6aWVyKDAuMzQsMS41NiwwLjY0LDEpLCBib3gtc2hhZG93IDAuMnMgZWFzZTtcbiAgICAgICAgICBwb3NpdGlvbjogcmVsYXRpdmU7XG4gICAgICAgIH1cbiAgICAgICAgIyR7RkxPQVRJTkdfQlROX0lEfTpob3ZlciB7XG4gICAgICAgICAgdHJhbnNmb3JtOiBzY2FsZSgxLjEpO1xuICAgICAgICAgIGJveC1zaGFkb3c6IDAgNnB4IDI0cHggb2tsY2goMC40NTcgMC4yNCAyNzcuMDIzIC8gMC40NSksIDAgMnB4IDZweCByZ2JhKDAsMCwwLDAuMik7XG4gICAgICAgIH1cbiAgICAgICAgIyR7RkxPQVRJTkdfQlROX0lEfTphY3RpdmUge1xuICAgICAgICAgIHRyYW5zZm9ybTogc2NhbGUoMC45NSk7XG4gICAgICAgIH1cbiAgICAgICAgIyR7RkxPQVRJTkdfQlROX0lEfSBzdmcge1xuICAgICAgICAgIHdpZHRoOiAyMHB4O1xuICAgICAgICAgIGhlaWdodDogMjBweDtcbiAgICAgICAgICBmaWxsOiBub25lO1xuICAgICAgICAgIHN0cm9rZTogY3VycmVudENvbG9yO1xuICAgICAgICAgIHN0cm9rZS13aWR0aDogMjtcbiAgICAgICAgICBzdHJva2UtbGluZWNhcDogcm91bmQ7XG4gICAgICAgICAgc3Ryb2tlLWxpbmVqb2luOiByb3VuZDtcbiAgICAgICAgfVxuICAgICAgICAjJHtESVNNSVNTX0JUTl9JRH0ge1xuICAgICAgICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICAgICAgICB0b3A6IC02cHg7XG4gICAgICAgICAgcmlnaHQ6IC02cHg7XG4gICAgICAgICAgd2lkdGg6IDE4cHg7XG4gICAgICAgICAgaGVpZ2h0OiAxOHB4O1xuICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDUwJTtcbiAgICAgICAgICBib3JkZXI6IDJweCBzb2xpZCB3aGl0ZTtcbiAgICAgICAgICBiYWNrZ3JvdW5kOiBva2xjaCgwLjU1MiAwLjAxNiAyODUuOTM4KTtcbiAgICAgICAgICBjb2xvcjogd2hpdGU7XG4gICAgICAgICAgY3Vyc29yOiBwb2ludGVyO1xuICAgICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbiAgICAgICAgICBwYWRkaW5nOiAwO1xuICAgICAgICAgIHRyYW5zaXRpb246IGJhY2tncm91bmQgMC4xNXMgZWFzZSwgdHJhbnNmb3JtIDAuMTVzIGVhc2U7XG4gICAgICAgICAgbGluZS1oZWlnaHQ6IDE7XG4gICAgICAgICAgei1pbmRleDogMTtcbiAgICAgICAgfVxuICAgICAgICAjJHtESVNNSVNTX0JUTl9JRH06aG92ZXIge1xuICAgICAgICAgIGJhY2tncm91bmQ6IG9rbGNoKDAuNTc3IDAuMjQ1IDI3LjMyNSk7XG4gICAgICAgICAgdHJhbnNmb3JtOiBzY2FsZSgxLjE1KTtcbiAgICAgICAgfVxuICAgICAgICAjJHtESVNNSVNTX0JUTl9JRH0gc3ZnIHtcbiAgICAgICAgICB3aWR0aDogOHB4O1xuICAgICAgICAgIGhlaWdodDogOHB4O1xuICAgICAgICAgIHN0cm9rZTogY3VycmVudENvbG9yO1xuICAgICAgICAgIHN0cm9rZS13aWR0aDogMi41O1xuICAgICAgICAgIGZpbGw6IG5vbmU7XG4gICAgICAgICAgc3Ryb2tlLWxpbmVjYXA6IHJvdW5kO1xuICAgICAgICB9XG4gICAgICAgIEBrZXlmcmFtZXMgam9iT3JhY2xlRmFiSW4ge1xuICAgICAgICAgIGZyb20geyBvcGFjaXR5OiAwOyB0cmFuc2Zvcm06IHRyYW5zbGF0ZVkoLTUwJSkgc2NhbGUoMC41KTsgfVxuICAgICAgICAgIHRvIHsgb3BhY2l0eTogMTsgdHJhbnNmb3JtOiB0cmFuc2xhdGVZKC01MCUpIHNjYWxlKDEpOyB9XG4gICAgICAgIH1cbiAgICAgICAgLmpvYm9yYWNsZS13cmFwcGVyLW91dCB7XG4gICAgICAgICAgYW5pbWF0aW9uOiBqb2JPcmFjbGVGYWJPdXQgMC4ycyBlYXNlIGJvdGggIWltcG9ydGFudDtcbiAgICAgICAgfVxuICAgICAgICBAa2V5ZnJhbWVzIGpvYk9yYWNsZUZhYk91dCB7XG4gICAgICAgICAgZnJvbSB7IG9wYWNpdHk6IDE7IHRyYW5zZm9ybTogdHJhbnNsYXRlWSgtNTAlKSBzY2FsZSgxKTsgfVxuICAgICAgICAgIHRvIHsgb3BhY2l0eTogMDsgdHJhbnNmb3JtOiB0cmFuc2xhdGVZKC01MCUpIHNjYWxlKDAuNSk7IH1cbiAgICAgICAgfVxuICAgICAgICAjJHtQT1BVUF9JRH0ge1xuICAgICAgICAgIHBvc2l0aW9uOiBmaXhlZDtcbiAgICAgICAgICB6LWluZGV4OiAyMTQ3NDgzNjQ2O1xuICAgICAgICAgIHdpZHRoOiA0NTBweDtcbiAgICAgICAgICBtYXgtaGVpZ2h0OiBjYWxjKDEwMHZoIC0gMzJweCk7XG4gICAgICAgICAgaGVpZ2h0OiA2MDBweDtcbiAgICAgICAgICBib3JkZXI6IG5vbmU7XG4gICAgICAgICAgYm9yZGVyLXJhZGl1czogMTZweDtcbiAgICAgICAgICBvdmVyZmxvdzogaGlkZGVuO1xuICAgICAgICAgIGJhY2tncm91bmQ6IHdoaXRlO1xuICAgICAgICAgIGJveC1zaGFkb3c6IDAgOHB4IDQwcHggcmdiYSgwLDAsMCwwLjEyKSwgMCAycHggOHB4IHJnYmEoMCwwLDAsMC4wNik7XG4gICAgICAgICAgYW5pbWF0aW9uOiBqb2JPcmFjbGVQb3B1cEluIDAuMjVzIGN1YmljLWJlemllcigwLjIyLDEsMC4zNiwxKSBib3RoO1xuICAgICAgICB9XG4gICAgICAgICMke1BPUFVQX0lEfS1vdmVybGF5IHtcbiAgICAgICAgICBwb3NpdGlvbjogZml4ZWQ7XG4gICAgICAgICAgaW5zZXQ6IDA7XG4gICAgICAgICAgei1pbmRleDogMjE0NzQ4MzY0NTtcbiAgICAgICAgICBiYWNrZ3JvdW5kOiByZ2JhKDAsMCwwLDAuMTUpO1xuICAgICAgICAgIGFuaW1hdGlvbjogam9iT3JhY2xlT3ZlcmxheUluIDAuMnMgZWFzZSBib3RoO1xuICAgICAgICB9XG4gICAgICAgIEBrZXlmcmFtZXMgam9iT3JhY2xlUG9wdXBJbiB7XG4gICAgICAgICAgZnJvbSB7IG9wYWNpdHk6IDA7IHRyYW5zZm9ybTogc2NhbGUoMC45NSk7IH1cbiAgICAgICAgICB0byB7IG9wYWNpdHk6IDE7IHRyYW5zZm9ybTogc2NhbGUoMSk7IH1cbiAgICAgICAgfVxuICAgICAgICBAa2V5ZnJhbWVzIGpvYk9yYWNsZU92ZXJsYXlJbiB7XG4gICAgICAgICAgZnJvbSB7IG9wYWNpdHk6IDA7IH1cbiAgICAgICAgICB0byB7IG9wYWNpdHk6IDE7IH1cbiAgICAgICAgfVxuICAgICAgICAuam9ib3JhY2xlLXBvcHVwLWNsb3Npbmcge1xuICAgICAgICAgIGFuaW1hdGlvbjogam9iT3JhY2xlUG9wdXBPdXQgMC4xNXMgY3ViaWMtYmV6aWVyKDAuMjIsMSwwLjM2LDEpIGJvdGggIWltcG9ydGFudDtcbiAgICAgICAgfVxuICAgICAgICAuam9ib3JhY2xlLW92ZXJsYXktY2xvc2luZyB7XG4gICAgICAgICAgYW5pbWF0aW9uOiBqb2JPcmFjbGVPdmVybGF5T3V0IDAuMTVzIGVhc2UgYm90aCAhaW1wb3J0YW50O1xuICAgICAgICB9XG4gICAgICAgIEBrZXlmcmFtZXMgam9iT3JhY2xlUG9wdXBPdXQge1xuICAgICAgICAgIGZyb20geyBvcGFjaXR5OiAxOyB0cmFuc2Zvcm06IHNjYWxlKDEpOyB9XG4gICAgICAgICAgdG8geyBvcGFjaXR5OiAwOyB0cmFuc2Zvcm06IHNjYWxlKDAuOTUpOyB9XG4gICAgICAgIH1cbiAgICAgICAgQGtleWZyYW1lcyBqb2JPcmFjbGVPdmVybGF5T3V0IHtcbiAgICAgICAgICBmcm9tIHsgb3BhY2l0eTogMTsgfVxuICAgICAgICAgIHRvIHsgb3BhY2l0eTogMDsgfVxuICAgICAgICB9XG4gICAgICBgO1xuICAgICAgICAgICAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzdHlsZSk7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBnZXRXcmFwcGVyWSgpIHtcbiAgICAgICAgICAgIGNvbnN0IHdyYXBwZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChXUkFQUEVSX0lEKTtcbiAgICAgICAgICAgIHJldHVybiB3cmFwcGVyXG4gICAgICAgICAgICAgICAgPyB3cmFwcGVyLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnRvcCArIHdyYXBwZXIub2Zmc2V0SGVpZ2h0IC8gMlxuICAgICAgICAgICAgICAgIDogd2luZG93LmlubmVySGVpZ2h0IC8gMjtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGNyZWF0ZUZsb2F0aW5nQnV0dG9uKCkge1xuICAgICAgICAgICAgaWYgKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFdSQVBQRVJfSUQpKSByZXR1cm47XG5cbiAgICAgICAgICAgIGNvbnN0IHdyYXBwZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgICAgICAgd3JhcHBlci5pZCA9IFdSQVBQRVJfSUQ7XG5cbiAgICAgICAgICAgIGNvbnN0IGJ0biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7XG4gICAgICAgICAgICBidG4uaWQgPSBGTE9BVElOR19CVE5fSUQ7XG4gICAgICAgICAgICBidG4udGl0bGUgPSBcIk9wZW4gSm9iT3JhY2xlXCI7XG4gICAgICAgICAgICBidG4uaW5uZXJIVE1MID0gYDxzdmcgdmlld0JveD1cIjAgMCAyNCAyNFwiIHN0cm9rZS1saW5lY2FwPVwicm91bmRcIiBzdHJva2UtbGluZWpvaW49XCJyb3VuZFwiPjxwYXRoIGQ9XCJNMTIgMkM2LjQ4IDIgMiA2LjQ4IDIgMTJzNC40OCAxMCAxMCAxMCAxMC00LjQ4IDEwLTEwUzE3LjUyIDIgMTIgMnpcIi8+PHBhdGggZD1cIk04IDEybDIgMiA0LTRcIi8+PC9zdmc+YDtcbiAgICAgICAgICAgIGJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgb3BlblBvcHVwKTtcblxuICAgICAgICAgICAgY29uc3QgZGlzbWlzcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7XG4gICAgICAgICAgICBkaXNtaXNzLmlkID0gRElTTUlTU19CVE5fSUQ7XG4gICAgICAgICAgICBkaXNtaXNzLnRpdGxlID0gXCJEaXNtaXNzXCI7XG4gICAgICAgICAgICBkaXNtaXNzLmlubmVySFRNTCA9IGA8c3ZnIHZpZXdCb3g9XCIwIDAgMTAgMTBcIiBzdHJva2UtbGluZWNhcD1cInJvdW5kXCI+PGxpbmUgeDE9XCIyXCIgeTE9XCIyXCIgeDI9XCI4XCIgeTI9XCI4XCIvPjxsaW5lIHgxPVwiOFwiIHkxPVwiMlwiIHgyPVwiMlwiIHkyPVwiOFwiLz48L3N2Zz5gO1xuICAgICAgICAgICAgZGlzbWlzcy5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGUpID0+IHtcbiAgICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgIGRpc21pc3NCdXR0b24oKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBidG4uYXBwZW5kQ2hpbGQoZGlzbWlzcyk7XG4gICAgICAgICAgICB3cmFwcGVyLmFwcGVuZENoaWxkKGJ0bik7XG4gICAgICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHdyYXBwZXIpO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gZGlzbWlzc0J1dHRvbigpIHtcbiAgICAgICAgICAgIGNvbnN0IHdyYXBwZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChXUkFQUEVSX0lEKTtcbiAgICAgICAgICAgIGlmICghd3JhcHBlcikgcmV0dXJuO1xuICAgICAgICAgICAgd3JhcHBlci5jbGFzc0xpc3QuYWRkKFwiam9ib3JhY2xlLXdyYXBwZXItb3V0XCIpO1xuICAgICAgICAgICAgd3JhcHBlci5hZGRFdmVudExpc3RlbmVyKFwiYW5pbWF0aW9uZW5kXCIsICgpID0+IHdyYXBwZXIucmVtb3ZlKCksIHtcbiAgICAgICAgICAgICAgICBvbmNlOiB0cnVlLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBvcGVuUG9wdXAoKSB7XG4gICAgICAgICAgICBpZiAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoUE9QVVBfSUQpKSByZXR1cm47XG5cbiAgICAgICAgICAgIGNvbnN0IG92ZXJsYXkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgICAgICAgb3ZlcmxheS5pZCA9IGAke1BPUFVQX0lEfS1vdmVybGF5YDtcbiAgICAgICAgICAgIG92ZXJsYXkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGNsb3NlUG9wdXApO1xuICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChvdmVybGF5KTtcblxuICAgICAgICAgICAgY29uc3Qgd3JhcHBlclkgPSBnZXRXcmFwcGVyWSgpO1xuICAgICAgICAgICAgY29uc3QgcG9wdXBIZWlnaHQgPSBNYXRoLm1pbig2MDAsIHdpbmRvdy5pbm5lckhlaWdodCAtIDMyKTtcbiAgICAgICAgICAgIC8vIFBvc2l0aW9uIHBvcHVwIHNvIGl0IHN0YXlzIHdpdGhpbiB2aWV3cG9ydFxuICAgICAgICAgICAgbGV0IHRvcCA9IHdyYXBwZXJZIC0gcG9wdXBIZWlnaHQgLyAyO1xuICAgICAgICAgICAgaWYgKHRvcCA8IDE2KSB0b3AgPSAxNjtcbiAgICAgICAgICAgIGlmICh0b3AgKyBwb3B1cEhlaWdodCA+IHdpbmRvdy5pbm5lckhlaWdodCAtIDE2KVxuICAgICAgICAgICAgICAgIHRvcCA9IHdpbmRvdy5pbm5lckhlaWdodCAtIDE2IC0gcG9wdXBIZWlnaHQ7XG5cbiAgICAgICAgICAgIGNvbnN0IGlmcmFtZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJpZnJhbWVcIik7XG4gICAgICAgICAgICBpZnJhbWUuaWQgPSBQT1BVUF9JRDtcbiAgICAgICAgICAgIGlmcmFtZS5zcmMgPSBicm93c2VyLnJ1bnRpbWUuZ2V0VVJMKFwiL3BvcHVwLmh0bWxcIik7XG4gICAgICAgICAgICBpZnJhbWUuYWxsb3cgPSBcImNsaXBib2FyZC13cml0ZVwiO1xuICAgICAgICAgICAgaWZyYW1lLnN0eWxlLnRvcCA9IGAke3RvcH1weGA7XG4gICAgICAgICAgICBpZnJhbWUuc3R5bGUucmlnaHQgPSBcIjY4cHhcIjtcbiAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoaWZyYW1lKTtcbiAgICAgICAgICAgIHBvcHVwT3BlbiA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBjbG9zZVBvcHVwKCkge1xuICAgICAgICAgICAgY29uc3QgcG9wdXAgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChQT1BVUF9JRCk7XG4gICAgICAgICAgICBjb25zdCBvdmVybGF5ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoYCR7UE9QVVBfSUR9LW92ZXJsYXlgKTtcbiAgICAgICAgICAgIGlmIChwb3B1cCkge1xuICAgICAgICAgICAgICAgIHBvcHVwLmNsYXNzTGlzdC5hZGQoXCJqb2JvcmFjbGUtcG9wdXAtY2xvc2luZ1wiKTtcbiAgICAgICAgICAgICAgICBwb3B1cC5hZGRFdmVudExpc3RlbmVyKFwiYW5pbWF0aW9uZW5kXCIsICgpID0+IHBvcHVwLnJlbW92ZSgpLCB7XG4gICAgICAgICAgICAgICAgICAgIG9uY2U6IHRydWUsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAob3ZlcmxheSkge1xuICAgICAgICAgICAgICAgIG92ZXJsYXkuY2xhc3NMaXN0LmFkZChcImpvYm9yYWNsZS1vdmVybGF5LWNsb3NpbmdcIik7XG4gICAgICAgICAgICAgICAgb3ZlcmxheS5hZGRFdmVudExpc3RlbmVyKFxuICAgICAgICAgICAgICAgICAgICBcImFuaW1hdGlvbmVuZFwiLFxuICAgICAgICAgICAgICAgICAgICAoKSA9PiBvdmVybGF5LnJlbW92ZSgpLFxuICAgICAgICAgICAgICAgICAgICB7IG9uY2U6IHRydWUgfSxcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcG9wdXBPcGVuID0gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBhc3luYyBmdW5jdGlvbiBkZXRlY3RBbmRTZW5kSm9iKCkge1xuICAgICAgICAgICAgbGV0IGpvYkRhdGE6IEpvYkRhdGEgfCBudWxsID0gbnVsbDtcblxuICAgICAgICAgICAgY29uc3QgdXJsID0gd2luZG93LmxvY2F0aW9uLmhyZWY7XG5cbiAgICAgICAgICAgIGNvbnN0IGdyZWVuaG91c2VEZXRlY3RvciA9IG5ldyBHcmVlbmhvdXNlRGV0ZWN0b3IoKTtcblxuICAgICAgICAgICAgaWYgKGdyZWVuaG91c2VEZXRlY3Rvci5pc0pvYkFwcGxpY2F0aW9uUGFnZSgpKSB7XG4gICAgICAgICAgICAgICAgam9iRGF0YSA9IGF3YWl0IGdyZWVuaG91c2VEZXRlY3Rvci5leHRyYWN0Sm9iRGF0YSgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoam9iRGF0YSkge1xuICAgICAgICAgICAgICAgIGJyb3dzZXIucnVudGltZVxuICAgICAgICAgICAgICAgICAgICAuc2VuZE1lc3NhZ2UoeyB0eXBlOiBcIkpPQl9ERVRFQ1RFRFwiLCBkYXRhOiBqb2JEYXRhIH0pXG4gICAgICAgICAgICAgICAgICAgIC5jYXRjaCgoKSA9PiB7fSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBicm93c2VyLnJ1bnRpbWUub25NZXNzYWdlLmFkZExpc3RlbmVyKChtZXNzYWdlKSA9PiB7XG4gICAgICAgICAgICBpZiAobWVzc2FnZS50eXBlID09PSBcIkNIRUNLX0ZPUl9KT0JcIikge1xuICAgICAgICAgICAgICAgIGRldGVjdEFuZFNlbmRKb2IoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChtZXNzYWdlLnR5cGUgPT09IFwiQ0xPU0VfUE9QVVBcIikge1xuICAgICAgICAgICAgICAgIGNsb3NlUG9wdXAoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgaW5qZWN0U3R5bGVzKCk7XG4gICAgICAgIGNyZWF0ZUZsb2F0aW5nQnV0dG9uKCk7XG4gICAgICAgIGRldGVjdEFuZFNlbmRKb2IoKTtcbiAgICB9LFxufSk7XG4iLCIvLyNyZWdpb24gc3JjL3V0aWxzL2ludGVybmFsL2xvZ2dlci50c1xuZnVuY3Rpb24gcHJpbnQobWV0aG9kLCAuLi5hcmdzKSB7XG5cdGlmIChpbXBvcnQubWV0YS5lbnYuTU9ERSA9PT0gXCJwcm9kdWN0aW9uXCIpIHJldHVybjtcblx0aWYgKHR5cGVvZiBhcmdzWzBdID09PSBcInN0cmluZ1wiKSBtZXRob2QoYFt3eHRdICR7YXJncy5zaGlmdCgpfWAsIC4uLmFyZ3MpO1xuXHRlbHNlIG1ldGhvZChcIlt3eHRdXCIsIC4uLmFyZ3MpO1xufVxuLyoqIFdyYXBwZXIgYXJvdW5kIGBjb25zb2xlYCB3aXRoIGEgXCJbd3h0XVwiIHByZWZpeCAqL1xuY29uc3QgbG9nZ2VyID0ge1xuXHRkZWJ1ZzogKC4uLmFyZ3MpID0+IHByaW50KGNvbnNvbGUuZGVidWcsIC4uLmFyZ3MpLFxuXHRsb2c6ICguLi5hcmdzKSA9PiBwcmludChjb25zb2xlLmxvZywgLi4uYXJncyksXG5cdHdhcm46ICguLi5hcmdzKSA9PiBwcmludChjb25zb2xlLndhcm4sIC4uLmFyZ3MpLFxuXHRlcnJvcjogKC4uLmFyZ3MpID0+IHByaW50KGNvbnNvbGUuZXJyb3IsIC4uLmFyZ3MpXG59O1xuLy8jZW5kcmVnaW9uXG5leHBvcnQgeyBsb2dnZXIgfTtcbiIsImltcG9ydCB7IGJyb3dzZXIgfSBmcm9tIFwid3h0L2Jyb3dzZXJcIjtcbi8vI3JlZ2lvbiBzcmMvdXRpbHMvaW50ZXJuYWwvY3VzdG9tLWV2ZW50cy50c1xudmFyIFd4dExvY2F0aW9uQ2hhbmdlRXZlbnQgPSBjbGFzcyBXeHRMb2NhdGlvbkNoYW5nZUV2ZW50IGV4dGVuZHMgRXZlbnQge1xuXHRzdGF0aWMgRVZFTlRfTkFNRSA9IGdldFVuaXF1ZUV2ZW50TmFtZShcInd4dDpsb2NhdGlvbmNoYW5nZVwiKTtcblx0Y29uc3RydWN0b3IobmV3VXJsLCBvbGRVcmwpIHtcblx0XHRzdXBlcihXeHRMb2NhdGlvbkNoYW5nZUV2ZW50LkVWRU5UX05BTUUsIHt9KTtcblx0XHR0aGlzLm5ld1VybCA9IG5ld1VybDtcblx0XHR0aGlzLm9sZFVybCA9IG9sZFVybDtcblx0fVxufTtcbi8qKlxuKiBSZXR1cm5zIGFuIGV2ZW50IG5hbWUgdW5pcXVlIHRvIHRoZSBleHRlbnNpb24gYW5kIGNvbnRlbnQgc2NyaXB0IHRoYXQnc1xuKiBydW5uaW5nLlxuKi9cbmZ1bmN0aW9uIGdldFVuaXF1ZUV2ZW50TmFtZShldmVudE5hbWUpIHtcblx0cmV0dXJuIGAke2Jyb3dzZXI/LnJ1bnRpbWU/LmlkfToke2ltcG9ydC5tZXRhLmVudi5FTlRSWVBPSU5UfToke2V2ZW50TmFtZX1gO1xufVxuLy8jZW5kcmVnaW9uXG5leHBvcnQgeyBXeHRMb2NhdGlvbkNoYW5nZUV2ZW50LCBnZXRVbmlxdWVFdmVudE5hbWUgfTtcbiIsImltcG9ydCB7IFd4dExvY2F0aW9uQ2hhbmdlRXZlbnQgfSBmcm9tIFwiLi9jdXN0b20tZXZlbnRzLm1qc1wiO1xuLy8jcmVnaW9uIHNyYy91dGlscy9pbnRlcm5hbC9sb2NhdGlvbi13YXRjaGVyLnRzXG5jb25zdCBzdXBwb3J0c05hdmlnYXRpb25BcGkgPSB0eXBlb2YgZ2xvYmFsVGhpcy5uYXZpZ2F0aW9uPy5hZGRFdmVudExpc3RlbmVyID09PSBcImZ1bmN0aW9uXCI7XG4vKipcbiogQ3JlYXRlIGEgdXRpbCB0aGF0IHdhdGNoZXMgZm9yIFVSTCBjaGFuZ2VzLCBkaXNwYXRjaGluZyB0aGUgY3VzdG9tIGV2ZW50IHdoZW5cbiogZGV0ZWN0ZWQuIFN0b3BzIHdhdGNoaW5nIHdoZW4gY29udGVudCBzY3JpcHQgaXMgaW52YWxpZGF0ZWQuIFVzZXMgTmF2aWdhdGlvblxuKiBBUEkgd2hlbiBhdmFpbGFibGUsIG90aGVyd2lzZSBmYWxscyBiYWNrIHRvIHBvbGxpbmcuXG4qL1xuZnVuY3Rpb24gY3JlYXRlTG9jYXRpb25XYXRjaGVyKGN0eCkge1xuXHRsZXQgbGFzdFVybDtcblx0bGV0IHdhdGNoaW5nID0gZmFsc2U7XG5cdHJldHVybiB7IHJ1bigpIHtcblx0XHRpZiAod2F0Y2hpbmcpIHJldHVybjtcblx0XHR3YXRjaGluZyA9IHRydWU7XG5cdFx0bGFzdFVybCA9IG5ldyBVUkwobG9jYXRpb24uaHJlZik7XG5cdFx0aWYgKHN1cHBvcnRzTmF2aWdhdGlvbkFwaSkgZ2xvYmFsVGhpcy5uYXZpZ2F0aW9uLmFkZEV2ZW50TGlzdGVuZXIoXCJuYXZpZ2F0ZVwiLCAoZXZlbnQpID0+IHtcblx0XHRcdGNvbnN0IG5ld1VybCA9IG5ldyBVUkwoZXZlbnQuZGVzdGluYXRpb24udXJsKTtcblx0XHRcdGlmIChuZXdVcmwuaHJlZiA9PT0gbGFzdFVybC5ocmVmKSByZXR1cm47XG5cdFx0XHR3aW5kb3cuZGlzcGF0Y2hFdmVudChuZXcgV3h0TG9jYXRpb25DaGFuZ2VFdmVudChuZXdVcmwsIGxhc3RVcmwpKTtcblx0XHRcdGxhc3RVcmwgPSBuZXdVcmw7XG5cdFx0fSwgeyBzaWduYWw6IGN0eC5zaWduYWwgfSk7XG5cdFx0ZWxzZSBjdHguc2V0SW50ZXJ2YWwoKCkgPT4ge1xuXHRcdFx0Y29uc3QgbmV3VXJsID0gbmV3IFVSTChsb2NhdGlvbi5ocmVmKTtcblx0XHRcdGlmIChuZXdVcmwuaHJlZiAhPT0gbGFzdFVybC5ocmVmKSB7XG5cdFx0XHRcdHdpbmRvdy5kaXNwYXRjaEV2ZW50KG5ldyBXeHRMb2NhdGlvbkNoYW5nZUV2ZW50KG5ld1VybCwgbGFzdFVybCkpO1xuXHRcdFx0XHRsYXN0VXJsID0gbmV3VXJsO1xuXHRcdFx0fVxuXHRcdH0sIDFlMyk7XG5cdH0gfTtcbn1cbi8vI2VuZHJlZ2lvblxuZXhwb3J0IHsgY3JlYXRlTG9jYXRpb25XYXRjaGVyIH07XG4iLCJpbXBvcnQgeyBsb2dnZXIgfSBmcm9tIFwiLi9pbnRlcm5hbC9sb2dnZXIubWpzXCI7XG5pbXBvcnQgeyBnZXRVbmlxdWVFdmVudE5hbWUgfSBmcm9tIFwiLi9pbnRlcm5hbC9jdXN0b20tZXZlbnRzLm1qc1wiO1xuaW1wb3J0IHsgY3JlYXRlTG9jYXRpb25XYXRjaGVyIH0gZnJvbSBcIi4vaW50ZXJuYWwvbG9jYXRpb24td2F0Y2hlci5tanNcIjtcbmltcG9ydCB7IGJyb3dzZXIgfSBmcm9tIFwid3h0L2Jyb3dzZXJcIjtcbi8vI3JlZ2lvbiBzcmMvdXRpbHMvY29udGVudC1zY3JpcHQtY29udGV4dC50c1xuLyoqXG4qIEltcGxlbWVudHNcbiogW2BBYm9ydENvbnRyb2xsZXJgXShodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvQWJvcnRDb250cm9sbGVyKS5cbiogVXNlZCB0byBkZXRlY3QgYW5kIHN0b3AgY29udGVudCBzY3JpcHQgY29kZSB3aGVuIHRoZSBzY3JpcHQgaXMgaW52YWxpZGF0ZWQuXG4qXG4qIEl0IGFsc28gcHJvdmlkZXMgc2V2ZXJhbCB1dGlsaXRpZXMgbGlrZSBgY3R4LnNldFRpbWVvdXRgIGFuZFxuKiBgY3R4LnNldEludGVydmFsYCB0aGF0IHNob3VsZCBiZSB1c2VkIGluIGNvbnRlbnQgc2NyaXB0cyBpbnN0ZWFkIG9mXG4qIGB3aW5kb3cuc2V0VGltZW91dGAgb3IgYHdpbmRvdy5zZXRJbnRlcnZhbGAuXG4qXG4qIFRvIGNyZWF0ZSBjb250ZXh0IGZvciB0ZXN0aW5nLCB5b3UgY2FuIHVzZSB0aGUgY2xhc3MncyBjb25zdHJ1Y3RvcjpcbipcbiogYGBgdHNcbiogaW1wb3J0IHsgQ29udGVudFNjcmlwdENvbnRleHQgfSBmcm9tICd3eHQvdXRpbHMvY29udGVudC1zY3JpcHRzLWNvbnRleHQnO1xuKlxuKiB0ZXN0KCdzdG9yYWdlIGxpc3RlbmVyIHNob3VsZCBiZSByZW1vdmVkIHdoZW4gY29udGV4dCBpcyBpbnZhbGlkYXRlZCcsICgpID0+IHtcbiogICBjb25zdCBjdHggPSBuZXcgQ29udGVudFNjcmlwdENvbnRleHQoJ3Rlc3QnKTtcbiogICBjb25zdCBpdGVtID0gc3RvcmFnZS5kZWZpbmVJdGVtKCdsb2NhbDpjb3VudCcsIHsgZGVmYXVsdFZhbHVlOiAwIH0pO1xuKiAgIGNvbnN0IHdhdGNoZXIgPSB2aS5mbigpO1xuKlxuKiAgIGNvbnN0IHVud2F0Y2ggPSBpdGVtLndhdGNoKHdhdGNoZXIpO1xuKiAgIGN0eC5vbkludmFsaWRhdGVkKHVud2F0Y2gpOyAvLyBMaXN0ZW4gZm9yIGludmFsaWRhdGUgaGVyZVxuKlxuKiAgIGF3YWl0IGl0ZW0uc2V0VmFsdWUoMSk7XG4qICAgZXhwZWN0KHdhdGNoZXIpLnRvQmVDYWxsZWRUaW1lcygxKTtcbiogICBleHBlY3Qod2F0Y2hlcikudG9CZUNhbGxlZFdpdGgoMSwgMCk7XG4qXG4qICAgY3R4Lm5vdGlmeUludmFsaWRhdGVkKCk7IC8vIFVzZSB0aGlzIGZ1bmN0aW9uIHRvIGludmFsaWRhdGUgdGhlIGNvbnRleHRcbiogICBhd2FpdCBpdGVtLnNldFZhbHVlKDIpO1xuKiAgIGV4cGVjdCh3YXRjaGVyKS50b0JlQ2FsbGVkVGltZXMoMSk7XG4qIH0pO1xuKiBgYGBcbiovXG52YXIgQ29udGVudFNjcmlwdENvbnRleHQgPSBjbGFzcyBDb250ZW50U2NyaXB0Q29udGV4dCB7XG5cdHN0YXRpYyBTQ1JJUFRfU1RBUlRFRF9NRVNTQUdFX1RZUEUgPSBnZXRVbmlxdWVFdmVudE5hbWUoXCJ3eHQ6Y29udGVudC1zY3JpcHQtc3RhcnRlZFwiKTtcblx0aWQ7XG5cdGFib3J0Q29udHJvbGxlcjtcblx0bG9jYXRpb25XYXRjaGVyID0gY3JlYXRlTG9jYXRpb25XYXRjaGVyKHRoaXMpO1xuXHRjb25zdHJ1Y3Rvcihjb250ZW50U2NyaXB0TmFtZSwgb3B0aW9ucykge1xuXHRcdHRoaXMuY29udGVudFNjcmlwdE5hbWUgPSBjb250ZW50U2NyaXB0TmFtZTtcblx0XHR0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuXHRcdHRoaXMuaWQgPSBNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zbGljZSgyKTtcblx0XHR0aGlzLmFib3J0Q29udHJvbGxlciA9IG5ldyBBYm9ydENvbnRyb2xsZXIoKTtcblx0XHR0aGlzLnN0b3BPbGRTY3JpcHRzKCk7XG5cdFx0dGhpcy5saXN0ZW5Gb3JOZXdlclNjcmlwdHMoKTtcblx0fVxuXHRnZXQgc2lnbmFsKCkge1xuXHRcdHJldHVybiB0aGlzLmFib3J0Q29udHJvbGxlci5zaWduYWw7XG5cdH1cblx0YWJvcnQocmVhc29uKSB7XG5cdFx0cmV0dXJuIHRoaXMuYWJvcnRDb250cm9sbGVyLmFib3J0KHJlYXNvbik7XG5cdH1cblx0Z2V0IGlzSW52YWxpZCgpIHtcblx0XHRpZiAoYnJvd3Nlci5ydW50aW1lPy5pZCA9PSBudWxsKSB0aGlzLm5vdGlmeUludmFsaWRhdGVkKCk7XG5cdFx0cmV0dXJuIHRoaXMuc2lnbmFsLmFib3J0ZWQ7XG5cdH1cblx0Z2V0IGlzVmFsaWQoKSB7XG5cdFx0cmV0dXJuICF0aGlzLmlzSW52YWxpZDtcblx0fVxuXHQvKipcblx0KiBBZGQgYSBsaXN0ZW5lciB0aGF0IGlzIGNhbGxlZCB3aGVuIHRoZSBjb250ZW50IHNjcmlwdCdzIGNvbnRleHQgaXNcblx0KiBpbnZhbGlkYXRlZC5cblx0KlxuXHQqIEBleGFtcGxlXG5cdCogICBicm93c2VyLnJ1bnRpbWUub25NZXNzYWdlLmFkZExpc3RlbmVyKGNiKTtcblx0KiAgIGNvbnN0IHJlbW92ZUludmFsaWRhdGVkTGlzdGVuZXIgPSBjdHgub25JbnZhbGlkYXRlZCgoKSA9PiB7XG5cdCogICAgIGJyb3dzZXIucnVudGltZS5vbk1lc3NhZ2UucmVtb3ZlTGlzdGVuZXIoY2IpO1xuXHQqICAgfSk7XG5cdCogICAvLyAuLi5cblx0KiAgIHJlbW92ZUludmFsaWRhdGVkTGlzdGVuZXIoKTtcblx0KlxuXHQqIEByZXR1cm5zIEEgZnVuY3Rpb24gdG8gcmVtb3ZlIHRoZSBsaXN0ZW5lci5cblx0Ki9cblx0b25JbnZhbGlkYXRlZChjYikge1xuXHRcdHRoaXMuc2lnbmFsLmFkZEV2ZW50TGlzdGVuZXIoXCJhYm9ydFwiLCBjYik7XG5cdFx0cmV0dXJuICgpID0+IHRoaXMuc2lnbmFsLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJhYm9ydFwiLCBjYik7XG5cdH1cblx0LyoqXG5cdCogUmV0dXJuIGEgcHJvbWlzZSB0aGF0IG5ldmVyIHJlc29sdmVzLiBVc2VmdWwgaWYgeW91IGhhdmUgYW4gYXN5bmMgZnVuY3Rpb25cblx0KiB0aGF0IHNob3VsZG4ndCBydW4gYWZ0ZXIgdGhlIGNvbnRleHQgaXMgZXhwaXJlZC5cblx0KlxuXHQqIEBleGFtcGxlXG5cdCogICBjb25zdCBnZXRWYWx1ZUZyb21TdG9yYWdlID0gYXN5bmMgKCkgPT4ge1xuXHQqICAgICBpZiAoY3R4LmlzSW52YWxpZCkgcmV0dXJuIGN0eC5ibG9jaygpO1xuXHQqXG5cdCogICAgIC8vIC4uLlxuXHQqICAgfTtcblx0Ki9cblx0YmxvY2soKSB7XG5cdFx0cmV0dXJuIG5ldyBQcm9taXNlKCgpID0+IHt9KTtcblx0fVxuXHQvKipcblx0KiBXcmFwcGVyIGFyb3VuZCBgd2luZG93LnNldEludGVydmFsYCB0aGF0IGF1dG9tYXRpY2FsbHkgY2xlYXJzIHRoZSBpbnRlcnZhbFxuXHQqIHdoZW4gaW52YWxpZGF0ZWQuXG5cdCpcblx0KiBJbnRlcnZhbHMgY2FuIGJlIGNsZWFyZWQgYnkgY2FsbGluZyB0aGUgbm9ybWFsIGBjbGVhckludGVydmFsYCBmdW5jdGlvbi5cblx0Ki9cblx0c2V0SW50ZXJ2YWwoaGFuZGxlciwgdGltZW91dCkge1xuXHRcdGNvbnN0IGlkID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xuXHRcdFx0aWYgKHRoaXMuaXNWYWxpZCkgaGFuZGxlcigpO1xuXHRcdH0sIHRpbWVvdXQpO1xuXHRcdHRoaXMub25JbnZhbGlkYXRlZCgoKSA9PiBjbGVhckludGVydmFsKGlkKSk7XG5cdFx0cmV0dXJuIGlkO1xuXHR9XG5cdC8qKlxuXHQqIFdyYXBwZXIgYXJvdW5kIGB3aW5kb3cuc2V0VGltZW91dGAgdGhhdCBhdXRvbWF0aWNhbGx5IGNsZWFycyB0aGUgaW50ZXJ2YWxcblx0KiB3aGVuIGludmFsaWRhdGVkLlxuXHQqXG5cdCogVGltZW91dHMgY2FuIGJlIGNsZWFyZWQgYnkgY2FsbGluZyB0aGUgbm9ybWFsIGBzZXRUaW1lb3V0YCBmdW5jdGlvbi5cblx0Ki9cblx0c2V0VGltZW91dChoYW5kbGVyLCB0aW1lb3V0KSB7XG5cdFx0Y29uc3QgaWQgPSBzZXRUaW1lb3V0KCgpID0+IHtcblx0XHRcdGlmICh0aGlzLmlzVmFsaWQpIGhhbmRsZXIoKTtcblx0XHR9LCB0aW1lb3V0KTtcblx0XHR0aGlzLm9uSW52YWxpZGF0ZWQoKCkgPT4gY2xlYXJUaW1lb3V0KGlkKSk7XG5cdFx0cmV0dXJuIGlkO1xuXHR9XG5cdC8qKlxuXHQqIFdyYXBwZXIgYXJvdW5kIGB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lYCB0aGF0IGF1dG9tYXRpY2FsbHkgY2FuY2Vsc1xuXHQqIHRoZSByZXF1ZXN0IHdoZW4gaW52YWxpZGF0ZWQuXG5cdCpcblx0KiBDYWxsYmFja3MgY2FuIGJlIGNhbmNlbGVkIGJ5IGNhbGxpbmcgdGhlIG5vcm1hbCBgY2FuY2VsQW5pbWF0aW9uRnJhbWVgXG5cdCogZnVuY3Rpb24uXG5cdCovXG5cdHJlcXVlc3RBbmltYXRpb25GcmFtZShjYWxsYmFjaykge1xuXHRcdGNvbnN0IGlkID0gcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCguLi5hcmdzKSA9PiB7XG5cdFx0XHRpZiAodGhpcy5pc1ZhbGlkKSBjYWxsYmFjayguLi5hcmdzKTtcblx0XHR9KTtcblx0XHR0aGlzLm9uSW52YWxpZGF0ZWQoKCkgPT4gY2FuY2VsQW5pbWF0aW9uRnJhbWUoaWQpKTtcblx0XHRyZXR1cm4gaWQ7XG5cdH1cblx0LyoqXG5cdCogV3JhcHBlciBhcm91bmQgYHdpbmRvdy5yZXF1ZXN0SWRsZUNhbGxiYWNrYCB0aGF0IGF1dG9tYXRpY2FsbHkgY2FuY2VscyB0aGVcblx0KiByZXF1ZXN0IHdoZW4gaW52YWxpZGF0ZWQuXG5cdCpcblx0KiBDYWxsYmFja3MgY2FuIGJlIGNhbmNlbGVkIGJ5IGNhbGxpbmcgdGhlIG5vcm1hbCBgY2FuY2VsSWRsZUNhbGxiYWNrYFxuXHQqIGZ1bmN0aW9uLlxuXHQqL1xuXHRyZXF1ZXN0SWRsZUNhbGxiYWNrKGNhbGxiYWNrLCBvcHRpb25zKSB7XG5cdFx0Y29uc3QgaWQgPSByZXF1ZXN0SWRsZUNhbGxiYWNrKCguLi5hcmdzKSA9PiB7XG5cdFx0XHRpZiAoIXRoaXMuc2lnbmFsLmFib3J0ZWQpIGNhbGxiYWNrKC4uLmFyZ3MpO1xuXHRcdH0sIG9wdGlvbnMpO1xuXHRcdHRoaXMub25JbnZhbGlkYXRlZCgoKSA9PiBjYW5jZWxJZGxlQ2FsbGJhY2soaWQpKTtcblx0XHRyZXR1cm4gaWQ7XG5cdH1cblx0YWRkRXZlbnRMaXN0ZW5lcih0YXJnZXQsIHR5cGUsIGhhbmRsZXIsIG9wdGlvbnMpIHtcblx0XHRpZiAodHlwZSA9PT0gXCJ3eHQ6bG9jYXRpb25jaGFuZ2VcIikge1xuXHRcdFx0aWYgKHRoaXMuaXNWYWxpZCkgdGhpcy5sb2NhdGlvbldhdGNoZXIucnVuKCk7XG5cdFx0fVxuXHRcdHRhcmdldC5hZGRFdmVudExpc3RlbmVyPy4odHlwZS5zdGFydHNXaXRoKFwid3h0OlwiKSA/IGdldFVuaXF1ZUV2ZW50TmFtZSh0eXBlKSA6IHR5cGUsIGhhbmRsZXIsIHtcblx0XHRcdC4uLm9wdGlvbnMsXG5cdFx0XHRzaWduYWw6IHRoaXMuc2lnbmFsXG5cdFx0fSk7XG5cdH1cblx0LyoqXG5cdCogQGludGVybmFsXG5cdCogQWJvcnQgdGhlIGFib3J0IGNvbnRyb2xsZXIgYW5kIGV4ZWN1dGUgYWxsIGBvbkludmFsaWRhdGVkYCBsaXN0ZW5lcnMuXG5cdCovXG5cdG5vdGlmeUludmFsaWRhdGVkKCkge1xuXHRcdHRoaXMuYWJvcnQoXCJDb250ZW50IHNjcmlwdCBjb250ZXh0IGludmFsaWRhdGVkXCIpO1xuXHRcdGxvZ2dlci5kZWJ1ZyhgQ29udGVudCBzY3JpcHQgXCIke3RoaXMuY29udGVudFNjcmlwdE5hbWV9XCIgY29udGV4dCBpbnZhbGlkYXRlZGApO1xuXHR9XG5cdHN0b3BPbGRTY3JpcHRzKCkge1xuXHRcdGRvY3VtZW50LmRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KENvbnRlbnRTY3JpcHRDb250ZXh0LlNDUklQVF9TVEFSVEVEX01FU1NBR0VfVFlQRSwgeyBkZXRhaWw6IHtcblx0XHRcdGNvbnRlbnRTY3JpcHROYW1lOiB0aGlzLmNvbnRlbnRTY3JpcHROYW1lLFxuXHRcdFx0bWVzc2FnZUlkOiB0aGlzLmlkXG5cdFx0fSB9KSk7XG5cdFx0d2luZG93LnBvc3RNZXNzYWdlKHtcblx0XHRcdHR5cGU6IENvbnRlbnRTY3JpcHRDb250ZXh0LlNDUklQVF9TVEFSVEVEX01FU1NBR0VfVFlQRSxcblx0XHRcdGNvbnRlbnRTY3JpcHROYW1lOiB0aGlzLmNvbnRlbnRTY3JpcHROYW1lLFxuXHRcdFx0bWVzc2FnZUlkOiB0aGlzLmlkXG5cdFx0fSwgXCIqXCIpO1xuXHR9XG5cdHZlcmlmeVNjcmlwdFN0YXJ0ZWRFdmVudChldmVudCkge1xuXHRcdGNvbnN0IGlzU2FtZUNvbnRlbnRTY3JpcHQgPSBldmVudC5kZXRhaWw/LmNvbnRlbnRTY3JpcHROYW1lID09PSB0aGlzLmNvbnRlbnRTY3JpcHROYW1lO1xuXHRcdGNvbnN0IGlzRnJvbVNlbGYgPSBldmVudC5kZXRhaWw/Lm1lc3NhZ2VJZCA9PT0gdGhpcy5pZDtcblx0XHRyZXR1cm4gaXNTYW1lQ29udGVudFNjcmlwdCAmJiAhaXNGcm9tU2VsZjtcblx0fVxuXHRsaXN0ZW5Gb3JOZXdlclNjcmlwdHMoKSB7XG5cdFx0Y29uc3QgY2IgPSAoZXZlbnQpID0+IHtcblx0XHRcdGlmICghKGV2ZW50IGluc3RhbmNlb2YgQ3VzdG9tRXZlbnQpIHx8ICF0aGlzLnZlcmlmeVNjcmlwdFN0YXJ0ZWRFdmVudChldmVudCkpIHJldHVybjtcblx0XHRcdHRoaXMubm90aWZ5SW52YWxpZGF0ZWQoKTtcblx0XHR9O1xuXHRcdGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoQ29udGVudFNjcmlwdENvbnRleHQuU0NSSVBUX1NUQVJURURfTUVTU0FHRV9UWVBFLCBjYik7XG5cdFx0dGhpcy5vbkludmFsaWRhdGVkKCgpID0+IGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoQ29udGVudFNjcmlwdENvbnRleHQuU0NSSVBUX1NUQVJURURfTUVTU0FHRV9UWVBFLCBjYikpO1xuXHR9XG59O1xuLy8jZW5kcmVnaW9uXG5leHBvcnQgeyBDb250ZW50U2NyaXB0Q29udGV4dCB9O1xuIl0sInhfZ29vZ2xlX2lnbm9yZUxpc3QiOlswLDEsMiw3LDgsOSwxMF0sIm1hcHBpbmdzIjoiOztDQUNBLFNBQVMsb0JBQW9CLFlBQVk7QUFDeEMsU0FBTzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NFY1IsSUFBTSxVRGZpQixXQUFXLFNBQVMsU0FBUyxLQUNoRCxXQUFXLFVBQ1gsV0FBVzs7O0NFY2YsU0FBZ0IsdUJBQXVCLEtBQXFCO0FBQ3hELFNBQU8sSUFDRixRQUFRLFVBQVUsR0FBRyxDQUNyQixRQUFRLFNBQVMs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