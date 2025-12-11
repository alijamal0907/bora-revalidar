# Configuração do Email OTP para Recuperação de Senha

## O que é?
O sistema de recuperação de senha usa um código OTP (One-Time Password) de 6 dígitos enviado por email.

## Como configurar no Supabase Dashboard

### 1. Acesse o Supabase Dashboard
- Vá para: https://app.supabase.com
- Selecione seu projeto: `wilcwwcfuryagkibosjb`

### 2. Configure o Template de Email
1. No menu lateral, vá em **Authentication** → **Email Templates**
2. Selecione o template **"Magic Link"** (usado para OTP)
3. Substitua o conteúdo HTML pelo template abaixo:

### 3. Template de Email Recomendado

\`\`\`html
<h2>Seu código de recuperação de senha</h2>
<p>Olá,</p>
<p>Você solicitou a recuperação de senha para sua conta no Bora Revalidar.</p>
<p>Use o código abaixo para redefinir sua senha:</p>
<h1 style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #2563eb; background: #f1f5f9; padding: 20px; text-align: center; border-radius: 8px;">
  {{ .Token }}
</h1>
<p>Este código expira em <strong>1 hora</strong>.</p>
<p>Se você não solicitou esta recuperação, ignore este email.</p>
<br>
<p>Equipe Bora Revalidar</p>
\`\`\`

### 4. Variáveis Disponíveis
- `{{ .Token }}` - Código OTP de 6 dígitos (use este!)
- `{{ .Email }}` - Email do usuário
- `{{ .TokenHash }}` - Hash do token (não use para OTP)
- `{{ .SiteURL }}` - URL do site

### 5. Configurações Adicionais (Opcional)

#### Rate Limiting
- **Authentication** → **Rate Limits**
- Limite padrão: 1 OTP por minuto por usuário
- Recomendado: Manter o padrão

#### Tempo de Expiração
- **Authentication** → **Settings**
- Tempo padrão de expiração: 1 hora
- Recomendado: Manter entre 5-60 minutos

### 6. Teste o Sistema
1. Acesse a página de login do app
2. Clique em "Esqueceu sua senha?"
3. Insira um email válido
4. Verifique a caixa de entrada
5. O email deve conter um código de 6 dígitos

## Como funciona no código

### Enviar OTP
\`\`\`typescript
await supabase.auth.signInWithOtp({
  email: 'usuario@email.com',
  options: {
    shouldCreateUser: false, // Não criar novo usuário
  },
})
\`\`\`

### Verificar OTP e Atualizar Senha
\`\`\`typescript
await supabase.auth.verifyOtp({
  email: 'usuario@email.com',
  token: '123456',
  type: 'email',
})

await supabase.auth.updateUser({
  password: 'novaSenha123',
})
\`\`\`

## Segurança

- ✅ Código expira automaticamente após 1 hora
- ✅ Rate limiting previne spam
- ✅ Código de uso único (não pode ser reutilizado)
- ✅ Validação no servidor via Supabase Auth
- ✅ Não cria usuários novos se o email não existir

## Problemas Comuns

### Email não chega
- Verifique spam/lixeira
- Confirme que o template está salvo
- Verifique rate limiting (1 por minuto)
- Para produção, configure SMTP customizado

### Código inválido
- Certifique-se de que o código tem 6 dígitos
- Verifique se não expirou (1 hora)
- Não use espaços ou caracteres especiais
- Código é case-sensitive

### SMTP para Produção
Para envios em produção com volume alto:
1. Vá em **Project Settings** → **Auth**
2. Configure um servidor SMTP customizado (SendGrid, AWS SES, etc.)
3. Isso evita limites do Supabase

## Suporte

Se tiver problemas, verifique:
- Console do navegador (F12) para erros
- Logs do Supabase Dashboard em **Logs** → **Auth Logs**
- Configurações de email em **Authentication** → **Settings**
