#!/usr/bin/env bash
# Execute com Bash. A senha fica no ambiente do contêiner, não em um arquivo do Git.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

if ! command -v docker >/dev/null 2>&1; then
  printf 'Docker não encontrado. Execute este comando no terminal do Codespace ou em uma máquina com Docker.\n' >&2
  exit 1
fi
docker compose version >/dev/null

if [[ -z "${NEON_DB_URL:-}" ]]; then
  if [[ ! -t 0 ]]; then
    printf 'Informe NEON_DB_URL ou execute em um terminal interativo.\n' >&2
    exit 1
  fi
  read -r -p 'URL JDBC da conexão direta do Neon, sem usuário e senha: ' NEON_DB_URL
fi

if [[ "$NEON_DB_URL" != jdbc:postgresql://* ]]; then
  printf 'A conexão precisa começar com jdbc:postgresql://.\n' >&2
  exit 1
fi
if [[ "$NEON_DB_URL" == *@* || "$NEON_DB_URL" == *password=* ]]; then
  printf 'Use a URL sem credenciais. Informe o usuário em NEON_DB_USER e a senha no próximo campo.\n' >&2
  exit 1
fi
case "$NEON_DB_URL" in
  *sslmode=require*|*sslmode=verify-ca*|*sslmode=verify-full*) ;;
  *) printf 'Inclua sslmode=require na URL para conectar ao Neon com TLS.\n' >&2; exit 1 ;;
esac

NEON_DB_USER="${NEON_DB_USER:-neondb_owner}"
if [[ -z "${NEON_DB_PASSWORD:-}" ]]; then
  if [[ ! -t 0 ]]; then
    printf 'Informe NEON_DB_PASSWORD ou execute em um terminal interativo.\n' >&2
    exit 1
  fi
  read -r -s -p 'Senha do Neon (os caracteres ficam invisíveis): ' NEON_DB_PASSWORD
  printf '\n'
fi
if [[ -z "$NEON_DB_PASSWORD" ]]; then
  printf 'A senha não pode ficar vazia.\n' >&2
  exit 1
fi

if [[ -n "${CODESPACE_NAME:-}" ]]; then
  SESSION_COOKIE_SECURE="${SESSION_COOKIE_SECURE:-true}"
  CORS_ORIGINS="${CORS_ORIGINS:-http://localhost:4200,http://127.0.0.1:4200,https://localhost:8080,https://${CODESPACE_NAME}-8080.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN:-app.github.dev}}"
else
  SESSION_COOKIE_SECURE="${SESSION_COOKIE_SECURE:-false}"
  CORS_ORIGINS="${CORS_ORIGINS:-http://localhost:4200,http://127.0.0.1:4200}"
fi
export NEON_DB_URL NEON_DB_USER NEON_DB_PASSWORD SESSION_COOKIE_SECURE CORS_ORIGINS
# O serviço db do compose.yml pode continuar ativo e conservar seus dados locais.
export COMPOSE_IGNORE_ORPHANS=true

printf 'Compilando e iniciando o CURRY conectado ao Neon...\n'
docker compose -f compose.neon.yml up --build -d app
printf '\nContêiner iniciado. Aguarde a mensagem Started CurryApplication no log.\n'
printf 'Acompanhar: docker compose -f compose.neon.yml logs -f app\n'
printf 'Abra a porta 8080 do Codespace ou http://localhost:8080 em execução local.\n'
docker compose -f compose.neon.yml logs --tail=60 app
