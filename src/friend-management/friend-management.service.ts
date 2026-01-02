import Database, { Statement } from 'better-sqlite3';
import { InjectPlugin, Service } from 'my-fastify-decorators';

const addFriend: string = `
INSERT INTO friends (userId, otherId) VALUES (@userId, @otherId);
`;

const DeleteFriend = `DELETE FROM friends WHERE userId = @userId AND otherId = @otherId;`;

@Service()
export class FriendManagementService {
	@InjectPlugin('db')
	private db !: Database.Database;

	private statementAddFriend : Statement<{
		userId : number, 
		otherId : number
	}>

	private statementDeleteFriend : Statement<{
		userId : number, 
		otherId : number
	}>

	onModuleInit(){
		this.statementAddFriend = this.db.prepare(addFriend);
		this.statementDeleteFriend = this.db.prepare(DeleteFriend);
	}

	add_friend(userId : number, otherId : number) {
		if (userId === otherId) 
			throw new Error("Self-friendship")
		try {
			this.statementAddFriend.run({ userId, otherId });
			return { success: true, message: "Friend added" };
		} 
		catch (error: any) {
			return { success: false, message: "You are already friend with this user" };
		}
	}

	delete_friend(userId : number, otherId : number) {
		const result = this.statementDeleteFriend.run({ userId, otherId });
		if (result.changes > 0) {
			return { success: true, message: "Friend deleted" };
		} 
		else {
			return { success: false, message: "You wasn't friend with this user" };
		}
	}
}
