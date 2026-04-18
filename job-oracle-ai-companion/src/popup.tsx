// Main popup entry point - Autofill disabled, job data + AI features only

import { useEffect, useState } from 'react';
import { useTheme } from '~hooks/useTheme';
import { Header } from '~components/Header';
import { JobCard } from '~components/JobCard';
import { AIOptions } from '~components/AIOptions';
import { ConnectionStatusComponent } from '~components/ConnectionStatus';
import { api } from '~services/api';
import type { JobData, PopupState } from '~types';

import "~style.css";


const IndexPopup = () => {
	const { resolvedTheme } = useTheme();
	const [state, setState] = useState<PopupState>({
		currentJob: null,
		matchScore: null,
		fieldProgress: { filled: 0, total: 0, fields: [] },
		isLoading: true,
		connectionStatus: 'checking',
	});


	useEffect(() => {
		// Get current tab job data
		getCurrentJobData();
	}, []);

	const getCurrentJobData = async () => {
		try {
			const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
			if (tab?.id) {
				chrome.tabs.sendMessage(tab.id, { action: 'GET_JOB_DATA' }, (response) => {
					if (chrome.runtime.lastError) {
						setState(prev => ({ ...prev, isLoading: false }));
						return;
					}
					if (response?.jobData) {
						setState(prev => ({
							...prev,
							currentJob: response.jobData,
							isLoading: false,
						}));
						calculateMatchScore(response.jobData);
					} else {
						setState(prev => ({ ...prev, isLoading: false }));
					}
				});
			} else {
				setState(prev => ({ ...prev, isLoading: false }));
			}
		} catch (error) {
			console.error('Failed to get job data:', error);
			setState(prev => ({ ...prev, isLoading: false }));
		}
	};

	const calculateMatchScore = async (jobData: JobData) => {
		try {
			const score = await api.calculateMatchScore(jobData);
			setState(prev => ({ ...prev, matchScore: score }));
		} catch (error) {
			console.error('Failed to calculate match score:', error);
		}
	};

	const handleGenerateResume = async () => {
		if (!state.currentJob) return;
		chrome.runtime.openOptionsPage();
	};

	const handleGenerateCoverLetter = async () => {
		if (!state.currentJob) return;
		chrome.runtime.openOptionsPage();
	};

	return (
		<div
			className="plasmo-popup-container"
			data-theme={resolvedTheme}
		>
			<Header />
			<div className="plasmo-popup-content">
				<ConnectionStatusComponent status={state.connectionStatus} />

				{state.isLoading ? (
				<div className="plasmo-flex plasmo-items-center plasmo-justify-center plasmo-py-12">
					<div className="plasmo-animate-spin plasmo-w-8 plasmo-h-8 plasmo-border-2 plasmo-border-accent-primary plasmo-border-t-transparent plasmo-rounded-full" />
				</div>
			) : state.currentJob ? (
				<>
					<JobCard
						job={state.currentJob}
						matchScore={state.matchScore}
					/>

					<AIOptions
						onGenerateResume={handleGenerateResume}
						onGenerateCoverLetter={handleGenerateCoverLetter}
					/>
				</>
			) : (
				<div className="plasmo-text-center plasmo-py-12 plasmo-px-6">
					<div className="plasmo-text-4xl plasmo-mb-4">🔍</div>
					<h3 className="plasmo-font-display plasmo-font-semibold plasmo-text-lg plasmo-text-text-primary plasmo-mb-2">
						No Job Detected
					</h3>
					<p className="plasmo-text-text-secondary plasmo-text-sm">
						Navigate to a job application page to see JobOracle in action.
					</p>
				</div>
			)}
			</div>
		</div>
	);
}

export default IndexPopup;
