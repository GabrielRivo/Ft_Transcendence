import { generateSchema, IsEmail, IsRequired, IsString, Length, MinLength } from 'my-class-validator';

export class ResetPasswordDto {
	@IsRequired()
	@IsString()
	@IsEmail()
	email: string;

	@IsRequired()
	@IsString()
	@Length(6, 6)
	otp: string;

	@IsRequired()
	@IsString()
	@MinLength(8)
	newPassword: string;
}

export const ResetPasswordSchema = generateSchema(ResetPasswordDto);
