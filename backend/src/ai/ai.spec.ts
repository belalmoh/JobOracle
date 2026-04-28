import { Test, TestingModule } from '@nestjs/testing';
import { Ai } from './ai';

describe('Ai', () => {
  let provider: Ai;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [Ai],
    }).compile();

    provider = module.get<Ai>(Ai);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
