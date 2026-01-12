import { generateSchema, IsRequired, IsNumber } from 'my-class-validator';

export class CreateGameStatDto {
	@IsRequired({message : "Needed the id"})
	@IsNumber()
	player1: number;

	@IsRequired({message : "Needed the id"})
	@IsNumber()
	player2: number;

	@IsRequired({message : "Needed the score"})
	@IsNumber()
	score_player1: number;

	@IsRequired({message : "Needed the score"})
	@IsNumber()
	score_player2: number;

	@IsRequired({message : "Needed the duration"})
	@IsNumber()
	game_duration_in_seconde: number;
}
export const CreateGameStatSchema = generateSchema(CreateGameStatDto);