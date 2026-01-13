import Database, { Statement } from 'better-sqlite3';
import { InjectPlugin, Service } from 'my-fastify-decorators';
import { Server } from 'socket.io';

const CreateGroup = 
	`INSERT INTO privateGroup (name, ownerId) VALUES (@name, @ownerId)`;

const AddMember = 
	`INSERT INTO groupMembers (groupId, userId) VALUES (@groupId, @userId)`;

const RemoveMember = 
	`DELETE FROM groupMembers WHERE groupId = @groupId AND userId = @userId`;

const GetGroupMembers = 
	`SELECT userId FROM groupMembers WHERE groupId = @groupId`;

const GetUserGroups = 
	`SELECT g.groupId, g.name, g.ownerId, g.created_at
	FROM privateGroup g
	LEFT JOIN groupMembers m ON g.groupId = m.groupId
	WHERE g.ownerId = @userId OR m.userId = @userId
	GROUP BY g.groupId`;

const GetGroupById = 
	`SELECT groupId, name, ownerId, created_at FROM privateGroup WHERE groupId = @groupId`;

const DeleteGroup = 
	`DELETE FROM privateGroup WHERE groupId = @groupId AND ownerId = @ownerId`;

const IsMember = 
	`SELECT 1 FROM groupMembers WHERE groupId = @groupId AND userId = @userId
	UNION SELECT 1 FROM privateGroup WHERE groupId = @groupId AND ownerId = @userId`;

export interface Group {
	groupId: number;
	name: string;
	ownerId: number;
	created_at: string;
}

@Service()
export class GroupManagementService {
	@InjectPlugin('db')
	private db!: Database.Database;

	@InjectPlugin('io')
	private io!: Server;

	private statementCreateGroup: Statement<{ name: string; ownerId: number }>;
	private statementAddMember: Statement<{ groupId: number; userId: number }>;
	private statementRemoveMember: Statement<{ groupId: number; userId: number }>;
	private statementGetGroupMembers: Statement<{ groupId: number }>;
	private statementGetUserGroups: Statement<{ userId: number }>;
	private statementGetGroupById: Statement<{ groupId: number }>;
	private statementDeleteGroup: Statement<{ groupId: number; ownerId: number }>;
	private statementIsMember: Statement<{ groupId: number; userId: number }>;

	onModuleInit() {
		this.statementCreateGroup = this.db.prepare(CreateGroup);
		this.statementAddMember = this.db.prepare(AddMember);
		this.statementRemoveMember = this.db.prepare(RemoveMember);
		this.statementGetGroupMembers = this.db.prepare(GetGroupMembers);
		this.statementGetUserGroups = this.db.prepare(GetUserGroups);
		this.statementGetGroupById = this.db.prepare(GetGroupById);
		this.statementDeleteGroup = this.db.prepare(DeleteGroup);
		this.statementIsMember = this.db.prepare(IsMember);
	}

	createGroup(ownerId: number, name: string): { success: boolean; message: string; groupId?: number } {
		try {
			const result = this.statementCreateGroup.run({ name, ownerId });
			const groupId = Number(result.lastInsertRowid);
			
			this.statementAddMember.run({ groupId, userId: ownerId });
			
			return { success: true, message: "Group created", groupId };
		} catch (error: any) {
			return { success: false, message: error.message || "Failed to create group" };
		}
	}

	addMember(groupId: number, userId: number, inviterId: number): { success: boolean; message: string } {
		const canInvite = this.isMember(groupId, inviterId);
		if (!canInvite) {
			return { success: false, message: "You are not a member of this group" };
		}
		
		const members = this.getGroupMembers(groupId);
		if (members.length >= 16) {
			return { success: false, message: "Group is full (max 16 members)" };
		}
		
		try {
			this.statementAddMember.run({ groupId, userId });
			
			this.emitToUser(userId, 'group_invite', { groupId });
			
			return { success: true, message: "Member added" };
		} catch (error: any) {
			return { success: false, message: "User is already a member" };
		}
	}

	removeMember(groupId: number, userId: number, removerId: number): { success: boolean; message: string } {
		const group = this.getGroupById(groupId);
		if (!group) {
			return { success: false, message: "Group not found" };
		}
		
		if (group.ownerId !== removerId && userId !== removerId) {
			return { success: false, message: "You don't have permission to remove this member" };
		}
		
		if (userId === group.ownerId) {
			return { success: false, message: "Owner cannot leave. Delete the group instead." };
		}
		
		const result = this.statementRemoveMember.run({ groupId, userId });
		if (result.changes === 0) {
			return { success: false, message: "User is not a member" };
		}
		
		return { success: true, message: "Member removed" };
	}

	getUserGroups(userId: number): Group[] {
		return this.statementGetUserGroups.all({ userId }) as Group[];
	}

	getGroupMembers(groupId: number): number[] {
		const rows = this.statementGetGroupMembers.all({ groupId }) as { userId: number }[];
		return rows.map(r => r.userId);
	}

	getGroupById(groupId: number): Group | undefined {
		return this.statementGetGroupById.get({ groupId }) as Group | undefined;
	}

	isMember(groupId: number, userId: number): boolean {
		return !!this.statementIsMember.get({ groupId, userId });
	}

	deleteGroup(groupId: number, ownerId: number): { success: boolean; message: string } {
		const result = this.statementDeleteGroup.run({ groupId, ownerId });
		if (result.changes === 0) {
			return { success: false, message: "Group not found or you are not the owner" };
		}
		return { success: true, message: "Group deleted" };
	}

	private emitToUser(userId: number, event: string, data: any): void {
		for (const [, socket] of this.io.sockets.sockets) {
			if (socket.data.userId === userId) {
				socket.emit(event, data);
			}
		}
	}
}

