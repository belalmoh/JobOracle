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
	ParseIntPipe,
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
	@UseInterceptors(FileInterceptor('resume'))
	create(@UploadedFile() file: any, @Body('ownerId') ownerId: string) {
		if (!file) {
			throw new BadRequestException('Resume file is required');
		}
		return this.resumeService.create(file, ownerId);
	}

	@Get()
	findAll() {
		return this.resumeService.findAll();
	}

	@Get(':id')
	findOne(@Param('id', ParseIntPipe) id: number) {
		return this.resumeService.findOne(id);
	}

	@Delete(':id')
	remove(@Param('id', ParseIntPipe) id: number) {
		return this.resumeService.remove(id);
	}

	@Delete()
	removeAll() {
		return this.resumeService.removeAll();
	}
}
