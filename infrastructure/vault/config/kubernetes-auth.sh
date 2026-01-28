#!/bin/bash
# ==============================================================================
# Kubernetes Auth Method Configuration Script
# ==============================================================================
#
# Context: ft_transcendence DevOps Module
#
# Purpose:
#   This script configures Vault to authenticate requests from Kubernetes pods.
#   It sets up the Kubernetes Auth Method, which allows pods to authenticate
#   using their ServiceAccount JWT tokens. This enables a secure, zero-secret
#   deployment model where pods don't need pre-provisioned credentials.
#
# How it works:
#   1. A pod authenticates to Vault using its ServiceAccount JWT token
#   2. Vault verifies the token via the Kubernetes TokenReview API
#   3. If valid, Vault issues a Vault token with policies based on the role
#   4. The pod uses this Vault token to access secrets
#
# Roles:
#   Each role maps a Kubernetes ServiceAccount (in a namespace) to Vault policies.
#   This implements the principle of least privilege - each service only gets
#   access to the secrets it needs.
#
# Usage:
#   This script is executed inside the Vault pod by setup-vault.sh
#   It should NOT be run directly from outside the cluster.
#
# See: https://developer.hashicorp.com/vault/docs/auth/kubernetes
# ==============================================================================

set -e # Exit immediately if a command exits with a non-zero status.

echo "[*] Configuring Kubernetes Auth Method..."

# ------------------------------------------------------------------------------
# 1. Enable Kubernetes Auth Method
# ------------------------------------------------------------------------------
# We check if the auth method is already enabled to make the script idempotent.
# If it's already enabled, we proceed to configuration update.
if vault auth list | grep -q "kubernetes/"; then
    echo "[-] Kubernetes auth already enabled."
else
    echo "[+] Enabling Kubernetes auth method..."
    vault auth enable kubernetes
fi

# ------------------------------------------------------------------------------
# 2. Configure Vault to talk to Kubernetes API
# ------------------------------------------------------------------------------
# Vault needs to verify the JWT tokens sent by pods. To do this, it needs to
# call the TokenReview API of Kubernetes.

echo "[*] Configuring Kubernetes connection..."

# When running inside a Pod, the ServiceAccount token and CA are mounted here:
SA_PATH="/var/run/secrets/kubernetes.io/serviceaccount"
K8S_HOST="https://kubernetes.default.svc"
K8S_CA_CERT="$SA_PATH/ca.crt"
# Note: In Vault 1.9+, `disable_local_ca_jwt=false` (default) allows Vault to use its own token automatically.
# However, explicit configuration is often more reliable in dev environments.

vault write auth/kubernetes/config \
    kubernetes_host="$K8S_HOST" \
    kubernetes_ca_cert=@"$K8S_CA_CERT" \
    disable_iss_validation=true

echo "[+] Kubernetes auth configuration applied."

# ------------------------------------------------------------------------------
# 3. Create Roles
# ------------------------------------------------------------------------------
# A Vault Role maps a Kubernetes ServiceAccount (in a Namespace) to a set of
# Vault Policies. This is the core of the authentication model.
#
# Role Configuration Parameters:
#   - bound_service_account_names:      Which ServiceAccount can use this role
#   - bound_service_account_namespaces: Which namespace the SA must be in
#   - policies:                         Vault policies to attach to the token
#   - ttl:                              Token time-to-live (auto-renewed by ESO)
#
# Security Notes:
#   - TTL of 1h is a good balance between security and performance
#   - Shorter TTL = more frequent re-authentication = more secure
#   - ESO automatically refreshes tokens before expiry
# ------------------------------------------------------------------------------

# ==============================================================================
# MICROSERVICE ROLES
# ==============================================================================
# These roles are used by application microservices running in the 'production'
# namespace. Each service has its own ServiceAccount and gets access to:
#   1. Its own service-specific secrets (e.g., secret/auth/*)
#   2. Shared infrastructure secrets (Redis, RabbitMQ via shared-policy)

# ------------------------------------------------------------------------------
# Role: auth-role
# ------------------------------------------------------------------------------
# Service:   Auth Microservice
# Namespace: production
# Purpose:   User authentication, JWT management, OAuth integration
#
# Policies:
#   - auth-policy:   Access to secret/+/auth/* (JWT keys, OAuth secrets)
#   - shared-policy: Access to secret/+/shared/* (Redis, RabbitMQ)
# ------------------------------------------------------------------------------
echo "[*] Creating role: auth-role..."
vault write auth/kubernetes/role/auth-role \
    bound_service_account_names=auth-sa \
    bound_service_account_namespaces=production \
    policies=auth-policy,shared-policy \
    ttl=1h

