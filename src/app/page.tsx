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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#0D1B2A" }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: "#C6A239" }}></div>
          <p style={{ color: "#E6E6E6" }}>Carregando...</p>
        </div>
      </div>
    );
  }

  // Mostrar aviso se Supabase não estiver configurado
  if (configError) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#0D1B2A" }}>
        <div className="w-full max-w-md p-8 rounded-lg" style={{ backgroundColor: "#8B0000" }}>
          <h1 className="text-2xl font-bold text-center mb-4" style={{ color: "#FFFFFF" }}>
            ⚠️ Configuração Necessária
          </h1>
          <p className="text-center mb-4" style={{ color: "#E6E6E6" }}>
            O Supabase não está configurado. Configure as variáveis de ambiente:
          </p>
          <ul className="list-disc list-inside space-y-2 mb-6" style={{ color: "#E6E6E6" }}>
            <li>NEXT_PUBLIC_SUPABASE_URL</li>
            <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
          </ul>
          <p className="text-sm text-center" style={{ color: "#B7CBBF" }}>
            Clique no banner laranja acima para configurar ou acesse Configurações → Integrações → Supabase
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#0D1B2A" }}>
      <div className="w-full max-w-md p-8 rounded-lg" style={{ backgroundColor: "#1B4332" }}>
        <h1 className="text-3xl font-bold text-center mb-8" style={{ color: "#C6A239" }}>
          Bora Revalidar
        </h1>
        
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => {
              setIsLogin(true);
              setErro("");
              setSucesso("");
            }}
            className="flex-1 py-2 rounded transition-all"
            style={{
              backgroundColor: isLogin ? "#C6A239" : "transparent",
              color: isLogin ? "#0D1B2A" : "#E6E6E6",
              border: `2px solid ${isLogin ? "#C6A239" : "#E6E6E6"}`
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
            className="flex-1 py-2 rounded transition-all"
            style={{
              backgroundColor: !isLogin ? "#C6A239" : "transparent",
              color: !isLogin ? "#0D1B2A" : "#E6E6E6",
              border: `2px solid ${!isLogin ? "#C6A239" : "#E6E6E6"}`
            }}
          >
            Criar conta
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block mb-2" style={{ color: "#E6E6E6" }}>Nome</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                className="w-full p-3 rounded"
                style={{ backgroundColor: "#0D1B2A", color: "#E6E6E6", border: "1px solid #C6A239" }}
              />
            </div>
          )}
          
          <div>
            <label className="block mb-2" style={{ color: "#E6E6E6" }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-3 rounded"
              style={{ backgroundColor: "#0D1B2A", color: "#E6E6E6", border: "1px solid #C6A239" }}
            />
          </div>
          
          <div>
            <label className="block mb-2" style={{ color: "#E6E6E6" }}>Senha</label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              minLength={6}
              className="w-full p-3 rounded"
              style={{ backgroundColor: "#0D1B2A", color: "#E6E6E6", border: "1px solid #C6A239" }}
            />
            {!isLogin && (
              <p className="text-xs mt-1" style={{ color: "#B7CBBF" }}>
                Mínimo de 6 caracteres
              </p>
            )}
          </div>

          {erro && (
            <div className="p-3 rounded" style={{ backgroundColor: "#8B0000", color: "#FFFFFF" }}>
              {erro}
            </div>
          )}

          {sucesso && (
            <div className="p-3 rounded" style={{ backgroundColor: "#1B4332", color: "#C6A239", border: "1px solid #C6A239" }}>
              {sucesso}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded font-bold transition-all hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: "#C6A239", color: "#0D1B2A" }}
          >
            {loading ? "Carregando..." : (isLogin ? "Entrar" : "Criar conta")}
          </button>
        </form>

        {isLogin && (
          <p className="text-center mt-4" style={{ color: "#B7CBBF" }}>
            <a href="#" className="hover:underline">Esqueci minha senha</a>
          </p>
        )}
      </div>
    </div>
  );
}
