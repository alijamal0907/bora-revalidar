"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn, signUp, supabase, isSupabaseConfigured } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [configError, setConfigError] = useState(false);

  // Verificar se usuário já está logado
  useEffect(() => {
    const checkAuth = async () => {
      // Verificar se Supabase está configurado
      if (!isSupabaseConfigured()) {
        console.warn("⚠️ Supabase não está configurado. Configure as variáveis de ambiente.");
        setConfigError(true);
        setCheckingAuth(false);
        return;
      }

      try {
        // Apenas tenta verificar sessão se Supabase estiver configurado
        const { data: { session }, error } = await supabase!.auth.getSession();
        
        if (error) {
          console.error("Erro ao verificar sessão:", error);
          setCheckingAuth(false);
          return;
        }
        
        if (session?.user) {
          router.push("/home");
        } else {
          setCheckingAuth(false);
        }
      } catch (error) {
        console.error("Erro ao verificar autenticação:", error);
        setCheckingAuth(false);
      }
    };
    
    checkAuth();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setSucesso("");
    setLoading(true);

    // Verificar configuração antes de tentar autenticar
    if (!isSupabaseConfigured()) {
      setErro("Sistema não configurado. Entre em contato com o suporte.");
      setLoading(false);
      return;
    }
    
    try {
      if (isLogin) {
        // LOGIN
        const { data, error } = await signIn(email, senha);
        
        if (error) {
          console.error("Erro no login:", error);
          
          // Tratamento específico de erros
          if (error.name === 'NetworkError' || error.status === 0) {
            setErro("Erro de conexão. Verifique sua internet e tente novamente.");
          } else if (error.message.includes("Email not confirmed")) {
            setErro("Por favor, confirme seu email antes de fazer login. Verifique sua caixa de entrada.");
          } else if (error.message.includes("Invalid login credentials")) {
            setErro("Email ou senha incorretos. Verifique suas credenciais.");
          } else if (error.message.includes("não está configurado")) {
            setErro("Sistema não configurado. Entre em contato com o suporte.");
          } else {
            setErro(`Erro ao fazer login: ${error.message}`);
          }
          setLoading(false);
          return;
        }
        
        if (data?.user) {
          setSucesso("Login realizado! Redirecionando...");
          setTimeout(() => {
            router.push("/home");
          }, 500);
        }
      } else {
        // CADASTRO
        const { data, error } = await signUp(email, senha);
        
        if (error) {
          console.error("Erro no cadastro:", error);
          
          // Tratamento específico de erros
          if (error.name === 'NetworkError' || error.status === 0) {
            setErro("Erro de conexão. Verifique sua internet e tente novamente.");
          } else if (error.message.includes("already registered")) {
            setErro("Este email já está cadastrado. Tente fazer login.");
          } else if (error.message.includes("Password should be at least")) {
            setErro("A senha deve ter pelo menos 6 caracteres.");
          } else if (error.message.includes("não está configurado")) {
            setErro("Sistema não configurado. Entre em contato com o suporte.");
          } else {
            setErro(`Erro ao criar conta: ${error.message}`);
          }
          setLoading(false);
          return;
        }
        
        if (data?.user) {
          // Verificar se precisa confirmar email
          if (data.user.identities && data.user.identities.length === 0) {
            setErro("Este email já está cadastrado. Tente fazer login.");
            setLoading(false);
            return;
          }

          // Verificar se email foi confirmado automaticamente
          if (data.session) {
            // Login automático bem-sucedido
            setSucesso("Conta criada com sucesso! Redirecionando...");
            setTimeout(() => {
              router.push("/home");
            }, 1000);
          } else {
            // Precisa confirmar email
            setSucesso("Conta criada! Verifique seu email para confirmar e depois faça login.");
            setIsLogin(true);
            setLoading(false);
          }
        }
      }
    } catch (err: any) {
      console.error("Erro inesperado:", err);
      
      // Tratamento de erros de rede
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setErro("Erro de conexão. Verifique sua internet e tente novamente.");
      } else if (err.name === 'AbortError') {
        setErro("Requisição cancelada. Tente novamente.");
      } else {
        setErro("Erro inesperado. Tente novamente.");
      }
      setLoading(false);
    }
  };

  // Mostrar loading enquanto verifica autenticação
  if (checkingAuth) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #001C2D 0%, #06345F 100%)" }}
      >
        {/* Textura de grade */}
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
        
        <div className="text-center relative z-10">
          <div 
            className="animate-spin rounded-full h-16 w-16 border-4 border-t-transparent mx-auto mb-4"
            style={{ borderColor: "#FF8A38" }}
          ></div>
          <p className="text-lg" style={{ color: "#DCE6ED" }}>Carregando...</p>
        </div>
      </div>
    );
  }

  // Mostrar aviso se Supabase não estiver configurado
  if (configError) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #001C2D 0%, #06345F 100%)" }}
      >
        {/* Textura de grade */}
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
        
        <div 
          className="w-full max-w-md p-8 rounded-3xl relative z-10"
          style={{ 
            backgroundColor: "#8B0000",
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.3)"
          }}
        >
          <h1 className="text-3xl font-bold text-center mb-4" style={{ color: "#FFFFFF" }}>
            ⚠️ Configuração Necessária
          </h1>
          <p className="text-center mb-4" style={{ color: "#DCE6ED" }}>
            O Supabase não está configurado. Configure as variáveis de ambiente:
          </p>
          <ul className="list-disc list-inside space-y-2 mb-6" style={{ color: "#DCE6ED" }}>
            <li>NEXT_PUBLIC_SUPABASE_URL</li>
            <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
          </ul>
          <p className="text-sm text-center" style={{ color: "#DCE6ED" }}>
            Clique no banner laranja acima para configurar ou acesse Configurações → Integrações → Supabase
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #001C2D 0%, #06345F 100%)" }}
    >
      {/* Textura de grade */}
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
      
      <div 
        className="w-full max-w-md p-10 rounded-3xl relative z-10"
        style={{ 
          backgroundColor: "rgba(0, 18, 29, 0.8)",
          backdropFilter: "blur(10px)",
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.3)",
          border: "1px solid rgba(255, 255, 255, 0.1)"
        }}
      >
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div 
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: "#FF8A38" }}
          >
            <span className="text-4xl font-bold" style={{ color: "#FFFFFF" }}>B</span>
          </div>
        </div>

        <h1 className="text-4xl font-bold text-center mb-2" style={{ color: "#FFFFFF" }}>
          Bora Revalidar
        </h1>
        <p className="text-center mb-8" style={{ color: "#DCE6ED" }}>
          Sua plataforma de estudos
        </p>
        
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => {
              setIsLogin(true);
              setErro("");
              setSucesso("");
            }}
            className="flex-1 py-3 rounded-full font-semibold transition-all duration-300"
            style={{
              backgroundColor: isLogin ? "#FF8A38" : "transparent",
              color: isLogin ? "#FFFFFF" : "#DCE6ED",
              border: `2px solid ${isLogin ? "#FF8A38" : "rgba(255, 255, 255, 0.2)"}`
            }}
          >
            Entrar
          </button>
          <button
            onClick={() => {
              setIsLogin(false);
              setErro("");
              setSucesso("");
            }}
            className="flex-1 py-3 rounded-full font-semibold transition-all duration-300"
            style={{
              backgroundColor: !isLogin ? "#FF8A38" : "transparent",
              color: !isLogin ? "#FFFFFF" : "#DCE6ED",
              border: `2px solid ${!isLogin ? "#FF8A38" : "rgba(255, 255, 255, 0.2)"}`
            }}
          >
            Criar conta
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div>
              <label className="block mb-2 font-medium" style={{ color: "#DCE6ED" }}>Nome</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                className="w-full p-4 rounded-2xl transition-all duration-200 focus:outline-none focus:ring-2"
                style={{ 
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  color: "#FFFFFF",
                  border: "1px solid rgba(255, 255, 255, 0.1)"
                }}
              />
            </div>
          )}
          
          <div>
            <label className="block mb-2 font-medium" style={{ color: "#DCE6ED" }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-4 rounded-2xl transition-all duration-200 focus:outline-none focus:ring-2"
              style={{ 
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                color: "#FFFFFF",
                border: "1px solid rgba(255, 255, 255, 0.1)"
              }}
            />
          </div>
          
          <div>
            <label className="block mb-2 font-medium" style={{ color: "#DCE6ED" }}>Senha</label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              minLength={6}
              className="w-full p-4 rounded-2xl transition-all duration-200 focus:outline-none focus:ring-2"
              style={{ 
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                color: "#FFFFFF",
                border: "1px solid rgba(255, 255, 255, 0.1)"
              }}
            />
            {!isLogin && (
              <p className="text-xs mt-2" style={{ color: "#DCE6ED" }}>
                Mínimo de 6 caracteres
              </p>
            )}
          </div>

          {erro && (
            <div 
              className="p-4 rounded-2xl"
              style={{ 
                backgroundColor: "rgba(139, 0, 0, 0.2)",
                border: "1px solid #8B0000",
                color: "#FFFFFF"
              }}
            >
              {erro}
            </div>
          )}

          {sucesso && (
            <div 
              className="p-4 rounded-2xl"
              style={{ 
                backgroundColor: "rgba(255, 138, 56, 0.2)",
                border: "1px solid #FF8A38",
                color: "#FFFFFF"
              }}
            >
              {sucesso}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-full font-bold transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ 
              backgroundColor: "#FF8A38",
              color: "#FFFFFF",
              boxShadow: "0 4px 15px rgba(255, 138, 56, 0.3)"
            }}
          >
            {loading ? "Carregando..." : (isLogin ? "Entrar" : "Criar conta")}
          </button>
        </form>

        {isLogin && (
          <p className="text-center mt-6" style={{ color: "#DCE6ED" }}>
            <a href="#" className="hover:underline transition-all">Esqueci minha senha</a>
          </p>
        )}
      </div>
    </div>
  );
}
