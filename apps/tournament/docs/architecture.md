# Guide de Conception : Microservice de Gestion de Tournois

### Architecture Hexagonale & NestJS

Ce document détaille la philosophie, la structure et la procédure de développement "Inside-Out" pour garantir un service découplé, testable et évolutif.

---

## 1. Philosophie et Principes Fondateurs

Avant d'écrire le code, nous devons accepter les contraintes architecturales suivantes pour éviter le "monolithe distribué".

### 1.1. Les 5 Piliers du Microservice

1. **Bounded Context (Contexte Borné) :** Ce service ne gère *que* le cycle de vie des tournois. Il ne gère pas la facturation des joueurs, ni l'authentification (qui sont des contextes externes).
2. **Souveraineté des Données :** Ce service possède sa propre base de données. Aucun autre service n'y accède directement.
3. **API First :** Les contrats (OpenAPI, AsyncAPI) sont définis avant l'implémentation.
4. **Isolation :** Le code métier ne doit dépendre d'aucun framework (pas de dépendance à NestJS dans le Domaine).
5. **Observabilité :** Le service doit exposer sa santé (`/health`) et tracer ses requêtes.

### 1.2. Le Modèle Hexagonal (Ports & Adapters)

L'application est divisée en trois zones concentriques :

* 🟢 **Le Domaine (Cœur) :** La vérité métier. Code TypeScript pur. Aucune dépendance externe.
* 🟡 **L'Application (Orchestration) :** Les cas d'utilisation (*Use Cases*). Coordonne le domaine et les ports.
* 🔴 **L'Infrastructure (Adaptateurs) :** L'implémentation technique (NestJS, TypeORM, Socket.io).

---

## 2. Structure Standardisée du Projet

Voici l'arborescence stricte à respecter pour chaque module métier (ex: `src/tournament`).

```text
src/
└── tournament/
    ├── domain/                     # 🟢 CŒUR DU MÉTIER (Pur TS)
    │   ├── entities/               # Objets riches (Tournament, Player)
    │   ├── events/                 # Événements métier (TournamentStarted)
    │   ├── exceptions/             # Erreurs métier (TournamentFullError)
    │   └── ports/                  # Interfaces (Contrats)
    │       ├── tournament.repository.ts    # Pour la persistence
    │       └── event.publisher.ts          # Pour les notifications (WS/Bus)
    │
    ├── application/                # 🟡 ORCHESTRATION
    │   ├── use-cases/              # Un fichier par action (StartTournament)
    │   └── dtos/                   # Objets de transfert simples
    │
    └── infrastructure/             # 🔴 DÉTAILS TECHNIQUES (NestJS)
        ├── adapters/               # Implémentations des Ports
        │   ├── postgres.repository.ts
        │   └── websocket.publisher.ts
        ├── controllers/            # Entrée HTTP (REST)
        ├── gateways/               # Entrée WebSocket (Socket.io)
        └── tournament.module.ts    # Injection de Dépendances

```

---

## 3. Procédure de Développement "Inside-Out"

Ne commencez jamais par la base de données ou le contrôleur. Suivez ces 5 étapes séquentiellement.

### Étape 1 : Le Domaine (Définir les règles)

Nous modélisons la réalité métier. Ici, nous définissons ce qu'est un tournoi valide.

**🧠 Questions à se poser :**

* *Quelles sont les règles inviolables ? (ex: min 2 joueurs)*
* *Quelles erreurs spécifiques peuvent survenir ?*

**Exemple de code (`domain/entities/tournament.ts`) :**

```typescript
export class Tournament {
  constructor(
    public readonly id: string,
    public status: 'DRAFT' | 'STARTED' | 'FINISHED',
    private _players: string[] = []
  ) {}

  // Règle métier encapsulée : On ne peut pas démarrer sans joueurs
  public start(): void {
    if (this._players.length < 2) {
      throw new Error("Impossible de démarrer un tournoi avec moins de 2 joueurs.");
    }
    this.status = 'STARTED';
  }

  public addPlayer(playerId: string): void {
    if (this.status !== 'DRAFT') {
      throw new Error("Inscriptions fermées.");
    }
    this._players.push(playerId);
  }
}

```

### Étape 2 : Les Ports (Définir les besoins)

Le domaine a besoin de communiquer avec l'extérieur. Il définit des interfaces (contrats) sans se soucier de l'implémentation.

**🧠 Questions à se poser :**

* *De quoi ai-je besoin pour sauvegarder mon travail ? (Repository)*
* *Qui dois-je prévenir quand l'état change ? (Publisher)*

**Exemple de code (`domain/ports/event.publisher.ts`) :**

```typescript
import { Tournament } from '../entities/tournament';

export interface EventPublisher {
  // Le domaine dit "Je veux publier", il ne dit pas "Je veux envoyer un socket"
  publishTournamentStarted(tournament: Tournament): Promise<void>;
}

```

### Étape 3 : L'Application (Les Cas d'Utilisation)

C'est le chef d'orchestre. Il traduit une intention utilisateur en manipulation de domaine.

**🧠 Questions à se poser :**

* *Quel est le scénario complet ? (Charger -> Modifier -> Sauvegarder -> Notifier)*
* *Est-ce que je dépend bien d'une Interface et non d'une Classe ?*

**Exemple de code (`application/use-cases/start-tournament.use-case.ts`) :**

