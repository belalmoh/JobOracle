import { Test, TestingModule } from '@nestjs/testing';
import { JobAnalysisService } from './job-analysis.service';

describe('JobAnalysisService', () => {
  let service: JobAnalysisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JobAnalysisService],
    }).compile();

    service = module.get<JobAnalysisService>(JobAnalysisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
