import { loginAction, registerAction } from "./actions";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/Logo";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-[url('/assets/grid-bg.svg')] bg-cover">
      <div className="border border-neon-blue bg-black/90 p-12 max-w-md w-full backdrop-blur-md relative">
        <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-neon-blue"></div>
        <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-neon-blue"></div>
        
        <div className="flex justify-center mb-8 animate-pulse-fast">
          <Logo className="w-24 h-24" />
        </div>
        <h1 className="text-3xl font-mono text-center text-neon-blue mb-8 tracking-widest uppercase text-glow">
          Neon Gladiator
        </h1>

        <form action={loginAction} className="space-y-4 mb-8">
          <div>
            <label className="text-xs text-neon-blue uppercase tracking-widest">Email</label>
            <input name="email" type="email" required className="w-full bg-neutral-900 border border-neutral-700 p-2 text-white focus:border-neon-blue outline-none" />
          </div>
          <div>
            <label className="text-xs text-neon-blue uppercase tracking-widest">Password</label>
            <input name="password" type="password" required className="w-full bg-neutral-900 border border-neutral-700 p-2 text-white focus:border-neon-blue outline-none" />
          </div>
          <Button type="submit" className="w-full">Initialize Link</Button>
        </form>

        <div className="text-center text-neutral-500 text-xs uppercase">
          <p>New User?</p>
          <form action={registerAction} className="mt-2">
            <input type="hidden" name="username" value={`User${Math.floor(Math.random()*1000)}`} />
            <input type="hidden" name="email" value="demo@test.com" />
            <input type="hidden" name="password" value="password" />
            <Button variant="secondary" className="text-xs py-1">Quick Reg (Demo)</Button>
          </form>
        </div>
      </div>
    </main>
  );
}
