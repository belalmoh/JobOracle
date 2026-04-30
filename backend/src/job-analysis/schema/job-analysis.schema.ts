import { z } from 'zod';

const shortText = z.string().max(200);
const mediumText = z.string().max(2000);
const longText = z.string().max(10000);

export const jobAnalysisResponseSchema = z
	.object({
		matchScore: z.number().min(0).max(100),
		skillAlignment: z.number().min(0).max(1),
		experienceMatch: z.number().min(0).max(1),
		keywordCoverage: z.number().min(0).max(1),
		matchingSkills: z.array(z.string()).max(50).default([]),
		missingSkills: z.array(z.string()).max(50).default([]),
		recommendations: z.array(z.string()).max(20).default([]),
		insights: z.object({
			strengths: mediumText,
			gaps: mediumText,
			keywords: z.array(z.string()).max(100).default([]),
		}),
	})
	.strict();

export type JobAnalysisResponse = z.infer<typeof jobAnalysisResponseSchema>;

// Legacy resume parsing schema (kept for backward compatibility)
export const jobAnalysisSchema = z
	.object({
		name: shortText,
		email: z.string().email().or(z.literal('')),
		phone: shortText,
		location: shortText,
		linkedin: z.string().url().or(z.literal('')),
		github: z.string().url().or(z.literal('')),
		website: z.string().url().or(z.literal('')),
		summary: mediumText,
		skills: z.array(shortText).max(200).default([]),
		experience: z
			.array(
				z.object({
					title: shortText,
					company: shortText,
					duration: shortText,
					description: longText,
				}),
			)
			.max(100)
			.default([]),
		education: z
			.array(
				z.object({
					degree: shortText,
					school: shortText,
					year: shortText,
				}),
			)
			.max(100)
			.default([]),
		certifications: z.array(shortText).max(200).default([]),
		projects: z
			.array(
				z.object({
					name: shortText,
					description: longText,
					url: z.string().url().or(z.literal('')).optional(),
				}),
			)
			.max(100)
			.default([]),
	})
	.strict();

export type JobAnalysisSchema = z.infer<typeof jobAnalysisSchema>;
