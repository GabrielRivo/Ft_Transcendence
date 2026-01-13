import { createElement, FragmentComponent, createPortal, Element } from 'my-react';
import { Cross } from '@icon/cross';

interface ModalProps {
	onClose: () => void;
	children?: Element;
	title: string;
}

interface ModalHeaderProps {
	title: string;
	onClose: () => void;
}

interface ModalContentProps {
	children?: Element | Element[];
}

function ModalContent({ children }: ModalContentProps) {
	return (
		<div
			onMouseDown={(e: MouseEvent) => e.stopPropagation()}
			className="w-full max-w-md rounded-xl border border-purple-500/30 bg-slate-900 p-6 shadow-2xl shadow-purple-500/10"
		>
			{children}
		</div>
	);
}

function ModalHeader({ title, onClose }: ModalHeaderProps) {
	return (
		<div className="mb-6 flex items-center justify-between">
			<h2 className="text-xl font-bold text-white">{title}</h2>
			<button
				onClick={onClose}
				className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
			>
				<Cross />
			</button>
		</div>
	);
}

// je sais, sert a rien mais plus lisible...
function ModalBody({ children }: { children?: Element | Element[] }) {
	return <FragmentComponent>{children}</FragmentComponent>;
}

export function Modal({ onClose, children, title }: ModalProps) {
	const handleBackdropMouseDown = (e: MouseEvent) => {
		if (e.target === e.currentTarget) {
			e.stopPropagation();
			onClose();
		}
	};

	return createPortal(
		<div
			onMouseDown={handleBackdropMouseDown}
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
		>
			<ModalContent>
				<ModalHeader title={title} onClose={onClose} />
				<ModalBody>{children}</ModalBody>
			</ModalContent>
		</div>,
		document.body,
	);
}
