import { generateSchema, IsRequired, IsString, IsNumber, MinLength, MaxLength, AdditionalProperties } from "my-class-validator";

@AdditionalProperties(false)
export class RoomIdDto {
	@IsRequired()
	@IsString()
	@MinLength(1)
	roomId!: string;
}

@AdditionalProperties(false)
export class JoinPrivateRoomDto {
	@IsRequired()
	@IsNumber()
	friendId!: number;
}

@AdditionalProperties(false)
export class SendPrivateMessageDto {
	@IsRequired()
	@IsNumber()
	friendId!: number;

	@IsRequired()
	@IsString()
	@MinLength(1)
	@MaxLength(500)
	content!: string;
}

export const RoomIdSchema = generateSchema(RoomIdDto);
export const JoinPrivateRoomSchema = generateSchema(JoinPrivateRoomDto);
export const SendPrivateMessageSchema = generateSchema(SendPrivateMessageDto);