```typescript
export class StartTournamentUseCase {
  constructor(
    private readonly repo: TournamentRepository, // Port
    private readonly publisher: EventPublisher   // Port
  ) {}

  async execute(tournamentId: string): Promise<void> {
    // 1. Récupération
    const tournament = await this.repo.findById(tournamentId);
    if (!tournament) throw new Error("Tournoi introuvable");

    // 2. Action Métier (C'est ici que les règles de l'étape 1 sont vérifiées)
    tournament.start();

    // 3. Persistance
    await this.repo.save(tournament);

    // 4. Notification (Effet de bord)
    await this.publisher.publishTournamentStarted(tournament);
  }
}

```

### Étape 4 : L'Infrastructure (Les Adaptateurs)

C'est ici que la technologie réelle (Postgres, Socket.io) est connectée.

#### A. Adaptateurs "Driven" (Sortie : Droite de l'hexagone)

Nous implémentons les interfaces définies à l'étape 2.

**Le Publisher WebSocket (`infrastructure/adapters/websocket.publisher.ts`) :**

```typescript
@Injectable()
export class WebsocketPublisher implements EventPublisher {
  constructor(private readonly gateway: TournamentGateway) {}

  async publishTournamentStarted(tournament: Tournament): Promise<void> {
    // Traduction : Objet Domaine -> Message Technique Socket
    this.gateway.server.to(`room_${tournament.id}`).emit('TOURNAMENT_STARTED', {
      id: tournament.id,
      status: tournament.status
    });
  }
}

```

#### B. Adaptateurs "Driving" (Entrée : Gauche de l'hexagone)

Ce sont les déclencheurs. Ils peuvent être REST ou WebSocket.

**Le Gateway WebSocket (`infrastructure/gateways/tournament.gateway.ts`) :**

```typescript
@WebSocketGateway()
export class TournamentGateway {
  @WebSocketServer() server: Server;

  constructor(private readonly startUseCase: StartTournamentUseCase) {}

  // Cas : Le client demande à démarrer le tournoi via WS
  @SubscribeMessage('start_tournament')
  async handleStart(@MessageBody() data: { id: string }) {
    await this.startUseCase.execute(data.id);
    return { status: 'success' };
  }
}

```

### Étape 5 : Le Wiring (Assemblage NestJS)

Nous utilisons le module pour dire à NestJS quelle implémentation utiliser pour quelle interface.

**Le Module (`infrastructure/tournament.module.ts`) :**

```typescript
@Module({
  controllers: [TournamentController],
  providers: [
    TournamentGateway,
    StartTournamentUseCase,
    // INJECTION DE DÉPENDANCE MANUELLE
    {
      provide: 'EventPublisher',      // Quand le UseCase demande 'EventPublisher'
      useClass: WebsocketPublisher    // NestJS lui donne 'WebsocketPublisher'
    },
    {
      provide: 'TournamentRepository',
      useClass: PostgresRepository
    }
  ]
})
export class TournamentModule {}

```

---

## 4. Focus : Gestion Complète des WebSockets

Les WebSockets sont particuliers car ils agissent des deux côtés de l'architecture.

### 4.1. Sens Entrant (Client -> Serveur)

* **Rôle :** Adaptateur Primaire (Driving).
* **Composant :** `@WebSocketGateway` avec `@SubscribeMessage`.
* **Responsabilité :** Recevoir le payload, valider le DTO, extraire l'ID utilisateur du socket, appeler le Use Case.
* **Interdiction :** Ne jamais mettre de logique métier ici.

### 4.2. Sens Sortant (Serveur -> Client)

* **Rôle :** Adaptateur Secondaire (Driven).
* **Composant :** Une classe qui implémente une interface du Domaine (ex: `EventPublisher`) et qui utilise le Gateway pour émettre.
* **Responsabilité :** Transformer l'événement métier en message JSON pour le client.

> **Le cycle vertueux :**
> Client (Socket) ➡️ Gateway (Adapter) ➡️ UseCase (App) ➡️ Entity (Domain) ➡️ Repository (Adapter) ➡️ Publisher (Adapter) ➡️ Gateway (Tech) ➡️ Client (Socket).

---

## 5. Stratégie de Tests

L'architecture hexagonale rend les tests extrêmement robustes.

| Type de Test | Ce qu'on teste | Outils | Complexité |
| --- | --- | --- | --- |
| **Unitaires (Domaine)** | Les règles métier (ex: `tournament.start()`). | Jest (Pur) | Très Faible (Pas de NestJS) |
| **Unitaires (Use Case)** | L'orchestration. On "Mock" les ports. | Jest + Mocks | Faible |
| **Intégration** | Les adaptateurs (ex: Le Repository écrit-il vraiment en base ?). | Jest + Docker DB | Moyenne |
| **E2E (End-to-End)** | La chaîne complète (HTTP -> DB). | Supertest | Haute |

**Exemple de Test de Use Case (Sans DB, Sans Socket) :**

```typescript
it('should start tournament and notify', async () => {
  // 1. Setup (Mocks)
  const mockRepo = { findById: jest.fn(), save: jest.fn() };
  const mockPub = { publishTournamentStarted: jest.fn() };
  const useCase = new StartTournamentUseCase(mockRepo, mockPub);

  // 2. Execution
  mockRepo.findById.mockResolvedValue(new Tournament('1', 'DRAFT', ['p1', 'p2']));
  await useCase.execute('1');

  // 3. Verification
  expect(mockRepo.save).toHaveBeenCalled(); // A-t-on sauvegardé ?
  expect(mockPub.publishTournamentStarted).toHaveBeenCalled(); // A-t-on notifié ?
});

```