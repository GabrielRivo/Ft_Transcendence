import { Body, BodySchema, Controller, Delete, Inject, Post } from 'my-fastify-decorators';
import { MatchHistoryService } from './match-history.service.js';
import {  AddMatchToHistorySchema, AddMatchToHistoryDto } from './dto/MatchHistory.dto.js';

@Controller('/match-history')
export class MatchHistoryController {

	@Inject(MatchHistoryService)
	private match_history_managementService!: MatchHistoryService

	@Post('/match_history') // nom diff?
	@BodySchema(AddMatchToHistorySchema)
	add_match_to_history(@Body() data: AddMatchToHistoryDto) {
		return this.match_history_managementService.add_match_to_history(data.userId1, data.userId2, 
				data.scoreUser1, data.scoreUser2)
	}

	@Delete('/match_history') // necessaire?
	@BodySchema(AddMatchToHistorySchema)
	delete_match_from_history(@Body() data : AddMatchToHistoryDto){
		return this.match_history_managementService.delete_match_from_history(data.userId1, data.userId2, 
				data.scoreUser1, data.scoreUser2)
	}
}