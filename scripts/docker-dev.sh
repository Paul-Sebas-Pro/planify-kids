#!/usr/bin/env bash
# scripts/docker-dev.sh — Planify Kids dev environment via Docker
set -euo pipefail

# ── Couleurs ──────────────────────────────────────────────────────────────────
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

log()  { echo -e "${BLUE}[planify]${NC} $1"; }
ok()   { echo -e "  ${GREEN}✓${NC} $1"; }
warn() { echo -e "  ${YELLOW}!${NC} $1"; }
err()  { echo -e "  ${RED}✗${NC} $1"; }
sep()  { echo -e "${BOLD}────────────────────────────────────────${NC}"; }

# ── Configuration ─────────────────────────────────────────────────────────────
PROJECT="planify-kids"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

declare -A DEFAULT_PORTS=(
  [postgres]=5432
  [mongo]=27017
  [api]=3000
  [web]=5173
)
declare -A PORTS=()

# ── Port helpers ──────────────────────────────────────────────────────────────

# Vrai si aucun processus (Docker inclus) n'écoute sur ce port
is_port_free() {
  local port="$1"
  ! ss -tlnp 2>/dev/null | awk '{print $4}' | grep -qE ":${port}$"
}

# Premier port libre à partir de $1
find_free_port() {
  local port="$1"
  until is_port_free "$port"; do
    port=$((port + 1))
  done
  echo "$port"
}

# Résout les ports : libre → par défaut, occupé → prochain libre
resolve_ports() {
  sep
  log "Vérification des ports..."
  for service in postgres mongo api web; do
    local default="${DEFAULT_PORTS[$service]}"
    if is_port_free "$default"; then
      PORTS[$service]=$default
      ok "Port $default ($service) libre"
    else
      local alt
      alt=$(find_free_port $((default + 1)))
      warn "Port $default ($service) occupé → port alternatif : ${BOLD}$alt${NC}"
      PORTS[$service]=$alt
    fi
  done
}

# ── Autres helpers ────────────────────────────────────────────────────────────
check_docker() {
  if ! docker info &>/dev/null; then
    err "Docker n'est pas démarré."
    echo "    → Lance Docker Desktop ou 'sudo systemctl start docker'"
    exit 1
  fi
  ok "Docker actif"
}

check_running() {
  local running
  running=$(docker compose -p "$PROJECT" ps --status running -q 2>/dev/null | wc -l)
  if [[ "$running" -gt 0 ]]; then
    sep
    warn "Des containers sont déjà actifs :"
    docker compose -p "$PROJECT" ps
    echo ""
    read -r -p "  Redémarrer ? [y/N] " choice
    case "$choice" in
      [yY])
        log "Arrêt des containers..."
        docker compose -p "$PROJECT" down
        ;;
      *)
        log "Attache aux logs existants (Ctrl+C pour quitter)..."
        docker compose -p "$PROJECT" logs -f
        exit 0
        ;;
    esac
  fi
}

check_env() {
  if [[ ! -f "$ROOT/.env" ]]; then
    warn ".env absent — copie depuis .env.example"
    cp "$ROOT/.env.example" "$ROOT/.env"
    echo ""
    warn "Édite $ROOT/.env avec tes secrets (JWT_SECRET au minimum) puis relance."
    exit 1
  fi
  ok ".env présent"
}

show_urls() {
  sep
  echo -e "  ${BOLD}Services démarrés :${NC}"
  echo -e "  ${GREEN}●${NC} Web   → ${BOLD}http://localhost:${PORTS[web]}${NC}"
  echo -e "  ${GREEN}●${NC} API   → ${BOLD}http://localhost:${PORTS[api]}${NC}"
  echo -e "  ${GREEN}●${NC} DB    → localhost:${PORTS[postgres]}  (postgres/postgres/planify_kids)"
  echo -e "  ${GREEN}●${NC} Mongo → localhost:${PORTS[mongo]}"
  sep
  echo ""
  echo "  Commandes utiles :"
  echo "    Logs en direct  : $0 --logs"
  echo "    Statut          : $0 --status"
  echo "    Arrêt propre    : $0 --down"
  echo "    Rebuild images  : $0 --build"
  echo ""
}

# ── Parsing des flags ─────────────────────────────────────────────────────────
BUILD=0
DOWN=0
LOGS=0
STATUS=0
SEED=0

usage() {
  cat <<EOF
Usage: $0 [options]

Options :
  -b, --build    Reconstruit les images Docker
  -d, --down     Arrête et supprime les containers
  -l, --logs     Suit les logs après le démarrage
  -s, --status   Affiche le statut des containers
      --seed     Lance le seed BDD après démarrage
  -h, --help     Affiche cette aide
EOF
  exit 0
}

for arg in "$@"; do
  case $arg in
    -b|--build)  BUILD=1 ;;
    -d|--down)   DOWN=1 ;;
    -l|--logs)   LOGS=1 ;;
    -s|--status) STATUS=1 ;;
    --seed)      SEED=1 ;;
    -h|--help)   usage ;;
    *)
      err "Option inconnue : $arg"
      usage
      ;;
  esac
done

# ── Main ──────────────────────────────────────────────────────────────────────
cd "$ROOT"

sep
echo -e "  ${BOLD}Planify Kids — Environnement Docker${NC}"
sep

if [[ $STATUS -eq 1 ]]; then
  docker compose -p "$PROJECT" ps
  exit 0
fi

if [[ $DOWN -eq 1 ]]; then
  log "Arrêt des containers..."
  docker compose -p "$PROJECT" down
  ok "Containers arrêtés. Volumes conservés (données persistées)."
  echo "    → Pour supprimer aussi les volumes : docker compose -p $PROJECT down -v"
  exit 0
fi

check_docker
check_env
check_running   # down nos containers si demandé → libère leurs ports
resolve_ports   # détecte conflits restants (autres containers/process) → port alternatif

# Exporter les ports résolus pour docker-compose
export POSTGRES_PORT="${PORTS[postgres]}"
export MONGO_PORT="${PORTS[mongo]}"
export API_PORT="${PORTS[api]}"
export WEB_PORT="${PORTS[web]}"

sep
BUILD_ARG=""
[[ $BUILD -eq 1 ]] && BUILD_ARG="--build" && log "Rebuild des images..."

log "Démarrage des services..."
docker compose -p "$PROJECT" up -d $BUILD_ARG

echo ""
log "Attente que l'API soit prête..."
timeout=40
while ! curl -sf "http://localhost:${API_PORT}/health" &>/dev/null; do
  timeout=$((timeout - 1))
  if [[ $timeout -le 0 ]]; then
    warn "API pas encore prête — vérifie les logs : $0 --logs"
    break
  fi
  sleep 1
done

if [[ $SEED -eq 1 ]]; then
  log "Seed de la base de données..."
  docker compose -p "$PROJECT" exec api pnpm --filter @planify-kids/api db:seed
  ok "Seed terminé"
fi

show_urls

[[ $LOGS -eq 1 ]] && docker compose -p "$PROJECT" logs -f
