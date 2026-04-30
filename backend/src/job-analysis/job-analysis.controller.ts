import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { JobAnalysisService } from './job-analysis.service';
import { CreateJobAnalysisDto } from './dto/create-job-analysis.dto';

@Controller('job')
export class JobAnalysisController {
	constructor(private readonly jobAnalysisService: JobAnalysisService) {}

	@Post('analyze')
	create(@Body() createJobAnalysisDto: CreateJobAnalysisDto) {
		return this.jobAnalysisService.create(createJobAnalysisDto);
	}

	@Get()
	findAll() {
		return this.jobAnalysisService.findAll();
	}

	// @Get('/job/:id/resume/:resumeId')
	// findOne(@Param('id') id: string) {
	// 	return this.jobAnalysisService.findOne(+id);
	// }

	// @Delete(':id')
	// remove(@Param('id') id: string) {
	// 	return this.jobAnalysisService.remove(+id);
	// }
}
