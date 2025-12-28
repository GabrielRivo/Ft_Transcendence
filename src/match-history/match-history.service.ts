import Database, { Statement } from 'better-sqlite3';
import { InjectPlugin, Service } from 'my-fastify-decorators';


const addMatchHistoryStatement: string = 
`INSERT INTO matchHistory (userId1, userId2, scoreUser1, 
scoreUser2) VALUES (@userId1, @userId2, @scoreUser1, 
@scoreUser2);
`;

@Service()
export class MatchHistoryService { // m?
	@InjectPlugin('db')
	private db !: Database.Database;

	private statementAddMatchtoHistory : Statement<{
		userId1	: number;
		userId2	: number;
		scoreUser1 : number;
		scoreUser2 : number;
	}>

	onModuleInit(){
		this.statementAddMatchtoHistory = this.db.prepare(addMatchHistoryStatement);

	}

	add_match_to_history(userId1 : number, userId2	: number, 
		scoreUser1 : number, scoreUser2 : number) {
			return this.statementAddMatchtoHistory.run({
				userId1,
				userId2, 
				scoreUser1,
				scoreUser2,
			})
		}

	delete_match_from_history(userId1 : number, userId2	: number, 
		scoreUser1 : number, scoreUser2 : number){ // purpose?

	}
}