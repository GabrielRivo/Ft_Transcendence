
CREATE TABLE IF NOT EXISTS game_stats (
    game_id INTEGER PRIMARY KEY AUTOINCREMENT,
    player1 INTEGER NOT NULL,
    player2 INTEGER NOT NULL,
    score_player1 INTEGER NOT NULL,
    score_player2 INTEGER NOT NULL,
    game_duration_in_seconde INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_stats (
    user_id INTEGER PRIMARY KEY,
    total_games INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    tournament_played INTEGER DEFAULT 0,
    tournament_won INTEGER DEFAULT 0,
    average_score INTEGER DEFAULT 0,
    average_game_duration_in_seconde INTEGER DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);