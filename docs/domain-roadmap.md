# 🗺️ Roadmap de Développement : Domaine & Application

## Phase 1 : Les Fondations (Value Objects)

Nous commençons par les petits objets immuables qui composent nos entités.

* [X] **1.1 Structure des dossiers :** Créer l'arborescence `src/tournament/domain/` avec les sous-dossiers `value-objects`, `entities`, `events`, `ports`, `exceptions`.
* [X] **1.2 Exceptions du Domaine :** Créer une classe de base `DomainException` et les erreurs spécifiques (`TournamentFullException`, `InvalidStateTransitionException`, `PlayerAlreadyRegisteredException`).
* [X] **1.3 Value Object `Participant` :** Implémenter la classe immuable avec validation (ID requis, type USER/GUEST, displayName non vide).

## Phase 2 : L'Entité "Match" (La brique de base)

Le tournoi est un assemblage de matchs. Le match a sa propre logique d'état.

* [X] **2.1 Classe `Match` :** Définir les propriétés (`id`, `playerA`, `playerB`, `score`, `status`).
* [X] **2.2 Logique de Victoire :** Méthode `setScore(scoreA, scoreB)` qui passe le statut à `FINISHED` si 11 points.
* [X] **2.3 Gestion du Forfait :** Méthode `declareWalkover(winnerId)` qui termine le match instantanément.
* [ ] **2.4 Tests Unitaires `Match` :** Vérifier qu'on ne peut pas changer le score d'un match fini.

## Phase 3 : Le Cœur "Tournament" (Aggregate Root)

C'est le gros morceau. Il orchestre tout.

* [X] **3.1 Classe `Tournament` :** Structure de base avec l'ID, la capacité (4/8/16) et l'état (`CREATED`).
* [X] **3.2 Inscription (`join`) :**
* Vérifier l'unicité de l'ID.
* Vérifier l'unicité du `displayName`.
* Vérifier que le statut est `CREATED`.
* Ajouter le participant.


* [X] **3.3 Auto-Start :** Dans la méthode `join`, si `participants.length === capacity`, appeler la méthode privée `start()`.
* [ ] **3.4 Tests Unitaires `Tournament` (Partie 1) :** Tester les inscriptions, les rejets de doublons et le changement d'état.

## Phase 4 : Le Moteur de Bracket (Algorithme)

La logique de génération de l'arbre est complexe, on peut l'isoler dans un "Domain Service".

* [X] **4.1 Algorithme de Génération :** Créer une fonction/classe `BracketGenerator`.
* Input : Liste des participants mélangée.
* Output : Liste des matchs liés (Match 1 -> Match 3 <- Match 2).


* [X] **4.2 Intégration dans `Tournament` :** La méthode `start()` utilise ce générateur pour remplir la propriété `matches`.
* [X] **4.3 Propagation des Résultats :** Implémenter `onMatchFinished(matchId)`.
* Trouver le match suivant dans l'arbre.
* Y placer le vainqueur.
* Si c'était la finale -> Passer le tournoi en `FINISHED`.



## Phase 5 : Les Ports (Contrats)

Définir comment le domaine communique avec le monde extérieur.

* [x] **5.1 `TournamentRepository` :** Interface pour `save(tournament)` et `findById(id)`.
* [x] **5.2 `TournamentEventsPublisher` :** Interface pour notifier les événements (ex: `publishTournamentStarted`, `publishMatchUpdated`).

## Phase 6 : La Couche Application (Use Cases)

Ce sont les points d'entrée que votre Controller et votre Gateway appelleront.

* [ ] **6.1 DTOs :** Définir les types d'entrée simples (ex: `CreateTournamentCommand`, `JoinTournamentCommand`).
* [ ] **6.2 Use Case `CreateTournament` :** Instancie l'entité et sauvegarde.
* [ ] **6.3 Use Case `JoinTournament` :** Charge, ajoute le joueur, sauvegarde, publie les événements.
* [ ] **6.4 Use Case `ProcessMatchResult` :** (Pour le serveur de jeu) Met à jour le score et fait avancer le tournoi.
