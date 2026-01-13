import { createElement } from 'my-react';
import { usePong } from '../../hook/usePong';

export const Game = () => {
	const { gameRef } = usePong();

	return <canvas ref={gameRef} id="gameCanvas" className="block size-full blur-sm" />;
};
