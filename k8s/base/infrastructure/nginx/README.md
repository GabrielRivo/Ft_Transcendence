# Nginx Ingress Controller - Documentation

## Vue d'Ensemble

Ce composant déploie le Nginx Ingress Controller pour exposer les services applicatifs via des règles Ingress. Le contrôleur est configuré avec des options de sécurité et de performance adaptées à chaque environnement.

## Architecture

Le Nginx Ingress Controller est déployé comme un **Deployment** avec :
- **ServiceAccount** : Pour l'authentification Kubernetes
- **ClusterRole/ClusterRoleBinding** : Pour les permissions nécessaires (lecture des Ingress, Services, ConfigMaps, etc.)
- **Deployment** : Contrôleur Nginx avec health checks
- **Service** : LoadBalancer (production/test) ou NodePort (dev) pour exposer le contrôleur
- **IngressClass** : Classe d'ingress par défaut (`nginx`)
- **ConfigMaps** : Configuration Nginx et ModSecurity

## Configuration par Environnement

### Développement (`dev`)

**Caractéristiques** :
- **Replicas** : 1
- **Service Type** : NodePort (pas de LoadBalancer pour économiser les ressources)
- **Ressources** : Réduites (128Mi/100m requests, 256Mi/200m limits)
- **ModSecurity** : Désactivé (performance pour le développement)
- **Exposition** : Pas d'exposition publique

**Utilisation** :
```bash
make k8s-up ENV=dev
```

### Test (`test`)

**Caractéristiques** :
- **Replicas** : 2
- **Service Type** : LoadBalancer (mais sans exposition publique)
- **Ressources** : Standard (256Mi/250m requests, 512Mi/500m limits)
- **ModSecurity** : Optionnel (peut être activé pour les tests de sécurité)
- **Exposition** : Interne uniquement

**Utilisation** :
```bash
make k8s-up ENV=test
```

### Production (`production`)

