import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { logoutAction } from "../actions";

export default async function Dashboard() {
  const session = await getSession();
  if (!session) redirect("/");

  const user = await prisma.user.findUnique({ 
    where: { id: session.user.id },
    include: { inventory: true }
  });

  if (!user) redirect("/");

  return (
    <div className="min-h-screen bg-background p-8">
      <header className="flex justify-between items-center mb-12 border-b border-neutral-800 pb-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-neon-blue/20 border border-neon-blue flex items-center justify-center">
             <span className="text-2xl font-bold text-neon-blue">{user.username[0]}</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{user.username}</h2>
            <p className="text-neon-yellow text-sm">Lvl {user.level} • {user.coins} Credits</p>
          </div>
        </div>
        <form action={logoutAction}><Button variant="danger">Disconnect</Button></form>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Play Section */}
        <div className="col-span-2 bg-panel border border-panelBorder p-8 relative overflow-hidden group">
          <div className="absolute inset-0 bg-neon-blue/5 group-hover:bg-neon-blue/10 transition-all"/>
          <h3 className="text-3xl font-mono text-neon-blue mb-4">BATTLE ARENA</h3>
          <p className="text-neutral-400 mb-8 max-w-md">Enter the matchmaking queue. Defeat opponents to earn credits and ELO rating.</p>
          <Link href="/game">
            <Button className="w-full py-6 text-xl">ENTER QUEUE</Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="bg-panel border border-panelBorder p-6">
          <h4 className="text-neon-pink mb-4 font-mono">OPERATOR STATS</h4>
          <div className="space-y-4">
            <div className="flex justify-between"><span className="text-neutral-500">ELO RATING</span> <span>{user.elo}</span></div>
            <div className="flex justify-between"><span className="text-neutral-500">WINS</span> <span>{user.wins}</span></div>
            <div className="flex justify-between"><span className="text-neutral-500">LOSSES</span> <span>{user.losses}</span></div>
          </div>
        </div>

        {/* Shop Preview */}
        <div className="bg-panel border border-panelBorder p-6">
           <h4 className="text-neon-green mb-4 font-mono">SUPPLY DEPOT</h4>
           <div className="h-32 flex items-center justify-center text-neutral-600 italic">
             Shop System Offline (Demo)
           </div>
           <Button variant="secondary" className="w-full">Visit Shop</Button>
        </div>
      </div>
    </div>
  );
}
