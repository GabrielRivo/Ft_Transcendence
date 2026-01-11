import { createElement } from 'my-react';
import { RoomUser } from '../../../hook/useChat';
import { useAuth } from '../../../hook/useAuth';

interface ChatRoomUsersProps {
	roomUsers: RoomUser[];
	currentRoom: string;
}

export function ChatRoomUsers({ roomUsers, currentRoom }: ChatRoomUsersProps) {
	const { user } = useAuth();

	const getRoomTitle = () => {
		if (currentRoom === 'hub') return 'Dans le Hub';
		if (currentRoom.startsWith('room_') || currentRoom.startsWith('friend_')) return 'Dans la conversation';
		return 'Connectés';
	};

	return (
		<div className="flex h-full flex-col border-l border-white/10 bg-slate-900/50">
			{/* Header */}
			<div className="border-b border-white/10 p-3">
				<h3 className="font-pirulen text-xs tracking-wider text-orange-500">{getRoomTitle()}</h3>
				<p className="mt-1 text-xs text-gray-500">
					{roomUsers.length} utilisateur{roomUsers.length > 1 ? 's' : ''}
				</p>
			</div>

			{/* User List */}
			<div className="flex-1 overflow-y-auto p-2">
				{roomUsers.length === 0 ? (
					<p className="px-2 py-4 text-center text-sm text-gray-500">Aucun utilisateur</p>
				) : (
					<div className="space-y-1">
						{roomUsers.map((roomUser) => {
							const isCurrentUser = roomUser.userId === user?.id;
							return (
								<div
									key={roomUser.userId}
									className={`flex items-center gap-2 rounded-lg px-3 py-2 ${
										isCurrentUser ? 'bg-cyan-500/10' : 'hover:bg-white/5'
									}`}
								>
									{/* Avatar */}
									<div
										className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
											isCurrentUser
												? 'bg-cyan-500/30 text-cyan-400'
												: 'bg-gray-700 text-gray-300'
										}`}
									>
										{roomUser.username.charAt(0).toUpperCase()}
									</div>

									{/* User Info */}
									<div className="flex-1 truncate">
										<p
											className={`text-sm truncate ${
												isCurrentUser ? 'text-cyan-400' : 'text-gray-300'
											}`}
										>
											{roomUser.username}
											{isCurrentUser && (
												<span className="ml-1 text-xs text-gray-500">(vous)</span>
											)}
										</p>
									</div>

									{/* Online indicator */}
									<div className="h-2 w-2 rounded-full bg-green-500"></div>
								</div>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
}

