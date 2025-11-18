// Utilitário para enviar emails de boas-vindas
// Você pode usar Resend (recomendado para Vercel) ou outro serviço

export async function sendWelcomeEmail(email: string, nome: string) {
  // Se você tiver Resend configurado:
  /*
  const { Resend } = require('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)
  
  await resend.emails.send({
    from: 'Bora Revalidar <noreply@seudominio.com>',
    to: email,
    subject: 'Bem-vindo ao Bora Revalidar! 🎉',
    html: `
      <h1>Olá ${nome}!</h1>
      <p>Seu pagamento foi confirmado e sua conta está ativa!</p>
      <p>Acesse agora: <a href="https://seu-dominio.vercel.app/login">https://seu-dominio.vercel.app/login</a></p>
      <p>Use o email: ${email} para fazer login.</p>
      <p>Bons estudos! 📚</p>
    `
  })
  */
  
  console.log(`[v0] Email de boas-vindas seria enviado para: ${email}`)
  // Por enquanto apenas loga, implemente o envio real depois
}
