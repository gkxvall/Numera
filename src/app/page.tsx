import Link from "next/link";
import { Button } from "@/components";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="font-display text-numera-outline text-5xl tracking-wide sm:text-6xl">
        Numera
      </h1>
      <p className="text-foreground max-w-sm text-lg">Count smart. Tap carefully. Survive.</p>
      <Link href="/setup/players">
        <Button size="lg">Play locally</Button>
      </Link>
      <Link href="/showcase" className="text-foreground/60 text-sm underline underline-offset-4">
        View design system
      </Link>
    </main>
  );
}
