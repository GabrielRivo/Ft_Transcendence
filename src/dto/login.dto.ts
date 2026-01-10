import { generateSchema, IsEmail, IsRequired, IsString, MinLength } from 'my-class-validator';

export class LoginDto {
	@IsRequired()
	@IsString()
	@IsEmail()
	email!: string;

	@IsRequired()
	@IsString()
	@MinLength(8)
	password!: string;
}

export const LoginSchema = generateSchema(LoginDto);

