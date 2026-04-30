// JobOracle Extension Types

// User Profile (from backend)
export interface ParsedData {
    skills: string[];
    experience: Array<{
        title: string;
        company: string;
        duration: string;
        description: string;
    }>;
    education: Array<{
        degree: string;
        school: string;
        year: string;
    }>;
    summary: string;
    personal?: {
        firstName?: string;
        lastName?: string;
        fullName?: string;
        email?: string;
        phone?: string;
        linkedin?: string;
        website?: string;
        github?: string;
        address?: string;
        city?: string;
        state?: string;
        zipCode?: string;
        country?: string;
    };
}

export interface UserProfile {
    id: number;
    resumeText: string;
    parsedData: ParsedData;
    keywords: string[];
}

export interface ResumeDataContent {
    content: {
        certifications: string[];
        education: Array<{
            degree: string;
            school: string;
            dates: string;
            details: string;
        }>;
        experience: Array<{
            title: string;
            company: string;
            dates: string;
            description: string;
        }>;
        github?: string;
        linkedin?: string;
        location?: string;
        name?: string;
        phone?: string;
        skills: string[];
        summary?: string;
        website?: string;
    };
}

export interface ResumeData {
    id: number;
    name: string;
    ownerId: string;
    content: ResumeDataContent;
}

// Job Data (extracted from page)
export interface JobData {
    company: string;
    title: string;
    description: string;
    location?: string;
    url: string;
    source: "greenhouse" | "lever" | "workday" | "other";
    salary?: string;
}

// Application Tracking
export type ApplicationStatus = "applied" | "interview" | "rejected" | "offer";

export interface Application {
    id: string;
    company: string;
    jobTitle: string;
    dateApplied: string;
    matchScore: number;
    jobUrl: string;
    status: ApplicationStatus;
    notes?: string;
    resumeVersion?: string;
}

// AI Provider Types
export type AIProvider = "ollama" | "openai" | "claude" | "custom";

// Extension Settings
export interface ExtensionSettings {
    theme: "dark" | "light" | "system";
    aiProvider: AIProvider;
    ollamaUrl: string;
    ollamaModel: string;
    apiKey?: string;
    autoDetectForms: boolean;
    showFloatingButton: boolean;
    smartFieldMatching: boolean;
    backendUrl: string;
}

// Field Status for Form Filling
export type FieldType =
    | "text"
    | "email"
    | "tel"
    | "file"
    | "select"
    | "textarea"
    | "checkbox";

export interface FieldStatus {
    id: string;
    label: string;
    selector: string;
    type: FieldType;
    value?: string;
    filled: boolean;
    required: boolean;
}

// Popup State
export interface FieldProgress {
    filled: number;
    total: number;
    fields: FieldStatus[];
}

export type ConnectionStatus = "connected" | "disconnected" | "checking";

export interface PopupState {
    currentJob: JobData | null;
    matchScore: number | null;
    fieldProgress: FieldProgress;
    isLoading: boolean;
    connectionStatus: ConnectionStatus;
}

// Field Mapping for Matcher
export interface FieldMapping {
    keywords: string[];
    field: string;
    type: FieldType;
}

// Job Analysis API Response
export interface JobAnalysisInsights {
    strengths: string;
    gaps: string;
    keywords: string[];
}

export interface JobAnalysisResponse {
    success: boolean;
    data: {
        matchScore: number;
        skillAlignment: number;
        experienceMatch: number;
        keywordCoverage: number;
        matchingSkills: string[];
        missingSkills: string[];
        recommendations: string[];
        insights: JobAnalysisInsights;
    };
    timestamp: string;
}

export interface FieldCategorizationResponse {
    field: string;
    confidence: number;
}

export interface ResumeAnalysisData {
    resumeId: number;
    ownerId: string;
    resumeData: ResumeDataContent;
    companyName: string;
    description: string;
    location?: string;
    salary?: number;
    title: string;
    url: string;
}
