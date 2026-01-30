import { createElement, useState } from 'my-react';
import { Modal } from '@/components/ui/modal';
import { ButtonStyle4 } from '@/components/ui/button/style4';
import { useToast } from '@/hook/useToast';
import { TwoFASetupModalProps } from '../types';

export function TwoFASetupModal({ onClose, qrCodeUrl, secret, onVerify }: TwoFASetupModalProps) {
	const { toast } = useToast();
	const [totpCode, setTotpCode] = useState('');

	const handleVerify = () => {
		if (totpCode.length !== 6) {
			toast('The code must contain 6 digits', 'warning', 1000);
			return;
		}
		onVerify(totpCode);
	};

	const handleCopySecret = () => {
		navigator.clipboard.writeText(secret);
		toast('Copied!', 'success', 1000);
	};

	return (
		<Modal onClose={onClose} title="2FA Setup" variant="cyan">
			<div className="space-y-4">
				<p className="text-sm text-gray-400">
					Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
				</p>
				{qrCodeUrl && (
					<div className="flex flex-col items-center gap-4">
						<div className="rounded-lg bg-white p-4">
							<img
								src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeUrl)}`}
								alt="QR Code 2FA"
								className="h-48 w-48"
							/>
						</div>

						{/* Secret manuel */}
						<div className="w-full space-y-2">
							<p className="text-xs text-gray-500">Or enter this code manually:</p>
							<div className="flex items-center gap-2 rounded-sm border border-white/10 bg-slate-800 p-3">
								<code className="flex-1 break-all font-mono text-sm text-cyan-400">{secret}</code>
								<button
									onClick={handleCopySecret}
									className="text-xs text-gray-400 transition-colors hover:text-white"
								>
									Copy
								</button>
							</div>
						</div>
					</div>
				)}
				<div className="space-y-2">
					<label className="text-xs text-gray-500">Enter the 6-digit code</label>
					<input
						type="text"
						value={totpCode}
						onInput={(e: Event) =>
							setTotpCode((e.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 6))
						}
						placeholder="000000"
						className="w-full rounded-sm border border-white/10 bg-transparent p-3 text-center text-2xl tracking-[0.5em] text-white outline-none focus:border-cyan-500/50"
						maxLength={6}
					/>
				</div>
				<ButtonStyle4 onClick={handleVerify} className="w-full">
					Verify and enable
				</ButtonStyle4>
			</div>
		</Modal>
	);
}

