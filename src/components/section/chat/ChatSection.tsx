import { createElement } from 'my-react';
import { useChat } from '../../../hook/useChat';
import { useFriends } from '../../../hook/useFriends';
import { ChatSidebar } from './ChatSidebar';
import { ChatMessages } from './ChatMessages';
import { ChatRoomUsers } from './ChatRoomUsers';

export function ChatSection() {
	const { connected, currentRoom, messages, roomUsers, sendMessage, joinRoom, joinPrivateRoom } =
		useChat();
	const { friends, loading: friendsLoading } = useFriends();

	const handleSelectRoom = (roomId: string) => {
		joinRoom(roomId);
	};

	const handleSelectFriend = (friendId: number) => {
		joinPrivateRoom(friendId);
	};

	return (
		<div className="flex h-[500px] overflow-hidden rounded-lg border border-white/10">
			{/* Module Gauche - Sidebar */}
			<div className="w-56 flex-shrink-0">
				<ChatSidebar
					currentRoom={currentRoom}
					friends={friends}
					friendsLoading={friendsLoading}
					onSelectRoom={handleSelectRoom}
					onSelectFriend={handleSelectFriend}
				/>
			</div>

			{/* Module Centre - Messages */}
			<div className="flex-1">
				<ChatMessages
					messages={messages}
					currentRoom={currentRoom}
					connected={connected}
					onSendMessage={sendMessage}
				/>
			</div>

			{/* Module Droite - Users connectés */}
			<div className="w-48 flex-shrink-0">
				<ChatRoomUsers roomUsers={roomUsers} currentRoom={currentRoom} />
			</div>
		</div>
	);
}

