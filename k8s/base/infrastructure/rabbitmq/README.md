# RabbitMQ - Configuration Kubernetes

Ce dossier contient les manifests Kubernetes pour déployer RabbitMQ dans le cluster.

## Structure

- `statefulset.yaml` : StatefulSet pour RabbitMQ avec persistance
- `service.yaml` : Services ClusterIP (normal et headless)
- `rabbitmq.conf` : Fichier de configuration RabbitMQ de base
- `enabled_plugins` : Liste des plugins RabbitMQ activés
- `secret.yaml` : Secret pour les credentials RabbitMQ (username, password, erlang-cookie)
- `kustomization.yaml` : Configuration Kustomize avec configMapGenerator

**Note** : La configuration RabbitMQ est stockée dans des fichiers séparés (`rabbitmq.conf` et `enabled_plugins`) et chargée via `configMapGenerator` de Kustomize. Chaque overlay (dev, test, production) peut avoir ses propres fichiers de configuration qui surchargent la configuration de base.

## Accès depuis les Services Applicatifs

### Connexion depuis un Pod dans le même namespace

```typescript
// URL de connexion RabbitMQ (AMQP)
const rabbitmqUrl = 'amqp://rabbitmq:5672';

// Si des credentials sont configurés
const rabbitmqUrl = `amqp://${process.env.RABBITMQ_USERNAME}:${process.env.RABBITMQ_PASSWORD}@rabbitmq:5672`;

// URL de connexion Management UI
const managementUrl = 'http://rabbitmq:15672';
```

### Variables d'environnement

Les services applicatifs peuvent utiliser les variables d'environnement suivantes :

```yaml
env:
  - name: RABBITMQ_HOST
    value: rabbitmq
  - name: RABBITMQ_PORT
    value: '5672'
  - name: RABBITMQ_MANAGEMENT_PORT
    value: '15672'
  - name: RABBITMQ_USERNAME
    valueFrom:
      secretKeyRef:
        name: rabbitmq-secret
        key: username
  - name: RABBITMQ_PASSWORD
    valueFrom:
      secretKeyRef:
        name: rabbitmq-secret
        key: password
```

### DNS Kubernetes

- **Service ClusterIP** : `rabbitmq.<namespace>.svc.cluster.local` ou simplement `rabbitmq`
- **Service Headless** (pour StatefulSet) : `rabbitmq-headless.<namespace>.svc.cluster.local`
- **Pod individuel** (pour StatefulSet) : `rabbitmq-0.rabbitmq-headless.<namespace>.svc.cluster.local`

### Exemple de connexion depuis Node.js

```typescript
import amqp from 'amqplib';

const connection = await amqp.connect({
  hostname: process.env.RABBITMQ_HOST || 'rabbitmq',
  port: parseInt(process.env.RABBITMQ_PORT || '5672'),
  username: process.env.RABBITMQ_USERNAME || 'guest',
  password: process.env.RABBITMQ_PASSWORD || 'guest',
});

