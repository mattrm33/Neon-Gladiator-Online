import { ButtonHTMLAttributes, ReactNode } from "react";
import { twMerge } from "tailwind-merge";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
  children: ReactNode;
}

export const Button = ({ variant = "primary", className, children, ...props }: Props) => {
  const base = "relative overflow-hidden px-6 py-2 font-bold tracking-wider transition-all transform active:scale-95 uppercase border-2 skew-x-[-10deg]";
  
  const variants = {
    primary: "bg-neutral-900 border-neon-blue text-neon-blue hover:bg-neon-blue hover:text-black shadow-[0_0_10px_#00f3ff50]",
    secondary: "bg-neutral-900 border-neon-pink text-neon-pink hover:bg-neon-pink hover:text-black shadow-[0_0_10px_#bc13fe50]",
    danger: "bg-neutral-900 border-red-500 text-red-500 hover:bg-red-500 hover:text-black",
  };

  return (
    <button className={twMerge(base, variants[variant], className)} {...props}>
       <div className="skew-x-[10deg]">{children}</div>
    </button>
  );
};
