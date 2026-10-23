#!/usr/bin/env bash
#
# VPS deploy script — only runs when NEXT_PUBLIC_SEO=true (standalone/SSR
# build). SEO=false is a static export meant for shared hosting (see
# scripts/generate-htaccess.mjs) and has no server process to deploy here.
#
# Assumes code is already synced onto this VPS (git pull/rsync/CI happens
# outside this script) — it only installs, builds, assembles the standalone
# output, and (re)starts the PM2 process.
#
# Usage: ./deploy.sh

set -euo pipefail

MIN_NODE_MAJOR=20
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PERSIST_FILE="$PROJECT_DIR/.deploy.local"

cd "$PROJECT_DIR"

log() { printf '\n[deploy] %s\n' "$1"; }
err() { printf '\n[deploy] ERROR: %s\n' "$1" >&2; }

# --- 0. Doctor: verify required tooling before touching anything.
doctor() {
  log "Running environment checks..."
  local failed=0

  if ! command -v node > /dev/null 2>&1; then
    err "node not found. Install Node.js >= ${MIN_NODE_MAJOR} (LTS) first — e.g. via nvm: https://github.com/nvm-sh/nvm"
    failed=1
  else
    local node_major
    node_major="$(node -e 'console.log(process.versions.node.split(".")[0])')"
    if [ "$node_major" -lt "$MIN_NODE_MAJOR" ]; then
      err "node v$(node -v) found, but v${MIN_NODE_MAJOR}+ (LTS) required. Upgrade before deploying."
      failed=1
    else
      log "node $(node -v) OK"
    fi
  fi

  if ! command -v npm > /dev/null 2>&1; then
    err "npm not found (ships with Node — reinstall Node)."
    failed=1
  else
    log "npm $(npm -v) OK"
  fi

  if ! command -v rsync > /dev/null 2>&1; then
    err "rsync not found. Install it (e.g. apt-get install -y rsync / yum install -y rsync)."
    failed=1
  else
    log "rsync OK"
  fi

  if ! command -v pm2 > /dev/null 2>&1; then
    log "pm2 not found."
    read -r -p "[deploy] Install pm2 globally now (npm install -g pm2)? [Y/n] " reply
    reply="${reply:-Y}"
    if [[ "$reply" =~ ^[Yy]$ ]]; then
      log "Installing pm2..."
      if npm install -g pm2; then
        log "pm2 $(pm2 -v) installed."
      else
        err "pm2 install failed. Re-run with sufficient privileges (sudo) or install manually."
        failed=1
      fi
    else
      err "pm2 is required to run/restart the server. Install it and re-run."
      failed=1
    fi
  else
    log "pm2 $(pm2 -v) OK"
  fi

  if [ "$failed" -ne 0 ]; then
    err "Environment checks failed. Fix the above, then re-run ./deploy.sh"
    exit 1
  fi

  log "All checks passed."
}

doctor

# --- 1. Resolve NEXT_PUBLIC_SEO from env files (next.config.ts reads it the
# same way at build time) without sourcing the file — .env.local/.env.
# are not shell scripts (they allow bare `KEY=value with spaces #comment`).
resolve_seo_flag() {
  local file="$1"
  [ -f "$file" ] || return 1
  grep -E '^NEXT_PUBLIC_SEO=' "$file" | tail -n1 | cut -d'=' -f2- | tr -d '[:space:]'
}

SEO_VALUE=""
for env_file in .env.local .env.production .env; do
  val="$(resolve_seo_flag "$env_file" || true)"
  if [ -n "$val" ]; then
    SEO_VALUE="$val"
    break
  fi
done

if [ "$SEO_VALUE" != "true" ]; then
  log "NEXT_PUBLIC_SEO is not \"true\" (found: \"${SEO_VALUE:-unset}\") — this script only deploys the VPS/SSR build. Nothing to do."
  exit 0
fi

