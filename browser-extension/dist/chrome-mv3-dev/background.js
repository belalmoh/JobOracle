var background = (function() {
	//#region node_modules/.pnpm/wxt@0.20.25_@types+node@25.6.0_jiti@2.6.1/node_modules/wxt/dist/utils/define-background.mjs
	function defineBackground(arg) {
		if (arg == null || typeof arg === "function") return { main: arg };
		return arg;
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
	/** Convert a base64 string back to an ArrayBuffer */
	function base64ToArrayBuffer(base64) {
		const binary = atob(base64);
		const len = binary.length;
		const bytes = new Uint8Array(len);
		for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
		return bytes.buffer;
	}
	//#endregion
	//#region entrypoints/background.ts
	var background_default = defineBackground(() => {
		browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
			if (message.type === "JOB_DETECTED") {
				browser.storage.local.set({ currentJob: message.data });
				browser.runtime.sendMessage({
					type: "JOB_UPDATED",
					data: message.data
				}).catch(() => {});
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
				browser.tabs.create({ url: browser.runtime.getURL("/settings.html") });
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
		const actionApi = browser.action || globalThis.chrome?.action;
		if (actionApi?.onClicked) actionApi.onClicked.addListener(async (tab) => {
			if (!tab.id) return;
			try {
				await browser.tabs.sendMessage(tab.id, { type: "TOGGLE_SIDEBAR" });
			} catch {
				browser.tabs.create({ url: browser.runtime.getURL("/settings.html") });
			}
		});
	});
	async function handleUploadResume(message, sendResponse) {
		try {
			const { file, ownerId, backendUrl } = message;
			console.log("[JobOracle BG] Received upload request:", {
				name: file.name,
				type: file.type,
				size: file.size,
				base64Length: file.base64.length
			});
			const arrayBuffer = base64ToArrayBuffer(file.base64);
			console.log("[JobOracle BG] Reconstructed ArrayBuffer size:", arrayBuffer.byteLength);
			const reconstructedFile = new File([arrayBuffer], file.name, {
				type: file.type,
				lastModified: Date.now()
			});
			console.log("[JobOracle BG] Reconstructed File:", {
				name: reconstructedFile.name,
				size: reconstructedFile.size,
				type: reconstructedFile.type
			});
			const firstBytes = new Uint8Array(arrayBuffer.slice(0, 5));
			console.log("[JobOracle BG] First 5 bytes:", Array.from(firstBytes).map((b) => b.toString(16).padStart(2, "0")).join(" "));
			const formData = new FormData();
			formData.append("resume", reconstructedFile);
			formData.append("ownerId", ownerId);
			const response = await fetch(`${backendUrl}/resume/upload`, {
				method: "POST",
				body: formData
			});
			console.log("[JobOracle BG] Server response:", response.status);
			if (!response.ok) {
				const errorText = await response.text();
				console.error("[JobOracle BG] Server error body:", errorText);
				throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
			}
			sendResponse({
				success: true,
				data: (await response.json()).data
			});
		} catch (err) {
			const errorMsg = err instanceof Error ? err.message : "Upload failed in background";
			console.error("[JobOracle BG] Upload error:", errorMsg);
			sendResponse({
				success: false,
				error: errorMsg
			});
		}
	}
	async function handleResumeAnalysis(message, sendResponse) {
		try {
			const { backendUrl, ...analysisData } = message;
			const response = await fetch(`${backendUrl}/job/analyze`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(analysisData)
			});
			if (!response.ok) throw new Error(`Match score failed: ${response.status} ${response.statusText}`);
			sendResponse({
				success: true,
				data: await response.json()
			});
		} catch (err) {
			sendResponse({
				success: false,
				error: err instanceof Error ? err.message : "Analysis failed in background"
			});
		}
	}
	//#endregion
	//#region node_modules/.pnpm/@webext-core+match-patterns@1.0.3/node_modules/@webext-core/match-patterns/lib/index.js
	var _MatchPattern = class {
		constructor(matchPattern) {
			if (matchPattern === "<all_urls>") {
				this.isAllUrls = true;
				this.protocolMatches = [..._MatchPattern.PROTOCOLS];
				this.hostnameMatch = "*";
				this.pathnameMatch = "*";
			} else {
				const groups = /(.*):\/\/(.*?)(\/.*)/.exec(matchPattern);
				if (groups == null) throw new InvalidMatchPattern(matchPattern, "Incorrect format");
				const [_, protocol, hostname, pathname] = groups;
				validateProtocol(matchPattern, protocol);
				validateHostname(matchPattern, hostname);
				validatePathname(matchPattern, pathname);
				this.protocolMatches = protocol === "*" ? ["http", "https"] : [protocol];
				this.hostnameMatch = hostname;
				this.pathnameMatch = pathname;
			}
		}
		includes(url) {
			if (this.isAllUrls) return true;
			const u = typeof url === "string" ? new URL(url) : url instanceof Location ? new URL(url.href) : url;
			return !!this.protocolMatches.find((protocol) => {
				if (protocol === "http") return this.isHttpMatch(u);
				if (protocol === "https") return this.isHttpsMatch(u);
				if (protocol === "file") return this.isFileMatch(u);
				if (protocol === "ftp") return this.isFtpMatch(u);
				if (protocol === "urn") return this.isUrnMatch(u);
			});
		}
		isHttpMatch(url) {
			return url.protocol === "http:" && this.isHostPathMatch(url);
		}
		isHttpsMatch(url) {
			return url.protocol === "https:" && this.isHostPathMatch(url);
		}
		isHostPathMatch(url) {
			if (!this.hostnameMatch || !this.pathnameMatch) return false;
			const hostnameMatchRegexs = [this.convertPatternToRegex(this.hostnameMatch), this.convertPatternToRegex(this.hostnameMatch.replace(/^\*\./, ""))];
			const pathnameMatchRegex = this.convertPatternToRegex(this.pathnameMatch);
			return !!hostnameMatchRegexs.find((regex) => regex.test(url.hostname)) && pathnameMatchRegex.test(url.pathname);
		}
		isFileMatch(url) {
			throw Error("Not implemented: file:// pattern matching. Open a PR to add support");
		}
		isFtpMatch(url) {
			throw Error("Not implemented: ftp:// pattern matching. Open a PR to add support");
		}
		isUrnMatch(url) {
			throw Error("Not implemented: urn:// pattern matching. Open a PR to add support");
		}
		convertPatternToRegex(pattern) {
			const starsReplaced = this.escapeForRegex(pattern).replace(/\\\*/g, ".*");
			return RegExp(`^${starsReplaced}$`);
		}
		escapeForRegex(string) {
			return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		}
	};
	var MatchPattern = _MatchPattern;
	MatchPattern.PROTOCOLS = [
		"http",
		"https",
		"file",
		"ftp",
		"urn"
	];
	var InvalidMatchPattern = class extends Error {
		constructor(matchPattern, reason) {
			super(`Invalid match pattern "${matchPattern}": ${reason}`);
		}
	};
	function validateProtocol(matchPattern, protocol) {
		if (!MatchPattern.PROTOCOLS.includes(protocol) && protocol !== "*") throw new InvalidMatchPattern(matchPattern, `${protocol} not a valid protocol (${MatchPattern.PROTOCOLS.join(", ")})`);
	}
	function validateHostname(matchPattern, hostname) {
		if (hostname.includes(":")) throw new InvalidMatchPattern(matchPattern, `Hostname cannot include a port`);
		if (hostname.includes("*") && hostname.length > 1 && !hostname.startsWith("*.")) throw new InvalidMatchPattern(matchPattern, `If using a wildcard (*), it must go at the start of the hostname`);
	}
	function validatePathname(matchPattern, pathname) {}
	//#endregion
	//#region \0virtual:wxt-background-entrypoint?/Users/belal/Desktop/Projects/JobOracle/browser-extension/entrypoints/background.ts
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
	var ws;
	/** Connect to the websocket and listen for messages. */
	function getDevServerWebSocket() {
		if (ws == null) {
			const serverUrl = "ws://localhost:3001";
			logger.debug("Connecting to dev server @", serverUrl);
			ws = new WebSocket(serverUrl, "vite-hmr");
			ws.addWxtEventListener = ws.addEventListener.bind(ws);
			ws.sendCustom = (event, payload) => ws?.send(JSON.stringify({
				type: "custom",
				event,
				payload
			}));
			ws.addEventListener("open", () => {
				logger.debug("Connected to dev server");
			});
			ws.addEventListener("close", () => {
				logger.debug("Disconnected from dev server");
			});
			ws.addEventListener("error", (event) => {
				logger.error("Failed to connect to dev server", event);
			});
			ws.addEventListener("message", (e) => {
				try {
					const message = JSON.parse(e.data);
					if (message.type === "custom") ws?.dispatchEvent(new CustomEvent(message.event, { detail: message.data }));
				} catch (err) {
					logger.error("Failed to handle message", err);
				}
			});
		}
		return ws;
	}
	/** https://developer.chrome.com/blog/longer-esw-lifetimes/ */
	function keepServiceWorkerAlive() {
		setInterval(async () => {
			await browser.runtime.getPlatformInfo();
		}, 5e3);
	}
	function reloadContentScript(payload) {
		if (browser.runtime.getManifest().manifest_version == 2) reloadContentScriptMv2(payload);
		else reloadContentScriptMv3(payload);
	}
	async function reloadContentScriptMv3({ registration, contentScript }) {
		if (registration === "runtime") await reloadRuntimeContentScriptMv3(contentScript);
		else await reloadManifestContentScriptMv3(contentScript);
	}
	async function reloadManifestContentScriptMv3(contentScript) {
		const id = `wxt:${contentScript.js[0]}`;
		logger.log("Reloading content script:", contentScript);
		const registered = await browser.scripting.getRegisteredContentScripts();
		logger.debug("Existing scripts:", registered);
		const existing = registered.find((cs) => cs.id === id);
		if (existing) {
			logger.debug("Updating content script", existing);
			await browser.scripting.updateContentScripts([{
				...contentScript,
				id,
				css: contentScript.css ?? []
			}]);
		} else {
			logger.debug("Registering new content script...");
			await browser.scripting.registerContentScripts([{
				...contentScript,
				id,
				css: contentScript.css ?? []
			}]);
		}
		await reloadTabsForContentScript(contentScript);
	}
	async function reloadRuntimeContentScriptMv3(contentScript) {
		logger.log("Reloading content script:", contentScript);
		const registered = await browser.scripting.getRegisteredContentScripts();
		logger.debug("Existing scripts:", registered);
		const matches = registered.filter((cs) => {
			const hasJs = contentScript.js?.find((js) => cs.js?.includes(js));
			const hasCss = contentScript.css?.find((css) => cs.css?.includes(css));
			return hasJs || hasCss;
		});
		if (matches.length === 0) {
			logger.log("Content script is not registered yet, nothing to reload", contentScript);
			return;
		}
		await browser.scripting.updateContentScripts(matches);
		await reloadTabsForContentScript(contentScript);
	}
	async function reloadTabsForContentScript(contentScript) {
		const allTabs = await browser.tabs.query({});
		const matchPatterns = contentScript.matches.map((match) => new MatchPattern(match));
		const matchingTabs = allTabs.filter((tab) => {
			const url = tab.url;
			if (!url) return false;
			return !!matchPatterns.find((pattern) => pattern.includes(url));
		});
		await Promise.all(matchingTabs.map(async (tab) => {
			try {
				await browser.tabs.reload(tab.id);
			} catch (err) {
				logger.warn("Failed to reload tab:", err);
			}
		}));
	}
	async function reloadContentScriptMv2(_payload) {
		throw Error("TODO: reloadContentScriptMv2");
	}
	try {
		const ws = getDevServerWebSocket();
		ws.addWxtEventListener("wxt:reload-extension", () => {
			browser.runtime.reload();
		});
		ws.addWxtEventListener("wxt:reload-content-script", (event) => {
			reloadContentScript(event.detail);
		});
		ws.addEventListener("open", () => ws.sendCustom("wxt:background-initialized"));
		keepServiceWorkerAlive();
	} catch (err) {
		logger.error("Failed to setup web socket connection with dev server", err);
	}
	browser.commands.onCommand.addListener((command) => {
		if (command === "wxt:reload-extension") browser.runtime.reload();
	});
	var result;
	try {
		result = background_default.main();
		if (result instanceof Promise) console.warn("The background's main() function return a promise, but it must be synchronous");
	} catch (err) {
		logger.error("The background crashed on startup!");
		throw err;
	}
	//#endregion
	return result;
})();

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFja2dyb3VuZC5qcyIsIm5hbWVzIjpbImJyb3dzZXIiXSwic291cmNlcyI6WyIuLi8uLi9ub2RlX21vZHVsZXMvLnBucG0vd3h0QDAuMjAuMjVfQHR5cGVzK25vZGVAMjUuNi4wX2ppdGlAMi42LjEvbm9kZV9tb2R1bGVzL3d4dC9kaXN0L3V0aWxzL2RlZmluZS1iYWNrZ3JvdW5kLm1qcyIsIi4uLy4uL25vZGVfbW9kdWxlcy8ucG5wbS9Ad3h0LWRlditicm93c2VyQDAuMS40MC9ub2RlX21vZHVsZXMvQHd4dC1kZXYvYnJvd3Nlci9zcmMvaW5kZXgubWpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzLy5wbnBtL3d4dEAwLjIwLjI1X0B0eXBlcytub2RlQDI1LjYuMF9qaXRpQDIuNi4xL25vZGVfbW9kdWxlcy93eHQvZGlzdC9icm93c2VyLm1qcyIsIi4uLy4uL2xpYi91dGlscy50cyIsIi4uLy4uL2VudHJ5cG9pbnRzL2JhY2tncm91bmQudHMiLCIuLi8uLi9ub2RlX21vZHVsZXMvLnBucG0vQHdlYmV4dC1jb3JlK21hdGNoLXBhdHRlcm5zQDEuMC4zL25vZGVfbW9kdWxlcy9Ad2ViZXh0LWNvcmUvbWF0Y2gtcGF0dGVybnMvbGliL2luZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vI3JlZ2lvbiBzcmMvdXRpbHMvZGVmaW5lLWJhY2tncm91bmQudHNcbmZ1bmN0aW9uIGRlZmluZUJhY2tncm91bmQoYXJnKSB7XG5cdGlmIChhcmcgPT0gbnVsbCB8fCB0eXBlb2YgYXJnID09PSBcImZ1bmN0aW9uXCIpIHJldHVybiB7IG1haW46IGFyZyB9O1xuXHRyZXR1cm4gYXJnO1xufVxuLy8jZW5kcmVnaW9uXG5leHBvcnQgeyBkZWZpbmVCYWNrZ3JvdW5kIH07XG4iLCIvLyAjcmVnaW9uIHNuaXBwZXRcbmV4cG9ydCBjb25zdCBicm93c2VyID0gZ2xvYmFsVGhpcy5icm93c2VyPy5ydW50aW1lPy5pZFxuICA/IGdsb2JhbFRoaXMuYnJvd3NlclxuICA6IGdsb2JhbFRoaXMuY2hyb21lO1xuLy8gI2VuZHJlZ2lvbiBzbmlwcGV0XG4iLCJpbXBvcnQgeyBicm93c2VyIGFzIGJyb3dzZXIkMSB9IGZyb20gXCJAd3h0LWRldi9icm93c2VyXCI7XG4vLyNyZWdpb24gc3JjL2Jyb3dzZXIudHNcbi8qKlxuKiBDb250YWlucyB0aGUgYGJyb3dzZXJgIGV4cG9ydCB3aGljaCB5b3Ugc2hvdWxkIHVzZSB0byBhY2Nlc3MgdGhlIGV4dGVuc2lvblxuKiBBUElzIGluIHlvdXIgcHJvamVjdDpcbipcbiogYGBgdHNcbiogaW1wb3J0IHsgYnJvd3NlciB9IGZyb20gJ3d4dC9icm93c2VyJztcbipcbiogYnJvd3Nlci5ydW50aW1lLm9uSW5zdGFsbGVkLmFkZExpc3RlbmVyKCgpID0+IHtcbiogICAvLyAuLi5cbiogfSk7XG4qIGBgYFxuKlxuKiBAbW9kdWxlIHd4dC9icm93c2VyXG4qL1xuY29uc3QgYnJvd3NlciA9IGJyb3dzZXIkMTtcbi8vI2VuZHJlZ2lvblxuZXhwb3J0IHsgYnJvd3NlciB9O1xuIiwiaW1wb3J0IHsgY2xzeCwgdHlwZSBDbGFzc1ZhbHVlIH0gZnJvbSBcImNsc3hcIjtcbmltcG9ydCB7IHR3TWVyZ2UgfSBmcm9tIFwidGFpbHdpbmQtbWVyZ2VcIjtcblxuZXhwb3J0IGZ1bmN0aW9uIGNuKC4uLmlucHV0czogQ2xhc3NWYWx1ZVtdKSB7XG4gICAgcmV0dXJuIHR3TWVyZ2UoY2xzeCguLi5pbnB1dHMpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEJyb3dzZXJJZCgpIHtcbiAgICBjb25zdCBrZXkgPSBcImpvX2JpZFwiO1xuICAgIGxldCBpZCA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKGtleSk7XG4gICAgaWYgKCFpZCkge1xuICAgICAgICBpZCA9IGNyeXB0by5yYW5kb21VVUlEKCk7XG4gICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKGtleSwgaWQpO1xuICAgIH1cbiAgICByZXR1cm4gaWQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzdHJpcEdyZWVuaG91c2VDb250ZW50KHJhdzogc3RyaW5nKTogc3RyaW5nIHtcbiAgICByZXR1cm4gcmF3XG4gICAgICAgIC5yZXBsYWNlKC9eXCJ8XCIkL2csIFwiXCIpXG4gICAgICAgIC5yZXBsYWNlKC8mbHQ7L2csIFwiPFwiKVxuICAgICAgICAucmVwbGFjZSgvJmd0Oy9nLCBcIj5cIilcbiAgICAgICAgLnJlcGxhY2UoLyZhbXA7L2csIFwiJlwiKVxuICAgICAgICAucmVwbGFjZSgvJnF1b3Q7L2csICdcIicpXG4gICAgICAgIC5yZXBsYWNlKC8mIzM5Oy9nLCBcIidcIilcbiAgICAgICAgLnJlcGxhY2UoLyZuYnNwOy9nLCBcIiBcIilcbiAgICAgICAgLnJlcGxhY2UoLzxbXj5dKz4vZywgXCJcIilcbiAgICAgICAgLnJlcGxhY2UoL1xccysvZywgXCIgXCIpXG4gICAgICAgIC50cmltKCk7XG59XG5cbi8qKiBDb252ZXJ0IGFuIEFycmF5QnVmZmVyIHRvIGEgYmFzZTY0IHN0cmluZyAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFycmF5QnVmZmVyVG9CYXNlNjQoYnVmZmVyOiBBcnJheUJ1ZmZlcik6IHN0cmluZyB7XG4gICAgY29uc3QgYnl0ZXMgPSBuZXcgVWludDhBcnJheShidWZmZXIpO1xuICAgIGxldCBiaW5hcnkgPSBcIlwiO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYnl0ZXMuYnl0ZUxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGJpbmFyeSArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ5dGVzW2ldKTtcbiAgICB9XG4gICAgcmV0dXJuIGJ0b2EoYmluYXJ5KTtcbn1cblxuLyoqIENvbnZlcnQgYSBiYXNlNjQgc3RyaW5nIGJhY2sgdG8gYW4gQXJyYXlCdWZmZXIgKi9cbmV4cG9ydCBmdW5jdGlvbiBiYXNlNjRUb0FycmF5QnVmZmVyKGJhc2U2NDogc3RyaW5nKTogQXJyYXlCdWZmZXIge1xuICAgIGNvbnN0IGJpbmFyeSA9IGF0b2IoYmFzZTY0KTtcbiAgICBjb25zdCBsZW4gPSBiaW5hcnkubGVuZ3RoO1xuICAgIGNvbnN0IGJ5dGVzID0gbmV3IFVpbnQ4QXJyYXkobGVuKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgIGJ5dGVzW2ldID0gYmluYXJ5LmNoYXJDb2RlQXQoaSk7XG4gICAgfVxuICAgIHJldHVybiBieXRlcy5idWZmZXI7XG59IiwiaW1wb3J0IHR5cGUgeyBKb2JEYXRhLCBTZXJpYWxpemVkRmlsZSB9IGZyb20gXCJAL3R5cGVzXCI7XG5pbXBvcnQgeyBiYXNlNjRUb0FycmF5QnVmZmVyIH0gZnJvbSBcIkAvbGliL3V0aWxzXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUJhY2tncm91bmQoKCkgPT4ge1xuICAgIGJyb3dzZXIucnVudGltZS5vbk1lc3NhZ2UuYWRkTGlzdGVuZXIoKG1lc3NhZ2UsIF9zZW5kZXIsIHNlbmRSZXNwb25zZSkgPT4ge1xuICAgICAgICBpZiAobWVzc2FnZS50eXBlID09PSBcIkpPQl9ERVRFQ1RFRFwiKSB7XG4gICAgICAgICAgICBicm93c2VyLnN0b3JhZ2UubG9jYWwuc2V0KHsgY3VycmVudEpvYjogbWVzc2FnZS5kYXRhIH0pO1xuICAgICAgICAgICAgYnJvd3Nlci5ydW50aW1lXG4gICAgICAgICAgICAgICAgLnNlbmRNZXNzYWdlKHsgdHlwZTogXCJKT0JfVVBEQVRFRFwiLCBkYXRhOiBtZXNzYWdlLmRhdGEgfSlcbiAgICAgICAgICAgICAgICAuY2F0Y2goKCkgPT4ge30pO1xuICAgICAgICAgICAgc2VuZFJlc3BvbnNlKHsgb2s6IHRydWUgfSk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChtZXNzYWdlLnR5cGUgPT09IFwiR0VUX0NVUlJFTlRfSk9CXCIpIHtcbiAgICAgICAgICAgIGJyb3dzZXIuc3RvcmFnZS5sb2NhbC5nZXQoXCJjdXJyZW50Sm9iXCIpLnRoZW4oKHJlc3VsdCkgPT4ge1xuICAgICAgICAgICAgICAgIHNlbmRSZXNwb25zZSh7IGRhdGE6IHJlc3VsdC5jdXJyZW50Sm9iID8/IG51bGwgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG1lc3NhZ2UudHlwZSA9PT0gXCJPUEVOX1NFVFRJTkdTXCIpIHtcbiAgICAgICAgICAgIGJyb3dzZXIudGFicy5jcmVhdGUoe1xuICAgICAgICAgICAgICAgIHVybDogYnJvd3Nlci5ydW50aW1lLmdldFVSTChcIi9zZXR0aW5ncy5odG1sXCIpLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBzZW5kUmVzcG9uc2UoeyBvazogdHJ1ZSB9KTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG1lc3NhZ2UudHlwZSA9PT0gXCJUT0dHTEVfU0lERUJBUlwiKSB7XG4gICAgICAgICAgICBzZW5kUmVzcG9uc2UoeyBvazogdHJ1ZSB9KTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG1lc3NhZ2UudHlwZSA9PT0gXCJVUExPQURfUkVTVU1FXCIpIHtcbiAgICAgICAgICAgIGhhbmRsZVVwbG9hZFJlc3VtZShtZXNzYWdlLCBzZW5kUmVzcG9uc2UpO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobWVzc2FnZS50eXBlID09PSBcIkdFVF9SRVNVTUVfQU5BTFlTSVNcIikge1xuICAgICAgICAgICAgaGFuZGxlUmVzdW1lQW5hbHlzaXMobWVzc2FnZSwgc2VuZFJlc3BvbnNlKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0pO1xuXG4gICAgLy8gVXNlIGNocm9tZS5hY3Rpb24gZGlyZWN0bHkgZm9yIE1WMyBjb21wYXRpYmlsaXR5XG4gICAgY29uc3QgYWN0aW9uQXBpID0gKGJyb3dzZXIgYXMgYW55KS5hY3Rpb24gfHwgKGdsb2JhbFRoaXMgYXMgYW55KS5jaHJvbWU/LmFjdGlvbjtcbiAgICBpZiAoYWN0aW9uQXBpPy5vbkNsaWNrZWQpIHtcbiAgICAgICAgYWN0aW9uQXBpLm9uQ2xpY2tlZC5hZGRMaXN0ZW5lcihhc3luYyAodGFiOiBhbnkpID0+IHtcbiAgICAgICAgICAgIGlmICghdGFiLmlkKSByZXR1cm47XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGF3YWl0IGJyb3dzZXIudGFicy5zZW5kTWVzc2FnZSh0YWIuaWQsIHsgdHlwZTogXCJUT0dHTEVfU0lERUJBUlwiIH0pO1xuICAgICAgICAgICAgfSBjYXRjaCB7XG4gICAgICAgICAgICAgICAgYnJvd3Nlci50YWJzLmNyZWF0ZSh7XG4gICAgICAgICAgICAgICAgICAgIHVybDogYnJvd3Nlci5ydW50aW1lLmdldFVSTChcIi9zZXR0aW5ncy5odG1sXCIpLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG59KTtcblxuYXN5bmMgZnVuY3Rpb24gaGFuZGxlVXBsb2FkUmVzdW1lKFxuICAgIG1lc3NhZ2U6IHtcbiAgICAgICAgZmlsZTogU2VyaWFsaXplZEZpbGU7XG4gICAgICAgIG93bmVySWQ6IHN0cmluZztcbiAgICAgICAgYmFja2VuZFVybDogc3RyaW5nO1xuICAgIH0sXG4gICAgc2VuZFJlc3BvbnNlOiAocmVzcG9uc2U/OiBhbnkpID0+IHZvaWQsXG4pIHtcbiAgICB0cnkge1xuICAgICAgICBjb25zdCB7IGZpbGUsIG93bmVySWQsIGJhY2tlbmRVcmwgfSA9IG1lc3NhZ2U7XG5cbiAgICAgICAgY29uc29sZS5sb2coXCJbSm9iT3JhY2xlIEJHXSBSZWNlaXZlZCB1cGxvYWQgcmVxdWVzdDpcIiwge1xuICAgICAgICAgICAgbmFtZTogZmlsZS5uYW1lLFxuICAgICAgICAgICAgdHlwZTogZmlsZS50eXBlLFxuICAgICAgICAgICAgc2l6ZTogZmlsZS5zaXplLFxuICAgICAgICAgICAgYmFzZTY0TGVuZ3RoOiBmaWxlLmJhc2U2NC5sZW5ndGgsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIFJlY29uc3RydWN0IGZpbGUgZnJvbSBiYXNlNjRcbiAgICAgICAgY29uc3QgYXJyYXlCdWZmZXIgPSBiYXNlNjRUb0FycmF5QnVmZmVyKGZpbGUuYmFzZTY0KTtcblxuICAgICAgICBjb25zb2xlLmxvZyhcIltKb2JPcmFjbGUgQkddIFJlY29uc3RydWN0ZWQgQXJyYXlCdWZmZXIgc2l6ZTpcIiwgYXJyYXlCdWZmZXIuYnl0ZUxlbmd0aCk7XG5cbiAgICAgICAgY29uc3QgcmVjb25zdHJ1Y3RlZEZpbGUgPSBuZXcgRmlsZShbYXJyYXlCdWZmZXJdLCBmaWxlLm5hbWUsIHtcbiAgICAgICAgICAgIHR5cGU6IGZpbGUudHlwZSxcbiAgICAgICAgICAgIGxhc3RNb2RpZmllZDogRGF0ZS5ub3coKSxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc29sZS5sb2coXCJbSm9iT3JhY2xlIEJHXSBSZWNvbnN0cnVjdGVkIEZpbGU6XCIsIHtcbiAgICAgICAgICAgIG5hbWU6IHJlY29uc3RydWN0ZWRGaWxlLm5hbWUsXG4gICAgICAgICAgICBzaXplOiByZWNvbnN0cnVjdGVkRmlsZS5zaXplLFxuICAgICAgICAgICAgdHlwZTogcmVjb25zdHJ1Y3RlZEZpbGUudHlwZSxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gQ2hlY2sgZmlyc3QgZmV3IGJ5dGVzIGZvciBQREYgbWFnaWMgbnVtYmVyXG4gICAgICAgIGNvbnN0IGZpcnN0Qnl0ZXMgPSBuZXcgVWludDhBcnJheShhcnJheUJ1ZmZlci5zbGljZSgwLCA1KSk7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiW0pvYk9yYWNsZSBCR10gRmlyc3QgNSBieXRlczpcIiwgQXJyYXkuZnJvbShmaXJzdEJ5dGVzKS5tYXAoYiA9PiBiLnRvU3RyaW5nKDE2KS5wYWRTdGFydCgyLCBcIjBcIikpLmpvaW4oXCIgXCIpKTtcblxuICAgICAgICBjb25zdCBmb3JtRGF0YSA9IG5ldyBGb3JtRGF0YSgpO1xuICAgICAgICBmb3JtRGF0YS5hcHBlbmQoXCJyZXN1bWVcIiwgcmVjb25zdHJ1Y3RlZEZpbGUpO1xuICAgICAgICBmb3JtRGF0YS5hcHBlbmQoXCJvd25lcklkXCIsIG93bmVySWQpO1xuXG4gICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2goYCR7YmFja2VuZFVybH0vcmVzdW1lL3VwbG9hZGAsIHtcbiAgICAgICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICAgICAgICBib2R5OiBmb3JtRGF0YSxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc29sZS5sb2coXCJbSm9iT3JhY2xlIEJHXSBTZXJ2ZXIgcmVzcG9uc2U6XCIsIHJlc3BvbnNlLnN0YXR1cyk7XG5cbiAgICAgICAgaWYgKCFyZXNwb25zZS5vaykge1xuICAgICAgICAgICAgY29uc3QgZXJyb3JUZXh0ID0gYXdhaXQgcmVzcG9uc2UudGV4dCgpO1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIltKb2JPcmFjbGUgQkddIFNlcnZlciBlcnJvciBib2R5OlwiLCBlcnJvclRleHQpO1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICAgICAgIGBVcGxvYWQgZmFpbGVkOiAke3Jlc3BvbnNlLnN0YXR1c30gJHtyZXNwb25zZS5zdGF0dXNUZXh0fWAsXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgc2VydmVyUmVzcG9uc2UgPSBhd2FpdCByZXNwb25zZS5qc29uKCk7XG4gICAgICAgIHNlbmRSZXNwb25zZSh7IHN1Y2Nlc3M6IHRydWUsIGRhdGE6IHNlcnZlclJlc3BvbnNlLmRhdGEgfSk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGNvbnN0IGVycm9yTXNnID1cbiAgICAgICAgICAgIGVyciBpbnN0YW5jZW9mIEVycm9yID8gZXJyLm1lc3NhZ2UgOiBcIlVwbG9hZCBmYWlsZWQgaW4gYmFja2dyb3VuZFwiO1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiW0pvYk9yYWNsZSBCR10gVXBsb2FkIGVycm9yOlwiLCBlcnJvck1zZyk7XG4gICAgICAgIHNlbmRSZXNwb25zZSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyb3JNc2cgfSk7XG4gICAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBoYW5kbGVSZXN1bWVBbmFseXNpcyhcbiAgICBtZXNzYWdlOiB7XG4gICAgICAgIGJhY2tlbmRVcmw6IHN0cmluZztcbiAgICAgICAgcmVzdW1lSWQ6IG51bWJlcjtcbiAgICAgICAgb3duZXJJZDogc3RyaW5nO1xuICAgICAgICByZXN1bWVEYXRhOiBhbnk7XG4gICAgICAgIGNvbXBhbnlOYW1lOiBzdHJpbmc7XG4gICAgICAgIHRpdGxlOiBzdHJpbmc7XG4gICAgICAgIGRlc2NyaXB0aW9uOiBzdHJpbmc7XG4gICAgICAgIGxvY2F0aW9uPzogc3RyaW5nO1xuICAgICAgICBzYWxhcnk/OiBudW1iZXI7XG4gICAgICAgIHVybDogc3RyaW5nO1xuICAgIH0sXG4gICAgc2VuZFJlc3BvbnNlOiAocmVzcG9uc2U/OiBhbnkpID0+IHZvaWQsXG4pIHtcbiAgICB0cnkge1xuICAgICAgICBjb25zdCB7IGJhY2tlbmRVcmwsIC4uLmFuYWx5c2lzRGF0YSB9ID0gbWVzc2FnZTtcblxuICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKGAke2JhY2tlbmRVcmx9L2pvYi9hbmFseXplYCwge1xuICAgICAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcbiAgICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICAgICBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIixcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShhbmFseXNpc0RhdGEpLFxuICAgICAgICB9KTtcblxuICAgICAgICBpZiAoIXJlc3BvbnNlLm9rKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgICAgICAgYE1hdGNoIHNjb3JlIGZhaWxlZDogJHtyZXNwb25zZS5zdGF0dXN9ICR7cmVzcG9uc2Uuc3RhdHVzVGV4dH1gLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHNlcnZlclJlc3BvbnNlID0gYXdhaXQgcmVzcG9uc2UuanNvbigpO1xuICAgICAgICBzZW5kUmVzcG9uc2UoeyBzdWNjZXNzOiB0cnVlLCBkYXRhOiBzZXJ2ZXJSZXNwb25zZSB9KTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc3QgZXJyb3JNc2cgPVxuICAgICAgICAgICAgZXJyIGluc3RhbmNlb2YgRXJyb3IgPyBlcnIubWVzc2FnZSA6IFwiQW5hbHlzaXMgZmFpbGVkIGluIGJhY2tncm91bmRcIjtcbiAgICAgICAgc2VuZFJlc3BvbnNlKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnJvck1zZyB9KTtcbiAgICB9XG59IiwiLy8gc3JjL2luZGV4LnRzXG52YXIgX01hdGNoUGF0dGVybiA9IGNsYXNzIHtcbiAgY29uc3RydWN0b3IobWF0Y2hQYXR0ZXJuKSB7XG4gICAgaWYgKG1hdGNoUGF0dGVybiA9PT0gXCI8YWxsX3VybHM+XCIpIHtcbiAgICAgIHRoaXMuaXNBbGxVcmxzID0gdHJ1ZTtcbiAgICAgIHRoaXMucHJvdG9jb2xNYXRjaGVzID0gWy4uLl9NYXRjaFBhdHRlcm4uUFJPVE9DT0xTXTtcbiAgICAgIHRoaXMuaG9zdG5hbWVNYXRjaCA9IFwiKlwiO1xuICAgICAgdGhpcy5wYXRobmFtZU1hdGNoID0gXCIqXCI7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGdyb3VwcyA9IC8oLiopOlxcL1xcLyguKj8pKFxcLy4qKS8uZXhlYyhtYXRjaFBhdHRlcm4pO1xuICAgICAgaWYgKGdyb3VwcyA9PSBudWxsKVxuICAgICAgICB0aHJvdyBuZXcgSW52YWxpZE1hdGNoUGF0dGVybihtYXRjaFBhdHRlcm4sIFwiSW5jb3JyZWN0IGZvcm1hdFwiKTtcbiAgICAgIGNvbnN0IFtfLCBwcm90b2NvbCwgaG9zdG5hbWUsIHBhdGhuYW1lXSA9IGdyb3VwcztcbiAgICAgIHZhbGlkYXRlUHJvdG9jb2wobWF0Y2hQYXR0ZXJuLCBwcm90b2NvbCk7XG4gICAgICB2YWxpZGF0ZUhvc3RuYW1lKG1hdGNoUGF0dGVybiwgaG9zdG5hbWUpO1xuICAgICAgdmFsaWRhdGVQYXRobmFtZShtYXRjaFBhdHRlcm4sIHBhdGhuYW1lKTtcbiAgICAgIHRoaXMucHJvdG9jb2xNYXRjaGVzID0gcHJvdG9jb2wgPT09IFwiKlwiID8gW1wiaHR0cFwiLCBcImh0dHBzXCJdIDogW3Byb3RvY29sXTtcbiAgICAgIHRoaXMuaG9zdG5hbWVNYXRjaCA9IGhvc3RuYW1lO1xuICAgICAgdGhpcy5wYXRobmFtZU1hdGNoID0gcGF0aG5hbWU7XG4gICAgfVxuICB9XG4gIGluY2x1ZGVzKHVybCkge1xuICAgIGlmICh0aGlzLmlzQWxsVXJscylcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIGNvbnN0IHUgPSB0eXBlb2YgdXJsID09PSBcInN0cmluZ1wiID8gbmV3IFVSTCh1cmwpIDogdXJsIGluc3RhbmNlb2YgTG9jYXRpb24gPyBuZXcgVVJMKHVybC5ocmVmKSA6IHVybDtcbiAgICByZXR1cm4gISF0aGlzLnByb3RvY29sTWF0Y2hlcy5maW5kKChwcm90b2NvbCkgPT4ge1xuICAgICAgaWYgKHByb3RvY29sID09PSBcImh0dHBcIilcbiAgICAgICAgcmV0dXJuIHRoaXMuaXNIdHRwTWF0Y2godSk7XG4gICAgICBpZiAocHJvdG9jb2wgPT09IFwiaHR0cHNcIilcbiAgICAgICAgcmV0dXJuIHRoaXMuaXNIdHRwc01hdGNoKHUpO1xuICAgICAgaWYgKHByb3RvY29sID09PSBcImZpbGVcIilcbiAgICAgICAgcmV0dXJuIHRoaXMuaXNGaWxlTWF0Y2godSk7XG4gICAgICBpZiAocHJvdG9jb2wgPT09IFwiZnRwXCIpXG4gICAgICAgIHJldHVybiB0aGlzLmlzRnRwTWF0Y2godSk7XG4gICAgICBpZiAocHJvdG9jb2wgPT09IFwidXJuXCIpXG4gICAgICAgIHJldHVybiB0aGlzLmlzVXJuTWF0Y2godSk7XG4gICAgfSk7XG4gIH1cbiAgaXNIdHRwTWF0Y2godXJsKSB7XG4gICAgcmV0dXJuIHVybC5wcm90b2NvbCA9PT0gXCJodHRwOlwiICYmIHRoaXMuaXNIb3N0UGF0aE1hdGNoKHVybCk7XG4gIH1cbiAgaXNIdHRwc01hdGNoKHVybCkge1xuICAgIHJldHVybiB1cmwucHJvdG9jb2wgPT09IFwiaHR0cHM6XCIgJiYgdGhpcy5pc0hvc3RQYXRoTWF0Y2godXJsKTtcbiAgfVxuICBpc0hvc3RQYXRoTWF0Y2godXJsKSB7XG4gICAgaWYgKCF0aGlzLmhvc3RuYW1lTWF0Y2ggfHwgIXRoaXMucGF0aG5hbWVNYXRjaClcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICBjb25zdCBob3N0bmFtZU1hdGNoUmVnZXhzID0gW1xuICAgICAgdGhpcy5jb252ZXJ0UGF0dGVyblRvUmVnZXgodGhpcy5ob3N0bmFtZU1hdGNoKSxcbiAgICAgIHRoaXMuY29udmVydFBhdHRlcm5Ub1JlZ2V4KHRoaXMuaG9zdG5hbWVNYXRjaC5yZXBsYWNlKC9eXFwqXFwuLywgXCJcIikpXG4gICAgXTtcbiAgICBjb25zdCBwYXRobmFtZU1hdGNoUmVnZXggPSB0aGlzLmNvbnZlcnRQYXR0ZXJuVG9SZWdleCh0aGlzLnBhdGhuYW1lTWF0Y2gpO1xuICAgIHJldHVybiAhIWhvc3RuYW1lTWF0Y2hSZWdleHMuZmluZCgocmVnZXgpID0+IHJlZ2V4LnRlc3QodXJsLmhvc3RuYW1lKSkgJiYgcGF0aG5hbWVNYXRjaFJlZ2V4LnRlc3QodXJsLnBhdGhuYW1lKTtcbiAgfVxuICBpc0ZpbGVNYXRjaCh1cmwpIHtcbiAgICB0aHJvdyBFcnJvcihcIk5vdCBpbXBsZW1lbnRlZDogZmlsZTovLyBwYXR0ZXJuIG1hdGNoaW5nLiBPcGVuIGEgUFIgdG8gYWRkIHN1cHBvcnRcIik7XG4gIH1cbiAgaXNGdHBNYXRjaCh1cmwpIHtcbiAgICB0aHJvdyBFcnJvcihcIk5vdCBpbXBsZW1lbnRlZDogZnRwOi8vIHBhdHRlcm4gbWF0Y2hpbmcuIE9wZW4gYSBQUiB0byBhZGQgc3VwcG9ydFwiKTtcbiAgfVxuICBpc1Vybk1hdGNoKHVybCkge1xuICAgIHRocm93IEVycm9yKFwiTm90IGltcGxlbWVudGVkOiB1cm46Ly8gcGF0dGVybiBtYXRjaGluZy4gT3BlbiBhIFBSIHRvIGFkZCBzdXBwb3J0XCIpO1xuICB9XG4gIGNvbnZlcnRQYXR0ZXJuVG9SZWdleChwYXR0ZXJuKSB7XG4gICAgY29uc3QgZXNjYXBlZCA9IHRoaXMuZXNjYXBlRm9yUmVnZXgocGF0dGVybik7XG4gICAgY29uc3Qgc3RhcnNSZXBsYWNlZCA9IGVzY2FwZWQucmVwbGFjZSgvXFxcXFxcKi9nLCBcIi4qXCIpO1xuICAgIHJldHVybiBSZWdFeHAoYF4ke3N0YXJzUmVwbGFjZWR9JGApO1xuICB9XG4gIGVzY2FwZUZvclJlZ2V4KHN0cmluZykge1xuICAgIHJldHVybiBzdHJpbmcucmVwbGFjZSgvWy4qKz9eJHt9KCl8W1xcXVxcXFxdL2csIFwiXFxcXCQmXCIpO1xuICB9XG59O1xudmFyIE1hdGNoUGF0dGVybiA9IF9NYXRjaFBhdHRlcm47XG5NYXRjaFBhdHRlcm4uUFJPVE9DT0xTID0gW1wiaHR0cFwiLCBcImh0dHBzXCIsIFwiZmlsZVwiLCBcImZ0cFwiLCBcInVyblwiXTtcbnZhciBJbnZhbGlkTWF0Y2hQYXR0ZXJuID0gY2xhc3MgZXh0ZW5kcyBFcnJvciB7XG4gIGNvbnN0cnVjdG9yKG1hdGNoUGF0dGVybiwgcmVhc29uKSB7XG4gICAgc3VwZXIoYEludmFsaWQgbWF0Y2ggcGF0dGVybiBcIiR7bWF0Y2hQYXR0ZXJufVwiOiAke3JlYXNvbn1gKTtcbiAgfVxufTtcbmZ1bmN0aW9uIHZhbGlkYXRlUHJvdG9jb2wobWF0Y2hQYXR0ZXJuLCBwcm90b2NvbCkge1xuICBpZiAoIU1hdGNoUGF0dGVybi5QUk9UT0NPTFMuaW5jbHVkZXMocHJvdG9jb2wpICYmIHByb3RvY29sICE9PSBcIipcIilcbiAgICB0aHJvdyBuZXcgSW52YWxpZE1hdGNoUGF0dGVybihcbiAgICAgIG1hdGNoUGF0dGVybixcbiAgICAgIGAke3Byb3RvY29sfSBub3QgYSB2YWxpZCBwcm90b2NvbCAoJHtNYXRjaFBhdHRlcm4uUFJPVE9DT0xTLmpvaW4oXCIsIFwiKX0pYFxuICAgICk7XG59XG5mdW5jdGlvbiB2YWxpZGF0ZUhvc3RuYW1lKG1hdGNoUGF0dGVybiwgaG9zdG5hbWUpIHtcbiAgaWYgKGhvc3RuYW1lLmluY2x1ZGVzKFwiOlwiKSlcbiAgICB0aHJvdyBuZXcgSW52YWxpZE1hdGNoUGF0dGVybihtYXRjaFBhdHRlcm4sIGBIb3N0bmFtZSBjYW5ub3QgaW5jbHVkZSBhIHBvcnRgKTtcbiAgaWYgKGhvc3RuYW1lLmluY2x1ZGVzKFwiKlwiKSAmJiBob3N0bmFtZS5sZW5ndGggPiAxICYmICFob3N0bmFtZS5zdGFydHNXaXRoKFwiKi5cIikpXG4gICAgdGhyb3cgbmV3IEludmFsaWRNYXRjaFBhdHRlcm4oXG4gICAgICBtYXRjaFBhdHRlcm4sXG4gICAgICBgSWYgdXNpbmcgYSB3aWxkY2FyZCAoKiksIGl0IG11c3QgZ28gYXQgdGhlIHN0YXJ0IG9mIHRoZSBob3N0bmFtZWBcbiAgICApO1xufVxuZnVuY3Rpb24gdmFsaWRhdGVQYXRobmFtZShtYXRjaFBhdHRlcm4sIHBhdGhuYW1lKSB7XG4gIHJldHVybjtcbn1cbmV4cG9ydCB7XG4gIEludmFsaWRNYXRjaFBhdHRlcm4sXG4gIE1hdGNoUGF0dGVyblxufTtcbiJdLCJ4X2dvb2dsZV9pZ25vcmVMaXN0IjpbMCwxLDIsNV0sIm1hcHBpbmdzIjoiOztDQUNBLFNBQVMsaUJBQWlCLEtBQUs7QUFDOUIsTUFBSSxPQUFPLFFBQVEsT0FBTyxRQUFRLFdBQVksUUFBTyxFQUFFLE1BQU0sS0FBSztBQUNsRSxTQUFPOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0VhUixJQUFNLFVEZmlCLFdBQVcsU0FBUyxTQUFTLEtBQ2hELFdBQVcsVUFD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