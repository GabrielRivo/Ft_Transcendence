import {
    io, Socket
} from "socket.io-client";

// WARNING
export const socket: Socket = io(`http://${window.location.hostname}:3000/game/pong`, {
    transports: ["websocket"],
    autoConnect: false,
    auth: { userId: "game_client_1" }
});