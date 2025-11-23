import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server, Socket } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// --- GAME CONSTANTS ---
const QUEUE_CHECK_INTERVAL = 2000;
const GAME_TURN_TIME = 15000; // 15 seconds per turn

interface GameState {
  id: string;
  players: {
    [socketId: string]: {
      id: string; // User ID
      username: string;
      hp: number;
      maxHp: number;
      energy: number;
      avatar: string;
    }
  };
  turn: string; // SocketID of current turn
  status: "active" | "finished";
  logs: string[];
}

// In-memory storage (Use Redis for production scaling)
const matchmakingQueue: { socketId: string; userId: string; username: string; elo: number }[] = [];
const activeGames: { [gameId: string]: GameState } = {};
const socketUserMap: { [socketId: string]: string } = {}; // socketId -> userId

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

  const io = new Server(server);

  // --- MATCHMAKING LOOP ---
  setInterval(() => {
    if (matchmakingQueue.length >= 2) {
      // Simple FIFO Matchmaking
      const p1 = matchmakingQueue.shift()!;
      const p2 = matchmakingQueue.shift()!;
      const gameId = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create Game State
      activeGames[gameId] = {
        id: gameId,
        players: {
          [p1.socketId]: { id: p1.userId, username: p1.username, hp: 100, maxHp: 100, energy: 3, avatar: 'avatar_01' },
          [p2.socketId]: { id: p2.userId, username: p2.username, hp: 100, maxHp: 100, energy: 3, avatar: 'avatar_01' }
        },
        turn: p1.socketId, // Player 1 starts
        status: "active",
        logs: ["Match Started!"]
      };

      // Notify Players
      io.to(p1.socketId).emit("match_found", { gameId, opponent: p2.username });
      io.to(p2.socketId).emit("match_found", { gameId, opponent: p1.username });
      
      // Start Game Loop (Initial State)
      io.to(p1.socketId).emit("game_update", activeGames[gameId]);
      io.to(p2.socketId).emit("game_update", activeGames[gameId]);
    }
  }, QUEUE_CHECK_INTERVAL);

  io.on("connection", (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Authenticate Socket (simplified, ideally verify JWT here)
    socket.on("auth", (data: { userId: string; username: string }) => {
      socketUserMap[socket.id] = data.userId;
      socket.data.userId = data.userId;
      socket.data.username = data.username;
    });

    // Matchmaking
    socket.on("join_queue", () => {
      if (!socket.data.userId) return;
      // Prevent duplicates
      if (matchmakingQueue.find(p => p.socketId === socket.id)) return;
      
      matchmakingQueue.push({
        socketId: socket.id,
        userId: socket.data.userId,
        username: socket.data.username,
        elo: 1000 // Fetch real ELO in prod
      });
      socket.emit("queue_status", "queued");
    });

    socket.on("leave_queue", () => {
      const idx = matchmakingQueue.findIndex(p => p.socketId === socket.id);
      if (idx !== -1) matchmakingQueue.splice(idx, 1);
      socket.emit("queue_status", "idle");
    });

    // Game Actions
    socket.on("game_action", (payload: { gameId: string, action: string }) => {
      const game = activeGames[payload.gameId];
      if (!game || game.status !== "active") return;
      if (game.turn !== socket.id) return; // Not your turn

      const opponentSocketId = Object.keys(game.players).find(id => id !== socket.id)!;
      const me = game.players[socket.id];
      const opponent = game.players[opponentSocketId];
      
      let logMsg = "";

      // Logic
      if (payload.action === "attack") {
        const dmg = Math.floor(Math.random() * 15) + 5;
        opponent.hp = Math.max(0, opponent.hp - dmg);
        logMsg = `${me.username} ATTACKED for ${dmg} damage!`;
        me.energy = Math.min(5, me.energy + 1);
      } else if (payload.action === "heal") {
        if (me.energy >= 2) {
            const heal = 15;
            me.hp = Math.min(me.maxHp, me.hp + heal);
            me.energy -= 2;
            logMsg = `${me.username} HEALED for ${heal} HP.`;
        } else {
            logMsg = `${me.username} tried to heal but had no energy!`;
        }
      } else if (payload.action === "special") {
          if (me.energy >= 3) {
              const dmg = 30;
              opponent.hp = Math.max(0, opponent.hp - dmg);
              me.energy -= 3;
              logMsg = `${me.username} used ULTIMATE for ${dmg} damage!`;
          } else {
              logMsg = `${me.username} tried Ultimate but fizzled!`;
          }
      }

      game.logs.push(logMsg);

      // Check Win Condition
      if (opponent.hp <= 0) {
        game.status = "finished";
        game.logs.push(`${me.username} WINS!`);
        io.to(socket.id).emit("game_over", { result: "WIN" });
        io.to(opponentSocketId).emit("game_over", { result: "LOSS" });
        // In production: Save match to DB here
      } else {
        // Switch Turn
        game.turn = opponentSocketId;
      }

      // Broadcast State
      io.to(socket.id).emit("game_update", game);
      io.to(opponentSocketId).emit("game_update", game);

      if (game.status === "finished") {
        delete activeGames[payload.gameId];
      }
    });

    socket.on("disconnect", () => {
        // Remove from queue
        const idx = matchmakingQueue.findIndex(p => p.socketId === socket.id);
        if (idx !== -1) matchmakingQueue.splice(idx, 1);
        
        // Handle disconnect in game (Auto forfeit logic would go here)
    });
  });

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
