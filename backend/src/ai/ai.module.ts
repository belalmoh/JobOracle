import { Module } from '@nestjs/common';
import { AiProvider } from './ai';

@Module({
	providers: [AiProvider],
	exports: [AiProvider],
})
export class AiModule {}
