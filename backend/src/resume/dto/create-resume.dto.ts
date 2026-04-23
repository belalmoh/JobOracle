import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateResumeDto {
	@IsString()
	@IsNotEmpty()
	name!: string;
}
