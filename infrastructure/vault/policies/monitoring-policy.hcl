# Vault Policy for Monitoring Stack (Prometheus/Grafana)
# Context: ft-transcendence DevOps Module
# Service: kube-prometheus-stack (Prometheus, Grafana, Alertmanager)
#
# This policy grants access to the secrets required by the monitoring stack,
# specifically Grafana admin credentials. These secrets are synchronized to
# Kubernetes Secrets via the External Secrets Operator (ESO) in the 'monitoring'
# namespace.
#
# Security Principle: Least Privilege
# - Only grants READ access to the specific path needed
# - No write, update, or delete capabilities
# - Scoped to a single secret path (grafana only)

# ------------------------------------------------------------------------------
# 1. Grafana Admin Credentials
# ------------------------------------------------------------------------------
# Allow the monitoring stack (via ESO) to READ Grafana admin credentials.
#
# Secrets expected at this path:
# - admin_user:     Grafana admin username (typically "admin")
# - admin_password: Grafana admin password (generated, 32+ chars)
# - secret_key:     Grafana secret key for signing cookies and tokens (64 hex chars)
#
# These credentials are used to:
# - Authenticate the initial admin user to Grafana
# - Sign session cookies and internal tokens
# - Secure communication between Grafana components
#
# The path uses 'shared/' prefix because Grafana credentials are environment-
# independent infrastructure secrets (same across dev/test/prod namespaces).

path "secret/data/shared/grafana" {
  capabilities = ["read"]
}

# ------------------------------------------------------------------------------
# 2. Metadata Listing
# ------------------------------------------------------------------------------
# Allow listing metadata for Grafana secrets.
#
# This capability is required by the External Secrets Operator (ESO) to:
# - Verify the existence of the secret before attempting to read
# - Check secret version information for refresh/rotation purposes
# - List available keys within the secret path
#
# Note: 'list' on metadata does NOT expose secret values, only key names
# and version information.

path "secret/metadata/shared/grafana" {
  capabilities = ["list"]
}
