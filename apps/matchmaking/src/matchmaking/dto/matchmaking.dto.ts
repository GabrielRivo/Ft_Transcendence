import { generateSchema, IsNumber, IsString, IsRequired, Minimum, MinLength, AdditionalProperties } from "my-class-validator";

/**
 * DTO pour la demande de rejoindre la file de matchmaking.
 * Le champ elo est optionnel car il est généralement récupéré de la session.
 */
@AdditionalProperties(true)
export class JoinQueueDto {
	@IsNumber()
	@Minimum(0)
	elo?: number;
}

/**
 * DTO pour les décisions de match (accept/decline).
 * Le matchId est requis et doit être un UUID valide.
 */
@AdditionalProperties(true)
export class MatchDecisionDto {
	@IsRequired({ message: 'matchId is required' })
	@IsString({ message: 'matchId must be a string' })
	@MinLength(36, { message: 'matchId must be a valid UUID' })
	matchId!: string;
}

export const JoinQueueSchema = generateSchema(JoinQueueDto);
export const MatchDecisionSchema = generateSchema(MatchDecisionDto);
