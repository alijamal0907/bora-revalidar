"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/supabase";

export default function Header() {
  const router = useRouter();

  const handleSair = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 py-4 px-6 shadow-lg" style={{ backgroundColor: "#1B4332" }}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: "#C6A239" }}>
          Bora Revalidar
        </h1>
        
        <nav className="flex gap-6 items-center">
          <Link href="/home" className="hover:opacity-80 transition-opacity" style={{ color: "#E6E6E6" }}>
            Home
          </Link>
          <Link href="/estudar" className="hover:opacity-80 transition-opacity" style={{ color: "#E6E6E6" }}>
            Estudar
          </Link>
          <Link href="/simulados" className="hover:opacity-80 transition-opacity" style={{ color: "#E6E6E6" }}>
            Simulados
          </Link>
          <Link href="/revisao" className="hover:opacity-80 transition-opacity" style={{ color: "#E6E6E6" }}>
            Revisão
          </Link>
          <Link href="/premium" className="hover:opacity-80 transition-opacity" style={{ color: "#E6E6E6" }}>
            Premium
          </Link>
          <button
            onClick={handleSair}
            className="px-4 py-2 rounded hover:opacity-90 transition-opacity"
            style={{ backgroundColor: "#C6A239", color: "#0D1B2A" }}
          >
            Sair
          </button>
        </nav>
      </div>
    </header>
  );
}
