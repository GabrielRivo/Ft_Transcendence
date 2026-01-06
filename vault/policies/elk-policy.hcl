# Vault Policy for ELK Stack
# Context: ft-transcendence DevOps Module
# Service: ELK Stack (Elasticsearch, Logstash, Kibana)
#
# This policy grants access to the secrets required by the ELK components.
# These secrets are typically synchronized to Kubernetes Secrets via
# the External Secrets Operator (ESO).

# ------------------------------------------------------------------------------
# 1. ELK Shared Secrets
# ------------------------------------------------------------------------------
# Allow the ELK stack (via ESO) to READ secrets located in secret/shared/*
# Specifically targeted at elasticsearch, kibana, and logstash paths.

# Elasticsearch secrets (password, keystore_password)
path "secret/data/shared/elasticsearch" {
  capabilities = ["read"]
}

# Kibana secrets (encryption_key)
path "secret/data/shared/kibana" {
  capabilities = ["read"]
}

# Logstash secrets (password)
path "secret/data/shared/logstash" {
  capabilities = ["read"]
}

# ------------------------------------------------------------------------------
# 2. Metadata Listing
# ------------------------------------------------------------------------------
# Allow listing metadata for these secrets. This is useful for ESO to check
# for existence or versioning.

path "secret/metadata/shared/elasticsearch" {
  capabilities = ["list"]
}

path "secret/metadata/shared/kibana" {
  capabilities = ["list"]
}

path "secret/metadata/shared/logstash" {
  capabilities = ["list"]
}