const channel = await connection.createChannel();
```

## Configuration par Environnement

### Dev

- **Replicas** : 1
- **Ressources** : 256Mi mémoire, 250m CPU (requests) / 512Mi mémoire, 500m CPU (limits)
- **Stockage** : 10Gi avec StorageClass `standard`
- **Clustering** : Désactivé (single node)
- **Management UI** : Accessible en interne

### Test

- **Replicas** : 3
- **Ressources** : 512Mi mémoire, 500m CPU (requests) / 1Gi mémoire, 1000m CPU (limits)
- **Stockage** : 20Gi avec StorageClass `standard`
- **Clustering** : Activé avec découverte Kubernetes
- **PodAntiAffinity** : Préférence pour distribuer les pods sur différents nodes
- **Haute disponibilité** : Queues et exchanges répliqués

### Production

- **Replicas** : 3
- **Ressources** : 512Mi mémoire, 500m CPU (requests) / 1Gi mémoire, 1000m CPU (limits)
- **Stockage** : 50Gi avec StorageClass `fast-ssd`
- **Clustering** : Activé avec découverte Kubernetes
- **PodAntiAffinity** : Requis pour distribuer les pods sur différents nodes
- **PodDisruptionBudget** : Minimum 2 pods disponibles
- **Haute disponibilité** : Queues et exchanges répliqués sur tous les nodes
- **Sécurité** : Guest user désactivé, credentials sécurisés via Vault

## Health Checks

RabbitMQ expose deux probes :

- **Liveness Probe** : Vérifie que RabbitMQ répond aux commandes (`rabbitmq-diagnostics ping`)

  - Délai initial : 60 secondes (RabbitMQ nécessite plus de temps pour démarrer)
  - Période : 30 secondes
  - Timeout : 10 secondes
  - Seuil d'échec : 3

- **Readiness Probe** : Vérifie que RabbitMQ est prêt à accepter des connexions
  - Délai initial : 20 secondes
  - Période : 10 secondes
  - Timeout : 5 secondes
  - Seuil d'échec : 3

## Sécurité

- **SecurityContext** : Exécution en mode non-root (UID 999)
- **Capabilities** : Toutes les capabilities Linux sont supprimées sauf celles nécessaires
- **Erlang Cookie** : Utilisé pour sécuriser la communication entre les nodes RabbitMQ dans un cluster
- **Guest User** : Désactivé en production (configuré dans les overlays)
- **Management UI** : Accessible uniquement en interne (ClusterIP)

## Persistance

Les données RabbitMQ sont persistées dans un PersistentVolume créé via `volumeClaimTemplates` :

- **Chemin de données** : `/var/lib/rabbitmq`
- **Fichiers** :
  - `mnesia/` : Base de données Mnesia (queues, exchanges, bindings, etc.)
  - `logs/` : Logs RabbitMQ

## Clustering

RabbitMQ supporte le clustering pour la haute disponibilité. La configuration utilise la découverte Kubernetes :

- **Service Discovery** : Utilise le service headless `rabbitmq-headless`
- **Hostname Pattern** : `rabbit@$(HOSTNAME).rabbitmq-headless.$(POD_NAMESPACE).svc.cluster.local`
- **Erlang Cookie** : Doit être identique pour tous les pods dans un cluster
- **Port Clustering** : 25672 (inter-node communication)

Pour activer le clustering, les overlays doivent :

1. Configurer plusieurs replicas (3 recommandé)
2. S'assurer que l'Erlang cookie est identique pour tous les pods
3. Configurer les politiques de haute disponibilité pour les queues et exchanges

## Configuration des Exchanges et Queues

Les exchanges et queues peuvent être configurés via :

1. **Management UI** : Interface web accessible sur le port 15672
2. **RabbitMQ CLI** : Commandes `rabbitmqctl` et `rabbitmqadmin`
3. **Code applicatif** : Déclaration dans le code de l'application
4. **Définition JSON** : Fichier de définition importé via Management UI ou CLI

### Types d'Exchanges

RabbitMQ supporte plusieurs types d'exchanges :

- **direct** : Routage basé sur une clé de routage exacte
- **topic** : Routage basé sur des patterns de clés de routage (wildcards)
- **fanout** : Diffusion à toutes les queues liées (broadcast)
- **headers** : Routage basé sur les headers des messages

### Configuration via Management UI

```bash
# Port-forward vers le service management
kubectl port-forward -n ft-transcendence-dev svc/rabbitmq 15672:15672

# Accéder via navigateur : http://localhost:15672
# Credentials : guest/guest (dev) ou selon la configuration de l'environnement
```

### Configuration via CLI (rabbitmqadmin)

```bash
# Se connecter au pod RabbitMQ
kubectl exec -it -n ft-transcendence-dev rabbitmq-0 -- bash

# Créer un exchange de type topic
rabbitmqadmin declare exchange name=matchmaking-exchange type=topic durable=true

# Créer une queue durable
rabbitmqadmin declare queue name=matchmaking-queue durable=true

# Créer un binding avec une clé de routage
rabbitmqadmin declare binding source=matchmaking-exchange destination=matchmaking-queue routing_key=matchmaking.*

# Lister les exchanges
rabbitmqadmin list exchanges

