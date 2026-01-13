import { createElement, useState } from 'my-react';
import { useAuth } from '@hook/useAuth';
import { useGroups } from '@hook/useGroups';
import { Modal } from '@ui/modal';
import { Check } from '@icon/check';

interface CreateGroupModalProps {
	onClose: () => void;
}

export function CreateGroupModal({ onClose }: CreateGroupModalProps) {
	const { user } = useAuth();
	const { createGroup } = useGroups();
	const [groupName, setGroupName] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	const handleSubmit = async (e: Event) => {
		e.preventDefault();
		if (!groupName.trim() || !user) return;

		setLoading(true);
		setError(null);

		const result = await createGroup(groupName.trim());

		setLoading(false);

		if (result.success) {
			setSuccess(true);
			setTimeout(() => {
				onClose();
			}, 1500);
		} else {
			setError(result.message || 'Impossible de créer le groupe');
		}
	};

	return (
		<Modal onClose={onClose} title="Créer un groupe">
			{success ? (
				<div className="flex flex-col items-center gap-4 py-8">
					<div className="flex size-16 items-center justify-center rounded-full bg-green-500/20">
						<Check className="text-green-400" />
					</div>
					<p className="text-green-400">Groupe créé !</p>
				</div>
			) : (
				<form onSubmit={handleSubmit}>
					<div className="mb-6">
						<label className="mb-2 block text-sm font-medium text-gray-300">Nom du groupe</label>
						<input
							type="text"
							value={groupName}
							onInput={(e: Event) => setGroupName((e.target as HTMLInputElement).value)}
							placeholder="Entrez le nom du groupe..."
							maxLength={50}
							className="w-full rounded-lg border border-white/10 bg-slate-800 px-4 py-3 text-white placeholder-gray-500 transition-colors outline-none focus:border-purple-500"
							autoFocus
						/>
						<p className="mt-1 text-right text-xs text-gray-500">{groupName.length}/50</p>
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
							disabled={loading || !groupName.trim()}
							className="flex-1 rounded-lg bg-linear-to-r from-purple-500 to-purple-600 py-3 text-sm font-medium text-white transition-all hover:from-purple-400 hover:to-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
						>
							{loading ? 'Création...' : 'Créer'}
						</button>
					</div>
				</form>
			)}
		</Modal>
	);
}
