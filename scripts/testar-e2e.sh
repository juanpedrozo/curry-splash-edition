#!/usr/bin/env bash
# Execute na raiz do projeto, com o PostgreSQL do Compose e a imagem app compilada.
# Use: docker compose build app && bash scripts/testar-e2e.sh
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ ! -f .env ]]; then
  echo 'Configure .env com DB_PASSWORD antes de executar.' >&2
  exit 1
fi

CURRY_E2E_SCHEMA="curry_e2e_$(date +%s)_${RANDOM}"
CURRY_E2E_CONTAINER="curry-e2e-${RANDOM}-$$"
CURRY_E2E_PORT="${CURRY_E2E_PORT:-18080}"
CURRY_E2E_PROJECT="$(docker inspect --format '{{ index .Config.Labels "com.docker.compose.project" }}' "$(docker compose ps -q db)")"
# O Compose ainda pode estar executando a imagem anterior. Use sempre o build atual.
CURRY_E2E_IMAGE="${CURRY_E2E_PROJECT}-app"

limpar() {
  docker logs "$CURRY_E2E_CONTAINER" > /tmp/curry-e2e-app.log 2>&1 || true
  docker rm -f "$CURRY_E2E_CONTAINER" >/dev/null 2>&1 || true
  docker compose exec -T db psql -U curry -d curry -v ON_ERROR_STOP=1 \
    -c "DROP SCHEMA IF EXISTS ${CURRY_E2E_SCHEMA} CASCADE" >/dev/null 2>&1 || true
}
trap limpar EXIT

docker compose exec -T db psql -U curry -d curry -v ON_ERROR_STOP=1 -c "CREATE SCHEMA ${CURRY_E2E_SCHEMA}"
docker run --detach --name "$CURRY_E2E_CONTAINER" --network "${CURRY_E2E_PROJECT}_default" \
  --env-file .env -e DB_URL=jdbc:postgresql://db:5432/curry -e DB_USER=curry \
  -e "SPRING_DATASOURCE_HIKARI_SCHEMA=${CURRY_E2E_SCHEMA}" \
  -e "SPRING_FLYWAY_DEFAULT_SCHEMA=${CURRY_E2E_SCHEMA}" \
  -e "SPRING_JPA_PROPERTIES_HIBERNATE_DEFAULT_SCHEMA=${CURRY_E2E_SCHEMA}" \
  -e SERVER_ADDRESS=0.0.0.0 -e SESSION_COOKIE_SECURE=false \
  -p "127.0.0.1:${CURRY_E2E_PORT}:8080" "$CURRY_E2E_IMAGE" >/dev/null

for tentativa in $(seq 1 60); do
  if curl --silent --fail "http://127.0.0.1:${CURRY_E2E_PORT}/api/auth/csrf" >/dev/null; then
    break
  fi
  if [[ "$tentativa" == 60 ]]; then
    docker logs "$CURRY_E2E_CONTAINER" >&2
    exit 1
  fi
  sleep 1
done

npm ci --prefix frontend --no-audit --no-fund
(cd frontend && npx playwright install chromium)
CURRY_E2E_BASE_URL="http://127.0.0.1:${CURRY_E2E_PORT}" npm run test:e2e --prefix frontend