# Lister les queues
rabbitmqadmin list queues

# Lister les bindings
rabbitmqadmin list bindings
```

### Configuration via CLI (rabbitmqctl)

```bash
# Se connecter au pod RabbitMQ
kubectl exec -it -n ft-transcendence-dev rabbitmq-0 -- bash

# Créer un exchange
rabbitmqctl declare exchange name=matchmaking-exchange type=topic durable=true

# Créer une queue
rabbitmqctl declare queue name=matchmaking-queue durable=true

# Créer un binding
rabbitmqctl declare binding source=matchmaking-exchange destination=matchmaking-queue routing_key=matchmaking.*

# Lister les exchanges
rabbitmqctl list_exchanges

# Lister les queues avec détails
rabbitmqctl list_queues name messages consumers

# Lister les bindings
rabbitmqctl list_bindings
```

### Configuration via Code Applicatif (Node.js)

```typescript
import amqp from 'amqplib';

const connection = await amqp.connect({
  hostname: process.env.RABBITMQ_HOST || 'rabbitmq',
  port: parseInt(process.env.RABBITMQ_PORT || '5672'),
  username: process.env.RABBITMQ_USERNAME || 'guest',
  password: process.env.RABBITMQ_PASSWORD || 'guest',
});

const channel = await connection.createChannel();

// Créer un exchange
await channel.assertExchange('matchmaking-exchange', 'topic', {
  durable: true,
});

// Créer une queue
const queueResult = await channel.assertQueue('matchmaking-queue', {
  durable: true,
});

// Créer un binding
await channel.bindQueue(
  queueResult.queue,
  'matchmaking-exchange',
  'matchmaking.*'
);

// Publier un message
channel.publish(
  'matchmaking-exchange',
  'matchmaking.create',
  Buffer.from(JSON.stringify({ userId: '123', gameMode: 'classic' }))
);

// Consommer des messages
await channel.consume(
  queueResult.queue,
  (msg) => {
    if (msg) {
      const content = JSON.parse(msg.content.toString());
      console.log('Message reçu:', content);
      channel.ack(msg);
    }
  },
  { noAck: false }
);
```

### Politiques de Haute Disponibilité

Pour les environnements avec clustering (test/production), configurez des politiques HA :

```bash
# Appliquer une politique HA pour toutes les queues
rabbitmqctl set_policy ha-all "^" '{"ha-mode":"all","ha-sync-mode":"automatic"}'

# Appliquer une politique HA pour des queues spécifiques (pattern)
rabbitmqctl set_policy ha-matchmaking "^matchmaking-" '{"ha-mode":"all","ha-sync-mode":"automatic"}'

# Appliquer une politique HA avec quorum queues (RabbitMQ 3.8+)
rabbitmqctl set_policy ha-quorum "^quorum-" '{"ha-mode":"all","queue-mode":"lazy"}'

# Lister les politiques
rabbitmqctl list_policies

# Supprimer une politique
rabbitmqctl clear_policy ha-all
```

### Exemples de Configuration pour ft_transcendence

#### Exchange pour le Matchmaking

```bash
# Exchange pour les événements de matchmaking
rabbitmqadmin declare exchange name=matchmaking-exchange type=topic durable=true

# Queue pour les requêtes de matchmaking
rabbitmqadmin declare queue name=matchmaking-requests durable=true

# Queue pour les notifications de match trouvé
rabbitmqadmin declare queue name=matchmaking-notifications durable=true

# Bindings
rabbitmqadmin declare binding source=matchmaking-exchange destination=matchmaking-requests routing_key=matchmaking.request
rabbitmqadmin declare binding source=matchmaking-exchange destination=matchmaking-notifications routing_key=matchmaking.found
```

#### Exchange pour les Notifications

```bash
# Exchange pour les notifications utilisateur
rabbitmqadmin declare exchange name=notifications-exchange type=fanout durable=true

# Queue par utilisateur (pattern)
rabbitmqadmin declare queue name=notifications-user-123 durable=true