**Caractéristiques** :
- **Replicas** : 3 (haute disponibilité)
- **Service Type** : LoadBalancer avec annotations Cloudflare
- **Ressources** : Augmentées (512Mi/500m requests, 1Gi/1000m limits)
- **Pod Anti-Affinity** : Distribution sur différents nodes
- **ModSecurity** : Configuré (via ConfigMap modsecurity-config)
- **Headers de Sécurité** : ConfigMap `nginx-headers` avec headers de sécurité
- **Cloudflare** : Annotations pour intégration avec Cloudflare (proxy mode)
- **External Traffic Policy** : `Local` (préserve l'IP source du client)

**Utilisation** :
```bash
make k8s-up ENV=production
```

## Configuration Cloudflare (Production)

### Mode Proxy Cloudflare

Pour utiliser Cloudflare en mode proxy avec protection WAF/DDoS :

1. **Configurer le DNS** : Pointer le DNS vers l'IP du LoadBalancer
2. **Activer le Proxy** : Dans Cloudflare Dashboard, activer le proxy (orange cloud)
3. **Headers automatiques** : Cloudflare ajoutera automatiquement :
   - `CF-Connecting-IP` : IP réelle du client
   - `CF-Ray` : ID de requête Cloudflare
   - `CF-Visitor` : Protocole utilisé (http/https)

### Configuration Nginx pour Cloudflare

Le ConfigMap `nginx-config` en production est configuré pour :
- **use-forwarded-headers** : `true` - Utilise les headers X-Forwarded-*
- **compute-full-forwarded-for** : `true` - Calcule l'IP réelle depuis les headers
- **use-proxy-protocol** : `true` - Support du Proxy Protocol (si utilisé)

### IPs Cloudflare

Pour configurer la liste blanche des IPs Cloudflare dans Nginx (si nécessaire), référencer :
- IPv4 : https://www.cloudflare.com/ips-v4
- IPv6 : https://www.cloudflare.com/ips-v6

## Règles Ingress par Environnement

### Structure des Ingress

Toutes les règles Ingress doivent utiliser la classe `nginx` :

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-app-ingress
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: 'true'
    nginx.ingress.kubernetes.io/force-ssl-redirect: 'true'
spec:
  ingressClassName: nginx
  rules:
    - host: my-app.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: my-app
                port:
                  number: 80
```

### Annotations Ingress Courantes

#### Sécurité
```yaml
annotations:
  # Force HTTPS
  nginx.ingress.kubernetes.io/ssl-redirect: 'true'
  nginx.ingress.kubernetes.io/force-ssl-redirect: 'true'
  
  # Rate limiting
  nginx.ingress.kubernetes.io/limit-rps: '100'
  nginx.ingress.kubernetes.io/limit-connections: '10'
  
  # Headers de sécurité
  nginx.ingress.kubernetes.io/configuration-snippet: |
    more_set_headers "X-Frame-Options: SAMEORIGIN";
    more_set_headers "X-Content-Type-Options: nosniff";
```

#### Performance
```yaml
annotations:
  # Cache
  nginx.ingress.kubernetes.io/enable-cors: 'true'
  nginx.ingress.kubernetes.io/cors-allow-origin: '*'
  
  # Timeouts
  nginx.ingress.kubernetes.io/proxy-connect-timeout: '60'
  nginx.ingress.kubernetes.io/proxy-send-timeout: '60'
  nginx.ingress.kubernetes.io/proxy-read-timeout: '60'
```

#### Cloudflare (Production uniquement)
```yaml
annotations:
  # Utiliser l'IP réelle de Cloudflare
  nginx.ingress.kubernetes.io/use-forwarded-headers: 'true'
  nginx.ingress.kubernetes.io/compute-full-forwarded-for: 'true'
```

### Exemples de Règles Ingress par Service

#### Frontend (React)
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: frontend-ingress
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: 'true'
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  ingressClassName: nginx
  rules:
    - host: app.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend
                port:
                  number: 80
```

#### Service Auth (API)
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: auth-ingress
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: 'true'
    nginx.ingress.kubernetes.io/limit-rps: '100'
spec:
  ingressClassName: nginx
  rules:
    - host: api.example.com
      http:
        paths:
          - path: /api/auth
            pathType: Prefix
            backend:
              service:
                name: auth
                port:
                  number: 3000
```

#### Service Matchmaking (WebSocket)
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: matchmaking-ingress
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: 'true'
    nginx.ingress.kubernetes.io/proxy-read-timeout: '3600'
    nginx.ingress.kubernetes.io/proxy-send-timeout: '3600'
spec:
  ingressClassName: nginx
  rules:
    - host: ws.example.com
      http:
        paths:
          - path: /ws
            pathType: Prefix
            backend:
              service:
                name: matchmaking
                port:
                  number: 3000
```

## ModSecurity / WAF

### Configuration ModSecurity

Le ConfigMap `modsecurity-config` contient la configuration ModSecurity de base. Pour activer ModSecurity :

1. **Utiliser une image avec ModSecurity** : L'image officielle `nginx-ingress-controller` ne supporte pas ModSecurity nativement. Utiliser une image personnalisée ou un sidecar.

2. **Activer dans le ConfigMap** : Modifier le ConfigMap `nginx-config` pour activer ModSecurity :
```yaml
data:
  enable-modsecurity: 'true'
  enable-owasp-core-rules: 'true'
```

### OWASP Core Rule Set

Le ConfigMap `modsecurity-config` inclut les règles OWASP Core Rule Set (CRS) pour la protection contre les attaques courantes :
- Injection SQL
- Cross-Site Scripting (XSS)
- Cross-Site Request Forgery (CSRF)
- Path Traversal
- Etc.

### Alternative : Cloudflare WAF

En production, Cloudflare fournit un WAF intégré qui peut être utilisé à la place de ModSecurity :
- Configuration via Cloudflare Dashboard
- Protection DDoS automatique
- Rate limiting configurable
- Règles de sécurité personnalisables

## Monitoring

### Métriques Prometheus

Le contrôleur expose des métriques Prometheus sur le port `10254` :
- Endpoint : `http://nginx-ingress-controller:10254/metrics`
- Métriques disponibles :
  - `nginx_ingress_controller_requests` : Nombre de requêtes
  - `nginx_ingress_controller_connections` : Connexions actives
  - `nginx_ingress_controller_response_duration_seconds` : Durée de réponse

### Health Checks

- **Liveness Probe** : `/healthz` sur le port `10254`
- **Readiness Probe** : `/healthz` sur le port `10254`

## Troubleshooting

### Vérifier le statut du contrôleur

```bash
# Vérifier les pods
kubectl get pods -n ft-transcendence-dev -l app=nginx-ingress-controller

# Vérifier les logs
kubectl logs -n ft-transcendence-dev -l app=nginx-ingress-controller

# Vérifier la configuration
kubectl get configmap -n ft-transcendence-dev nginx-config -o yaml
```

### Vérifier les règles Ingress

```bash
# Lister les Ingress
kubectl get ingress -n ft-transcendence-dev

# Détails d'une Ingress
kubectl describe ingress -n ft-transcendence-dev my-app-ingress
```

### Tester la configuration Nginx

```bash
# Accéder au pod
kubectl exec -it -n ft-transcendence-dev deployment/nginx-ingress-controller -- /bin/sh

# Vérifier la configuration Nginx
cat /etc/nginx/nginx.conf
```

## Références

- [Nginx Ingress Controller Documentation](https://kubernetes.github.io/ingress-nginx/)
- [Cloudflare IPs](https://www.cloudflare.com/ips/)
- [OWASP ModSecurity Core Rule Set](https://coreruleset.org/)
- [Kubernetes Ingress Documentation](https://kubernetes.io/docs/concepts/services-networking/ingress/)
