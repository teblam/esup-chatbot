const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');

// Créer le dossier data s'il n'existe pas
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
    console.log('Création du dossier data...');
    fs.mkdirSync(dataDir);
}

console.log('Connexion à la base de données SQLite...');
const db = new sqlite3.Database(path.join(dataDir, 'database.db'), (err) => {
    if (err) {
        console.error('Erreur de connexion à la base de données:', err);
    } else {
        console.log('Connexion à la base de données réussie');
    }
});

// Initialiser la base de données
console.log('Initialisation des tables...');
db.serialize(() => {
    // Table utilisateurs
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        uphf_username TEXT NOT NULL,
        uphf_password TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        preferred_language TEXT DEFAULT 'fr',
        preferred_restaurant TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) {
            console.error('Erreur création table users:', err);
        } else {
            console.log('Table users créée/vérifiée avec succès');
        }
    });

    // Table conversations avec lien vers l'utilisateur
    db.run(`CREATE TABLE IF NOT EXISTS conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )`, (err) => {
        if (err) {
            console.error('Erreur création table conversations:', err);
        } else {
            console.log('Table conversations créée/vérifiée avec succès');
        }
    });

    db.run(`CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversation_id INTEGER,
        role TEXT,
        content TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id)
    )`, (err) => {
        if (err) {
            console.error('Erreur création table messages:', err);
        } else {
            console.log('Table messages créée/vérifiée avec succès');
        }
    });
});

const storage = {
    async userExists(username) {
        return new Promise((resolve, reject) => {
            db.get('SELECT COUNT(*) as count FROM users WHERE username = ?', [username], (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(row.count > 0);
            });
        });
    },

    async createUser(userData) {
        const { username, password, uphfUsername, uphfPassword, preferredLanguage, preferredRestaurant } = userData;
        
        // Vérifier si l'utilisateur existe déjà
        const exists = await this.userExists(username);
        if (exists) {
            throw new Error('Cet utilisateur existe déjà');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        return new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO users (username, password, uphf_username, uphf_password, preferred_language, preferred_restaurant) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [username, hashedPassword, uphfUsername, uphfPassword, preferredLanguage, preferredRestaurant],
                function(err) {
                    if (err) {
                        console.error('Erreur création utilisateur:', err);
                        reject(err);
                        return;
                    }
                    console.log('Utilisateur créé avec succès:', username);
                    resolve({ id: this.lastID, username });
                }
            );
        });
    },

    async verifyUser(username, password) {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
                try {
                    if (err) {
                        reject(err);
                        return;
                    }
                    if (!user) {
                        resolve(null);
                        return;
                    }
                    const match = await bcrypt.compare(password, user.password);
                    resolve(match ? user : null);
                } catch (error) {
                    reject(error);
                }
            });
        });
    },

    async getUser(userId) {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM users WHERE id = ?', [userId], (err, user) => {
                if (err) reject(err);
                if (user) delete user.password;
                resolve(user);
            });
        });
    },

    async getUserUPHFCredentials(userId) {
        return new Promise((resolve, reject) => {
            db.get('SELECT uphf_username, uphf_password FROM users WHERE id = ?', [userId], (err, credentials) => {
                if (err) reject(err);
                resolve(credentials);
            });
        });
    },

    async createConversation(userId, title = 'Nouvelle conversation') {
        return new Promise((resolve, reject) => {
            const now = new Date().toISOString();
            db.run(
                'INSERT INTO conversations (user_id, title, created_at) VALUES (?, ?, ?)', 
                [userId, title, now], 
                function(err) {
                    if (err) {
                        reject(err);
                        return;
                    }
                    // Récupérer la conversation complète après création
                    db.get(
                        'SELECT * FROM conversations WHERE id = ?',
                        [this.lastID],
                        (err, conversation) => {
                            if (err) {
                                reject(err);
                                return;
                            }
                            resolve(conversation);
                        }
                    );
                }
            );
        });
    },

    async getConversations(userId) {
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM conversations WHERE user_id = ? ORDER BY created_at DESC', 
                [userId], 
                (err, rows) => {
                    if (err) reject(err);
                    resolve(rows);
                }
            );
        });
    },

    async getConversationMessages(conversationId, userId) {
        return new Promise((resolve, reject) => {
            db.all(`SELECT m.* FROM messages m 
                    JOIN conversations c ON m.conversation_id = c.id 
                    WHERE c.id = ? AND c.user_id = ? 
                    ORDER BY m.created_at ASC`, 
                [conversationId, userId], 
                (err, rows) => {
                    if (err) reject(err);
                    resolve(rows);
                }
            );
        });
    },

    async addMessage(conversationId, role, content, created_at = new Date().toISOString()) {
        return new Promise((resolve, reject) => {
            db.run('INSERT INTO messages (conversation_id, role, content, created_at) VALUES (?, ?, ?, ?)',
                [conversationId, role, content, created_at], 
                function(err) {
                    if (err) reject(err);
                    resolve({ 
                        id: this.lastID, 
                        conversation_id: conversationId, 
                        role, 
                        content,
                        created_at
                    });
                }
            );
        });
    },

    async getConversation(conversationId, userId) {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM conversations WHERE id = ? AND user_id = ?', 
                [conversationId, userId], 
                (err, conversation) => {
                    if (err) reject(err);
                    resolve(conversation);
                }
            );
        });
    },

    async updateConversationTitle(conversationId, title) {
        return new Promise((resolve, reject) => {
            db.run('UPDATE conversations SET title = ? WHERE id = ?',
                [title, conversationId],
                function(err) {
                    if (err) reject(err);
                    resolve({ id: conversationId, title });
                }
            );
        });
    },

    async deleteConversation(conversationId) {
        return new Promise((resolve, reject) => {
            // Commencer une transaction pour s'assurer que tout est supprimé
            db.serialize(() => {
                db.run('BEGIN TRANSACTION');
                
                // Supprimer d'abord les messages
                db.run('DELETE FROM messages WHERE conversation_id = ?', [conversationId], (err) => {
                    if (err) {
                        db.run('ROLLBACK');
                        reject(err);
                        return;
                    }
                    
                    // Puis supprimer la conversation
                    db.run('DELETE FROM conversations WHERE id = ?', [conversationId], (err) => {
                        if (err) {
                            db.run('ROLLBACK');
                            reject(err);
                            return;
                        }
                        
                        db.run('COMMIT', (err) => {
                            if (err) {
                                db.run('ROLLBACK');
                                reject(err);
                                return;
                            }
                            resolve();
                        });
                    });
                });
            });
        });
    }
};

module.exports = storage; 