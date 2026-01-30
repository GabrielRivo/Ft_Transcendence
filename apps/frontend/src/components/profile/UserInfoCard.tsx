import { createElement, useState } from 'my-react';
import { ButtonStyle3 } from '@/components/ui/button/style3';
import { ButtonStyle4 } from '@/components/ui/button/style4';
import { UserInfoCardProps } from './types';

export function UserInfoCard({ user, onUsernameUpdate }: UserInfoCardProps) {
	const [isEditingUsername, setIsEditingUsername] = useState(false);
	const [newUsername, setNewUsername] = useState('');

	const handleUpdateUsername = () => {
		onUsernameUpdate(newUsername).then(() => {
			setIsEditingUsername(false);
			setNewUsername('');
		});
	};

	return (
		<div className="rounded-lg border border-cyan-500/30 bg-slate-900/50 p-6">
			<h2 className="font-pirulen mb-4 text-xs tracking-wider text-cyan-500">INFORMATIONS</h2>
			<div className="space-y-4">
				<div className="rounded-sm border border-white/10 p-4">
					<div className="flex items-center justify-between">
						<div>
							<label className="text-xs text-gray-500">Username</label>
						</div>
						{!isEditingUsername && (
							<button
								onClick={() => {
									setIsEditingUsername(true);
									setNewUsername(user?.username || '');
								}}
								className="text-xs text-cyan-400 transition-colors hover:text-white"
							>
								Modify
							</button>
						)}
					</div>
					{isEditingUsername ? (
						<div className="mt-2 space-y-3">
							<input
								type="text"
								value={newUsername}
								onInput={(e: Event) => setNewUsername((e.target as HTMLInputElement).value)}
								placeholder="New username"
								className="w-full rounded-sm border border-white/10 bg-transparent p-2 text-sm text-white outline-none focus:border-cyan-500/50"
								minLength={3}
								maxLength={20}
							/>
							<div className="flex justify-end gap-2">
								<ButtonStyle3 onClick={() => setIsEditingUsername(false)}>Cancel</ButtonStyle3>
								<ButtonStyle4 onClick={handleUpdateUsername}>Update</ButtonStyle4>
							</div>
						</div>
					) : (
						<p className="text-lg font-bold text-white">{user?.username || 'Non défini'}</p>
					)}
				</div>
				<div>
					<label className="text-xs text-gray-500">Mail</label>
					<p className="text-white">{user?.email || 'Non défini'}</p>
				</div>
			</div>
		</div>
	);
}