# ------------------------------------------------------------------------------
# Role: matchmaking-role
# ------------------------------------------------------------------------------
# Service:   Matchmaking Microservice
# Namespace: production
# Purpose:   Game queue management, player matching, tournament organization
#
# Policies:
#   - matchmaking-policy: Access to secret/+/matchmaking/* (future service secrets)
#   - shared-policy:      Access to secret/+/shared/* (Redis, RabbitMQ)
# ------------------------------------------------------------------------------
echo "[*] Creating role: matchmaking-role..."
vault write auth/kubernetes/role/matchmaking-role \
    bound_service_account_names=matchmaking-sa \
    bound_service_account_namespaces=production \
    policies=matchmaking-policy,shared-policy \
    ttl=1h

# ==============================================================================
# INFRASTRUCTURE ROLES
# ==============================================================================
# These roles are used by infrastructure services (ELK, Monitoring) via the
# External Secrets Operator (ESO). ESO runs in each namespace and uses these
# roles to sync secrets from Vault to Kubernetes Secrets.

# ------------------------------------------------------------------------------
# Role: elk-role
# ------------------------------------------------------------------------------
# Service:   ELK Stack (Elasticsearch, Logstash, Kibana)
# Namespace: logging
# Purpose:   Centralized log management and visualization
#
# Used by:   External Secrets Operator (SecretStore in logging namespace)
# SA Name:   elk-secrets-sa (created by infrastructure/k8s/base/external-secrets/)
#
# Policies:
#   - elk-policy: Access to secret/shared/elasticsearch, kibana, logstash
#
# Note: ELK doesn't use shared-policy because it's infrastructure, not an app.
#       It only needs access to its own component secrets.
# ------------------------------------------------------------------------------
echo "[*] Creating role: elk-role..."
vault write auth/kubernetes/role/elk-role \
    bound_service_account_names=elk-secrets-sa \
    bound_service_account_namespaces=logging \
    policies=elk-policy \
    ttl=1h

# ------------------------------------------------------------------------------
# Role: monitoring-role
# ------------------------------------------------------------------------------
# Service:   Monitoring Stack (Prometheus, Grafana, Alertmanager)
# Namespace: monitoring
# Purpose:   Metrics collection, visualization, and alerting
#
# Used by:   External Secrets Operator (SecretStore in monitoring namespace)
# SA Name:   monitoring-secrets-sa (created by infrastructure/k8s/base/external-secrets/)
#
# Policies:
#   - monitoring-policy: Access to secret/shared/grafana (admin credentials)
#
# Note: Prometheus doesn't require Vault secrets (uses ServiceMonitors).
#       Only Grafana needs secrets for admin authentication.
# ------------------------------------------------------------------------------
echo "[*] Creating role: monitoring-role..."
vault write auth/kubernetes/role/monitoring-role \
    bound_service_account_names=monitoring-secrets-sa \
    bound_service_account_namespaces=monitoring \
    policies=monitoring-policy \
    ttl=1h

# ------------------------------------------------------------------------------
# Role: infra-role
# ------------------------------------------------------------------------------
# Service:   Infrastructure Services (Redis, RabbitMQ)
# Namespace: dev, production (multi-environment support)
# Purpose:   Sync shared infrastructure secrets to application namespaces
#
# Used by:   External Secrets Operator (SecretStore in dev and production namespaces)
# SA Name:   infra-secrets-sa (created by infrastructure/k8s/base/external-secrets/infra-secretstore.yaml)
#
# Policies:
#   - shared-policy: Access to secret/shared/* (Redis password, RabbitMQ credentials)
#
# Multi-Namespace Binding:
#   This role is unique because it accepts ServiceAccounts from MULTIPLE namespaces.
#   Both 'dev' and 'production' namespaces need access to the same shared secrets
#   (Redis, RabbitMQ) to allow microservices to connect to these infrastructure services.
#
# Secrets Accessible:
#   - secret/shared/redis     -> password
#   - secret/shared/rabbitmq  -> password, erlang_cookie
#
# Security Notes:
#   - The same credentials are used in dev and production for simplicity
#   - In a more complex setup, consider separate secrets per environment
#   - The shared-policy only grants READ access (no write/delete)
#
# See:
#   - infrastructure/vault/policies/shared-policy.hcl
#   - infrastructure/k8s/base/external-secrets/infra-secretstore.yaml
#   - infrastructure/k8s/base/external-secrets/redis-es.yaml
#   - infrastructure/k8s/base/external-secrets/rabbitmq-es.yaml
# ------------------------------------------------------------------------------
echo "[*] Creating role: infra-role..."
vault write auth/kubernetes/role/infra-role \
    bound_service_account_names=infra-secrets-sa \
    bound_service_account_namespaces=dev,production \
    policies=shared-policy \
    ttl=1h

# ==============================================================================
# Completion
# ==============================================================================
echo "[SUCCESS] Kubernetes Auth Method configured successfully."
echo "[INFO] Roles created: auth-role, matchmaking-role, elk-role, monitoring-role, infra-role"