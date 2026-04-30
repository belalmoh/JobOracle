import type { JobData } from "../types";
import { stripGreenhouseContent } from "../lib/utils";
import { Extractor } from "./extractor";
export class GreenhouseDetector extends Extractor {
    isJobApplicationPage(): boolean {
        const url = window.location.href;
        // Pattern 1: job-boards.greenhouse.io/{company}/jobs/{id}
        const boardsPattern = /greenhouse\.io\/[^/]+\/jobs\/\d+/;
        // Pattern 2: job-boards.greenhouse.io/embed/job_app?for={company}&jr_id={id}
        const embedPattern = /greenhouse\.io\/embed\/job_app/;
        return boardsPattern.test(url) || embedPattern.test(url);
    }

    getCompanyDetailsFromUrl(): {
        company: string | null;
        jobId: string | null;
    } {
        const url = new URL(window.location.href);
        let company = null;
        let jobId = null;
        if (/greenhouse\.io\/embed\/job_app/.test(url.href)) {
            // Pattern 2: query params
            company = url.searchParams.get("for");
            jobId = url.searchParams.get("jr_id");
        } else {
            // Pattern 1: /{company}/jobs/{id}
            const pathParts = url.pathname.split("/");
            company = pathParts[1] || null;
            jobId = pathParts[3] || null;
        }

        return {
            company,
            jobId,
        };
    }

    async extractFromAPI(): Promise<JobData | null> {
        const url = new URL(window.location.href);
        const { company, jobId } = this.getCompanyDetailsFromUrl();

        const jobDetailUrl = `https://boards-api.greenhouse.io/v1/boards/${company}/jobs/${jobId}`;

        try {
            const response = await fetch(jobDetailUrl);
            if (!response.ok) throw new Error("Network response was not ok");
            const data = await response.json();

            return {
                company: this.capitalizeCompany(data.company_name),
                title: data.title,
                description: JSON.stringify(
                    stripGreenhouseContent(data.content),
                ),
                location: data.location.name,
                url: window.location.href,
                salary: data.salary
                    ? `${data.salary.currency} ${data.salary.value}`
                    : undefined,
                source: "greenhouse",
            };
        } catch (error) {
            console.error(
                "Failed to fetch job details from Greenhouse API:",
                error,
            );
            return null;
        }
    }

    extractFromDom(): JobData {
        const url = window.location.href;
        const parsedUrl = new URL(url);
        let { company } = this.getCompanyDetailsFromUrl();
        if (!company) company = parsedUrl.hostname.split(".")[0];

        // Try to extract job title from various selectors
        const titleSelectors = [
            "h1.app-title",
            ".app-title",
            '[data-testid="job-title"]',
            ".posting-title",
            "h1.job-title",
            "h1.posting-headline",
            ".job-title h1",
            'h1[class*="title"]',
            ".jobs-unified-top-card__job-title",
            "h1",
            ".posting-headline h2",
            "h2.job-title",
            '[data-automation-id="jobTitle"]',
        ];

        let title = "Unknown Position";
        for (const selector of titleSelectors) {
            const el = document.querySelector(selector);
            if (el?.textContent) {
                title = el.textContent.trim();
                break;
            }
        }

        // Extract job description
        const descriptionSelectors = [
            '[data-testid="job-description"]',
            ".posting-description",
            "#job-description",
            ".app-description",
            "#content .job-post-content",
            "#content #gh_jid",
            ".job__description",
            '[class*="job-description"]',
            '[class*="jobDescription"]',
            '[id*="job-description"]',
            '[id*="jobDescription"]',
            '[class*="posting-description"]',
            'article[class*="job"]',
            ".job-details",
            ".job-content",
            ".description",
        ];

        let description = "";
        for (const selector of descriptionSelectors) {
            const el = document.querySelector(selector);
            if (el?.textContent) {
                description = el.textContent.trim();
                break;
            }
        }

        // Extract location if available
        const locationSelectors = [
            ".location",
            '[data-testid="job-location"]',
            ".posting-location",
            ".job-post-location",
            ".job__location",
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
            '[data-testid="job-salary"]',
            ".posting-salary",
            ".job-post-salary",
            '[class*="salary"]',
            '[class*="compensation"]',
            '[class*="pay-range"]',
            '[class*="pay_range"]',
            '[data-field="salary"]',
            '[data-automation-id="salary"]',
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
            source: "greenhouse",
        };
    }

    extractFromAI(): JobData {
        // Placeholder for future AI-based extraction if needed
        return {
            company: "Unknown Company",
            title: "Unknown Position",
            description: "",
            url: window.location.href,
            source: "greenhouse",
        };
    }

    /**
     * Extract job data using multiple strategies (order of reliability):
     * 1. API extraction (most reliable)
     * 2. DOM parsing with various selectors
     * 3. AI-based extraction (fallback)
     * @returns JobData object with extracted information
     */
    async extractJobData(): Promise<JobData> {
        const JobData = await this.extractFromAPI();
        if (JobData) {
            return JobData as JobData;
        }

        const domData = this.extractFromDom();
        if (domData.description) {
            return domData as JobData;
        }

        const aiData = this.extractFromAI();
        if (aiData.description) {
            return aiData as JobData;
        }

        // If all else fails, return a minimal object with URL and source
        return {
            company: "Unknown Company",
            title: "Unknown Position",
            description: "",
            url: window.location.href,
            source: "greenhouse",
        };
    }

    capitalizeCompany(company: string): string {
        return company
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    }

    findApplicationForm(): HTMLFormElement | null {
        const selectors = [
            "form#application-form",
            'form[action*="/applications"]',
            '[data-testid="application-form"]',
            "form",
        ];

        for (const selector of selectors) {
            const form = document.querySelector(selector) as HTMLFormElement;
            if (form) return form;
        }

        return null;
    }
}
