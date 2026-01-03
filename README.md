# ft_transcendence - Infrastructure Module

Ce module gère l'infrastructure complète du projet `ft_transcendence`, incluant l'orchestration des conteneurs, la gestion des secrets, le logging, et le monitoring.

## Pré-requis

- **Linux** (Testé sur Ubuntu/Debian)
- **K3s** : Kubernetes léger pour l'orchestration
- **kubectl** : Outil de ligne de commande Kubernetes
- **Helm** : Gestionnaire de paquets pour Kubernetes
- **Docker** : Pour la construction des images (ou conteneurisation alternative compatible CRI)

## Architecture

L'infrastructure repose sur un cluster Kubernetes (K3s) hébergeant les microservices applicatifs ainsi que les services d'infrastructure transverses.

```mermaid
flowchart TB
    subgraph Ingress
        NGINX[NGINX Ingress Controller]
    end

    subgraph Apps[Microservices]
        AUTH[Auth Service]
        MATCH[Matchmaking Service]
        FRONTEND[Frontend]
    end

    subgraph Infra[Infrastructure Services]
        VAULT[HashiCorp Vault]
        REDIS[Redis]
        RABBITMQ[RabbitMQ]
    end

    subgraph Observability
        ES[Elasticsearch]
        LS[Logstash]
        KB[Kibana]
        PROM[Prometheus]
        GRAF[Grafana]
    end

    subgraph Storage
        PV_SQLITE[SQLite PVs]
        PV_ES[Elasticsearch PV]
        PV_VAULT[Vault PV]
    end

    NGINX --> AUTH
    NGINX --> MATCH
    NGINX --> FRONTEND
    NGINX --> KB
    NGINX --> GRAF

    AUTH --> REDIS
    AUTH --> RABBITMQ
    AUTH --> VAULT
    MATCH --> REDIS
    MATCH --> RABBITMQ
    MATCH --> VAULT

    AUTH --> LS
    MATCH --> LS
    LS --> ES
    KB --> ES

    PROM --> AUTH
    PROM --> MATCH
    PROM --> REDIS
    PROM --> RABBITMQ
    GRAF --> PROM
```

## Structure des Dossiers

| Dossier       | Description                                                      |
| ------------- | ---------------------------------------------------------------- |
| `k8s/`        | Manifests Kubernetes organisés avec Kustomize (base/overlays)    |
| `helm/`       | Charts Helm personnalisés et fichiers de valeurs (`values.yaml`) |
| `vault/`      | Configuration et policies pour HashiCorp Vault                   |
| `dashboards/` | Dashboards JSON pour Grafana et visualisations Kibana            |
| `scripts/`    | Scripts d'automatisation (setup, init, maintenance)              |

## Quickstart

Un `Makefile` (à venir) orchestrera le déploiement. Voici les commandes prévues :

```bash
# Démarrage complet de l'infrastructure
make up

# Arrêt propre
make down

# Vérification de l'état des services
make status
```

## Composants Déployés

| Composant           | Rôle                             | Namespace    |
| ------------------- | -------------------------------- | ------------ |
| **HashiCorp Vault** | Gestion centralisée des secrets  | `vault`      |
| **Elasticsearch**   | Base de données de logs          | `logging`    |
| **Logstash**        | Ingestion et traitement des logs | `logging`    |
| **Kibana**          | Visualisation des logs           | `logging`    |
| **Prometheus**      | Collecte de métriques            | `monitoring` |
| **Grafana**         | Tableaux de bord de monitoring   | `monitoring` |
| **RabbitMQ**        | Message Broker                   | `production` |
| **Redis**           | Cache et session store           | `production` |
