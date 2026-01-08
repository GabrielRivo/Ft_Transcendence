import { useEffect, useRef } from 'my-react';

// voir import type c bizarre
import type { RefObject } from 'my-react/src/types/global';

import Game from '../libs/pong/Game/index';

export const usePong = (): { gameRef: RefObject<HTMLCanvasElement | null>; Services: typeof Game.Services } => {
	const gameRef = useRef<HTMLCanvasElement | null>(null);

	useEffect(() => {
		console.log('usePong');
		if (!gameRef.current) return;

		Game.Services.init(gameRef.current);
		try {
			Game.Services.GameService!.launchGame('PongOnline');
		} catch (e) {
			console.error('An error occurred during the game initialization:', e);
		}
	}, []);

	return {
		gameRef,
		Services: Game.Services,
	};
};
