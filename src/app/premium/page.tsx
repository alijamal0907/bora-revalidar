"use client";

import Header from "@/components/custom/Header";
import ProtectedRoute from "@/components/custom/ProtectedRoute";

export default function PremiumPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen" style={{ backgroundColor: "#0D1B2A" }}>
        <Header />
        
        <main className="pt-24 px-6 max-w-7xl mx-auto">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold mb-8 text-center" style={{ color: "#C6A239" }}>
              ⭐ Bora Revalidar Premium
            </h1>
            
            <div className="p-8 rounded-lg mb-8" style={{ backgroundColor: "#1B4332", border: "2px solid #C6A239" }}>
              <h2 className="text-2xl font-bold mb-4" style={{ color: "#C6A239" }}>
                Desbloqueie todo o potencial da plataforma
              </h2>
              
              <ul className="space-y-3 mb-8" style={{ color: "#E6E6E6" }}>
                <li className="flex items-start gap-3">
                  <span style={{ color: "#C6A239" }}>✓</span>
                  <span>Acesso ilimitado a todas as questões do Revalida</span>
                </li>
                <li className="flex items-start gap-3">
                  <span style={{ color: "#C6A239" }}>✓</span>
                  <span>Simulados personalizados com Inteligência Artificial</span>
                </li>
                <li className="flex items-start gap-3">
                  <span style={{ color: "#C6A239" }}>✓</span>
                  <span>Explicações detalhadas com fontes bibliográficas</span>
                </li>
                <li className="flex items-start gap-3">
                  <span style={{ color: "#C6A239" }}>✓</span>
                  <span>Flashcards inteligentes com revisão espaçada</span>
                </li>
                <li className="flex items-start gap-3">
                  <span style={{ color: "#C6A239" }}>✓</span>
                  <span>Estatísticas avançadas e análise de desempenho</span>
                </li>
                <li className="flex items-start gap-3">
                  <span style={{ color: "#C6A239" }}>✓</span>
                  <span>Biblioteca completa de diretrizes e materiais</span>
                </li>
              </ul>

              <div className="text-center">
                <p className="text-3xl font-bold mb-2" style={{ color: "#C6A239" }}>
                  R$ 147,00
                </p>
                <p className="mb-6" style={{ color: "#B7CBBF" }}>
                  De R$ 197,00 por apenas R$ 147,00
                </p>
                
                <a
                  href="https://pay.kiwify.com.br/mD6du8N"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-12 py-4 rounded-lg font-bold text-xl hover:opacity-90 transition-all transform hover:scale-105"
                  style={{ backgroundColor: "#C6A239", color: "#0D1B2A" }}
                >
                  Assinar Premium
                </a>
              </div>
            </div>

            <div className="text-center" style={{ color: "#B7CBBF" }}>
              <p>Pagamento seguro via Kiwify</p>
              <p className="text-sm mt-2">Acesso imediato após confirmação do pagamento</p>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
