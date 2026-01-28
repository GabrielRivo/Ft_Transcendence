# Vault Policy for Auth Service
# Context: ft-transcendence Microservices Architecture
# Service: Auth Service (User authentication, JWT management)

# ------------------------------------------------------------------------------
# 1. Service-Specific Secrets
# ------------------------------------------------------------------------------
# Allow the Auth service to READ its own specific secrets.
# Path format: secret/data/<environment>/auth
# The '+' wildcard matches any single path segment (e.g., 'dev', 'production').
# Capabilities:
# - read: Required to fetch the secret values (KV v2 'data' path).
path "secret/data/+/auth" {
  capabilities = ["read"]
}

# Allow listing metadata for its own secrets.
# This is often required by client libraries to discover available keys.
path "secret/metadata/+/auth" {
  capabilities = ["list"]
}
