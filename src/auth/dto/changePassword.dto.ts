import {
	AdditionalProperties,
	IsRequired,
	IsString,
	MinLength,
	generateSchema,
} from 'my-class-validator';

@AdditionalProperties(false)
export class ChangePasswordDto {
	@IsRequired()
	@IsString()
	currentPassword: string;

	@IsRequired()
	@IsString()
	@MinLength(8)
	newPassword: string;
}

export const ChangePasswordSchema = generateSchema(ChangePasswordDto);

