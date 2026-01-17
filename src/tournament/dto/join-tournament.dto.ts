import { IsNullable, IsString, MinLength, MaxLength, generateSchema } from 'my-class-validator';

export class JoinTournamentDto {
    @IsNullable(true)
    @IsString()
    @MinLength(2)
    @MaxLength(20)
    alias?: string;
}

export const JoinTournamentSchema = generateSchema(JoinTournamentDto);