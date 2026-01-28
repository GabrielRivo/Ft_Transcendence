import {
	AdditionalProperties,
	IsEmail,
	IsRequired,
	IsString,
	generateSchema,
} from 'my-class-validator';

@AdditionalProperties(false)
export class ChangeEmailDto {
	@IsRequired()
	@IsString()
	@IsEmail()
	email: string;
}

export const ChangeEmailSchema = generateSchema(ChangeEmailDto);

