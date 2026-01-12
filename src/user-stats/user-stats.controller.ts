import { Body, BodySchema, Controller, Get, Inject, Param, Post } from 'my-fastify-decorators';
import { UserStatsService } from './user-stats.service.js';
import { CreateGameStatDto, CreateGameStatSchema } from './dto/user-stats.dto.js';

@Controller('/stats')
export class UserStatsController {

	@Inject(UserStatsService)
	private statsService!: UserStatsService;

	@Get('/user/:userId')
	async get_stats(@Param('userId') userId: string) {
		try {
			const stats_log = await this.statsService.getGlobalStats(Number(userId));
			if (!stats_log)
				return { message: "User doesn't have stats" };
			return stats_log;
		}
		catch (err) {
			console.error("Erreur GET stats:", err);
			return { message: "Error" };
		}
	}

	@Post('/game-result')
	@BodySchema(CreateGameStatSchema)
	async saveGame(@Body() dto: CreateGameStatDto) {
		try {
			await this.statsService.updateUserGlobalStats(dto.player1, {win: dto.score_player1 > dto.score_player2, 
				loss: dto.score_player1 < dto.score_player2, score: dto.score_player1, duration: dto.game_duration_in_seconde, 
						isTournament: false, wonTournament: false});

			await this.statsService.updateUserGlobalStats(dto.player2, {win: dto.score_player2 > dto.score_player1, 
					loss: dto.score_player2 < dto.score_player1, score: dto.score_player2, 
						duration: dto.game_duration_in_seconde, isTournament: false, wonTournament: false
			});
			return { message: "Match registered" };
		}
		catch (err) {
			console.error("Erreur POST game-result:", err);
			return { message: "Can't register match" };
		}
	}
}