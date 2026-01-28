#!/bin/bash
# ==============================================================================
# Vault Secrets Initialization Script
# ==============================================================================
#
# Context: ft_transcendence DevOps Module
#
# Purpose:
#   This script populates Vault with initial random secrets for the microservices.
#   It ensures that necessary secrets exist without overwriting existing ones
#   (idempotent behavior). It is designed to be extensible for adding new
#   secrets easily.
#
# Usage:
#   ./infrastructure/scripts/init-secrets.sh [options]
#
# Options:
#   -f, --force   Force overwrite existing secrets (DANGER!)
#
# Dependencies:
#   - kubectl
#   - jq
#   - openssl (for random generation)
#
# ==============================================================================

set -e

# ------------------------------------------------------------------------------
# Configuration & Variables
# ------------------------------------------------------------------------------

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Paths & Vault Info
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
KEYS_FILE="$PROJECT_ROOT/.vault-keys"
VAULT_NAMESPACE="vault"
VAULT_POD="vault-0"

FORCE_OVERWRITE=false

# ------------------------------------------------------------------------------
# Argument Parsing
# ------------------------------------------------------------------------------

for arg in "$@"; do
    case $arg in
        -f|--force)
            FORCE_OVERWRITE=true
            shift
            ;;
    esac
done

# ------------------------------------------------------------------------------
# Helper Functions
# ------------------------------------------------------------------------------

log_info() { echo -e "${GREEN}[INFO] $1${NC}"; }
log_warn() { echo -e "${YELLOW}[WARN] $1${NC}"; }
log_error() { echo -e "${RED}[ERROR] $1${NC}"; }

check_dependency() {
    if ! command -v "$1" &> /dev/null; then
        log_error "$1 is not installed."
        exit 1
    fi
}

# Generate a random alphanumeric string
generate_password() {
    local length="${1:-32}"
    openssl rand -base64 48 | tr -dc 'a-zA-Z0-9' | head -c "$length"
}

# Generate a UUID
generate_uuid() {
    cat /proc/sys/kernel/random/uuid
}

# Generate a hex string
generate_hex() {
    local length="${1:-32}"
    openssl rand -hex "$length"
}

# Check if Vault is accessible and logged in
check_vault_access() {
    if ! kubectl exec -n "$VAULT_NAMESPACE" "$VAULT_POD" -- vault status >/dev/null 2>&1; then
        log_error "Vault is not accessible. Is it running and unsealed?"
        exit 1
    fi
    
    # Check if we have a token (we assume setup-vault.sh was run and we are root)
    # Ideally, we should source the token from .vault-keys if needed, but the pod
    # environment doesn't persist the token across execs unless we pass it.
    
    if [[ ! -f "$KEYS_FILE" ]]; then
        log_error "Keys file not found at $KEYS_FILE. Cannot authenticate."
        exit 1
    fi
    
    local root_token=$(jq -r '.root_token' "$KEYS_FILE")
    if [[ -z "$root_token" || "$root_token" == "null" ]]; then
        log_error "Root token not found in keys file."
        exit 1
    fi
    
    # Login explicitly for this session
    kubectl exec -n "$VAULT_NAMESPACE" "$VAULT_POD" -- vault login "$root_token" > /dev/null
}

# Ensure a secret exists
# Usage: ensure_secret "path/to/secret" "key" "generator_type" [length]
# Types: password, uuid, hex, static
ensure_secret() {
    local path="$1"
    local key="$2"
    local type="$3"
    local length="$4"
    local static_value="$5"
    
    log_info "Checking secret: $path -> $key"
    
    # Check if secret exists and has the key
    local current_value=""
    # We use 'vault kv get -field=key path' to check specific key
    # We trap error because if key doesn't exist, vault returns exit code 2
    if ! $FORCE_OVERWRITE; then
        current_value=$(kubectl exec -n "$VAULT_NAMESPACE" "$VAULT_POD" -- vault kv get -field="$key" "$path" 2>/dev/null || true)
    fi
    
    if [[ -n "$current_value" && "$FORCE_OVERWRITE" == "false" ]]; then
        echo "   [SKIP] Secret already exists."
        return
    fi
    
    # Generate new value
    local new_value=""
    case "$type" in
        "password") new_value=$(generate_password "$length") ;;
        "uuid")     new_value=$(generate_uuid) ;;
        "hex")      new_value=$(generate_hex "$length") ;;
        "static")   new_value="$static_value" ;;
        *)          log_error "Unknown type: $type"; exit 1 ;;
    esac
    
    log_warn "   [+] Generating new secret ($type)..."
    
    # Check if the secret path itself exists (to decide between put and patch)
    # We ignore the specific key check result from earlier, we need to know if the *path* has any data.
    local secret_exists=false
    if kubectl exec -n "$VAULT_NAMESPACE" "$VAULT_POD" -- vault kv get -format=json "$path" >/dev/null 2>&1; then
        secret_exists=true
    fi

    if $secret_exists; then
        # Use patch to append/update key without overwriting others
        log_info "   [.] Path exists, patching..."
        kubectl exec -n "$VAULT_NAMESPACE" "$VAULT_POD" -- vault kv patch "$path" "$key=$new_value"
    else
        # Use put to create the new secret
        log_info "   [.] Path does not exist, creating..."
        kubectl exec -n "$VAULT_NAMESPACE" "$VAULT_POD" -- vault kv put "$path" "$key=$new_value"
    fi
    
    echo "   [OK] Secret written."
}

