import { createElement, useState, createPortal } from 'my-react';
import { useAuth } from '@hook/useAuth';
import { useFriends } from '@hook/useFriends';
import { Modal } from '@ui/modal';
import { Check } from '@icon/check';

interface AddFriendModalProps {
	onClose: () => void;
}

export function AddFriendModal({ onClose }: AddFriendModalProps) {
	const { user } = useAuth();
	const { sendFriendInviteByUsername } = useFriends();
	const [username, setUsername] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	const handleSubmit = async (e: Event) => {
		e.preventDefault();
		if (!username.trim() || !user) return;

		setLoading(true);
		setError(null);

		const result = await sendFriendInviteByUsername(username.trim());

		setLoading(false);

		if (result.success) {
			setSuccess(true);
			setTimeout(() => {
				onClose();
			}, 1500);
		} else {
			setError(result.message || "Impossible d'envoyer l'invitation");
		}
	};

	const handleBackdropClick = (e: Event) => {
		if (e.target === e.currentTarget) {
			onClose();
		}
	};

	// "Ajouter un ami"
	return createPortal(
		<Modal onClose={onClose} title="Ajouter un am">
			{success ? (
				<div className="flex flex-col items-center gap-4 py-8">
					<div className="flex size-16 items-center justify-center rounded-full bg-green-500/20">
						<Check className="text-green-400" />
					</div>
					<p className="text-green-400">Invitation envoyée !</p>
				</div>
			) : (
				<form onSubmit={handleSubmit}>
					<div className="mb-6">
						<label className="mb-2 block text-sm font-medium text-gray-300">Pseudo de l'utilisateur</label>
						<input
							type="text"
							value={username}
							onInput={(e: Event) => setUsername((e.target as HTMLInputElement).value)}
							placeholder="Entrez le pseudo..."
							className="w-full rounded-lg border border-white/10 bg-slate-800 px-4 py-3 text-white placeholder-gray-500 transition-colors outline-none focus:border-cyan-500"
							autoFocus
						/>
						{error && <p className="mt-2 text-sm text-red-400">{error}</p>}
					</div>

					<div className="flex gap-3">
						<button
							type="button"
							onClick={onClose}
							className="flex-1 rounded-lg border border-white/10 py-3 text-sm font-medium text-gray-300 transition-colors hover:bg-white/5"
						>
							Annuler
						</button>
						<button
							type="submit"
							disabled={loading || !username.trim()}
							className="flex-1 rounded-lg bg-linear-to-r from-cyan-500 to-cyan-600 py-3 text-sm font-medium text-white transition-all hover:from-cyan-400 hover:to-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
						>
							{loading ? 'Envoi...' : 'Envoyer'}
						</button>
					</div>
				</form>
			)}
		</Modal>,
		document.body,
	);
}
