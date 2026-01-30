import { createElement, useState } from 'my-react';
import { ButtonStyle3 } from '@/components/ui/button/style3';
import { ButtonStyle4 } from '@/components/ui/button/style4';
import { BioCardProps } from './types';

export function BioCard({ bio, onBioChange, onSaveBio, isSaving }: BioCardProps) {
	const [isEditingBio, setIsEditingBio] = useState(false);

	const handleSaveBio = () => {
		onSaveBio().then(() => {
			setIsEditingBio(false);
		});
	};

	return (
		<div className="rounded-lg border border-orange-500/30 bg-slate-900/50 p-6">
			<div className="mb-4 flex items-center justify-between">
				<h2 className="font-pirulen text-xs tracking-wider text-orange-500">BIO</h2>
				{!isEditingBio && (
					<button
						onClick={() => setIsEditingBio(true)}
						className="text-xs text-gray-400 transition-colors hover:text-white"
					>
						Modify
					</button>
				)}
			</div>
			{isEditingBio ? (
				<div className="space-y-3">
					<textarea
						value={bio}
						onInput={(e: Event) => onBioChange((e.target as HTMLTextAreaElement).value)}
						placeholder="Describe yourself in a few words..."
						className="h-24 w-full resize-none rounded-sm border border-white/10 bg-transparent p-3 text-sm text-white outline-none transition-all duration-300 placeholder:text-gray-600 focus:border-orange-500/50 focus:bg-white/5"
						maxLength={200}
					/>
					<div className="flex items-center justify-between">
						<span className="text-xs text-gray-500">{bio.length}/200</span>
						<div className="flex gap-2">
							<ButtonStyle3 onClick={() => setIsEditingBio(false)}>Cancel</ButtonStyle3>
							<ButtonStyle4 onClick={handleSaveBio} disabled={isSaving}>
								{isSaving ? 'Saving...' : 'Save'}
							</ButtonStyle4>
						</div>
					</div>
				</div>
			) : (
				<p className="text-sm text-gray-400">{bio || 'No bio defined. Click edit to add one.'}</p>
			)}
		</div>
	);
}

