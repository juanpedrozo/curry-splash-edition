#!/usr/bin/env bash
# Reproduz a atualização V2 -> V3 e testa as consultas em um esquema descartável.
set -euo pipefail
cd "$(dirname "$0")/.."
CURRY_SQL_SCHEMA="curry_sql_$(date +%s)_${RANDOM}"
CURRY_SQL_EMAIL='sql-test@curry.test'
limpar() {
  docker compose exec -T db psql -U curry -d curry \
    -c "DROP SCHEMA IF EXISTS ${CURRY_SQL_SCHEMA} CASCADE" >/dev/null 2>&1 || true
}
trap limpar EXIT
psql_teste() {
  docker compose exec -T -e "PGOPTIONS=-c search_path=${CURRY_SQL_SCHEMA}" db \
    psql -U curry -d curry -v ON_ERROR_STOP=1 "$@"
}
docker compose exec -T db psql -U curry -d curry -v ON_ERROR_STOP=1 \
  -c "CREATE SCHEMA ${CURRY_SQL_SCHEMA}" >/dev/null
psql_teste < backend/src/main/resources/db/migration/V1__esquema.sql >/dev/null
psql_teste < backend/src/main/resources/db/migration/V2__consultas_estatisticas.sql >/dev/null
psql_teste <<'SQL' >/dev/null
INSERT INTO jogadores (nome) VALUES ('Atleta legado');
INSERT INTO treinos (jogador_id, data_treino, duracao_minutos) SELECT id, CURRENT_DATE, 30 FROM jogadores;
INSERT INTO arremessos (treino_id, zona, tentativas, acertos) SELECT id, 'TOPO_DO_ARCO', 20, 10 FROM treinos;
SQL
psql_teste < backend/src/main/resources/db/migration/V3__contas_e_propriedade.sql >/dev/null
# Conta de SQL sem senha utilizável. Não é criada no banco da aplicação.
psql_teste -c "INSERT INTO usuarios (nome, email, senha_hash) VALUES ('Teste SQL', '${CURRY_SQL_EMAIL}', repeat('x', 60))" >/dev/null
psql_teste -v "usuario_email=${CURRY_SQL_EMAIL}" < database/vincular-legado.sql >/dev/null
psql_teste -v "usuario_email=${CURRY_SQL_EMAIL}" < database/demo.sql >/dev/null
psql_teste -v "usuario_email=${CURRY_SQL_EMAIL}" < database/demo.sql >/dev/null
psql_teste < queries.sql >/dev/null
psql_teste <<'SQL'
DO $teste$
BEGIN
    IF (SELECT COUNT(*) FROM jogadores) <> 4
        OR (SELECT COUNT(*) FROM treinos) <> 16
        OR (SELECT COUNT(*) FROM arremessos) <> 76
        OR EXISTS (SELECT 1 FROM jogadores WHERE usuario_id IS NULL)
        OR (SELECT SUM(acertos) FROM arremessos a JOIN treinos t ON t.id = a.treino_id
            JOIN jogadores j ON j.id = t.jogador_id WHERE j.nome = 'Atleta legado') <> 10
    THEN
        RAISE EXCEPTION 'Falha na preservação dos dados ou na idempotência da carga.';
    END IF;
END;
$teste$;
SELECT 'OK: atualização V2/V3, vínculo, duas cargas sem duplicação e seis consultas SQL.' AS resultado;
SQL
