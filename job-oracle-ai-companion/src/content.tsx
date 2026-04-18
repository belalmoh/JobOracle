// Content script for page interaction - Job data extraction only (autofill disabled)

import cssText from "data-text:~style.css"
import type { PlasmoCSConfig } from "plasmo"

import { GreenhouseDetector } from '~detectors/greenhouse'
import { storage } from '~storage'
import type { JobData } from '~types'

export const config: PlasmoCSConfig = {
	matches: [
		"https://*.greenhouse.io/*",
		"https://*.lever.co/*",
		"https://*.ashbyhq.com/*",
		"https://*.workday.com/*",
		"https://*.myworkdayjobs.com/*",
		"https://*.taleo.net/*",
		"https://jobs.lever.co/*",
	],
	all_frames: true
}

/**
 * Generates a style element with adjusted CSS to work correctly within a Shadow DOM.
 */
export const getStyle = (): HTMLStyleElement => {
	const baseFontSize = 16

	let updatedCssText = cssText.replaceAll(":root", ":host(plasmo-csui)")
	const remRegex = /([\d.]+)rem/g
	updatedCssText = updatedCssText.replace(remRegex, (match, remValue) => {
		const pixelsValue = parseFloat(remValue) * baseFontSize
		return `${pixelsValue}px`
	})

	const styleElement = document.createElement("style")
	styleElement.textContent = updatedCssText
	return styleElement
}

// State
let currentJobData: JobData | null = null

const detectJobProvider = (url: string): string => {
	if (/\.greenhouse\.io/.test(url)) return 'greenhouse'
	if (/\.lever\.co/.test(url)) return 'lever'
	if (/\.ashbyhq\.com/.test(url)) return 'ashby'
	if (/\.workday\.com/.test(url) || /\.myworkdayjobs\.com/.test(url)) return 'workday'
	if (/\.taleo\.net/.test(url)) return 'taleo'
	return 'generic';
}

// Initialize - only extracts job data, no autofill
const init = async () => {
	console.log('JobOracle: Initializing content script...')
	
	const url = window.location.href;
	const jobProvider = detectJobProvider(url);

	if (jobProvider === 'greenhouse') {
		currentJobData = GreenhouseDetector.extractJobData()
		console.log('JobOracle: Job data extracted:', currentJobData)
	} else {
		console.log('JobOracle: No specific detector for this site')
	}
}

// Message handler - only returns job data
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	try {
		switch (request.action) {
			case 'GET_JOB_DATA':
				sendResponse({ jobData: currentJobData })
				break
			case 'GET_FIELD_PROGRESS':
				// Autofill disabled - return empty array
				sendResponse({ fields: [] })
				break
			case 'AUTOFILL_FORM':
				// Autofill disabled
				sendResponse({ error: 'Autofill is temporarily disabled' })
				break
			default:
				sendResponse({ error: 'Unknown action' })
		}
	} catch (error) {
		console.error('Content script error:', error)
		sendResponse({ error: 'Internal error' })
	}
	return true
})

// Initialize when DOM is ready
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', init)
} else {
	init()
}

// Plasmo overlay - disabled
const PlasmoOverlay = () => {
	return null
}

export default PlasmoOverlay