# ------------------------------------------------------------------------------
# Main Execution
# ------------------------------------------------------------------------------

check_dependency "kubectl"
check_dependency "jq"
check_dependency "openssl"

log_info "Initializing secrets in Vault..."
check_vault_access

# ------------------------------------------------------------------------------
# SECRET DEFINITIONS
# ------------------------------------------------------------------------------
# Format: ensure_secret "PATH" "KEY" "TYPE" [LENGTH/VALUE]

log_info "--- Shared Infrastructure Secrets ---"
# ------------------------------------------------------------------------------
# Redis Credentials
# ------------------------------------------------------------------------------
# Redis is used as an in-memory cache and session store across microservices.
# All services connecting to Redis share this password.
#
# password: Authentication password for Redis connections.
#           Used in connection strings: redis://:PASSWORD@redis-master:6379
#           32 alphanumeric characters provides ~190 bits of entropy.
# ------------------------------------------------------------------------------

ensure_secret "secret/shared/redis" "password" "password" 32

# ------------------------------------------------------------------------------
# RabbitMQ Credentials
# ------------------------------------------------------------------------------
# RabbitMQ is the message broker for inter-service communication (event bus).
# Used for async messaging between microservices (auth, matchmaking, etc.).
#
# password:      Password for the default RabbitMQ user.
#                Used in AMQP connection strings for all microservices.
#                32 alphanumeric characters for strong security.
#
# erlang_cookie: Shared secret for RabbitMQ cluster node authentication.
#                Required for nodes to communicate in a cluster.
#                Must be identical across all RabbitMQ nodes.
#                Using hex format for compatibility with Erlang requirements.
#                See: https://www.rabbitmq.com/docs/clustering#erlang-cookie
# ------------------------------------------------------------------------------

ensure_secret "secret/shared/rabbitmq" "password" "password" 32
ensure_secret "secret/shared/rabbitmq" "erlang_cookie" "hex" 32

log_info "--- ELK Stack Secrets ---"
# ------------------------------------------------------------------------------
# Elasticsearch Credentials
# ------------------------------------------------------------------------------
# Elasticsearch is the central log storage and search engine.
# These credentials are critical for ELK stack security.
#
# password:          Password for the 'elastic' built-in superuser account.
#                    This is the main admin account for Elasticsearch.
#                    Used by Kibana and Logstash to connect to Elasticsearch.
#                    SECURITY: Consider creating dedicated users with minimal
#                    permissions for each service in production.
#
# keystore_password: Password protecting the Elasticsearch keystore and TLS
#                    certificates (PKCS12 format). Used to encrypt private keys
#                    stored in the keystore for inter-node and client TLS.
#                    See: https://www.elastic.co/guide/en/elasticsearch/reference/current/security-settings.html
# ------------------------------------------------------------------------------

ensure_secret "secret/shared/elasticsearch" "password" "password" 32
ensure_secret "secret/shared/elasticsearch" "keystore_password" "password" 32

# ------------------------------------------------------------------------------
# Kibana Credentials
# ------------------------------------------------------------------------------
# Kibana provides the web UI for log visualization and Elasticsearch management.
#
# encryption_key: Used for encrypting saved objects, session cookies, and
#                 reporting data. This is the xpack.security.encryptionKey.
#                 Must be at least 32 characters (we use 64 hex = 32 bytes).
#                 If this key changes, saved objects may become unreadable.
#                 IMPORTANT: Back up this key for disaster recovery.
#                 See: https://www.elastic.co/guide/en/kibana/current/security-settings.html
# ------------------------------------------------------------------------------

ensure_secret "secret/shared/kibana" "encryption_key" "hex" 64

