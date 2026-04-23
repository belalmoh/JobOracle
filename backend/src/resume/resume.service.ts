import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateResumeDto } from './dto/create-resume.dto';
import { Resume } from './entities/resume.entity';
import { UploadedFileMeta } from './resume.controller';

@Injectable()
export class ResumeService {
	constructor(
		@InjectRepository(Resume)
		private readonly resumeRepository: Repository<Resume>,
	) {}

	async create(file: UploadedFileMeta) {
		const content = this.parseFile(file);

		const resume = this.resumeRepository.create({
			name: file.originalname,
			content,
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

	/** Parse uploaded file buffer into a JSON object */
	private parseFile(file: UploadedFileMeta): Record<string, any> {
		const buffer = file.buffer.toString('utf-8');

		// Try JSON first (e.g. exported resume data)
		try {
			return JSON.parse(buffer);
		} catch {
			// Not JSON — return raw text wrapped in an object for storage
			return { raw: buffer };
		}
	}
}
