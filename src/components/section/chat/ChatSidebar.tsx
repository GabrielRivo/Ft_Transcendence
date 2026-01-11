import { createElement } from 'my-react';
import { Friend } from '../../../hook/useFriends';

interface ChatSidebarProps {
	currentRoom: string;
	friends: Friend[];
	friendsLoading: boolean;
	onSelectRoom: (roomId: string) => void;
	onSelectFriend: (friendId: number) => void;
}

export function ChatSidebar({
	currentRoom,
	friends,
	friendsLoading,
	onSelectRoom,
	onSelectFriend,
}: ChatSidebarProps) {
	return (
		<div className="flex h-full flex-col border-r border-white/10 bg-slate-900/50">
			{/* Header */}
			<div className="border-b border-white/10 p-3">
				<h3 className="font-pirulen text-xs tracking-wider text-cyan-500">CONVERSATIONS</h3>
			</div>

			{/* Room List */}
			<div className="flex-1 overflow-y-auto">
				{/* Hub (General) */}
				<div className="p-2">
					<h4 className="mb-2 px-2 text-xs font-semibold uppercase text-gray-500">Général</h4>
					<button
						onClick={() => onSelectRoom('hub')}
						className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
							currentRoom === 'hub'
								? 'bg-cyan-500/20 text-cyan-400'
								: 'text-gray-300 hover:bg-white/5'
						}`}
					>
						<div className="flex items-center gap-2">
							<span className="text-lg">🌐</span>
							<span>Hub</span>
						</div>
					</button>
				</div>

				{/* Friends */}
				<div className="p-2">
					<h4 className="mb-2 px-2 text-xs font-semibold uppercase text-gray-500">Amis</h4>
					{friendsLoading ? (
						<div className="px-3 py-2 text-sm text-gray-500">Chargement...</div>
					) : friends.length === 0 ? (
						<div className="px-3 py-2 text-sm text-gray-500">Aucun ami</div>
					) : (
						<div className="space-y-1">
							{friends.map((friend) => {
								const roomId = `friend_${friend.id}`;
								return (
									<button
										key={friend.id}
										onClick={() => onSelectFriend(friend.id)}
										className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
											currentRoom === roomId
												? 'bg-purple-500/20 text-purple-400'
												: 'text-gray-300 hover:bg-white/5'
										}`}
									>
										<div className="flex items-center gap-2">
											<div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500/30 text-xs">
												{friend.username.charAt(0).toUpperCase()}
											</div>
											<span className="truncate">{friend.username}</span>
										</div>
									</button>
								);
							})}
						</div>
					)}
				</div>

				{/* Groups (placeholder for future) */}
				<div className="p-2">
					<h4 className="mb-2 px-2 text-xs font-semibold uppercase text-gray-500">Groupes</h4>
					<div className="px-3 py-2 text-sm text-gray-500">Aucun groupe</div>
				</div>
			</div>
		</div>
	);
}

