import {
	Controller,
	Get,
	Post,
	Body,
	Param,
	Delete,
	UploadedFile,
	UseInterceptors,
	BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ResumeService } from './resume.service';
import { CreateResumeDto } from './dto/create-resume.dto';

export interface UploadedFileMeta {
	fieldname: string;
	originalname: string;
	encoding: string;
	mimetype: string;
	size: number;
	destination: string;
	filename: string;
	path: string;
	buffer: Buffer;
}

@Controller('resume')
export class ResumeController {
	constructor(private readonly resumeService: ResumeService) {}

	@Post('upload')
	@UseInterceptors(FileInterceptor('file'))
	create(@UploadedFile() file: UploadedFileMeta) {
		if (!file) {
			throw new BadRequestException('Resume file is required');
		}
		return this.resumeService.create(file);
	}

	@Get()
	findAll() {
		return this.resumeService.findAll();
	}

	@Get(':id')
	findOne(@Param('id') id: string) {
		return this.resumeService.findOne(+id);
	}

	@Delete(':id')
	remove(@Param('id') id: string) {
		return this.resumeService.remove(+id);
	}
}
