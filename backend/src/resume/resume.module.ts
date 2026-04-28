import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResumeService } from './resume.service';
import { ResumeController } from './resume.controller';
import { Resume } from './entities/resume.entity';
import { AiModule } from 'src/ai/ai.module';

@Module({
	imports: [TypeOrmModule.forFeature([Resume]), AiModule],
	controllers: [ResumeController],
	providers: [ResumeService],
})
export class ResumeModule {}
