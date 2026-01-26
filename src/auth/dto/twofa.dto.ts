import { generateSchema, IsRequired, IsString, MinLength, MaxLength } from 'my-class-validator';

export class TwoFAVerifyDto {
	@IsRequired()
	@IsString()
	@MinLength(6)
	@MaxLength(6)
	code: string;
}

export const TwoFAVerifySchema = generateSchema(TwoFAVerifyDto);
