import { z } from 'zod';

const shortText = z.string().trim().max(500).default('');
const mediumText = z.string().trim().max(2000).default('');

const urlOrEmpty = z
	.string()
	.trim()
	.max(400)
	.refine(
		(value) => value === '' || /^https?:\/\/.+/i.test(value),
		'Must be empty or a valid URL starting with http/https',
	)
	.default('');

const emailOrEmpty = z
	.string()
	.trim()
	.max(320)
	.refine(
		(value) => value === '' || z.string().email().safeParse(value).success,
		'Must be empty or a valid email',
	)
	.default('');

const experienceSchema = z
	.object({
		title: shortText,
		company: shortText,
		dates: shortText,
		description: mediumText,
	})
	.strict();

const educationSchema = z
	.object({
		degree: shortText,
		school: shortText,
		dates: shortText,
		details: mediumText,
	})
	.strict();

const projectSchema = z
	.object({
		name: shortText,
		description: mediumText,
		technologies: z.array(shortText).max(100).default([]),
	})
	.strict();

export const resumeSchema = z
	.object({
		name: shortText,
		email: emailOrEmpty,
		phone: shortText,
		location: shortText,
		linkedin: urlOrEmpty,
		github: urlOrEmpty,
		website: urlOrEmpty,
		summary: mediumText,
		skills: z.array(shortText).max(200).default([]),
		experience: z.array(experienceSchema).max(100).default([]),
		education: z.array(educationSchema).max(100).default([]),
		certifications: z.array(shortText).max(200).default([]),
		projects: z.array(projectSchema).max(100).default([]),
	})
	.strict();

export type ResumeSchema = z.infer<typeof resumeSchema>;
