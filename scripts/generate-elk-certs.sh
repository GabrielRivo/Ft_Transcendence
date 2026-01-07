#!/bin/bash
# ==============================================================================
# ELK Stack TLS Certificates Generation Script
# ==============================================================================
#
# Context: ft-transcendence DevOps Module
# Component: ELK Stack Security (Elasticsearch, Kibana, Logstash)
#
# Purpose:
#   This script generates self-signed TLS certificates for securing the
#   ELK stack communication. It creates a Certificate Authority (CA) and
#   signs certificates for:
#   - Elasticsearch (http and transport layers)
#   - Kibana
#   - Logstash
#
#   It outputs the certificates and keys to a temporary directory and then
#   creates a Kubernetes Secret (elk-tls-certs) in the 'logging' namespace
#   containing these files.
#
# Usage:
#   ./infrastructure/scripts/generate-elk-certs.sh
#
# Dependencies:
#   - openssl
#   - kubectl
#
# ==============================================================================

set -e

# ------------------------------------------------------------------------------
# Configuration & Variables
# ------------------------------------------------------------------------------

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
CONFIGS_DIR="$INFRA_ROOT/infrastructure/tls/configs"
CERTS_DIR="/tmp/elk-certs-$(date +%s)"
NAMESPACE="logging"
SECRET_NAME="elk-tls-certs"

# Certificate Validity (in days)
VALIDITY_DAYS=365

# ------------------------------------------------------------------------------
# Helper Functions
# ------------------------------------------------------------------------------

log_info() { echo -e "${GREEN}[INFO] $1${NC}"; }
log_warn() { echo -e "${YELLOW}[WARN] $1${NC}"; }
log_error() { echo -e "${RED}[ERROR] $1${NC}"; }

check_dependency() {
    if ! command -v "$1" &> /dev/null; then
        log_error "$1 is not installed. Please install it."
        exit 1
    fi
}

cleanup() {
    log_info "Cleaning up temporary directory..."
    rm -rf "$CERTS_DIR"
}

# ------------------------------------------------------------------------------
# Main Execution
# ------------------------------------------------------------------------------

check_dependency "openssl"
check_dependency "kubectl"

# Validate configs exist
if [[ ! -d "$CONFIGS_DIR" ]]; then
    log_error "TLS Configs directory not found: $CONFIGS_DIR"
    exit 1
fi

# Ensure clean exit
trap cleanup EXIT

log_info "Starting ELK TLS certificates generation..."
mkdir -p "$CERTS_DIR"

# ------------------------------------------------------------------------------
# 1. Create Certificate Authority (CA)
# ------------------------------------------------------------------------------
log_info "Generating Certificate Authority (CA)..."

# Generate CA Private Key
openssl genrsa -out "$CERTS_DIR/ca.key" 4096

# Generate CA Certificate (Self-Signed)
openssl req -x509 -new -nodes -key "$CERTS_DIR/ca.key" \
    -sha256 -days "$VALIDITY_DAYS" \
    -out "$CERTS_DIR/ca.crt" \
    -subj "/CN=Elasticsearch-CA"

# ------------------------------------------------------------------------------
# 2. Generate Certificates for Elasticsearch
# ------------------------------------------------------------------------------
log_info "Generating Elasticsearch certificates..."

# Generate Private Key
openssl genrsa -out "$CERTS_DIR/elasticsearch.key" 4096

# Generate CSR using external config
openssl req -new -key "$CERTS_DIR/elasticsearch.key" \
    -out "$CERTS_DIR/elasticsearch.csr" \
    -config "$CONFIGS_DIR/elasticsearch-openssl.cnf"

# Sign Certificate with CA
openssl x509 -req -in "$CERTS_DIR/elasticsearch.csr" \
    -CA "$CERTS_DIR/ca.crt" -CAkey "$CERTS_DIR/ca.key" -CAcreateserial \
    -out "$CERTS_DIR/elasticsearch.crt" \
    -days "$VALIDITY_DAYS" -sha256 \
    -extensions req_ext -extfile "$CONFIGS_DIR/elasticsearch-openssl.cnf"

# ------------------------------------------------------------------------------
# 3. Generate Certificates for Kibana
# ------------------------------------------------------------------------------
log_info "Generating Kibana certificates..."

openssl genrsa -out "$CERTS_DIR/kibana.key" 4096

openssl req -new -key "$CERTS_DIR/kibana.key" \
    -out "$CERTS_DIR/kibana.csr" \
    -config "$CONFIGS_DIR/kibana-openssl.cnf"

openssl x509 -req -in "$CERTS_DIR/kibana.csr" \
    -CA "$CERTS_DIR/ca.crt" -CAkey "$CERTS_DIR/ca.key" -CAcreateserial \
    -out "$CERTS_DIR/kibana.crt" \
    -days "$VALIDITY_DAYS" -sha256 \
    -extensions req_ext -extfile "$CONFIGS_DIR/kibana-openssl.cnf"

# ------------------------------------------------------------------------------
# 4. Generate Certificates for Logstash
# ------------------------------------------------------------------------------
log_info "Generating Logstash certificates..."

openssl genrsa -out "$CERTS_DIR/logstash.key" 4096

openssl req -new -key "$CERTS_DIR/logstash.key" \
    -out "$CERTS_DIR/logstash.csr" \
    -config "$CONFIGS_DIR/logstash-openssl.cnf"

openssl x509 -req -in "$CERTS_DIR/logstash.csr" \
    -CA "$CERTS_DIR/ca.crt" -CAkey "$CERTS_DIR/ca.key" -CAcreateserial \
    -out "$CERTS_DIR/logstash.crt" \
    -days "$VALIDITY_DAYS" -sha256 \
    -extensions req_ext -extfile "$CONFIGS_DIR/logstash-openssl.cnf"

# ------------------------------------------------------------------------------
# 5. Convert Keys to PKCS#8 (Optional but recommended for Java apps)
# ------------------------------------------------------------------------------
# Elasticsearch and Logstash (Java) handle PKCS#8 better sometimes,
# but PEM format is usually fine with modern versions. We keep PEM for simplicity
# unless issues arise.

# ------------------------------------------------------------------------------
# 6. Create Kubernetes Secret
# ------------------------------------------------------------------------------
log_info "Creating Kubernetes Secret '$SECRET_NAME' in namespace '$NAMESPACE'..."

# Ensure namespace exists (idempotent via apply in Makefile, but check here)
if ! kubectl get namespace "$NAMESPACE" >/dev/null 2>&1; then
    log_warn "Namespace '$NAMESPACE' does not exist. Creating it..."
    kubectl create namespace "$NAMESPACE"
fi

# Delete existing secret if it exists
kubectl delete secret "$SECRET_NAME" -n "$NAMESPACE" --ignore-not-found

# Create the new secret with all certs and keys
kubectl create secret generic "$SECRET_NAME" \
    -n "$NAMESPACE" \
    --from-file=ca.crt="$CERTS_DIR/ca.crt" \
    --from-file=elasticsearch.crt="$CERTS_DIR/elasticsearch.crt" \
    --from-file=elasticsearch.key="$CERTS_DIR/elasticsearch.key" \
    --from-file=kibana.crt="$CERTS_DIR/kibana.crt" \
    --from-file=kibana.key="$CERTS_DIR/kibana.key" \
    --from-file=logstash.crt="$CERTS_DIR/logstash.crt" \
    --from-file=logstash.key="$CERTS_DIR/logstash.key"

log_info "Secret '$SECRET_NAME' created successfully."
log_info "Content:"
kubectl describe secret "$SECRET_NAME" -n "$NAMESPACE"

log_info "Done."
