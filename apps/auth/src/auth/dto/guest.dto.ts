import {
	AdditionalProperties,
	IsRequired,
	IsString,
	MinLength,
	MaxLength,
	generateSchema,
} from 'my-class-validator';

@AdditionalProperties(false)
export class GuestDto {
	@IsRequired()
	@IsString()
	@MinLength(3)
	@MaxLength(20)
	username: string;
}

export const GuestSchema = generateSchema(GuestDto);

