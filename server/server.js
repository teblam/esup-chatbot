require("dotenv").config();
const express = require('express');
const session = require('express-session');
const { authWithCredentials } = require("esup-multi.js");
const storage = require('./utils/storage');
const openaiService = require('./utils/openaiservice');
const path = require('path');
const mongoose = require('mongoose');

const app = express();
const port = 3000;

// Initialiser le serveur au démarrage
async function initServer() {
    try {
        // Attendre que la connexion MongoDB soit établie
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connexion à MongoDB établie');

        // Démarrer le serveur Express une fois la connexion établie
        app.listen(port, () => {
            console.log(`Serveur démarré sur http://localhost:${port}`);
        });
    } catch (error) {
        console.error("Erreur d'initialisation:", error);
        process.exit(1);
    }
}

// Configuration des sessions
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === 'production' }
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public'), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.js')) {
            res.set('Content-Type', 'application/javascript');
        }
        if (filePath.endsWith('.css')) {
            res.set('Content-Type', 'text/css');
        }
    }
}));

// Middleware d'authentification
const authMiddleware = async (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Non authentifié' });
    }
    next();
};

// Routes d'authentification
app.post('/api/register', async (req, res) => {
    try {
        const { username, password, uphfUsername, uphfPassword, preferredLanguage, preferredRestaurant } = req.body;
        const user = await storage.createUser({
            username,
            password,
            uphfUsername,
            uphfPassword,
            preferredLanguage,
            preferredRestaurant
        });
        res.json({ message: 'Utilisateur créé avec succès' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await storage.verifyUser(username, password);
        if (!user) {
            return res.status(401).json({ error: 'Identifiants invalides' });
        }
        req.session.userId = user.id;
        delete user.password;
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ message: 'Déconnecté avec succès' });
});

app.get('/api/me', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Non authentifié' });
    }
    try {
        const user = await storage.getUser(req.session.userId);
        if (!user) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Routes des conversations
app.post('/api/conversations', authMiddleware, async (req, res) => {
    try {
        const conversation = await storage.createConversation(req.session.userId);
        historique_messages = await openaiService.initierConversation(req.session.userId, storage);
        res.json(conversation);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.patch('/api/conversations/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { title } = req.body;
        
        // Vérifier que la conversation appartient à l'utilisateur
        const conversation = await storage.getConversation(id, req.session.userId);
        if (!conversation) {
            return res.status(403).json({ error: 'Conversation non autorisée' });
        }

        // Mettre à jour le titre
        const updatedConversation = await storage.updateConversationTitle(id, title);
        res.json(updatedConversation);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/conversations', authMiddleware, async (req, res) => {
    try {
        const conversations = await storage.getConversations(req.session.userId);
        res.json(conversations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/conversations/:id/messages', authMiddleware, async (req, res) => {
    try {
        const messages = await storage.getConversationMessages(req.params.id, req.session.userId);
        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/conversations/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Vérifier que la conversation appartient à l'utilisateur
        const conversation = await storage.getConversation(id, req.session.userId);
        if (!conversation) {
            return res.status(403).json({ error: 'Conversation non autorisée' });
        }

        // Supprimer la conversation et ses messages
        await storage.deleteConversation(id);
        res.json({ message: 'Conversation supprimée avec succès' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Création d'une instance unique pour l'utilisateur connecté
let globalUser;
let historique_messages;

async function login(instanceUrl, username, password) {
    try {
        const user = await authWithCredentials(instanceUrl, { username, password });
        return user;
    } catch (error) {
        console.error("Erreur lors de la connexion :", error);
        throw error;
    }
}

// Endpoint pour le chat
app.post('/api/chat', authMiddleware, async (req, res) => {
    try {
        const { message, conversationId } = req.body;
        const userId = req.session.userId;

        // Vérifier que la conversation appartient à l'utilisateur
        const conversation = await storage.getConversation(conversationId, userId);
        if (!conversation) {
            return res.status(403).json({ error: 'Conversation non autorisée' });
        }

        // Récupérer les messages existants
        const existingMessages = await storage.getConversationMessages(conversationId, userId);

        // Si c'est le premier message, mettre à jour le titre
        if (existingMessages.length === 0) {
            const title = message.length > 50 ? message.substring(0, 47) + '...' : message;
            await storage.updateConversationTitle(conversationId, title);
        }

        // Sauvegarder le message de l'utilisateur
        const userMessageSaved = await storage.addMessage(conversationId, 'user', message);

        // Initialiser l'historique des messages si ce n'est pas déjà fait
        if (!historique_messages) {
            historique_messages = await openaiService.initierConversation(userId, storage);
        }

        // Récupérer les identifiants UPHF de l'utilisateur
        const uphfCredentials = await storage.getUserUPHFCredentials(userId);
        
        // Se connecter avec les identifiants de l'utilisateur
        if (!globalUser || globalUser.username !== uphfCredentials.uphf_username) {
            globalUser = await login(
                "https://appmob.uphf.fr/backend",
                uphfCredentials.uphf_username,
                uphfCredentials.uphf_password
            );
        }

        // Traiter le message avec OpenAI et obtenir la réponse
        const aiResponse = await openaiService.processMessage(message, userId, historique_messages, globalUser, storage);

        // Sauvegarder la réponse du chatbot
        const aiMessageSaved = await storage.addMessage(conversationId, 'assistant', aiResponse);

        // Récupérer la conversation mise à jour si le titre a été modifié
        const updatedConversation = existingMessages.length === 0 
            ? await storage.getConversation(conversationId, userId)
            : conversation;

        // Renvoyer les messages et la conversation mise à jour
        res.json({
            messages: [userMessageSaved, aiMessageSaved],
            conversation: updatedConversation
        });
    } catch (error) {
        console.error('Erreur dans /api/chat:', error);
        res.status(500).json({ error: 'Une erreur est survenue' });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Initialiser le serveur
initServer();