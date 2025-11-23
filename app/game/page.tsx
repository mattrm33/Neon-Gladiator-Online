"use client";

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { Button } from "@/components/ui/Button";
import { IconSword, IconShield, IconZap } from "@/components/Logo";
import { useRouter } from "next/navigation";

let socket: Socket;

export default function GamePage() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "queued" | "playing">("idle");
  const [gameId, setGameId] = useState<string | null>(null);
  const [gameState, setGameState] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    // Connect to custom server
    socket = io();

    // Basic Auth Handshake (In prod, pass token)
    fetch("/api/session").then(r => r.json()).then(data => {
        if(data.user) {
            socket.emit("auth", { userId: data.user.id, username: data.user.username });
        }
    });

    socket.on("queue_status", (s) => setStatus(s));
    
    socket.on("match_found", (data) => {
      setGameId(data.gameId);
      setStatus("playing");
    });

    socket.on("game_update", (state) => {
      setGameState(state);
      setLogs(state.logs);
    });

    socket.on("game_over", ({ result }) => {
        alert(result === "WIN" ? "VICTORY ACHIEVED" : "CRITICAL FAILURE");
        router.push("/dashboard");
    });

    return () => {
      socket.disconnect();
    };
  }, [router]);

  const joinQueue = () => socket.emit("join_queue");
  
  const performAction = (action: string) => {
    if (!gameId) return;
    socket.emit("game_action", { gameId, action });
  };

  if (status === "idle") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-center">
        <div>
            <h1 className="text-4xl text-neon-blue font-mono mb-8">COMBAT SIMULATION</h1>
            <Button onClick={joinQueue} className="text-2xl py-4 px-12">INITIALIZE MATCHMAKING</Button>
        </div>
      </div>
    );
  }

  if (status === "queued") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
            <div className="animate-spin w-16 h-16 border-4 border-neon-blue border-t-transparent rounded-full mx-auto mb-8"/>
            <h2 className="text-xl text-neon-blue animate-pulse">SCANNING FOR OPPONENTS...</h2>
        </div>
      </div>
    );
  }

  if (status === "playing" && gameState) {
    const myId = socket.id;
    const opponentId = Object.keys(gameState.players).find(id => id !== myId)!;
    const me = gameState.players[myId];
    const opponent = gameState.players[opponentId];
    const isMyTurn = gameState.turn === myId;

    return (
      <div className="min-h-screen bg-neutral-950 text-white p-4 flex flex-col">
        {/* HUD */}
        <div className="flex justify-between items-start mb-12">
          {/* Opponent */}
          <div className="text-right w-1/3">
            <h3 className="text-red-500 font-mono text-xl">{opponent.username}</h3>
            <div className="w-full bg-neutral-800 h-4 mt-2 border border-neutral-700">
              <div className="bg-red-500 h-full transition-all duration-500" style={{ width: `${opponent.hp}%` }} />
            </div>
            <p className="text-xs text-neutral-500 mt-1">HP: {opponent.hp}/{opponent.maxHp}</p>
          </div>
          
          <div className="text-2xl font-bold font-mono text-neon-yellow">VS</div>

          {/* Me */}
          <div className="w-1/3">
            <h3 className="text-neon-blue font-mono text-xl">{me.username} (YOU)</h3>
            <div className="w-full bg-neutral-800 h-4 mt-2 border border-neutral-700">
              <div className="bg-neon-blue h-full transition-all duration-500" style={{ width: `${me.hp}%` }} />
            </div>
             <div className="flex gap-1 mt-2">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className={`w-4 h-4 border ${i < me.energy ? 'bg-neon-yellow border-neon-yellow' : 'border-neutral-700'}`} />
                ))}
             </div>
          </div>
        </div>

        {/* Arena Visualization */}
        <div className="flex-1 flex items-center justify-center relative">
            <div className={`absolute transition-opacity duration-300 ${isMyTurn ? 'opacity-0' : 'opacity-100 pointer-events-none'}`}>
                <h1 className="text-6xl font-black text-neutral-800 uppercase tracking-widest">Enemy Turn</h1>
            </div>
            
            {/* Action Bar */}
            <div className={`grid grid-cols-3 gap-4 max-w-lg w-full ${!isMyTurn ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                <button onClick={() => performAction("attack")} className="bg-neutral-900 border border-neon-blue p-8 hover:bg-neon-blue hover:text-black transition-all group">
                    <div className="flex flex-col items-center gap-2">
                        <IconSword />
                        <span className="font-mono font-bold">ATTACK</span>
                        <span className="text-xs text-neutral-500 group-hover:text-black">+1 Energy</span>
                    </div>
                </button>
                <button onClick={() => performAction("heal")} className="bg-neutral-900 border border-neon-green p-8 hover:bg-neon-green hover:text-black transition-all group">
                     <div className="flex flex-col items-center gap-2">
                        <IconShield />
                        <span className="font-mono font-bold">REPAIR</span>
                        <span className="text-xs text-neutral-500 group-hover:text-black">-2 Energy</span>
                    </div>
                </button>
                <button onClick={() => performAction("special")} className="bg-neutral-900 border border-neon-pink p-8 hover:bg-neon-pink hover:text-black transition-all group">
                     <div className="flex flex-col items-center gap-2">
                        <IconZap />
                        <span className="font-mono font-bold">ULTIMATE</span>
                        <span className="text-xs text-neutral-500 group-hover:text-black">-3 Energy</span>
                    </div>
                </button>
            </div>
        </div>

        {/* Battle Log */}
        <div className="h-48 bg-black border-t-2 border-neon-blue p-4 font-mono text-sm overflow-y-auto">
            {logs.slice().reverse().map((log, i) => (
                <div key={i} className="mb-1 text-neon-blue/80">> {log}</div>
            ))}
        </div>
      </div>
    );
  }
  
  return null;
}
