# Configuration
ENV ?= dev
OVERLAY = infrastructure/k8s/overlays/$(ENV)

# Determination du namespace en fonction de l'ENV
ifeq ($(ENV), production)
    NAMESPACE := ft-transcendence-production
else ifeq ($(ENV), test)
    NAMESPACE := ft-transcendence-test
else
    NAMESPACE := ft-transcendence-dev
endif

.PHONY: all up down clean logs status validate port-forward build re

all: up

# Validation des manifests Kustomize
validate:
	@echo "Validation des manifests pour $(ENV)..."
	@kubectl kustomize --enable-helm $(OVERLAY) > /dev/null && echo "Manifests valides" || { echo "Erreur de validation"; exit 1; }

# Deploie l'environnement
up:
	@echo "Deploiement de l'environnement $(ENV) dans $(NAMESPACE)..."
	@kubectl apply -f $(OVERLAY)/resources/namespace.yaml
	@kubectl kustomize --enable-helm $(OVERLAY) | kubectl apply -f -
	@echo "Deploiement termine. Ressources :"
	@kubectl get all,configmaps,ingresses -n $(NAMESPACE) 2>/dev/null | head -10

# Arrete l'environnement (supprime les ressources definies dans kustomize)
down:
	@echo "Arret de l'environnement $(ENV)..."
	@kubectl kustomize --enable-helm $(OVERLAY) | kubectl delete --ignore-not-found=true -f -
	@echo "Environnement $(ENV) arrete"

# Supprime completement le namespace
clean:
	@echo "Nettoyage complet de l'environnement $(ENV)..."
	@if kubectl get namespace $(NAMESPACE) >/dev/null 2>&1; then \
		echo "Inventaire des ressources avant suppression :"; \
		kubectl get all,pvc,configmaps,secrets,ingresses -n $(NAMESPACE) 2>/dev/null | head -n 15 | sed 's/^/   / ' || true; \
		echo ""; \
		echo "Suppression du namespace $(NAMESPACE) en cours... (Veuillez patienter)"; \
		time kubectl delete namespace $(NAMESPACE) --ignore-not-found=true; \
		echo "Namespace supprime."; \
	else \
		echo "Le namespace $(NAMESPACE) n'existe pas."; \
	fi
	@echo "Nettoyage termine"

# Affiche les logs
# Utilise app.kubernetes.io/name pour les services Helm (Bitnami) et app.kubernetes.io/component pour les autres
# Pour Redis, le chart Bitnami utilise component=master, donc on cherche par name=redis
logs:
	@if [ -z "$(SVC)" ]; then \
		echo "Logs de tous les pods dans $(NAMESPACE)..."; \
		kubectl logs -n $(NAMESPACE) -l app.kubernetes.io/part-of=ft-transcendence --tail=100 -f; \
	else \
		echo "Logs du service $(SVC) dans $(NAMESPACE)..."; \
		if kubectl get pods -n $(NAMESPACE) -l app.kubernetes.io/name=$(SVC) --no-headers 2>/dev/null | grep -q .; then \
			kubectl logs -n $(NAMESPACE) -l app.kubernetes.io/name=$(SVC) --tail=100 -f; \
		else \
			if kubectl get pods -n $(NAMESPACE) -l app.kubernetes.io/component=$(SVC) --no-headers 2>/dev/null | grep -q .; then \
				kubectl logs -n $(NAMESPACE) -l app.kubernetes.io/component=$(SVC) --tail=100 -f; \
			else \
				if [ "$(SVC)" = "nginx-ingress-controller" ]; then \
					kubectl logs -n $(NAMESPACE) -l app.kubernetes.io/name=ingress-nginx,app.kubernetes.io/component=controller --tail=100 -f 2>/dev/null || \
					kubectl logs -n $(NAMESPACE) -l app.kubernetes.io/part-of=ingress-nginx --tail=100 -f; \
				else \
					kubectl logs -n $(NAMESPACE) -l app.kubernetes.io/part-of=ft-transcendence --tail=100 -f; \
				fi; \
			fi; \
		fi; \
	fi

# Affiche l'etat des ressources
status:
	@echo "Etat des ressources dans $(NAMESPACE):"
	@kubectl get pods,services,configmaps,ingresses,pvc -n $(NAMESPACE)

# Port-forward pour acces local
port-forward:
	@if [ -z "$(SVC)" ] || [ -z "$(PORT)" ]; then \
		echo "Erreur : Veuillez specifier SVC=service PORT=port"; \
		exit 1; \
	fi
	@echo "Port-forward du service $(SVC) vers localhost:$(PORT)..."
	@kubectl port-forward -n $(NAMESPACE) service/$(SVC) $(PORT):$(PORT)

# Build des images Docker
build:
	@if [ -z "$(SVC)" ]; then \
		echo "Build de toutes les images..."; \
		docker build -t ft-transcendence-auth:latest apps/auth; \
		docker build -t ft-transcendence-matchmaking:latest apps/matchmaking; \
	else \
		echo "Build de l'image $(SVC)..."; \
		docker build -t ft-transcendence-$(SVC):latest apps/$(SVC); \
	fi
	@echo "Build termine"

re: clean up
