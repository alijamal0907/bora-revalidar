-- Corrigido trigger para usar apenas colunas que existem na tabela assinaturas
CREATE OR REPLACE FUNCTION criar_assinatura_automatica()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserir novo usuário na tabela assinaturas (sem coluna plano que não existe)
  INSERT INTO assinaturas (email, nome, status, data_cadastro)
  VALUES (
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1)),
    'ativo',
    NOW()
  )
  ON CONFLICT (email) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger que executa após criação de novo usuário no auth.users
DROP TRIGGER IF EXISTS trigger_criar_assinatura_automatica ON auth.users;
CREATE TRIGGER trigger_criar_assinatura_automatica
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION criar_assinatura_automatica();

-- Comentário para documentação
COMMENT ON FUNCTION criar_assinatura_automatica() IS 
  'Função que cria automaticamente um registro na tabela assinaturas quando um novo usuário se cadastra. Plano detectado via transaction_id/data_pagamento.';
