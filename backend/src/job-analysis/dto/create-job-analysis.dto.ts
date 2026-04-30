import { IsString, IsNotEmpty, IsOptional, IsNumber, IsObject } from 'class-validator';

export class CreateJobAnalysisDto {
	@IsNumber()
	@IsNotEmpty()
	resumeId!: number;

	@IsString()
	@IsNotEmpty()
	ownerId!: string;

	@IsString()
	@IsNotEmpty()
	companyName!: string;

	@IsString()
	@IsNotEmpty()
	description!: string;

	@IsString()
	@IsOptional()
	location?: string;

	@IsNumber()
	@IsOptional()
	salary?: number;

	@IsString()
	@IsNotEmpty()
	title!: string;

	@IsString()
	@IsNotEmpty()
	url!: string;

	@IsObject()
	@IsNotEmpty()
	resumeData!: object; // Can be either raw text or a structured object, depending on implementation
}