# ------------------------------------------------------------------------------
# Logstash Credentials
# ------------------------------------------------------------------------------
# Logstash is the log processing pipeline that receives logs from services
# and forwards them to Elasticsearch after parsing and enrichment.
#
# password: Password for the 'logstash_internal' user account.
#           This is a dedicated user created in Elasticsearch with minimal
#           permissions to write to log indices only (principle of least privilege).
#           Created by the setup-logstash-user.sh script after ES initialization.
#           See: infrastructure/scripts/setup-logstash-user.sh
# ------------------------------------------------------------------------------

ensure_secret "secret/shared/logstash" "password" "password" 32

log_info "--- Monitoring Stack Secrets (Prometheus/Grafana) ---"
# ------------------------------------------------------------------------------
# Grafana Admin Credentials
# ------------------------------------------------------------------------------
# These secrets are used by Grafana for initial admin authentication and
# security. They are synchronized to Kubernetes via External Secrets Operator.
#
# admin_user:     Username for the Grafana admin account.
#                 Using "admin" as default following Grafana conventions.
#
# admin_password: Strong password for admin authentication.
#                 Generated with 32 alphanumeric characters for security.
#                 IMPORTANT: Change this in production if needed via Vault UI.
#
# secret_key:     Used by Grafana to sign cookies and internal tokens.
#                 Must be a hex string (recommended 32+ bytes = 64 hex chars).
#                 If this changes, all existing sessions will be invalidated.
#                 See: https://grafana.com/docs/grafana/latest/setup-grafana/configure-grafana/#secret_key
# ------------------------------------------------------------------------------

ensure_secret "secret/shared/grafana" "admin_user" "static" "" "admin"
ensure_secret "secret/shared/grafana" "admin_password" "password" 32
ensure_secret "secret/shared/grafana" "secret_key" "hex" 32

log_info "--- Auth Service Secrets ---"
# ------------------------------------------------------------------------------
# JWT Token Signing Secrets
# ------------------------------------------------------------------------------
# The Auth service uses JWT (JSON Web Tokens) for stateless authentication.
# Two separate secrets are used for access and refresh tokens to enable
# independent rotation and different security policies.
#
# access_secret:  Secret key for signing short-lived access tokens.
#                 Access tokens typically expire in 15-30 minutes.
#                 Used by all microservices to verify incoming requests.
#                 64 hex characters = 256 bits, suitable for HS256 algorithm.
#
# refresh_secret: Secret key for signing long-lived refresh tokens.
#                 Refresh tokens typically expire in 7-30 days.
#                 Only used by the Auth service to issue new access tokens.
#                 Using a separate secret limits blast radius if compromised.
#                 64 hex characters = 256 bits, suitable for HS256 algorithm.
#
# SECURITY: If either secret is compromised, rotate immediately.
#           Access secret rotation invalidates all current sessions.
#           Refresh secret rotation forces all users to re-authenticate.
# ------------------------------------------------------------------------------

ensure_secret "secret/auth/jwt" "access_secret" "hex" 64
ensure_secret "secret/auth/jwt" "refresh_secret" "hex" 64

# ------------------------------------------------------------------------------
# OAuth Provider Credentials
# ------------------------------------------------------------------------------
# OAuth 2.0 credentials for external authentication providers.
# These enable "Sign in with Google/42" functionality.
#
# google_client_secret: Client secret from Google Cloud Console.
#                       Paired with GOOGLE_CLIENT_ID (non-secret, in config).
#                       See: https://console.cloud.google.com/apis/credentials
#
# 42_client_secret:     Client secret from 42 Intranet API application.
#                       Paired with 42_CLIENT_ID (non-secret, in config).
#                       See: https://profile.intra.42.fr/oauth/applications
#
# NOTE: These are placeholder values for development. In production:
#       1. Create OAuth apps in each provider's console
#       2. Update these secrets via: vault kv put secret/auth/oauth ...
#       3. Never commit real credentials to version control
# ------------------------------------------------------------------------------

ensure_secret "secret/auth/oauth" "google_client_secret" "static" "" "dev-placeholder-secret"
ensure_secret "secret/auth/oauth" "42_client_secret" "static" "" "dev-placeholder-secret"

log_info "--- Matchmaking Service Secrets ---"
# ------------------------------------------------------------------------------
# Matchmaking Service Credentials
# ------------------------------------------------------------------------------
# The Matchmaking service handles game queue management, player matching,
# and tournament organization. Currently, it uses shared infrastructure
# secrets (Redis, RabbitMQ) and does not require service-specific secrets.
#
# Future secrets might include:
# - API keys for external game servers
# - Encryption keys for match state serialization
# - Webhook signing secrets for notifications
#
# Uncomment and configure when needed:
# ensure_secret "secret/matchmaking/config" "api_key" "password" 64
# ------------------------------------------------------------------------------

# ------------------------------------------------------------------------------
# Completion
# ------------------------------------------------------------------------------

log_info "Secrets population completed successfully."
