import {
	Engine,
	Scene,
	ImportMeshAsync,
	SceneLoader,
	MeshBuilder,
	StandardMaterial,
	SpotLight,
	Color3,
	ArcRotateCamera,
	Vector2,
	Vector3,
	HemisphericLight,
	GlowLayer,
	PBRMaterial,
} from '@babylonjs/core';
import '@babylonjs/loaders/glTF';
import Services from '../Services/Services';
import { DeathBarPayload } from '../globalType';
import Player from '../Player';
import DeathBar from '../DeathBar';
import Ball from '../Ball';
import Wall from '../Wall';
import InputManager from '../InputManager';
import CollisionService from '../Services/CollisionService';
import Game from './Game';

import { socket } from '../../../socket';

interface GameUpdatePayload {
	p1: {
		pos: Vector3;
		dir: Vector3;
	};
	p2: {
		pos: Vector3;
		dir: Vector3;
	};
	ball: {
		pos: Vector3;
		dir: Vector3;
	};
}

class PongOnline extends Game {
	inputManager?: InputManager;
	player1?: Player;
	player2?: Player;
	ball?: Ball;
	walls?: Wall[];
	camera?: ArcRotateCamera;
	width: number = 7;
	height: number = 12;

	private currentGameState: 'waiting' | 'playing' | null;
	private gameState: 'waiting' | 'playing' | null;
	private serverState: 'connected' | 'disconnected';
	private gameJoined: boolean = false;

	constructor() {
		super();
		this.currentGameState = null;
		this.gameState = null;
		this.serverState = 'disconnected';
	}

	initialize(): void {
		Services.Scene = new Scene(Services.Engine!);
		Services.Dimensions = new Vector2(this.width, this.height);
		window.addEventListener('keydown', this.showDebugLayer);

		this.inputManager = new InputManager(this);
		this.inputManager.listenToP1Online();
		this.inputManager.listenToP1();
		this.inputManager.listenToP2();

		Services.EventBus!.on('DeathBarHit', this.onDeathBarHit);

		this.drawScene();

		Services.TimeService!.initialize();
	}

	async drawScene(): Promise<void> {
		const gl = new GlowLayer('glow', Services.Scene, {
			blurKernelSize: 32,
			mainTextureRatio: 0.25,
		});
		gl.intensity = 0.3;

		this.player1 = new Player(undefined);
		this.player2 = new Player(undefined);
		this.walls = [new Wall(), new Wall()];
		this.walls.forEach((wall) => Services.Scene!.addMesh(wall.model));
		this.ball = new Ball();
		this.camera = new ArcRotateCamera('Camera', 0, Math.PI / 4, 15, Vector3.Zero(), Services.Scene);
		this.camera.attachControl(Services.Canvas, true);

		//var light2: SpotLight = new SpotLight("spotLight", new Vector3(0, 10, 0), new Vector3(0, -1, 0), Math.PI / 2, 20, Services.Scene);
		//light2.intensity = 0;

		// const hemiLight = new HemisphericLight("hemiLight", new Vector3(0, 1, 0), Services.Scene);

		// hemiLight.intensity = 0.30;
		// //hemiLight.diffuse = new Color3(0.5, 0.6, 1);
		// hemiLight.diffuse = new Color3(0.5, 0.5, 0.5);
		// hemiLight.groundColor = new Color3(0, 0, 0);

		// await ImportMeshAsync("./testsus.glb", Services.Scene);
		// await ImportMeshAsync("./testsus.glb", Services.Scene);
		// await ImportMeshAsync("./models/test.obj", Services.Scene);

		const ground = MeshBuilder.CreateBox(
			'ground',
			{ width: this.width, height: this.height, depth: 0.1 },
			Services.Scene,
		);
		ground.position = new Vector3(0, -0.05, 0);
		ground.rotate(Vector3.Right(), Math.PI / 2);
		ground.isPickable = false;

		const groundMaterial = new StandardMaterial('groundMat', Services.Scene);
		groundMaterial.diffuseColor = new Color3(0.4, 0.4, 0.4);
		ground.material = groundMaterial;

		this.ball.setFullPos(new Vector3(0, 0.125, 0));
		this.player1.paddle.setModelDirection(new Vector3(0, 0, 1));
		this.player2.paddle.setModelDirection(new Vector3(0, 0, -1));
		this.player1.paddle.setPosition(new Vector3(0, 0.15, -this.height / 2 + 2));
		this.player2.paddle.setPosition(new Vector3(0, 0.15, this.height / 2 - 2));
		this.player1.deathBar.model.position = new Vector3(0, 0.125, -this.height / 2 + 1);
		this.player2.deathBar.model.position = new Vector3(0, 0.125, this.height / 2 - 1);
		this.walls[0].model.position = new Vector3(-this.width / 2 - 0.1, 0.25, 0);
		this.walls[1].model.position = new Vector3(this.width / 2 + 0.1, 0.25, 0);

		try {
			// Using SceneLoader.ImportMeshAsync instead of ImportMeshAsync directly to avoid strict signature issues
			const background = await SceneLoader.ImportMeshAsync('', './models/', 'pong.glb', Services.Scene!);
			background.meshes.forEach((mesh) => {
				mesh.isPickable = false;
			});
		} catch (e) {
			console.error('Failed to load pong.glb:', e);
		}
	}

