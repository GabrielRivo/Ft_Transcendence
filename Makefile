# Makefile Infrastructure K8s - ft_transcendence
# This Makefile orchestrates the entire Kubernetes infrastructure deployment.
# It handles lifecycle management (up/down/clean), component installation
# (Vault, ELK, Monitoring), and utility commands.

# ==============================================================================
# 1. SHELL CONFIGURATION
# ==============================================================================

# Use bash for shell execution to ensure consistent behavior
SHELL := /bin/bash

# .SHELLFLAGS sets flags for the shell.
# -e: Exit immediately if a command exits with a non-zero status.
# -u: Treat unset variables as an error.
# -o pipefail: The return value of a pipeline is the status of the last command to exit with a non-zero status.
# -c: Read commands from the command_string operand.
.SHELLFLAGS := -eu -o pipefail -c

# .ONESHELL ensures all lines in a recipe are executed in the same shell instance
.ONESHELL:

# .DEFAULT_GOAL defines the default target when make is run without arguments
.DEFAULT_GOAL := help

# ==============================================================================
# 2. COLORS AND FORMATTING
# ==============================================================================

# ANSI color codes for pretty output
RESET := \033[0m
BOLD := \033[1m
RED := \033[31m
GREEN := \033[32m
YELLOW := \033[33m
BLUE := \033[34m
CYAN := \033[36m

# Helper for printing status messages
# Usage: @echo -e "$(INFO) Message..."
INFO := $(BLUE)[*]$(RESET)
SUCCESS := $(GREEN)[OK]$(RESET)
WARN := $(YELLOW)[!]$(RESET)
ERROR := $(RED)[ERROR]$(RESET)

# ==============================================================================
# 3. DIRECTORY PATHS
# ==============================================================================

# Calculate the absolute path to the infrastructure directory based on this Makefile's location
INFRASTRUCTURE_DIR := $(shell dirname $(realpath $(lastword $(MAKEFILE_LIST))))

# Kubernetes paths
K8S_BASE_DIR := $(INFRASTRUCTURE_DIR)/k8s/base
K8S_OVERLAYS_DIR := $(INFRASTRUCTURE_DIR)/k8s/overlays

# Helm paths
HELM_VALUES_DIR := $(INFRASTRUCTURE_DIR)/helm/values

# Scripts path
SCRIPTS_DIR := $(INFRASTRUCTURE_DIR)/scripts

# Dashboards path
# Contains Grafana dashboard JSON files that will be loaded as ConfigMaps
DASHBOARDS_DIR := $(INFRASTRUCTURE_DIR)/dashboards/grafana

# ==============================================================================
# 4. ENVIRONMENT CONFIGURATION
# ==============================================================================

# Target environment (dev, test, production). Defaults to 'dev'.
# This variable controls which Kustomize overlay is applied.
ENVIRONMENT ?= dev

# ==============================================================================
# 5. KUBERNETES NAMESPACES
# ==============================================================================

# Define namespaces for various components to avoid magic strings
NS_VAULT := vault
NS_LOGGING := logging
NS_MONITORING := monitoring
NS_DEV := dev
NS_PRODUCTION := production
NS_EXTERNAL_SECRETS := external-secrets

# Infrastructure namespace for Redis/RabbitMQ deployment
# Can be overridden: make infra-up NS_INFRA=production
NS_INFRA ?= dev

# ==============================================================================
# 6. HELM REPOSITORIES
# ==============================================================================

# Official Helm chart repository URLs
HELM_REPO_HASHICORP := https://helm.releases.hashicorp.com
HELM_REPO_ELASTIC := https://helm.elastic.co
HELM_REPO_PROMETHEUS := https://prometheus-community.github.io/helm-charts
HELM_REPO_BITNAMI := https://charts.bitnami.com/bitnami
HELM_REPO_EXTERNAL_SECRETS := https://charts.external-secrets.io

# ==============================================================================
# 7. TIMEOUTS AND RETRIES
# ==============================================================================

# Default timeout for waiting for resources to become ready
# Increased to 600s to accommodate slower deployments (monitoring stack, etc.)
TIMEOUT_READY := 600s

# ==============================================================================
# 8. INTERNAL TARGETS (Prerequisites & Setup)
# ==============================================================================

# Target: _check-prerequisites
# Description: Checks if necessary tools (kubectl, helm) are installed and accessible.
# It also verifies connection to the Kubernetes cluster.
.PHONY: _check-prerequisites
_check-prerequisites:
	@echo -e "$(INFO) Checking prerequisites..."
	@# Check for kubectl
	@if ! command -v kubectl >/dev/null; then \
		echo -e "$(ERROR) kubectl could not be found. Please install it."; \
		exit 1; \
	fi
	@echo -e "$(INFO) kubectl found: $$(kubectl version --client --short 2>/dev/null || kubectl version --client | grep Client | cut -d: -f2 | tr -d ' ')"

	@# Check for helm
	@if ! command -v helm >/dev/null; then \
		echo -e "$(ERROR) helm could not be found. Please install it."; \
		exit 1; \
	fi
	@echo -e "$(INFO) helm found: $$(helm version --short)"

	@# Check cluster connection
	@if ! kubectl cluster-info; then \
		echo -e "$(ERROR) Cannot connect to Kubernetes cluster. Check your kubeconfig."; \
		exit 1; \
	fi
	@echo -e "$(SUCCESS) Connected to Kubernetes cluster."

# Target: _add-helm-repos
# Description: Adds necessary Helm repositories and updates them.
# This ensures we have the latest charts for Vault, ELK, Prometheus, etc.
.PHONY: _add-helm-repos
_add-helm-repos:
	@echo -e "$(INFO) Adding/Updating Helm repositories..."
	@helm repo add hashicorp $(HELM_REPO_HASHICORP) 2>/dev/null || true
	@helm repo add elastic $(HELM_REPO_ELASTIC) 2>/dev/null || true
	@helm repo add prometheus-community $(HELM_REPO_PROMETHEUS) 2>/dev/null || true
	@helm repo add bitnami $(HELM_REPO_BITNAMI) 2>/dev/null || true
	@helm repo add external-secrets $(HELM_REPO_EXTERNAL_SECRETS) 2>/dev/null || true
	@helm repo update
	@echo -e "$(SUCCESS) Helm repositories updated."

# Target: _wait-for-pods
# Description: Helper target to wait for all pods in a namespace to be Ready.
# Usage: make _wait-for-pods NS=namespace_name
.PHONY: _wait-for-pods
_wait-for-pods:
	@echo -e "$(INFO) Waiting for pods in namespace $(BOLD)$(NS)$(RESET) to be ready..."
	@kubectl wait --for=condition=ready pod --all -n $(NS) --timeout=$(TIMEOUT_READY) || \
		echo -e "$(WARN) Some pods in $(NS) are not yet ready (or none exist yet). You can check status with 'make status'."

# Target: _clean-pvcs
# Description: Helper to delete all PVCs in relevant namespaces.
# WARNING: This destroys persistent data.
.PHONY: _clean-pvcs
_clean-pvcs:
	@echo -e "$(WARN) Deleting all PVCs in namespaces: $(NS_VAULT), $(NS_LOGGING), $(NS_MONITORING), $(NS_DEV), $(NS_PRODUCTION)..."
	@kubectl delete pvc --all -n $(NS_VAULT) --ignore-not-found >/dev/null 2>&1 || true
	@kubectl delete pvc --all -n $(NS_LOGGING) --ignore-not-found >/dev/null 2>&1 || true
	@kubectl delete pvc --all -n $(NS_MONITORING) --ignore-not-found >/dev/null 2>&1 || true
	@kubectl delete pvc --all -n $(NS_DEV) --ignore-not-found >/dev/null 2>&1 || true
	@kubectl delete pvc --all -n $(NS_PRODUCTION) --ignore-not-found >/dev/null 2>&1 || true
	@echo -e "$(SUCCESS) All PVCs deleted."

# Target: _clean-base
# Description: Helper to delete base resources (namespaces, quotas, etc.) via Kustomize.
.PHONY: _clean-base
_clean-base:
	@echo -e "$(INFO) Deleting base Kubernetes manifests..."
	@if [ -d "$(K8S_OVERLAYS_DIR)/$(ENVIRONMENT)" ]; then \
		kubectl delete -k $(K8S_OVERLAYS_DIR)/$(ENVIRONMENT) --ignore-not-found; \
	fi
	@echo -e "$(SUCCESS) Base manifests deleted."

# ==============================================================================
# 9. LIFECYCLE TARGETS
# ==============================================================================

# Target: up
# Description: Deploys the entire infrastructure stack in the correct order.
# Order: Prerequisites -> Base -> Vault -> ESO -> ELK -> Monitoring -> Infra
#
# Deployment Order Rationale:
#   1. base-up:       Creates namespaces, storage classes, quotas, limit ranges
#   2. vault-up:      Installs HashiCorp Vault for secrets management
#   3. vault-init:    Initializes and unseals Vault, configures auth methods
#   4. vault-secrets: Populates initial secrets (Redis, RabbitMQ, Grafana, etc.)
#   5. eso-up:        Installs External Secrets Operator for K8s secret sync
#   6. eso-config:    Creates SecretStores and ExternalSecrets for all namespaces
#   7. elk-up:        Installs Elasticsearch, Logstash, Kibana for logging
#   8. monitoring-up: Installs Prometheus, Grafana, Alertmanager with dashboards
#   9. infra-up-all:  Installs Redis and RabbitMQ in dev and production namespaces
#
# This target deploys EVERYTHING needed for the ft_transcendence project.
.PHONY: up
up: _check-prerequisites base-up vault-up vault-init vault-secrets eso-up eso-config elk-up monitoring-up infra-up-all
	@echo -e "\n$(SUCCESS) $(BOLD)Infrastructure successfully deployed!$(RESET)"
	@echo -e "You can check the status with: $(BOLD)make status$(RESET)"
	@echo -e "Access UIs with: $(BOLD)make port-forward$(RESET)"

# Target: down
# Description: Stops the entire infrastructure stack in reverse order.
# Note: This does NOT delete PersistentVolumeClaims (data is preserved).
# Note: infra-down-all removes Redis/RabbitMQ from both dev and production.
.PHONY: down
down: monitoring-down elk-down infra-down-all eso-down vault-down
	@echo -e "\n$(SUCCESS) $(BOLD)Infrastructure stopped (PVCs preserved).$(RESET)"
	@echo -e "To remove data, use: $(BOLD)make clean$(RESET)"

# Target: clean
# Description: Completely destroys the infrastructure, INCLUDING DATA.
# Calls 'down' first, then deletes PVCs and base resources (namespaces).
# It also removes the local .vault-keys file to ensure a fresh start next time.
# WARNING: Also deletes 'Released' PersistentVolumes (orphan data from Retain policy).
.PHONY: clean
clean: down _clean-pvcs _clean-base
	@echo -e "$(WARN) removing local vault keys..."
	@rm -f $(INFRASTRUCTURE_DIR)/../.vault-keys
	@echo -e "$(WARN) Cleaning up released PersistentVolumes..."
	@kubectl get pv | grep Released | awk '{print $$1}' | xargs -r kubectl delete pv >/dev/null 2>&1 || true
	@# Ensure CRDs are gone if clean is full (optional, but cleaner)
	@kubectl delete crd secretstores.external-secrets.io externalsecrets.external-secrets.io clustersecretstores.external-secrets.io clusterexternalsecrets.external-secrets.io pushsecrets.external-secrets.io >/dev/null 2>&1 || true
	@echo -e "\n$(SUCCESS) $(BOLD)Infrastructure completely cleaned (Data destroyed).$(RESET)"

# ==============================================================================
# 10. BASE COMPONENT TARGETS
# ==============================================================================

# Target: base-up
# Description: Applies the base Kubernetes manifests using Kustomize.
# It selects the overlay based on the ENVIRONMENT variable (dev/test/production).
# This sets up namespaces, resource quotas, limit ranges, and storage classes.
.PHONY: base-up
base-up: _check-prerequisites
	@echo -e "$(INFO) Applying base Kubernetes manifests for environment: $(BOLD)$(ENVIRONMENT)$(RESET)..."
	@if [ ! -d "$(K8S_OVERLAYS_DIR)/$(ENVIRONMENT)" ]; then \
		echo -e "$(ERROR) Overlay for environment '$(ENVIRONMENT)' not found at $(K8S_OVERLAYS_DIR)/$(ENVIRONMENT)"; \
		exit 1; \
	fi
	@kubectl apply -k $(K8S_OVERLAYS_DIR)/$(ENVIRONMENT)
	@echo -e "$(INFO) Waiting for namespaces to be created..."
	@# Small wait to ensure namespaces are registered before proceeding to other steps
	@sleep 2
	@echo -e "$(SUCCESS) Base manifests applied successfully."

# ==============================================================================
# 11. VAULT COMPONENT
# ==============================================================================

# Target: vault-up
# Description: Installs Vault using the official HashiCorp Helm chart.
# Deploys into the 'vault' namespace.
# Depends on base-up to ensure namespace and storage classes exist.
.PHONY: vault-up
vault-up: base-up _add-helm-repos
	@echo -e "$(INFO) Installing Vault in namespace $(BOLD)$(NS_VAULT)$(RESET)..."
	@helm upgrade --install vault hashicorp/vault \
		--namespace $(NS_VAULT) \
		--values $(HELM_VALUES_DIR)/vault.yaml \
		--wait --timeout $(TIMEOUT_READY)
	@echo -e "$(SUCCESS) Vault installed."

# Target: vault-init
# Description: Initializes Vault, unseals it, enables KV v2, applies policies and K8s auth.
# Uses the setup-vault.sh script.
.PHONY: vault-init
vault-init:
	@echo -e "$(INFO) Initializing and Configuring Vault..."
	@$(SCRIPTS_DIR)/setup-vault.sh
	@echo -e "$(SUCCESS) Vault initialized and configured."

# Target: vault-secrets
# Description: Populates Vault with initial random secrets for microservices.
# Uses the init-secrets.sh script.
.PHONY: vault-secrets
vault-secrets:
	@echo -e "$(INFO) Populating initial secrets..."
	@$(SCRIPTS_DIR)/init-secrets.sh
	@echo -e "$(SUCCESS) Secrets populated."

# Target: vault-unseal
# Description: Helper target to manually unseal Vault if needed (e.g. after restart).
# In practice, vault-init handles this idempotently, but this is a shortcut.
.PHONY: vault-unseal
vault-unseal:
	@echo -e "$(INFO) Attempting to unseal Vault..."
	@# Re-run setup script which handles unseal check
	@$(SCRIPTS_DIR)/setup-vault.sh
	@echo -e "$(SUCCESS) Unseal check complete."

# Target: vault-policies
# Description: Reloads Vault policies from the policies directory.
# Useful when developing new policies without full init.
.PHONY: vault-policies
vault-policies:
	@echo -e "$(INFO) Reloading Vault policies..."
	@# We can reuse setup-vault.sh which applies policies every run
	@$(SCRIPTS_DIR)/setup-vault.sh
	@echo -e "$(SUCCESS) Policies reloaded."

# Target: vault-status
# Description: Displays detailed Vault status.
.PHONY: vault-status
vault-status:
	@echo -e "$(INFO) Vault Status:"
	@kubectl exec -n $(NS_VAULT) vault-0 -- vault status || true
	@echo -e "\n$(INFO) Auth Methods:"
	@kubectl exec -n $(NS_VAULT) vault-0 -- vault auth list || true
	@echo -e "\n$(INFO) Secrets Engines:"
	@kubectl exec -n $(NS_VAULT) vault-0 -- vault secrets list || true

# Target: vault-down
# Description: Uninstalls Vault and removes related resources.
.PHONY: vault-down
vault-down:
	@echo -e "$(INFO) Uninstalling Vault..."
	@helm uninstall vault --namespace $(NS_VAULT) --ignore-not-found
	@echo -e "$(SUCCESS) Vault uninstalled."

# ==============================================================================
# 12. EXTERNAL SECRETS OPERATOR COMPONENT
# ==============================================================================

# Target: eso-up
# Description: Installs External Secrets Operator using the official Helm chart.
# Deploys into the 'external-secrets' namespace (creating it if needed).
# Depends on base-up.
.PHONY: eso-up
eso-up: base-up _add-helm-repos
	@echo -e "$(INFO) Installing External Secrets Operator in namespace $(BOLD)$(NS_EXTERNAL_SECRETS)$(RESET)..."
	@helm upgrade --install external-secrets external-secrets/external-secrets \
		--namespace $(NS_EXTERNAL_SECRETS) \
		--create-namespace \
		--values $(HELM_VALUES_DIR)/external-secrets.yaml \
		--wait --timeout $(TIMEOUT_READY)
	@echo -e "$(SUCCESS) External Secrets Operator installed."

# Target: eso-config
# Description: Applies ESO specific configurations like SecretStore and ExternalSecrets.
# Must be run AFTER eso-up so that CRDs are present.
#
# This target applies the following resources:
#   - SecretStore (logging namespace): Connects to Vault for ELK secrets
#   - SecretStore (monitoring namespace): Connects to Vault for Grafana secrets
#   - SecretStore (dev namespace): Connects to Vault for Redis/RabbitMQ secrets
#   - SecretStore (production namespace): Connects to Vault for Redis/RabbitMQ secrets
#   - ExternalSecrets for Elasticsearch, Kibana, Logstash credentials
#   - ExternalSecrets for Grafana admin credentials
#   - ExternalSecrets for Redis and RabbitMQ credentials (dev and production)
#
# After applying, ESO will automatically sync secrets from Vault to K8s Secrets.
.PHONY: eso-config
eso-config:
	@echo -e "$(INFO) Configuring External Secrets Operator (SecretStore, ExternalSecrets)..."
	@# -------------------------------------------------------------------------
	@# Logging namespace - ELK Stack secrets
	@# -------------------------------------------------------------------------
	@echo -e "$(INFO)   Applying logging namespace ESO resources..."
	@kubectl apply -f $(K8S_BASE_DIR)/external-secrets/secretstore.yaml
	@kubectl apply -f $(K8S_BASE_DIR)/external-secrets/elasticsearch-es.yaml
	@kubectl apply -f $(K8S_BASE_DIR)/external-secrets/kibana-es.yaml
	@kubectl apply -f $(K8S_BASE_DIR)/external-secrets/logstash-es.yaml
	@# -------------------------------------------------------------------------
	@# Monitoring namespace - Grafana secrets
	@# -------------------------------------------------------------------------
	@echo -e "$(INFO)   Applying monitoring namespace ESO resources..."
	@kubectl apply -f $(K8S_BASE_DIR)/external-secrets/grafana-es.yaml
	@# -------------------------------------------------------------------------
	@# Dev namespace - Redis/RabbitMQ secrets
	@# -------------------------------------------------------------------------
	@# The infra-secretstore.yaml, redis-es.yaml, and rabbitmq-es.yaml files are
	@# templates with {{NAMESPACE}} placeholder. We use sed to replace it.
	@echo -e "$(INFO)   Applying dev namespace ESO resources (Redis/RabbitMQ)..."
	@sed 's/{{NAMESPACE}}/$(NS_DEV)/g' $(K8S_BASE_DIR)/external-secrets/infra-secretstore.yaml | kubectl apply -f -
	@sed 's/{{NAMESPACE}}/$(NS_DEV)/g' $(K8S_BASE_DIR)/external-secrets/redis-es.yaml | kubectl apply -f -
	@sed 's/{{NAMESPACE}}/$(NS_DEV)/g' $(K8S_BASE_DIR)/external-secrets/rabbitmq-es.yaml | kubectl apply -f -
	@# -------------------------------------------------------------------------
	@# Production namespace - Redis/RabbitMQ secrets
	@# -------------------------------------------------------------------------
	@echo -e "$(INFO)   Applying production namespace ESO resources (Redis/RabbitMQ)..."
	@sed 's/{{NAMESPACE}}/$(NS_PRODUCTION)/g' $(K8S_BASE_DIR)/external-secrets/infra-secretstore.yaml | kubectl apply -f -
	@sed 's/{{NAMESPACE}}/$(NS_PRODUCTION)/g' $(K8S_BASE_DIR)/external-secrets/redis-es.yaml | kubectl apply -f -
	@sed 's/{{NAMESPACE}}/$(NS_PRODUCTION)/g' $(K8S_BASE_DIR)/external-secrets/rabbitmq-es.yaml | kubectl apply -f -
	@# -------------------------------------------------------------------------
	@# Wait for secrets to be synced
	@# -------------------------------------------------------------------------
	@echo -e "$(INFO)   Waiting for ExternalSecrets to sync..."
	@sleep 5
	@# Verify that secrets were created
	@if kubectl get secret grafana-credentials -n $(NS_MONITORING) >/dev/null 2>&1; then \
		echo -e "$(SUCCESS) Grafana credentials synced successfully."; \
	else \
		echo -e "$(WARN) Grafana credentials not yet synced. Check ESO logs if issue persists."; \
	fi
	@if kubectl get secret redis-credentials -n $(NS_DEV) >/dev/null 2>&1; then \
		echo -e "$(SUCCESS) Redis credentials synced to dev namespace."; \
	else \
		echo -e "$(WARN) Redis credentials not yet synced to dev. Check ESO logs if issue persists."; \
	fi
	@if kubectl get secret redis-credentials -n $(NS_PRODUCTION) >/dev/null 2>&1; then \
		echo -e "$(SUCCESS) Redis credentials synced to production namespace."; \
	else \
		echo -e "$(WARN) Redis credentials not yet synced to production. Check ESO logs if issue persists."; \
	fi
	@echo -e "$(SUCCESS) External Secrets Operator configured."

# Target: eso-down
# Description: Uninstalls External Secrets Operator and all related resources.
# Handles the case where CRDs may already be deleted (during make clean).
#
# Cleanup Order:
#   1. Delete ExternalSecrets and SecretStores from all namespaces (if CRDs exist)
#   2. Uninstall the ESO Helm chart
#
# Note: We check if ESO CRDs exist before attempting to delete resources to avoid
#       errors when running 'make clean' after CRDs are already removed.
.PHONY: eso-down
eso-down:
	@echo -e "$(INFO) Uninstalling External Secrets Operator..."
	@# First delete the SecretStore configuration and ExternalSecrets (only if CRDs exist)
	@if kubectl api-resources --api-group=external-secrets.io 2>/dev/null | grep -q externalsecrets; then \
		echo -e "$(INFO)   Cleaning up logging namespace ESO resources..."; \
		kubectl delete -f $(K8S_BASE_DIR)/external-secrets/logstash-es.yaml --ignore-not-found 2>/dev/null || true; \
		kubectl delete -f $(K8S_BASE_DIR)/external-secrets/kibana-es.yaml --ignore-not-found 2>/dev/null || true; \
		kubectl delete -f $(K8S_BASE_DIR)/external-secrets/elasticsearch-es.yaml --ignore-not-found 2>/dev/null || true; \
		kubectl delete -f $(K8S_BASE_DIR)/external-secrets/secretstore.yaml --ignore-not-found 2>/dev/null || true; \
		echo -e "$(INFO)   Cleaning up monitoring namespace ESO resources..."; \
		kubectl delete -f $(K8S_BASE_DIR)/external-secrets/grafana-es.yaml --ignore-not-found 2>/dev/null || true; \
		echo -e "$(INFO)   Cleaning up dev namespace ESO resources..."; \
		sed 's/{{NAMESPACE}}/$(NS_DEV)/g' $(K8S_BASE_DIR)/external-secrets/rabbitmq-es.yaml | kubectl delete -f - --ignore-not-found 2>/dev/null || true; \
		sed 's/{{NAMESPACE}}/$(NS_DEV)/g' $(K8S_BASE_DIR)/external-secrets/redis-es.yaml | kubectl delete -f - --ignore-not-found 2>/dev/null || true; \
		sed 's/{{NAMESPACE}}/$(NS_DEV)/g' $(K8S_BASE_DIR)/external-secrets/infra-secretstore.yaml | kubectl delete -f - --ignore-not-found 2>/dev/null || true; \
		echo -e "$(INFO)   Cleaning up production namespace ESO resources..."; \
		sed 's/{{NAMESPACE}}/$(NS_PRODUCTION)/g' $(K8S_BASE_DIR)/external-secrets/rabbitmq-es.yaml | kubectl delete -f - --ignore-not-found 2>/dev/null || true; \
		sed 's/{{NAMESPACE}}/$(NS_PRODUCTION)/g' $(K8S_BASE_DIR)/external-secrets/redis-es.yaml | kubectl delete -f - --ignore-not-found 2>/dev/null || true; \
		sed 's/{{NAMESPACE}}/$(NS_PRODUCTION)/g' $(K8S_BASE_DIR)/external-secrets/infra-secretstore.yaml | kubectl delete -f - --ignore-not-found 2>/dev/null || true; \
	else \
		echo -e "$(INFO) ESO CRDs not found, skipping ExternalSecrets cleanup."; \
	fi
	@# Then uninstall the chart
	@helm uninstall external-secrets --namespace $(NS_EXTERNAL_SECRETS) --ignore-not-found 2>/dev/null || true
	@echo -e "$(SUCCESS) External Secrets Operator uninstalled."

# ==============================================================================
# 13. ELK STACK COMPONENT
# ==============================================================================

# Target: elk-up
# Description: Installs the ELK Stack (Elasticsearch, Logstash, Kibana).
# Deploys into the 'logging' namespace.
# Integrated Steps:
# 1. Generate TLS Certificates
# 2. Install Elasticsearch
# 3. Wait for Elasticsearch Readiness
# 4. Setup Kibana Token (Vault + K8s Secret)
# 5. Install Kibana
# 6. Setup Logstash User (Elasticsearch API)
# 7. Install Logstash
.PHONY: elk-up
elk-up: base-up _add-helm-repos
	@echo -e "$(INFO) Generating ELK TLS certificates..."
	@$(SCRIPTS_DIR)/generate-elk-certs.sh

	@echo -e "$(INFO) Installing Elasticsearch in namespace $(BOLD)$(NS_LOGGING)$(RESET)..."
	@helm upgrade --install elasticsearch elastic/elasticsearch \
		--namespace $(NS_LOGGING) \
		--values $(HELM_VALUES_DIR)/elasticsearch.yaml \
		--wait --timeout $(TIMEOUT_READY)

	@echo -e "$(INFO) Configuring Kibana Service Token..."
	@# This script waits for ES to be ready, generates token if needed, pushes to Vault
	@$(SCRIPTS_DIR)/setup-kibana-token.sh

	@echo -e "$(INFO) Installing Kibana in namespace $(BOLD)$(NS_LOGGING)$(RESET)..."
	@helm upgrade --install kibana elastic/kibana \
		--namespace $(NS_LOGGING) \
		--values $(HELM_VALUES_DIR)/kibana.yaml \
		--wait --timeout $(TIMEOUT_READY) \
		--no-hooks

	@echo -e "$(INFO) Configuring Logstash User..."
	@# This script creates/updates the logstash_internal user in Elasticsearch
	@$(SCRIPTS_DIR)/setup-logstash-user.sh

	@echo -e "$(INFO) Installing Logstash in namespace $(BOLD)$(NS_LOGGING)$(RESET)..."
	@helm upgrade --install logstash elastic/logstash \
		--namespace $(NS_LOGGING) \
		--values $(HELM_VALUES_DIR)/logstash.yaml \
		--wait --timeout $(TIMEOUT_READY)
	@echo -e "$(SUCCESS) ELK Stack installed."

# Target: elk-down
# Description: Uninstalls the ELK Stack.
# Uses --no-hooks for Kibana to avoid post-delete hook failures (expects username/password
# but we use service account token authentication).
# Includes explicit cleanup of problematic Helm hook resources to prevent 'make clean' failures.
.PHONY: elk-down
elk-down:
	@echo -e "$(INFO) Uninstalling ELK Stack..."
	@# Uninstall charts, ignoring errors if not found
	@# Note: Kibana uses --no-hooks to skip post-delete hook that fails with service token auth
	@helm uninstall logstash --namespace $(NS_LOGGING) --ignore-not-found 2>/dev/null || true
	@helm uninstall kibana --namespace $(NS_LOGGING) --ignore-not-found --no-hooks 2>/dev/null || true
	@helm uninstall elasticsearch --namespace $(NS_LOGGING) --ignore-not-found 2>/dev/null || true
	
	@# Explicit cleanup of Kibana helm hook resources which often cause 'already exists' errors
	@echo -e "$(INFO) Cleaning up lingering Helm hooks and jobs..."
	@kubectl delete job -l app=kibana -n $(NS_LOGGING) --ignore-not-found 2>/dev/null || true
	@kubectl delete configmap kibana-kibana-helm-scripts -n $(NS_LOGGING) --ignore-not-found 2>/dev/null || true
	@kubectl delete serviceaccount pre-install-kibana-kibana post-delete-kibana-kibana -n $(NS_LOGGING) --ignore-not-found 2>/dev/null || true
	@kubectl delete role pre-install-kibana-kibana -n $(NS_LOGGING) --ignore-not-found 2>/dev/null || true
	@kubectl delete rolebinding pre-install-kibana-kibana -n $(NS_LOGGING) --ignore-not-found 2>/dev/null || true
	
	@echo -e "$(SUCCESS) ELK Stack uninstalled."

# ==============================================================================
# 14. MONITORING COMPONENT (Prometheus, Grafana, Alertmanager)
# ==============================================================================

# Target: dashboards-up
# Description: Creates a ConfigMap containing all Grafana dashboard JSON files.
# The Grafana sidecar will automatically detect and load these dashboards.
#
# Dashboard files are located in $(DASHBOARDS_DIR) and must have .json extension.
# Each dashboard should have:
#   - Unique UID (e.g., "ft-auth-service")
#   - Unique title
#   - Tag "ft-transcendence" for filtering
#
# The ConfigMap is labeled with "grafana_dashboard: 1" so the Grafana sidecar
# can auto-discover it and load the dashboards without pod restart.
.PHONY: dashboards-up
dashboards-up:
	@echo -e "$(INFO) Creating Grafana dashboards ConfigMap..."
	@# Check if dashboard files exist
	@if [ ! -d "$(DASHBOARDS_DIR)" ] || [ -z "$$(ls -A $(DASHBOARDS_DIR)/*.json 2>/dev/null)" ]; then \
		echo -e "$(WARN) No dashboard JSON files found in $(DASHBOARDS_DIR)"; \
		exit 0; \
	fi
	@# Create ConfigMap from all JSON files in the dashboards directory
	@# The --from-file option creates a key for each file (filename = key, content = value)
	@kubectl create configmap grafana-dashboards-ft-transcendence \
		--namespace $(NS_MONITORING) \
		--from-file=$(DASHBOARDS_DIR) \
		--dry-run=client -o yaml | \
		kubectl label --local -f - grafana_dashboard=1 -o yaml | \
		kubectl apply -f -
	@echo -e "$(SUCCESS) Grafana dashboards ConfigMap created."
	@echo -e "$(INFO) Dashboards will be auto-loaded by Grafana sidecar."

# Target: dashboards-down
# Description: Removes the Grafana dashboards ConfigMap.
.PHONY: dashboards-down
dashboards-down:
	@echo -e "$(INFO) Removing Grafana dashboards ConfigMap..."
	@kubectl delete configmap grafana-dashboards-ft-transcendence \
		--namespace $(NS_MONITORING) \
		--ignore-not-found
	@echo -e "$(SUCCESS) Grafana dashboards ConfigMap removed."

# Target: monitoring-up
# Description: Installs the complete monitoring stack (Prometheus, Grafana, Alertmanager).
# Deploys into the 'monitoring' namespace.
#
# Prerequisites:
#   - base-up: Namespaces and storage classes must exist
#   - eso-config: Grafana credentials must be synced from Vault
#   - dashboards-up: Custom dashboards ConfigMap must be created
#
# Components installed:
#   - Prometheus: Metrics collection and storage
#   - Grafana: Visualization and dashboards
#   - Alertmanager: Alert routing and notification
#   - Prometheus Operator: CRD-based configuration
#   - Kube State Metrics: Kubernetes object metrics
#   - Node Exporter: Host-level metrics (requires privileged access)
#
# After installation, access Grafana at: http://localhost:3000 (via make port-forward)
# Default admin credentials are stored in Vault at secret/shared/grafana
.PHONY: monitoring-up
monitoring-up: base-up _add-helm-repos dashboards-up
	@echo -e "$(INFO) Installing kube-prometheus-stack in namespace $(BOLD)$(NS_MONITORING)$(RESET)..."
	@# Verify that Grafana credentials exist (created by ESO)
	@if ! kubectl get secret grafana-credentials -n $(NS_MONITORING) >/dev/null 2>&1; then \
		echo -e "$(WARN) grafana-credentials secret not found. Run 'make eso-config' first."; \
		echo -e "$(INFO) Continuing anyway - Grafana will use default credentials."; \
	fi
	@helm upgrade --install kube-prometheus-stack prometheus-community/kube-prometheus-stack \
		--namespace $(NS_MONITORING) \
		--values $(HELM_VALUES_DIR)/prometheus.yaml \
		--wait --timeout $(TIMEOUT_READY)
	@echo -e "$(SUCCESS) Monitoring stack installed."
	@echo -e "$(INFO) Access Grafana: make port-forward, then http://localhost:3000"

# Target: monitoring-down
# Description: Uninstalls the Monitoring stack and cleans up related resources.
# Removes: Helm release, dashboards ConfigMap, orphan secrets.
#
# Note: Prometheus CRDs are NOT removed as they may be used by other components.
#       To fully remove CRDs, use 'make clean'.
.PHONY: monitoring-down
monitoring-down: dashboards-down
	@echo -e "$(INFO) Uninstalling Monitoring stack..."
	@helm uninstall kube-prometheus-stack --namespace $(NS_MONITORING) --ignore-not-found 2>/dev/null || true
	@# Clean up orphan secrets that may persist after uninstall
	@echo -e "$(INFO) Cleaning up orphan secrets..."
	@kubectl delete secret -n $(NS_MONITORING) -l app.kubernetes.io/managed-by=Helm --ignore-not-found 2>/dev/null || true
	@echo -e "$(SUCCESS) Monitoring stack uninstalled."

# ==============================================================================
# 15. INFRASTRUCTURE COMPONENT (Redis/RabbitMQ)
# ==============================================================================
#
# Redis and RabbitMQ are deployed as shared infrastructure services.
# They can be deployed to multiple namespaces (dev, production) using the
# NS_INFRA variable.
#
# Usage:
#   make infra-up                    # Deploy to dev namespace (default)
#   make infra-up NS_INFRA=production  # Deploy to production namespace
#   make infra-up-all                # Deploy to both dev and production
#
# Prerequisites:
#   - eso-config must have been run to create the secrets in the target namespace
#   - base-up must have been run to create the namespaces
#
# The same Helm values files are used for both environments. The environment
# label is set dynamically via --set to differentiate between deployments.
# ==============================================================================

# Target: infra-up
# Description: Installs infrastructure services (Redis, RabbitMQ) in the target namespace.
# The target namespace is controlled by NS_INFRA variable (default: dev).
#
# Example:
#   make infra-up                      # Install in dev namespace
#   make infra-up NS_INFRA=production  # Install in production namespace
.PHONY: infra-up
infra-up: base-up _add-helm-repos
	@echo -e "$(INFO) Installing Redis in namespace $(BOLD)$(NS_INFRA)$(RESET)..."
	@# Verify that Redis credentials exist (created by ESO via eso-config)
	@if ! kubectl get secret redis-credentials -n $(NS_INFRA) >/dev/null 2>&1; then \
		echo -e "$(WARN) redis-credentials secret not found in $(NS_INFRA). Run 'make eso-config' first."; \
		echo -e "$(INFO) Continuing anyway - Redis will fail to start without credentials."; \
	fi
	@helm upgrade --install redis bitnami/redis \
		--namespace $(NS_INFRA) \
		--values $(HELM_VALUES_DIR)/redis.yaml \
		--set commonLabels.environment=$(NS_INFRA) \
		--wait --timeout $(TIMEOUT_READY)

	@echo -e "$(INFO) Installing RabbitMQ in namespace $(BOLD)$(NS_INFRA)$(RESET)..."
	@# Verify that RabbitMQ credentials exist (created by ESO via eso-config)
	@if ! kubectl get secret rabbitmq-credentials -n $(NS_INFRA) >/dev/null 2>&1; then \
		echo -e "$(WARN) rabbitmq-credentials secret not found in $(NS_INFRA). Run 'make eso-config' first."; \
		echo -e "$(INFO) Continuing anyway - RabbitMQ will fail to start without credentials."; \
	fi
	@helm upgrade --install rabbitmq bitnami/rabbitmq \
		--namespace $(NS_INFRA) \
		--values $(HELM_VALUES_DIR)/rabbitmq.yaml \
		--set commonLabels.environment=$(NS_INFRA) \
		--wait --timeout $(TIMEOUT_READY)
	@echo -e "$(SUCCESS) Infrastructure services installed in $(BOLD)$(NS_INFRA)$(RESET)."

# Target: infra-up-all
# Description: Installs infrastructure services in BOTH dev and production namespaces.
# This is useful for initial cluster setup or when you need both environments running.
.PHONY: infra-up-all
infra-up-all:
	@echo -e "$(INFO) Installing infrastructure services in all namespaces..."
	@$(MAKE) infra-up NS_INFRA=$(NS_DEV)
	@$(MAKE) infra-up NS_INFRA=$(NS_PRODUCTION)
	@echo -e "$(SUCCESS) Infrastructure services installed in dev and production."

# Target: infra-down
# Description: Uninstalls infrastructure services from the target namespace.
# The target namespace is controlled by NS_INFRA variable (default: dev).
#
# Example:
#   make infra-down                      # Uninstall from dev namespace
#   make infra-down NS_INFRA=production  # Uninstall from production namespace
.PHONY: infra-down
infra-down:
	@echo -e "$(INFO) Uninstalling Infrastructure services from $(BOLD)$(NS_INFRA)$(RESET)..."
	@helm uninstall redis --namespace $(NS_INFRA) --ignore-not-found 2>/dev/null || true
	@helm uninstall rabbitmq --namespace $(NS_INFRA) --ignore-not-found 2>/dev/null || true
	@echo -e "$(SUCCESS) Infrastructure services uninstalled from $(NS_INFRA)."

# Target: infra-down-all
# Description: Uninstalls infrastructure services from BOTH dev and production namespaces.
.PHONY: infra-down-all
infra-down-all:
	@echo -e "$(INFO) Uninstalling infrastructure services from all namespaces..."
	@$(MAKE) infra-down NS_INFRA=$(NS_DEV)
	@$(MAKE) infra-down NS_INFRA=$(NS_PRODUCTION)
	@echo -e "$(SUCCESS) Infrastructure services uninstalled from dev and production."

# Target: infra-status
# Description: Shows the status of Redis and RabbitMQ in the target namespace.
.PHONY: infra-status
infra-status:
	@echo -e "$(INFO) Infrastructure Status in $(BOLD)$(NS_INFRA)$(RESET):"
	@echo -e "\n$(BOLD)==> Redis:$(RESET)"
	@kubectl get pods -n $(NS_INFRA) -l app.kubernetes.io/name=redis -o wide 2>/dev/null || echo "  No Redis pods found"
	@echo -e "\n$(BOLD)==> RabbitMQ:$(RESET)"
	@kubectl get pods -n $(NS_INFRA) -l app.kubernetes.io/name=rabbitmq -o wide 2>/dev/null || echo "  No RabbitMQ pods found"

# ==============================================================================
# 16. UTILITY TARGETS
# ==============================================================================

# Target: status
# Description: Displays the status of all pods in the relevant namespaces.
.PHONY: status
status:
	@echo -e "$(INFO) Infrastructure Status:"
	@echo -e "\n$(BOLD)==> Namespace: $(NS_VAULT)$(RESET)"
	@kubectl get pods -n $(NS_VAULT) -o wide
	@echo -e "\n$(BOLD)==> Namespace: $(NS_LOGGING)$(RESET)"
	@kubectl get pods -n $(NS_LOGGING) -o wide
	@echo -e "\n$(BOLD)==> Namespace: $(NS_MONITORING)$(RESET)"
	@kubectl get pods -n $(NS_MONITORING) -o wide
	@echo -e "\n$(BOLD)==> Namespace: $(NS_DEV)$(RESET)"
	@kubectl get pods -n $(NS_DEV) -o wide
	@echo -e "\n$(BOLD)==> Namespace: $(NS_PRODUCTION)$(RESET)"
	@kubectl get pods -n $(NS_PRODUCTION) -o wide
	@echo -e "\n$(BOLD)==> Namespace: $(NS_EXTERNAL_SECRETS)$(RESET)"
	@kubectl get pods -n $(NS_EXTERNAL_SECRETS) -o wide

# Target: logs
# Description: Displays aggregated logs from key components.
# Shows the last 20 lines of logs for each component.
.PHONY: logs
logs:
	@echo -e "$(INFO) Fetching recent logs..."
	@echo -e "\n$(BOLD)==> Vault Logs:$(RESET)"
	@kubectl logs -n $(NS_VAULT) -l app.kubernetes.io/name=vault --tail=20 --all-containers=true 2>/dev/null || echo "No Vault pods found"
	@echo -e "\n$(BOLD)==> Kibana Logs:$(RESET)"
	@kubectl logs -n $(NS_LOGGING) -l app=kibana --tail=20 --all-containers=true 2>/dev/null || echo "No Kibana pods found"
	@echo -e "\n$(BOLD)==> Logstash Logs:$(RESET)"
	@kubectl logs -n $(NS_LOGGING) -l release=logstash --tail=20 --all-containers=true 2>/dev/null || echo "No Logstash pods found"
	@echo -e "\n$(BOLD)==> Grafana Logs:$(RESET)"
	@kubectl logs -n $(NS_MONITORING) -l app.kubernetes.io/name=grafana --tail=20 --all-containers=true 2>/dev/null || echo "No Grafana pods found"
	@echo -e "\n$(BOLD)==> External Secrets Logs:$(RESET)"
	@kubectl logs -n $(NS_EXTERNAL_SECRETS) -l app.kubernetes.io/name=external-secrets --tail=20 --all-containers=true 2>/dev/null || echo "No ESO pods found"

# Target: port-forward
# Description: Exposes internal services to localhost for access.
# Vault: 8200, Kibana: 5601, Grafana: 3000
# NOTE: This command blocks the terminal.
.PHONY: port-forward
port-forward:
	@echo -e "$(INFO) Starting port-forwarding... (Press Ctrl+C to stop)"
	@echo -e "  - Vault:   http://localhost:8200"
	@echo -e "  - Kibana:  https://localhost:5601"
	@echo -e "  - Grafana: http://localhost:3000"
	@trap 'kill %1 %2 %3' SIGINT; \
	kubectl port-forward -n $(NS_VAULT) svc/vault 8200:8200 & \
	kubectl port-forward -n $(NS_LOGGING) svc/kibana-kibana 5601:5601 & \
	kubectl port-forward -n $(NS_MONITORING) svc/kube-prometheus-stack-grafana 3000:80 & \
	wait

# Target: health
# Description: Runs a health check on the infrastructure.
# (Placeholder: In the future, this will run a dedicated script)
.PHONY: health
health:
	@echo -e "$(INFO) Checking infrastructure health..."
	@# Check if all pods are ready
	@kubectl get pods -A --field-selector=status.phase!=Running,status.phase!=Succeeded --no-headers 2>/dev/null | grep -v "No resources found" || echo -e "$(SUCCESS) All pods are running."

# Target: help
# Description: Displays this help message with all available targets.
.PHONY: help
help:
	@echo -e "$(BOLD)Infrastructure Makefile Helper$(RESET)"
	@echo -e "Usage: make [target] [ENVIRONMENT=dev|test|production]"
	@echo -e ""
	@echo -e "$(BOLD)Lifecycle Targets:$(RESET)"
	@echo -e "  $(CYAN)up$(RESET)              Deploy full infrastructure (Vault, ESO, ELK, Monitoring)"
	@echo -e "  $(CYAN)down$(RESET)            Stop infrastructure (keep data)"
	@echo -e "  $(CYAN)clean$(RESET)           Destroy infrastructure ($(RED)DELETE DATA$(RESET))"
	@echo -e ""
	@echo -e "$(BOLD)Base Component:$(RESET)"
	@echo -e "  $(CYAN)base-up$(RESET)         Apply base manifests (namespaces, quotas, storage)"
	@echo -e ""
	@echo -e "$(BOLD)Vault Component:$(RESET)"
	@echo -e "  $(CYAN)vault-up$(RESET)        Install Vault"
	@echo -e "  $(CYAN)vault-down$(RESET)      Uninstall Vault"
	@echo -e "  $(CYAN)vault-init$(RESET)      Initialize, unseal, and configure Vault"
	@echo -e "  $(CYAN)vault-secrets$(RESET)   Populate initial secrets in Vault"
	@echo -e "  $(CYAN)vault-status$(RESET)    Show detailed Vault status"
	@echo -e ""
	@echo -e "$(BOLD)External Secrets Operator:$(RESET)"
	@echo -e "  $(CYAN)eso-up$(RESET)          Install External Secrets Operator"
	@echo -e "  $(CYAN)eso-down$(RESET)        Uninstall External Secrets Operator"
	@echo -e "  $(CYAN)eso-config$(RESET)      Configure SecretStores and ExternalSecrets"
	@echo -e ""
	@echo -e "$(BOLD)ELK Stack (Logging):$(RESET)"
	@echo -e "  $(CYAN)elk-up$(RESET)          Install Elasticsearch, Kibana, Logstash"
	@echo -e "  $(CYAN)elk-down$(RESET)        Uninstall ELK Stack"
	@echo -e ""
	@echo -e "$(BOLD)Monitoring Stack:$(RESET)"
	@echo -e "  $(CYAN)monitoring-up$(RESET)   Install Prometheus, Grafana, Alertmanager"
	@echo -e "  $(CYAN)monitoring-down$(RESET) Uninstall Monitoring stack"
	@echo -e "  $(CYAN)dashboards-up$(RESET)   Create Grafana dashboards ConfigMap"
	@echo -e "  $(CYAN)dashboards-down$(RESET) Remove Grafana dashboards ConfigMap"
	@echo -e ""
	@echo -e "$(BOLD)Infrastructure Services (Redis/RabbitMQ):$(RESET)"
	@echo -e "  $(CYAN)infra-up$(RESET)        Install Redis and RabbitMQ (NS_INFRA=dev by default)"
	@echo -e "  $(CYAN)infra-up-all$(RESET)    Install Redis and RabbitMQ in both dev and production"
	@echo -e "  $(CYAN)infra-down$(RESET)      Uninstall Redis and RabbitMQ (NS_INFRA=dev by default)"
	@echo -e "  $(CYAN)infra-down-all$(RESET)  Uninstall Redis and RabbitMQ from both namespaces"
	@echo -e "  $(CYAN)infra-status$(RESET)    Show Redis/RabbitMQ status in target namespace"
	@echo -e ""
	@echo -e "$(BOLD)Utility Targets:$(RESET)"
	@echo -e "  $(CYAN)status$(RESET)          Show pod status across all namespaces"
	@echo -e "  $(CYAN)logs$(RESET)            Show recent logs from key components"
	@echo -e "  $(CYAN)port-forward$(RESET)    Expose UIs to localhost (Vault:8200, Kibana:5601, Grafana:3000)"
	@echo -e "  $(CYAN)health$(RESET)          Check infrastructure health status"
	@echo -e ""
	@echo -e "$(BOLD)Variables:$(RESET)"
	@echo -e "  $(CYAN)ENVIRONMENT$(RESET)     Target environment for base manifests (dev|test|production)"
	@echo -e "  $(CYAN)NS_INFRA$(RESET)        Target namespace for Redis/RabbitMQ (dev|production)"
	@echo -e ""
	@echo -e "$(BOLD)Examples:$(RESET)"
	@echo -e "  make up                         # Deploy everything"
	@echo -e "  make infra-up                   # Install Redis/RabbitMQ in dev"
	@echo -e "  make infra-up NS_INFRA=production  # Install Redis/RabbitMQ in production"
	@echo -e "  make infra-up-all               # Install in both dev and production"
	@echo -e "  make status                     # Check all pods status"
	@echo -e "  make infra-status               # Check Redis/RabbitMQ in dev"
	@echo -e "  make port-forward               # Access UIs locally"
	@echo -e "  make clean ENVIRONMENT=dev      # Destroy dev environment"