# Binding pour notifications globales
rabbitmqadmin declare binding source=notifications-exchange destination=notifications-user-123 routing_key=
```

### Gestion des Messages

```bash
# Publier un message de test
rabbitmqadmin publish exchange=matchmaking-exchange routing_key=matchmaking.request payload='{"userId":"123","gameMode":"classic"}'

# Consulter les messages dans une queue (sans les consommer)
rabbitmqadmin get queue=matchmaking-requests ackmode=ack_requeue_false

# Purger une queue (supprimer tous les messages)
rabbitmqadmin purge queue name=matchmaking-requests

# Supprimer une queue
rabbitmqadmin delete queue name=matchmaking-requests

# Supprimer un exchange
rabbitmqadmin delete exchange name=matchmaking-exchange
```

### Bonnes Pratiques

1. **Durabilité** : Utilisez `durable=true` pour les exchanges et queues critiques
2. **Haute Disponibilité** : Configurez des politiques HA pour les queues importantes en production
3. **Naming Convention** : Utilisez des noms explicites avec préfixes (ex: `matchmaking-`, `notifications-`)
4. **Routing Keys** : Utilisez des patterns cohérents (ex: `service.action.entity`)
5. **Message TTL** : Configurez des TTL pour éviter l'accumulation de messages obsolètes
6. **Dead Letter Exchange** : Configurez un DLX pour gérer les messages rejetés
7. **Monitoring** : Surveillez la taille des queues et le taux de consommation

## Mise à jour

Le StatefulSet utilise une stratégie de mise à jour `RollingUpdate` :

- Les pods sont mis à jour un par un
- La partition est définie à 0 pour permettre la mise à jour de tous les pods
- Pour un cluster RabbitMQ, il est recommandé de mettre à jour les pods un par un pour maintenir la disponibilité

## Troubleshooting

### Vérifier l'état des pods

```bash
kubectl get pods -n ft-transcendence-dev -l app=rabbitmq
```

### Voir les logs

```bash
kubectl logs -n ft-transcendence-dev rabbitmq-0
```

### Se connecter à RabbitMQ depuis un pod

```bash
# Accéder au shell du pod
kubectl exec -it -n ft-transcendence-dev rabbitmq-0 -- bash

# Vérifier le statut
rabbitmqctl status

# Lister les queues
rabbitmqctl list_queues

# Lister les exchanges
rabbitmqctl list_exchanges

# Vérifier le clustering
rabbitmqctl cluster_status
```

### Accéder à la Management UI

```bash
# Port-forward vers le service management
kubectl port-forward -n ft-transcendence-dev svc/rabbitmq 15672:15672

# Accéder via navigateur : http://localhost:15672
# Credentials par défaut : guest/guest (sera surchargé dans les overlays)
```

### Vérifier la configuration

```bash
# Voir le ConfigMap généré
kubectl get configmap -n ft-transcendence-dev rabbitmq-config -o yaml

# Voir le contenu du fichier de configuration
kubectl get configmap -n ft-transcendence-dev rabbitmq-config -o jsonpath='{.data.rabbitmq\.conf}'
```

### Gestion des Secrets par Environnement

Les secrets RabbitMQ sont gérés séparément pour chaque environnement :

- **Dev** : `overlays/dev/rabbitmq-secret.yaml` - Credentials par défaut (guest/guest)
- **Test** : `overlays/test/rabbitmq-secret.yaml` - Credentials par défaut (structure prête pour Vault)
- **Production** : `overlays/production/rabbitmq-secret.yaml` - Credentials par défaut (DOIT être configuré via Vault)

**Important** : Pour la production, les credentials doivent être injectés via Vault ou External Secrets Operator. Ne jamais commiter de credentials réels dans Git. L'Erlang cookie doit être identique pour tous les pods dans un cluster RabbitMQ.

### Vérifier les volumes persistants

```bash
kubectl get pvc -n ft-transcendence-dev -l app=rabbitmq
```

### Vérifier le clustering

```bash
# Se connecter à un pod
kubectl exec -it -n ft-transcendence-dev rabbitmq-0 -- rabbitmqctl cluster_status

# Devrait afficher tous les nodes du cluster
```
