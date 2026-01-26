import { generateSchema, IsEmail, IsRequired, IsString, Length } from 'my-class-validator';

export class VerifyResetOtpDto {
	@IsRequired()
	@IsString()
	@IsEmail()
	email: string;

	@IsRequired()
	@IsString()
	@Length(6, 6)
	otp: string;
}

export const VerifyResetOtpSchema = generateSchema(VerifyResetOtpDto);
