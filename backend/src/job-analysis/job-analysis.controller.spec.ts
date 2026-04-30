import { Test, TestingModule } from '@nestjs/testing';
import { JobAnalysisController } from './job-analysis.controller';
import { JobAnalysisService } from './job-analysis.service';

describe('JobAnalysisController', () => {
  let controller: JobAnalysisController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [JobAnalysisController],
      providers: [JobAnalysisService],
    }).compile();

    controller = module.get<JobAnalysisController>(JobAnalysisController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
