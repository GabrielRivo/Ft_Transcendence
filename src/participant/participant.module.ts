import { Module } from 'my-fastify-decorators';
import { ParticipantRepository } from './participant.repository.js';
import { ParticipantService } from './participant.service.js';

@Module({
    providers: [ParticipantRepository, ParticipantService],
})
export class ParticipantModule {}