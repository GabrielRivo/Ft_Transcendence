## Fonctionnalites a ajouter/modifier

- Matchmaking doit recuperer l'elo aupres du service stats
- Integrer Guests dans Tournaments/Game pour permettre aux invites de participer a un tournoi
- Preparer Dockerfiles prod, docker-compose prod et Makefile pour lancer en une commande, prevoir health checks et dependencies
- Challenge a friend, modifier game creation request

## Cleaning
- Verifier les codes d'erreurs de chaque erreur levee par le backend (les fixer sur des erreurs 4xx)

## Erreurs a verifier (voir si elles reapparaissent)
- Apres une partie, lorsque le joueur est redirige vers la page du tournoi, s'il a fait d'autres tournois avant, il peut etre redirige vers la page de fin de tournoi d'un autre tournoi au lieu d'etre redirige sur le tournoi actif.

## Tests a realiser
- lister toutes les routes API exposees par le backend pour chaque service.
- Pour chaque route, lister tous les cas de tests a realiser via Postman.

- Tests des WebSockets
