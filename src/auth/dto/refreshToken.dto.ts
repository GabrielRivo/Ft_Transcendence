import { generateSchema, IsRequired, IsString } from 'my-class-validator';

export class RefreshTokenDto {
	@IsRequired()
	@IsString()
	refreshToken: string;
}

export const RefreshTokenSchema = generateSchema(RefreshTokenDto);