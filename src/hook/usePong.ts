// import { useEffect, useRef } from 'my-react';

// // voir import type c bizarre
// import type { RefObject } from 'my-react/src/types/global';

// import Game from '../libs/pong/Game';
// import Services from '../libs/pong/Services';

// export const usePong = (canvasRef: RefObject<HTMLCanvasElement>): { gameRef: RefObject<Game | null> } => {
// 	const gameRef = useRef<Game | null>(null);

// 	useEffect(() => {
// 		if (!canvasRef.current) return;

// 		Services.init(canvasRef.current);
// 	}, [canvasRef]);

// 	return {
// 		gameRef,
// 	};
// };
