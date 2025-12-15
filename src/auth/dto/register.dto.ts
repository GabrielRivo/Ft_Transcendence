import {
	AdditionalProperties,
	IsEmail,
	IsRequired,
	IsString,
	MinLength,
	generateSchema,
} from 'my-class-validator';

@AdditionalProperties(false)
export class RegisterDto {
	@IsRequired()
	@IsString()
	@IsEmail()
	email: string;

	@IsRequired()
	@IsString()
	@MinLength(8)
	password: string;
}

export const RegisterSchema = generateSchema(RegisterDto);
