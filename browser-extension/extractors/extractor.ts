import type { JobData } from "../types";
import { stripGreenhouseContent } from "../lib/utils";
export abstract class Extractor {
    abstract isJobApplicationPage(): boolean;

    abstract getCompanyDetailsFromUrl(): {
        company: string | null;
        jobId: string | null;
    };

    abstract extractFromAPI(): Promise<JobData | null>;

    abstract extractFromDom(): JobData;

    abstract extractFromAI(): JobData;

    abstract extractJobData(): Promise<JobData>;

    private static capitalizeCompany(company: string): string {
        return company
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    }

    static findApplicationForm(): HTMLFormElement | null {
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
