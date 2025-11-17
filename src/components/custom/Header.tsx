"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/supabase";
import { Home, BookOpen, FileText, Crown, RotateCcw } from "lucide-react";

export default function Header() {
  const router = useRouter();

  const handleSair = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <header 
      className="fixed top-0 left-0 right-0 z-50 py-5 px-8 backdrop-blur-md"
      style={{ 
        backgroundColor: "rgba(0, 28, 45, 0.8)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.1)"
      }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: "#FF8A38" }}
          >
            <span className="text-2xl font-bold" style={{ color: "#FFFFFF" }}>B</span>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "#FFFFFF" }}>
            Bora Revalidar
          </h1>
        </div>
        
        {/* Menu de navegação */}
        <nav className="flex gap-8 items-center">
          <Link 
            href="/home" 
            className="flex items-center gap-2 hover:opacity-80 transition-all duration-200 group"
          >
            <Home className="w-5 h-5 group-hover:scale-110 transition-transform" style={{ color: "#DCE6ED" }} />
            <span style={{ color: "#DCE6ED" }}>Home</span>
          </Link>
          
          <Link 
            href="/estudar" 
            className="flex items-center gap-2 hover:opacity-80 transition-all duration-200 group"
          >
            <BookOpen className="w-5 h-5 group-hover:scale-110 transition-transform" style={{ color: "#DCE6ED" }} />
            <span style={{ color: "#DCE6ED" }}>Estudar</span>
          </Link>
          
          <Link 
            href="/revisao" 
            className="flex items-center gap-2 hover:opacity-80 transition-all duration-200 group"
          >
            <RotateCcw className="w-5 h-5 group-hover:scale-110 transition-transform" style={{ color: "#DCE6ED" }} />
            <span style={{ color: "#DCE6ED" }}>Revisão</span>
          </Link>
          
          <Link 
            href="/simulados" 
            className="flex items-center gap-2 hover:opacity-80 transition-all duration-200 group"
          >
            <FileText className="w-5 h-5 group-hover:scale-110 transition-transform" style={{ color: "#DCE6ED" }} />
            <span style={{ color: "#DCE6ED" }}>Simulados</span>
          </Link>
          
          <Link 
            href="/premium" 
            className="flex items-center gap-2 hover:opacity-80 transition-all duration-200 group"
          >
            <Crown className="w-5 h-5 group-hover:scale-110 transition-transform" style={{ color: "#DCE6ED" }} />
            <span style={{ color: "#DCE6ED" }}>Premium</span>
          </Link>
          
          {/* Botão Sair em formato pill */}
          <button
            onClick={handleSair}
            className="px-6 py-2.5 font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg"
            style={{ 
              backgroundColor: "#FF8A38",
              color: "#FFFFFF",
              borderRadius: "50px",
              boxShadow: "0 4px 15px rgba(255, 138, 56, 0.3)"
            }}
          >
            Sair
          </button>
        </nav>
      </div>
    </header>
  );
}
