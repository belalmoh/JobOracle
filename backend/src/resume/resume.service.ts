import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Resume } from './entities/resume.entity';
import { UploadedFileMeta } from './resume.controller';
import { PDFParse } from 'pdf-parse';
import * as officeParser from 'officeparser';
import { AiProvider, ChatMessage } from 'src/ai/ai';
import { resumeSchema } from './schema/resume.schema';

@Injectable()
export class ResumeService {
	constructor(
		@InjectRepository(Resume)
		private readonly resumeRepository: Repository<Resume>,
		private readonly aiProvider: AiProvider,
	) {}

	async create(file: UploadedFileMeta, ownerId: string) {
		const existing = await this.resumeRepository.findOne({
			where: { name: file.originalname, ownerId },
		});

		if (existing) {
			return existing; // Return existing resume if already processed
		}

		const content = await this.getContent(file);
		const parsed = await this.parseWithAI(content);

		const result = resumeSchema.safeParse(parsed);

		if (!result.success) {
			throw new Error('AI response validation failed: ' + JSON.stringify(result.error.issues));
		}

		const resume = this.resumeRepository.create({
			name: file.originalname,
			content: result.data,
			ownerId: ownerId,
		});

		return this.resumeRepository.save(resume);
	}

	findAll() {
		return this.resumeRepository.find();
	}

	findOne(id: number) {
		return this.resumeRepository.findOne({ where: { id } });
	}

	async remove(id: number) {
		await this.resumeRepository.delete(id);
		return { deleted: true };
	}
	async removeAll() {
		await this.resumeRepository.clear();
		return { deleted: true };
	}

	/** Helper methods */

	/** Parse uploaded file buffer into a JSON object */
	private async getContent(file: UploadedFileMeta): Promise<string> {
		if (file.mimetype === 'application/pdf') {
			const data = new PDFParse({ data: file.buffer });
			const result = await data.getText();
			return result.text;
		} else if (
			file.mimetype === 'application/docx' ||
			file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
		) {
			const data = await officeParser.parseOffice(file.buffer);
			return data.toText();
		}
		// Add support for other file types (e.g. DOCX) as needed
		throw new Error('Unsupported file type');
	}

	private async parseWithAI(content: string) {
		const messages: ChatMessage[] = [
			{
				role: 'system',
				content: this.buildResumeParsingPrompt(),
			},
			{
				role: 'user',
				content: content,
			},
		];
		const response = await this.aiProvider.chat(messages);
		return this.aiProvider.parseJSONResponse(response ?? '');
	}

	private buildResumeParsingPrompt = () => {
		return `Extract resume info as JSON. Be CONCISE — short phrases, not sentences. Use empty strings/arrays for missing fields.
		Schema:
		{"name":"","email":"","phone":"","location":"","linkedin":"","github":"","website":"","summary":"","skills":[],"experience":[{"title":"","company":"","dates":"","description":""}],"education":[{"degree":"","school":"","dates":"","details":""}],"certifications":[],"projects":[{"name":"","description":"","technologies":[]}]}`;
	};
}
