-- Execute somente pelo operador do banco, depois de a pessoa criar sua conta.
-- psql ... -v usuario_email='EMAIL_DA_CONTA' -v ON_ERROR_STOP=1 -f database/vincular-legado.sql
-- Vincula apenas jogadores que ainda não têm dono. Não transfere dados de outra conta.
\if :{?usuario_email}
\else
\echo 'Informe -v usuario_email=EMAIL_DA_CONTA antes de executar.'
\quit 1
\endif
BEGIN;
SELECT set_config('curry.usuario_email', lower(btrim(:'usuario_email')), true);
DO $vinculo$
DECLARE
    dono bigint;
    quantidade integer;
BEGIN
    SELECT id INTO dono FROM usuarios WHERE email = current_setting('curry.usuario_email');
    IF dono IS NULL THEN
        RAISE EXCEPTION 'Conta não encontrada. Cadastre-se no CURRY primeiro.';
    END IF;
    UPDATE jogadores SET usuario_id = dono WHERE usuario_id IS NULL;
    GET DIAGNOSTICS quantidade = ROW_COUNT;
    RAISE NOTICE '% jogador(es) antigo(s) vinculado(s). Treinos e arremessos preservados.', quantidade;
END;
$vinculo$;
COMMIT;
