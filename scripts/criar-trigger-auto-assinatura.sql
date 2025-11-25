-- Criar função que adiciona automaticamente usuário na tabela assinaturas
CREATE OR REPLACE FUNCTION criar_assinatura_automatica()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserir novo usuário na tabela assinaturas com plano FREE
  INSERT INTO assinaturas (email, nome, status, plano, data_cadastro)
  VALUES (
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1)),
    'ativo',
    'free',
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
  'Função que cria automaticamente um registro na tabela assinaturas quando um novo usuário se cadastra, iniciando com plano FREE';
