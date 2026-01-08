import { createElement, useRef } from 'my-react';
import { usePong } from '../../hook/usePong';

export const Game = () => {
	const { gameRef, Services } = usePong();

	return <canvas ref={gameRef} className="block h-full w-full blur-sm" />;
};
