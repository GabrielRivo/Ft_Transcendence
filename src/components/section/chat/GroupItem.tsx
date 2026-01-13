import { createElement } from 'my-react';
import { Users } from '@icon/users';

interface GroupItemProps {
	key?: number | string;
	name: string;
	isSelected?: boolean;
	onClick: () => void;
}

export function GroupItem({ name, isSelected, onClick }: GroupItemProps) {
	return (
		<div
			onClick={onClick}
			className={`flex cursor-pointer flex-col items-center gap-2 transition-colors ${
				isSelected ? 'text-purple-400' : 'hover:text-purple-500'
			}`}
		>
			<div className="relative">
				<div
					className={`flex size-12 items-center justify-center rounded-full text-lg font-bold transition-all ${
						isSelected
							? 'bg-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.4)]'
							: 'bg-slate-800 hover:bg-purple-500/20'
					}`}
				>
					<Users className={`size-5 ${isSelected ? 'text-purple-400' : 'text-purple-500/70'}`} />
				</div>
			</div>
			<span className="max-w-16 truncate text-center text-xs font-bold">{name}</span>
		</div>
	);
}
