"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/custom/Header";
import ProtectedRoute from "@/components/custom/ProtectedRoute";
import { getCurrentUser, supabase, isSupabaseConfigured } from "@/lib/supabase";
import { BookOpen, FileText, Crown, LogOut } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [nomeUsuario, setNomeUsuario] = useState("");

  useEffect(() => {
    const loadUser = async () => {
      const { user } = await getCurrentUser();
      if (user) {
        const nome = user.email?.split("@")[0] || "Usuário";
        setNomeUsuario(nome);
      }
    };
    
    loadUser();
  }, []);

  const cards = [
    {
      title: "Estudar",
      description: "Acesse questões e materiais",
      icon: BookOpen,
      color: "#FF8A38", // Laranja vibrante
      route: "/estudar"
    },
    {
      title: "Simulados",
      description: "Teste seus conhecimentos",
      icon: FileText,
      color: "#1F1A6E", // Roxo profundo
      route: "/simulados"
    },
    {
      title: "Premium",
      description: "Desbloqueie todos os recursos",
      icon: Crown,
      color: "#024E63", // Azul petróleo
      route: "/premium"
    },
    {
      title: "Sair",
      description: "Encerrar sessão",
      icon: LogOut,
      color: "#00121D", // Preto-azulado
      route: "/"
    }
  ];

  return (
    <ProtectedRoute>
      {/* Fundo com degradê e textura ECG */}
      <div 
        className="min-h-screen relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #001C2D 0%, #06345F 100%)",
        }}
      >
        {/* Textura de grade sutil */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: "50px 50px"
          }}
        />

        {/* Linha ECG sutil */}
        <div 
          className="absolute top-1/3 left-0 right-0 h-32 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='1200' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 50 L200 50 L220 20 L240 80 L260 50 L1200 50' stroke='%23FFFFFF' stroke-width='2' fill='none'/%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat-x",
            backgroundPosition: "center"
          }}
        />

        <Header />
        
        <main className="pt-32 px-6 max-w-6xl mx-auto relative z-10">
          {/* Título de boas-vindas */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold mb-4" style={{ color: "#FFFFFF" }}>
              Bem-vindo, {nomeUsuario}!
            </h1>
            <p className="text-xl" style={{ color: "#DCE6ED" }}>
              Escolha uma opção para começar seus estudos
            </p>
          </div>

          {/* Grid 2x2 de cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {cards.map((card, index) => {
              const Icon = card.icon;
              return (
                <button
                  key={index}
                  onClick={() => router.push(card.route)}
                  className="group relative p-10 rounded-3xl transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                  style={{
                    backgroundColor: card.color,
                    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.3)"
                  }}
                >
                  {/* Ícone */}
                  <div className="flex justify-center mb-6">
                    <div 
                      className="p-4 rounded-2xl transition-transform duration-300 group-hover:scale-110"
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.1)"
                      }}
                    >
                      <Icon className="w-12 h-12" style={{ color: "#FFFFFF" }} />
                    </div>
                  </div>

                  {/* Título */}
                  <h2 
                    className="text-3xl font-bold mb-3 text-center"
                    style={{ color: "#FFFFFF" }}
                  >
                    {card.title}
                  </h2>

                  {/* Descrição */}
                  <p 
                    className="text-center text-sm"
                    style={{ color: "#DCE6ED" }}
                  >
                    {card.description}
                  </p>

                  {/* Efeito de brilho no hover */}
                  <div 
                    className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"
                    style={{
                      background: "radial-gradient(circle at center, rgba(255,255,255,0.3) 0%, transparent 70%)"
                    }}
                  />
                </button>
              );
            })}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
