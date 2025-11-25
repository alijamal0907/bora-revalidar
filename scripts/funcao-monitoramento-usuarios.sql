-- Função SQL para obter estatísticas de usuários
CREATE OR REPLACE FUNCTION get_user_stats()
RETURNS TABLE (
  total_auth bigint,
  total_assinaturas bigint,
  faltando bigint
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM auth.users)::bigint as total_auth,
    (SELECT COUNT(*) FROM assinaturas)::bigint as total_assinaturas,
    (SELECT COUNT(*) 
     FROM auth.users u 
     LEFT JOIN assinaturas a ON u.email = a.email 
     WHERE a.email IS NULL)::bigint as faltando;
END;
$$;

-- Dar permissão para usuários autenticados
GRANT EXECUTE ON FUNCTION get_user_stats() TO authenticated;