log "NEXT_PUBLIC_SEO=true — proceeding with standalone VPS deploy."

# --- 2. Project name + port — ask the user, remember the answer for next
# run (Enter keeps the previous value), re-ask the port if it's taken.
PREV_APP_NAME=""
PREV_PORT=""
if [ -f "$PERSIST_FILE" ]; then
  # shellcheck disable=SC1090
  source "$PERSIST_FILE"
  PREV_APP_NAME="${APP_NAME:-}"
  PREV_PORT="${PORT:-}"
fi

read -r -p "[deploy] PM2 project name [${PREV_APP_NAME:-edemand-app}]: " APP_NAME
APP_NAME="${APP_NAME:-${PREV_APP_NAME:-edemand-app}}"

is_port_free() {
  local p="$1"
  if command -v lsof > /dev/null 2>&1; then
    ! lsof -iTCP:"$p" -sTCP:LISTEN > /dev/null 2>&1
  elif command -v ss > /dev/null 2>&1; then
    ! ss -ltn "( sport = :$p )" 2>/dev/null | grep -q ":$p"
  else
    # No way to check — assume free, pm2/next will fail loudly if it isn't.
    return 0
  fi
}

while true; do
  read -r -p "[deploy] Port [${PREV_PORT:-8001}]: " PORT
  PORT="${PORT:-${PREV_PORT:-8001}}"
  if ! [[ "$PORT" =~ ^[0-9]+$ ]] || [ "$PORT" -lt 1 ] || [ "$PORT" -gt 65535 ]; then
    err "\"$PORT\" is not a valid port number (1-65535)."
    continue
  fi
  # Already-running PM2 process on this exact name/port is fine — that's
  # this app's own previous instance, about to be reloaded, not a conflict.
  if pm2 describe "$APP_NAME" > /dev/null 2>&1 && [ "$PORT" = "$PREV_PORT" ]; then
    break
  fi
  if is_port_free "$PORT"; then
    break
  fi
  err "Port $PORT is already in use. Pick another."
done

printf 'APP_NAME=%q\nPORT=%q\n' "$APP_NAME" "$PORT" > "$PERSIST_FILE"
log "Using project name \"$APP_NAME\" on port $PORT."

# --- 3. Install deps (ci = clean, reproducible install from lockfile)
log "Installing dependencies (npm ci)..."
npm ci

# --- 4. Build. prebuild (clean + sitemap + htaccess + locale-wrappers) runs
# automatically via the npm lifecycle hook already defined in package.json.
# HTACCESS_PROXY_PORT makes generate-htaccess.mjs (part of that prebuild
# hook) write the SAME port into public/.htaccess's reverse-proxy rules,
# so Apache and the PM2-managed Node process agree on where it's listening.
log "Building (npm run build)..."
HTACCESS_PROXY_PORT="$PORT" npm run build

# --- 5. Assemble standalone output. `output: "standalone"` only copies
# traced node_modules + server.js into .next/standalone — static assets and
# public/ must be copied in manually (documented Next.js standalone step).
log "Assembling standalone server output..."
rsync -a --delete public/ .next/standalone/public/
rsync -a --delete .next/static/ .next/standalone/.next/static/

# Standalone server needs its own runtime env file next to server.js.
for env_file in .env.local .env.production .env; do
  if [ -f "$env_file" ]; then
    cp "$env_file" .next/standalone/.env
    break
  fi
done

# --- 6. (Re)start under PM2.
log "Starting/reloading PM2 process \"$APP_NAME\" on port $PORT..."
if pm2 describe "$APP_NAME" > /dev/null 2>&1; then
  PORT="$PORT" pm2 reload "$APP_NAME" --update-env
else
  PORT="$PORT" pm2 start .next/standalone/server.js --name "$APP_NAME" --update-env
fi

pm2 save

log "Deploy complete. \"$APP_NAME\" live on port $PORT."
