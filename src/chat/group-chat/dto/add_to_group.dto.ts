import { AdditionalProperties, generateSchema, IsRequired,IsNumber} from "my-class-validator";

@AdditionalProperties(false)
export class AddUserGroup {

	@IsRequired({message : "Needed the roomid"})
	@IsNumber({message : "Need a number"})
	groupId: number;

	@IsRequired({message : "Needed the userId"})
	@IsNumber({message : "Need a number"})
	userId: number;

	@IsRequired({message : "Needed the ReceiverId"})
	@IsNumber({message : "Need a number"})
	senderId: number;
}

export const AddUserToGroupSchema = generateSchema(AddUserGroup);
