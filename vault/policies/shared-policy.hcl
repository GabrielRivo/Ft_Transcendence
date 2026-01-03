# Vault Policy for Shared Resources
# Context: ft-transcendence Microservices Architecture
# Usage: Assigned to ALL microservices that need access to common infrastructure.

# ------------------------------------------------------------------------------
# 1. Shared Infrastructure Secrets
# ------------------------------------------------------------------------------
# Allow services to read credentials for shared infrastructure components.
# Typical secrets included here:
# - Redis credentials (host, port, password)
# - RabbitMQ credentials (connection string, user, pass)
# - Database public connection info
#
# Path format: secret/data/<environment>/shared/<resource>
# The '+' wildcard matches the environment (e.g., 'dev').
# The '*' wildcard matches any sub-path (e.g., 'redis', 'rabbitmq').
path "secret/data/+/shared/*" {
  capabilities = ["read"]
}

# Allow listing metadata for shared secrets.
path "secret/metadata/+/shared/*" {
  capabilities = ["list"]
}
