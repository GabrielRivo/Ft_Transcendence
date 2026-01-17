import Database, { Statement } from 'better-sqlite3';
import { InjectPlugin, Service, Inject } from 'my-fastify-decorators';
// import { BlockManagementService } from '../../friend-management/block-management.service.js';


const BLOCK_URL = 'http://auth:3000';

@Service()
export class GeneralChatService {
	@InjectPlugin('db')
	private db !: Database.Database;
	private statementSaveGeneral !: Statement<{ userId: number, username: string, msgContent: string }>;
	private statementGetGeneralHistory !: Statement<[]>;
	private statementGetAllGeneralHistory !: Statement<[]>;


	// @Inject(BlockManagementService)
	// private blockService!: BlockManagementService;

	onModuleInit() {
		this.statementSaveGeneral = this.db.prepare(
		`INSERT INTO generalChatHistory (userId, username, msgContent) VALUES (@userId, @username, @msgContent)`
		);
		this.statementGetGeneralHistory = this.db.prepare(
			`SELECT * FROM generalChatHistory ORDER BY created_at DESC LIMIT 50`
		);
		this.statementGetAllGeneralHistory = this.db.prepare(
			`SELECT * FROM generalChatHistory ORDER BY created_at DESC LIMIT 100`);
	}
	async saveGeneralMessage(userId: number, username: string, content: string) {
		try {
		return this.statementSaveGeneral.run({ userId, username, msgContent: content });
		}
		catch(e) {
			console.log(e)
			return null;
		}
	}

	async getGeneralHistory(currentUserId: number) {
		const rows = this.statementGetGeneralHistory.all() as any[];
		const filteredHistory = []; 
		for (const msg of rows) {
			
			//const blocked = await this.blockService.is_blocked(currentUserId, msg.userId); // FAIRE LA REQUETE 
			//if (!blocked) {
				filteredHistory.push(msg);
			//}
		}
		return filteredHistory;
	}





// 	async getGeneralHistory(currentUserId: number) {
//     const rows = this.statementGetGeneralHistory.all() as any[];
//     const filteredHistory = [];

//     for (const msg of rows) {
//         // NOTE: fetch avec méthode GET accepte rarement un BODY selon la spec HTTP.
//         // Si ton backend le supporte, voici la syntaxe :
//         const res = await fetch(`${BLOCK_URL}/social/friend-management/block`, {
//             method: 'GET', 
//             headers: {
//                 "Content-Type": "application/json"
//             },
//             // On remplace ICI par l'ID de l'envoyeur du message
//             // Assure-toi que ton backend attend bien "targetId" comme clé
//             body: JSON.stringify({ 
//                 currentUserId, 
//                 otherId: msg.sender_id 
//             })
//         });

//         if (!res.ok) {
//             console.error(`Error with friend service ${res.status}`);
//             // En cas d'erreur technique, on décide souvent d'afficher le message par défaut
//             filteredHistory.push(msg); 
//         } else {
//             const data = await res.json() as { isBlocked: boolean };

//             if (data.isBlocked === false) {
//                 filteredHistory.push(msg);
//             }
//         }
//     }
    
//     return filteredHistory;
// }

	// async getGeneralHistory(currentUserId: number) {
	// 	const rows = this.statementGetGeneralHistory.all() as any[];
	// 	const filteredHistory = []; 
	// 	for (const msg of rows) {
	// 		const res = await fetch(`${BLOCK_URL}/social/friend-management/block`, 
	// 		{
	// 			method: 'GET',
	// 			headers : {
	// 				"Content-Type" : "application/json"
	// 			},
	// 			body : JSON.stringify({ currentUserId,   })
	// 		});
	// 	if (!res.ok) {
	// 		console.error(`Error with friend service ${res.status}`);

	// 		} else {
	// 			const data = await res.json() as { isBlocked: boolean };

	// 		if (data.isBlocked === false) {
	// 			filteredHistory.push(msg);
	// 		}
	// 	}
	// }
	// 	return filteredHistory;
	// }

	getAllGeneralHistory(){
		return this.statementGetAllGeneralHistory.all();
	}
}
// return this.statementGetGeneralHistory.all();

// faire un clear history a + de 100 messages
// faire un afficher history pour quand les users rejoignent le chat 
