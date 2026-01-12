
CREATE TABLE IF NOT EXISTS game_stats (
    game_id INTEGER PRIMARY KEY AUTOINCREMENT,
    player1 INTEGER NOT NULL,
    player2 INTEGER NOT NULL,
    score_player1 INTEGER NOT NULL,
    score_player2 INTEGER NOT NULL,
    game_duration_in_seconde INTEGER NOT NULL,
    -- Is tournament?
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_stats (
    user_id INTEGER PRIMARY KEY,
    total_games INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    -- une verif pour les match de tournois
    tournament_played INTEGER DEFAULT 0,
    tournament_won INTEGER DEFAULT 0,
    average_score INTEGER DEFAULT 0,
    average_game_duration_in_seconde INTEGER DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO user_stats (user_id, total_games, wins, losses) 
VALUES (1, 0, 0, 0), (2, 0, 0, 0), (3, 0, 0, 0);

CREATE TABLE IF NOT EXISTS tournament (
    tournament_id INTEGER PRIMARY KEY AUTOINCREMENT,
    players_number INTEGER NOT NULL,
    -- rajouter la player list?
    -- rajouter la tournament match list 
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)

CREATE TABLE IF NOT EXISTS tournament_match (
    tournament_id INTEGER NOT NULL,
    game_id INTEGER PRIMARY KEY AUTOINCREMENT,
    player1 INTEGER NOT NULL,
    player2 INTEGER NOT NULL,
    score_player1 INTEGER NOT NULL,
    score_player2 INTEGER NOT NULL,
    game_duration_in_seconde INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)

CREATE TABLE IF NOT EXISTS game_history (
    game_id INTEGER PRIMARY KEY AUTOINCREMENT,
    player1_id INTEGER NOT NULL,
    player2_id INTEGER NOT NULL,
    score_player1 INTEGER NOT NULL,
    score_player2 INTEGER NOT NULL,
    winner_id INTEGER,
    duration_seconds INTEGER NOT NULL,
    -- rajouter un controlle pour l'id tournois
    game_type TEXT CHECK(game_type IN ('ranked', 'tournament')) DEFAULT 'ranked',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player1_id) REFERENCES user_stats(user_id),
    FOREIGN KEY (player2_id) REFERENCES user_stats(user_id)
);

