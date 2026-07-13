import { boot } from "@/lib/content";

export default function Home() {
  return (
    <main className="flex min-h-svh items-center justify-center">
      <h1 className="display-xl">{boot.presents[0]}</h1>
    </main>
  );
}
