import { Module } from '@nestjs/common';
import { JobAnalysisService } from './job-analysis.service';
import { JobAnalysisController } from './job-analysis.controller';
import { JobAnalysis } from './entities/job-analysis.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiModule } from 'src/ai/ai.module';

@Module({
	imports: [TypeOrmModule.forFeature([JobAnalysis]), AiModule],
	controllers: [JobAnalysisController],
	providers: [JobAnalysisService],
})
export class JobAnalysisModule {}