	launch(): void {
		this.stop();
	}

	start(): void {
		this.joinServer();
	}

	joinServer(): void {
		// Services.EventBus!.on("Server:ConnectionError", this.onServerLostConnection);
		// Services.EventBus!.on("Server:Disconnected", this.onServerLostConnection);
		socket.on('connect_error', this.onServerLostConnection);
		socket.on('disconnect', this.onServerLostConnection);
		socket.on('queueTimeout', this.onGameEnded);
		socket.on('gameJoined', this.onGameJoined);
		socket.on('gameStopped', this.onGameStopped);
		socket.on('gameStarted', this.onGameStarted);
		socket.on('gameEnded', this.onGameEnded);
		socket.on('gameUpdate', this.onGameUpdate);
		socket.onAny(this.onServerLog);

		// const unsubscribe = Services.EventBus!.once("Server:Connected", () => {
		//     console.log("Connected to server, starting Pong game.");
		//     this.renderStart();
		// });
		// setTimeout(() => {
		//     unsubscribe();
		// }, 10000);

		const unsubscribe = socket.once('connect', () => {
			console.log('Connected to server, starting Pong game.');
			this.serverState = 'connected';
			this.processGameState();
		});

		// Services.SocketService!.connect();
		socket.connect();
	}

	private onServerLostConnection = (): void => {
		// Services.EventBus!.off("Server:ConnectionError", this.onServerLostConnection);
		// Services.EventBus!.off("Server:Disconnected", this.onServerLostConnection);
		socket.off('connect_error', this.onServerLostConnection);
		socket.off('disconnect', this.onServerLostConnection);

		console.log('Lost connection to server, attempting to reconnect...');
		this.serverState = 'disconnected';
		this.processGameState();

		const connectionTimeout = setTimeout(() => {
			unsubscribe();
			alert('Connection to server lost. The game will now stop.');
			this.endGame();
		}, 10000);

		const unsubscribe = Services.EventBus!.once('Server:Connected', () => {
			console.log('Reconnected to server, resuming game.');
			clearTimeout(connectionTimeout);
			// Services.EventBus!.on("Server:ConnectionError", this.onServerLostConnection);
			// Services.EventBus!.on("Server:Disconnected", this.onServerLostConnection);
			socket.on('connect_error', this.onServerLostConnection);
			socket.on('disconnect', this.onServerLostConnection);
			console.log('Resuming game after reconnection.');
			this.serverState = 'connected';
			this.processGameState();
		});
	};

	private onGameJoined = (payload: unknown): void => {
		this.gameJoined = true;
		console.log('Game joined with payload:', payload);
	};

	private onGameStopped = (): void => {
		this.gameState = 'waiting';
		this.processGameState();
	};

	private onGameStarted = (): void => {
		this.gameState = 'playing';
		Services.TimeService!.update();
		this.processGameState();
	};

	private onGameEnded = (payload: unknown): void => {
		console.log('Game ended by server:', payload);
		this.endGame();
	};

	private onServerLog = (event: string, ...args: unknown[]): void => {
		//console.log(`LOG SOCKET FROM SERVER: ${event}`, ...args);
	};

