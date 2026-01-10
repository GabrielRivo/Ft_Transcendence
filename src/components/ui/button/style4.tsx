import { createElement } from 'my-react';
import type { Element } from 'my-react';

interface ButtonStyle4Props {
	children?: Element;
	onClick?: (e: MouseEvent) => void | (() => void);
	type?: 'button' | 'submit' | 'reset';
	disabled?: boolean;
}

export function ButtonStyle4({ children, onClick, type = 'button', disabled = false }: ButtonStyle4Props) {
	return (
		<button
			type={type}
			onClick={onClick}
			// disabled={disabled}
			className={`group font-pirulen relative flex cursor-pointer items-center justify-center overflow-hidden rounded-sm bg-white/5 px-6 py-2 text-sm text-gray-300 backdrop-blur-md transition-all duration-300 select-none hover:border-white/30 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50`}
		>
			<div className="absolute -top-[50%] -left-[50%] h-[200%] w-[50%] rotate-45 bg-linear-to-r from-transparent via-white/10 to-transparent transition-all duration-700 group-hover:left-full"></div>

			<span className="tracking-widest">{children}</span>
		</button>
	);
}
