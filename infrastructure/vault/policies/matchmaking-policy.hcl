# Vault Policy for Matchmaking Service
# Context: ft-transcendence Microservices Architecture
# Service: Matchmaking Service (Game queues, player matching)

# ------------------------------------------------------------------------------
# 1. Service-Specific Secrets
# ------------------------------------------------------------------------------
# Allow the Matchmaking service to READ its own specific secrets.
# Path format: secret/data/<environment>/matchmaking
# The '+' wildcard matches any single path segment (e.g., 'dev', 'production').
path "secret/data/+/matchmaking" {
  capabilities = ["read"]
}

# Allow listing metadata for its own secrets.
path "secret/metadata/+/matchmaking" {
  capabilities = ["list"]
}
