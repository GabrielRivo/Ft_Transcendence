import { createElement } from 'my-react';
import { ButtonStyle3 } from '@/components/ui/button/style3';
import { ButtonStyle4 } from '@/components/ui/button/style4';
import { TwoFactorCardProps } from './types';

export function TwoFactorCard({ user, onSetup2FA, onDisable2FA, isSettingUp }: TwoFactorCardProps) {
	const isDisabled = !user?.email || user?.email === '';

	return (
		<div className="rounded-lg border border-green-500/30 bg-slate-900/50 p-6">
			<h2 className="font-pirulen mb-4 text-xs tracking-wider text-green-500">
				TWO-FACTOR AUTHENTICATION (2FA)
			</h2>
			{isDisabled && (
				<div className="mb-4 rounded-sm border border-red-500/30 bg-red-500/10 p-2">
					<p className="text-xs text-red-500">
						You cannot use this feature when you are connected via Discord or GitHub.
					</p>
				</div>
			)}
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<div>
						<h3 className="text-sm font-bold text-white">TOTP Authenticator</h3>
						<p className="text-xs text-gray-500">
							{user?.twoFA
								? 'Activated - Your account is protected'
								: 'Disabled - Add an extra layer of security'}
						</p>
					</div>
					<div
						className={`h-3 w-3 rounded-full ${user?.twoFA ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-gray-600'}`}
					/>
				</div>
				<div className="flex gap-2">
					{user?.twoFA ? (
						<ButtonStyle3 disabled={isDisabled} onClick={() => { onDisable2FA(); }}>
							Disable 2FA
						</ButtonStyle3>
					) : (
						<ButtonStyle4 disabled={isDisabled || isSettingUp} onClick={() => { onSetup2FA(); }}>
							{isSettingUp ? 'Setting up...' : 'Enable 2FA'}
						</ButtonStyle4>
					)}
				</div>
			</div>
		</div>
	);
}

