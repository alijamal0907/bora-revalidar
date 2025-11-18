# Controle de Dispositivo Único (OPCIONAL)

## Status Atual

O sistema de controle de dispositivos está **DESABILITADO** por padrão para evitar erros e permitir que múltiplos usuários façam login no mesmo momento sem problemas.

## O Que Este Sistema Faz

Quando habilitado, o controle de dispositivos garante que:
- Apenas 1 dispositivo pode estar logado por vez por usuário
- Se o usuário fizer login em outro dispositivo, a sessão anterior é encerrada automaticamente
- O app verifica a cada 30 segundos se a sessão ainda está ativa

## Como Habilitar (Opcional)

### Passo 1: Criar a Tabela no Supabase

1. Acesse o painel do Supabase
2. Vá em **SQL Editor**
3. Execute o script em `scripts/criar-tabela-user-devices.sql`

### Passo 2: Habilitar no Código

Abra `hooks/use-device-session.ts` e remova a linha `return` no início do useEffect:

\`\`\`typescript
useEffect(() => {
  // REMOVA ESTA LINHA PARA HABILITAR:
  return  // <-- Apague esta linha
  
  if (!userId) return
  // ... resto do código
})
\`\`\`

### Passo 3: Reabilitar Funções no Storage

Abra `lib/storage-supabase.ts` e substitua as funções:

**registerDeviceSession:**
\`\`\`typescript
export async function registerDeviceSession(
  userId: string,
  email: string,
  deviceInfo: {
    userAgent: string
    platform: string
    deviceId: string
  }
): Promise<{ success: boolean; message: string }> {
  try {
    const { data: existingSessions, error: fetchError } = await supabase
      .from('user_devices')
      .select('*')
      .eq('user_id', userId)
      .eq('active', true)

    if (fetchError) {
      console.error('[v0] Error fetching existing sessions:', fetchError)
    }

    if (existingSessions && existingSessions.length > 0) {
      const { error: deactivateError } = await supabase
        .from('user_devices')
        .update({ active: false, ended_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('active', true)

      if (deactivateError) {
        console.error('[v0] Error deactivating old sessions:', deactivateError)
      }
    }

    const { error: insertError } = await supabase
      .from('user_devices')
      .insert([
        {
          user_id: userId,
          email: email,
          device_id: deviceInfo.deviceId,
          user_agent: deviceInfo.userAgent,
          platform: deviceInfo.platform,
          active: true,
          last_active: new Date().toISOString(),
          started_at: new Date().toISOString(),
        },
      ])

    if (insertError) {
      console.error('[v0] Error registering device session:', insertError)
      return { success: false, message: 'Erro ao registrar dispositivo' }
    }

    return { success: true, message: 'Dispositivo registrado com sucesso' }
  } catch (error) {
    console.error('[v0] Error in registerDeviceSession:', error)
    return { success: false, message: 'Erro ao gerenciar sessão' }
  }
}
\`\`\`

## Por Que Está Desabilitado?

Para facilitar o desenvolvimento e testes, o sistema está desabilitado por padrão. Assim você pode:
- Testar em múltiplos navegadores simultaneamente
- Não precisa se preocupar com sessões sendo encerradas durante desenvolvimento
- Permite múltiplas pessoas acessarem para testes

## Quando Habilitar?

Habilite este sistema quando:
- O app estiver em produção
- Você quiser garantir que cada usuário use apenas 1 dispositivo
- Evitar compartilhamento de contas entre múltiplas pessoas

## Desvantagens de Habilitar

- Usuários que trocam de dispositivo frequentemente terão que fazer login novamente
- Se a internet cair momentaneamente, pode desconectar o usuário
- Adiciona complexidade de debugging