	private onGameUpdate = (payload: GameUpdatePayload): void => {
		// Update player 1
		this.player1?.paddle.setPosition(new Vector3(payload.p1.pos._x, payload.p1.pos._y, payload.p1.pos._z));
		this.player1?.paddle.setDirection(new Vector3(payload.p1.dir._x, payload.p1.dir._y, payload.p1.dir._z));
		// Update player 2
		this.player2?.paddle.setPosition(new Vector3(payload.p2.pos._x, payload.p2.pos._y, payload.p2.pos._z));
		this.player2?.paddle.setDirection(new Vector3(payload.p2.dir._x, payload.p2.dir._y, payload.p2.dir._z));
		// Update ball
		this.ball?.setFullPos(new Vector3(payload.ball.pos._x, payload.ball.pos._y, payload.ball.pos._z));
		this.ball?.setDir(new Vector3(payload.ball.dir._x, payload.ball.dir._y, payload.ball.dir._z));
	};

	private onDeathBarHit = (payload: DeathBarPayload) => {
		if (payload.deathBar.owner == this.player1) {
			this.player2!.scoreUp();
		} else if (payload.deathBar.owner == this.player2) {
			this.player1!.scoreUp();
		}
		this.ball = new Ball();
		this.ball.setFullPos(new Vector3(0, 0.125, 0));
	};

	processGameState(): void {
		if (this.serverState === 'connected' && this.gameState === 'playing' && this.currentGameState !== 'playing') {
			Services.EventBus!.emit('UI:MenuStateChange', 'off');
			this.currentGameState = 'playing';
			this.run();
		} else if (this.currentGameState !== 'waiting') {
			if (this.gameJoined === false && this.serverState === 'connected') {
				Services.EventBus!.emit('UI:MenuStateChange', 'matchmaking');
			} else Services.EventBus!.emit('UI:MenuStateChange', 'loading');
			this.currentGameState = 'waiting';
			this.stop();
		}
	}

	run() {
		console.log('Game running.');
		Services.Engine!.stopRenderLoop();
		Services.Engine!.runRenderLoop(() => {
			Services.TimeService!.update();
			if (this.camera) {
				this.camera.alpha += 0.0001 * Services.Engine!.getDeltaTime();
			}
			// this.player1!.update();
			// this.player2!.update();
			// this.ball!.update();
			Services.Scene!.render();
		});
	}

	stop() {
		console.log('Game stopped.');
		Services.Engine!.stopRenderLoop();
		Services.Engine!.runRenderLoop(() => {
			if (this.camera) {
				this.camera.alpha += 0.0001 * Services.Engine!.getDeltaTime();
			}
			Services.Scene!.render();
		});
	}

	private endGame(): void {
		Services.EventBus!.emit('UI:MenuStateChange', 'pongMenu');
		Services.EventBus!.emit('Game:Ended', {
			name: 'PongOnline',
			winnerId: null,
			score: { player1: this.player1!.score, player2: this.player2!.score },
		});
	}

	dispose(): void {
		console.log('Disposing Pong game instance.');
		Services.Engine!.stopRenderLoop();
		// Services.SocketService!.disconnect();

		this.player1?.dispose();
		this.player2?.dispose();
		this.ball?.dispose();
		this.walls?.forEach((wall) => wall.dispose());
		this.inputManager?.dispose();
		Services.EventBus!.off('DeathBarHit', this.onDeathBarHit);
		// Services.EventBus!.off("Server:ConnectionError", this.onServerLostConnection);
		// Services.EventBus!.off("Server:Disconnected", this.onServerLostConnection);
		socket.off('connect_error', this.onServerLostConnection);
		socket.off('disconnect', this.onServerLostConnection);
		socket.off('queueTimeout', this.onGameEnded);
		socket.off('gameJoined', this.onGameJoined);
		socket.off('gameStopped', this.onGameStopped);
		socket.off('gameStarted', this.onGameStarted);
		socket.off('gameEnded', this.onGameEnded);
		socket.off('gameUpdate', this.onGameUpdate);
		socket.offAny(this.onServerLog);
		socket.disconnect();

		Services.Scene!.dispose();

		Services.Scene = undefined;
		Services.Dimensions = undefined;

		window.removeEventListener('keydown', this.showDebugLayer);
	}

	showDebugLayer(ev: KeyboardEvent) {
		if (ev.ctrlKey && ev.keyCode === 73) {
			if (Services.Scene!.debugLayer.isVisible()) {
				Services.Scene!.debugLayer.hide();
			} else {
				Services.Scene!.debugLayer.show();
			}
		}
	}
}

export default PongOnline;
