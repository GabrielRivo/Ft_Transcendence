import { createElement, useState, useEffect, useRef } from 'my-react';
import { ChatMessage } from '../../../hook/useChat';
import { useAuth } from '../../../hook/useAuth';

interface ChatMessagesProps {
	messages: ChatMessage[];
	currentRoom: string;
	connected: boolean;
	onSendMessage: (content: string) => void;
}

export function ChatMessages({
	messages,
	currentRoom,
	connected,
	onSendMessage,
}: ChatMessagesProps) {
	const { user } = useAuth();
	const [inputValue, setInputValue] = useState('');
	const messagesEndRef = useRef<HTMLDivElement | null>(null);

	// Auto-scroll vers le bas quand de nouveaux messages arrivent
	useEffect(() => {
		if (messagesEndRef.current) {
			messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
		}
	}, [messages]);

	const handleSubmit = (e: Event) => {
		e.preventDefault();
		if (inputValue.trim() && connected) {
			onSendMessage(inputValue);
			setInputValue('');
		}
	};

	const formatTime = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleTimeString('fr-FR', {
			hour: '2-digit',
			minute: '2-digit',
		});
	};

	const getRoomTitle = () => {
		if (currentRoom === 'hub') return 'Hub Général';
		if (currentRoom.startsWith('room_')) return 'Message privé';
		if (currentRoom.startsWith('friend_')) return 'Message privé';
		return currentRoom;
	};

	return (
		<div className="flex h-full flex-col bg-slate-950/50">
			{/* Header */}
			<div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
				<div>
					<h3 className="font-pirulen text-sm tracking-wider text-white">{getRoomTitle()}</h3>
					<p className="text-xs text-gray-500">
						{connected ? (
							<span className="flex items-center gap-1">
								<span className="h-2 w-2 rounded-full bg-green-500"></span>
								Connecté
							</span>
						) : (
							<span className="flex items-center gap-1">
								<span className="h-2 w-2 rounded-full bg-red-500"></span>
								Déconnecté
							</span>
						)}
					</p>
				</div>
			</div>

			{/* Messages */}
			<div className="flex-1 overflow-y-auto p-4">
				{messages.length === 0 ? (
					<div className="flex h-full items-center justify-center">
						<p className="text-gray-500">Aucun message pour le moment</p>
					</div>
				) : (
					<div className="space-y-3">
						{messages.map((msg, index) => {
							const isOwnMessage = msg.userId === user?.id;
							return (
								<div
									key={`${msg.created_at}-${index}`}
									className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
								>
									<div
										className={`max-w-[70%] rounded-lg px-3 py-2 ${
											isOwnMessage
												? 'bg-cyan-500/20 text-cyan-100'
												: 'bg-white/5 text-gray-200'
										}`}
									>
										{!isOwnMessage && (
											<p className="mb-1 text-xs font-semibold text-purple-400">
												{msg.username}
											</p>
										)}
										<p className="text-sm break-words">{msg.msgContent}</p>
										<p className="mt-1 text-right text-xs text-gray-500">
											{formatTime(msg.created_at)}
										</p>
									</div>
								</div>
							);
						})}
						<div ref={messagesEndRef} />
					</div>
				)}
			</div>

			{/* Input */}
			<div className="border-t border-white/10 p-4">
				<form onSubmit={handleSubmit} className="flex gap-2">
					<input
						type="text"
						value={inputValue}
						onInput={(e: Event) => setInputValue((e.target as HTMLInputElement).value)}
						placeholder={connected ? 'Écrivez un message...' : 'Connexion en cours...'}
						disabled={!connected}
						className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-cyan-500/50 focus:bg-white/10 disabled:opacity-50"
					/>
					<button
						type="submit"
						disabled={!connected || !inputValue.trim()}
						className="rounded-lg bg-cyan-500/20 px-4 py-2 text-sm font-semibold text-cyan-400 transition-colors hover:bg-cyan-500/30 disabled:cursor-not-allowed disabled:opacity-50"
					>
						Envoyer
					</button>
				</form>
			</div>
		</div>
	);
}

