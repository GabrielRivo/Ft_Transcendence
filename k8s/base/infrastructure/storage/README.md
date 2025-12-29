# Storage pour SQLite - Documentation

## Vue d'Ensemble

Cette section gère le stockage persistant pour les bases de données SQLite utilisées par les services `auth` et `matchmaking`.

## StorageClasses

### `standard`
- **Environnements** : `dev`, `test`
- **Type** : Stockage standard
- **Provisioner** : `kubernetes.io/no-provisioner` (nécessite un provisioner externe ou des PersistentVolumes manuels)
- **VolumeBindingMode** : `WaitForFirstConsumer` (le volume n'est créé que lorsqu'un pod l'utilise)

### `fast-ssd`
- **Environnements** : `production`
- **Type** : Stockage SSD haute performance
- **Provisioner** : `kubernetes.io/no-provisioner` (nécessite un provisioner externe ou des PersistentVolumes manuels)
- **VolumeBindingMode** : `WaitForFirstConsumer`

## PersistentVolumeClaims

### `auth-db-pvc`
- **Service** : `auth`
- **Taille** : 1Gi
- **AccessMode** : `ReadWriteOnce` (un seul pod peut monter le volume en écriture)
- **StorageClass** :
  - `dev`/`test` : `standard`
  - `production` : `fast-ssd`

### `matchmaking-db-pvc`
- **Service** : `matchmaking`
- **Taille** : 1Gi
- **AccessMode** : `ReadWriteOnce`
- **StorageClass** :
  - `dev`/`test` : `standard`
  - `production` : `fast-ssd`

## Utilisation dans les Pods

Les PVCs doivent être montés dans les pods des services applicatifs :

```yaml
volumes:
  - name: db-storage
    persistentVolumeClaim:
      claimName: auth-db-pvc
volumeMounts:
  - name: db-storage
    mountPath: /data
```

Les services doivent configurer `DB_PATH` pour pointer vers le volume monté :
- `DB_PATH=/data/db.sqlite`

## Stratégie de Backup et Restauration

### Backup

#### Méthode 1 : Backup via kubectl cp

```bash
# Créer un backup du PVC auth-db
kubectl exec -n ft-transcendence-dev deployment/auth-service -- \
  sqlite3 /data/db.sqlite ".backup /tmp/backup.sqlite"

kubectl cp ft-transcendence-dev/$(kubectl get pod -n ft-transcendence-dev -l app.kubernetes.io/component=auth -o jsonpath='{.items[0].metadata.name}'):/tmp/backup.sqlite \
  ./backups/auth-db-$(date +%Y%m%d-%H%M%S).sqlite
```

#### Méthode 2 : Backup via snapshot (si supporté par le provisioner)

```bash
# Créer un snapshot du PVC
kubectl create volumesnapshot auth-db-snapshot \
  --source-pvc=auth-db-pvc \
  --namespace=ft-transcendence-dev
```

#### Méthode 3 : Backup automatique via CronJob

Un CronJob peut être configuré pour effectuer des backups réguliers :

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: db-backup
spec:
  schedule: "0 2 * * *"  # Tous les jours à 2h du matin
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup
            image: sqlite-backup:latest
            command:
            - /bin/sh
            - -c
            - |
              kubectl exec -n $(NAMESPACE) deployment/auth-service -- \
                sqlite3 /data/db.sqlite ".backup /tmp/backup.sqlite"
              # Copier vers un stockage externe (S3, NFS, etc.)
```

### Restauration

#### Restauration depuis un backup

```bash
# Copier le backup dans le pod
kubectl cp ./backups/auth-db-20231229-020000.sqlite \
  ft-transcendence-dev/$(kubectl get pod -n ft-transcendence-dev -l app.kubernetes.io/component=auth -o jsonpath='{.items[0].metadata.name}'):/tmp/restore.sqlite

# Restaurer la base de données
kubectl exec -n ft-transcendence-dev deployment/auth-service -- \
  sqlite3 /data/db.sqlite ".restore /tmp/restore.sqlite"
```

### Recommandations

1. **Fréquence des backups** :
   - `dev` : Optionnel (données de test)
   - `test` : Quotidien
   - `production` : Quotidien avec rétention de 30 jours

2. **Stockage des backups** :
   - Utiliser un stockage externe (S3, NFS, etc.)
   - Ne pas stocker les backups dans le même cluster

3. **Tests de restauration** :
   - Tester régulièrement la restauration des backups
   - Documenter les procédures de restauration

4. **Monitoring** :
   - Surveiller l'espace disque utilisé par les PVCs
   - Alerter si l'espace dépasse 80% de la capacité

## Notes Techniques

- Les StorageClasses utilisent `kubernetes.io/no-provisioner` car elles nécessitent un provisioner externe ou des PersistentVolumes manuels
- Pour un environnement de développement local (minikube, kind, etc.), vous devrez peut-être créer des PersistentVolumes manuels
- Les PVCs utilisent `WaitForFirstConsumer` pour éviter la création de volumes non utilisés

## Commandes Utiles

```bash
# Voir les StorageClasses
kubectl get storageclass

# Voir les PVCs
kubectl get pvc -n ft-transcendence-dev

# Voir les détails d'un PVC
kubectl describe pvc auth-db-pvc -n ft-transcendence-dev

# Voir l'utilisation du stockage
kubectl get pvc -n ft-transcendence-dev -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.status.capacity.storage}{"\n"}{end}'
```
