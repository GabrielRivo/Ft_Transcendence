import { AdditionalProperties, IsInt, IsNullable, IsRequired, IsString, generateSchema } from "my-class-validator";

@AdditionalProperties(false)
export class ReadProfileDtoResponse {
    @IsRequired()
	@IsInt()
	userId : number;

    @IsRequired()
    @IsString()
    username : string;

    @IsRequired()
    @IsString()
    @IsNullable(true)
    avatar : string | null; // link to the avatar (self hosted or external)

    @IsRequired()
    @IsString()
    bio : string;
}

export const ReadProfileDtoSchemaResponse = generateSchema(ReadProfileDtoResponse);