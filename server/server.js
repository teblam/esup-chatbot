require("dotenv").config();
const express = require('express');
const session = require('express-session');
const { authWithCredentials } = require("esup-multi.js");
const OpenAI = require("openai");
const storage = require('./utils/storage');
const path = require('path');

const app = express();
const port = 3000;

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
        historique_messages = await initier_conversation(req.session.userId);
        res.json(conversation);
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

// Création de l'instance OpenAI avec vérification explicite de la clé
if (!process.env.OPENAI_API_KEY) {
    throw new Error("La clé API OpenAI n'est pas définie dans le fichier .env");
}

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY.trim()
});

const date_ajd = new Date().toJSON().slice(0, 10);
const language = "Français";

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

// Initialisation au démarrage du serveur
async function initServer() {
    try {
        console.log("Serveur initialisé avec succès");
    } catch (error) {
        console.error("Erreur d'initialisation:", error);
        process.exit(1);
    }
}

async function initier_conversation(userId) {
  // Récupérer les préférences de l'utilisateur
  const userPreferences = await storage.getUser(userId);
  const language = userPreferences.preferred_language;
  const preferredRestaurant = userPreferences.preferred_restaurant;

  const historique_messages = [];
  historique_messages.push({
    role: "developer",
    content: `Tu es un assistant qui rend service aux étudiants de l'Université Polytechnique des Hauts-de-France nommé "esup-chatbot".
    Formate tes réponses dans un language simple, en utilisant des paragraphes.
    Tu répondras aux questions posées par l'utilisateur uniquement dans la langue suivante : ${language}.
    Nous sommes le ${date_ajd}
    Utilise la fonction 'getActualities' lorsqu'un utilisateur veut obtenir les actualités de l'université.
    Utilise la fonction 'getContacts' lorsqu'un utilisateur veut obtenir le contact d'un membre de l'équipe pédagogique (administration et professeurs).
    Utilise la fonction 'getMenuRU' lorsqu'un utilisateur veut obtenir le menu d'un restaurant universitaire (seul le menu de la semaine en cours est disponible).
    Si l'utilisateur ne précise pas de restaurant spécifique, utilise son restaurant favori qui est le ${preferredRestaurant}.
    Les IDs des restaurants sont :
    - 1184 : Restaurant Universitaire Ronzier
    - 1165 : Restaurant Universitaire Rambouillet
    - 1175 : Cafétéria IUT
    - 1176 : Cafétéria Matisse
    - 1182 : Mont Houy 1
    - 1183 : Mont Houy 2
    - 1188 : Cafétéria Mousseron
    - 1265 : Cafétéria Mont Houy 1
    - 1773 : Cafétéria Mont Houy 2
    - 1689 : RU Rubika
    Ne précise pas si des plats ne sont pas communiqués pour certains jours.
    Utilise la fonction 'getEDT' lorsqu'un utilisateur veut obtenir l'emploi du temps pour la semaine.`
  });
  return historique_messages;
}

async function runConversation(historique_messages, userId) {
  const tools = [
    {
      type: "function",
      function: {
        name: "getActualities",
        description: "Obtenir les dernières actualités de l'université.",
      },
    },
    {
      type: "function",
      function: {
        name: "getContacts",
        description: "Permet d'obtenir des informations utiles sur un contact.",
        strict: true,
        parameters: {
          type: "object",
          properties: {
              name: {
                  "type": "string",
                  "description": "Le nom et/ou prénom de la personne recherchée"
              }
          },
          additionalProperties: false,
          required: ["name"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "getMenuRU",
        description: "Permet d'obtenir le menu de la semaine pour un restaurant universitaire.",
        strict: true,
        parameters: {
          type: "object",
          properties: {
              id: {
                  "type": "string",
                  "description": "L'ID du Restaurant Universitaire"
              }
          },
          additionalProperties: false,
          required: ["id"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "getEDT",
        description: "Obtenir l'emploi du temps pour la semaine.",
      },
    },
  ];

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini-2024-07-18",
    messages: historique_messages,
    tools,
    tool_choice: "auto"
  });

  return completion;
}

async function processMessage(message, userId) {
    try {
        // Ajout du message utilisateur à l'historique
        historique_messages.push({ 
            role: "user", 
            content: [{ type: "text", text: message }] 
        });

        // Obtenir la réponse initiale
        let completion = await runConversation(historique_messages, userId);
        
        // Si l'assistant demande d'utiliser des outils
        if (completion.choices[0].message.tool_calls) {
            historique_messages.push(completion.choices[0].message);
            
            // Traiter chaque appel d'outil
            for (const toolCall of completion.choices[0].message.tool_calls) {
                const toolName = toolCall.function.name;
                let response;

                // Exécuter l'outil approprié
                switch (toolName) {
                    case "getActualities":
                        const actualites = await globalUser.getActualities();
                        response = {
                            role: "tool",
                            content: JSON.stringify({ actualites: actualites.slice(0, 5) }),
                            tool_call_id: toolCall.id
                        };
                        break;

                    case "getContacts":
                        const args = JSON.parse(toolCall.function.arguments);
                        const contacts = await globalUser.getContacts({type:"STAFF", value: args.name});
                        response = {
                            role: "tool",
                            content: JSON.stringify({ contacts }),
                            tool_call_id: toolCall.id
                        };
                        break;

                    case "getMenuRU":
                        const menuArgs = JSON.parse(toolCall.function.arguments);
                        const userPreferences = await storage.getUser(userId);
                        const restaurantId = menuArgs.id || userPreferences.preferred_restaurant;
                        const menu_restaurant = await globalUser.getRestaurantMenu(restaurantId);
                        const menu_restaurant_formate = menu_restaurant
                            .filter(menu => date_ajd < menu.date)
                            .map(menu => `${menu.date}, ${JSON.stringify(menu.meal)}`);
                        response = {
                            role: "tool",
                            content: JSON.stringify({ menu_restaurant_formate }),
                            tool_call_id: toolCall.id
                        };
                        break;

                    case "getEDT":
                        const date_fin = new Date();
                        date_fin.setDate(date_fin.getDate() + 7);
                        const date_fin_formatee = date_fin.toJSON().slice(0, 10);
                        const schedules = await globalUser.getSchedules({
                            startDate: date_ajd, 
                            endDate: date_fin_formatee
                        });
                        const emploiDuTemps = schedules.plannings.map(planning => ({
                            nom: planning.label,
                            cours: planning.events
                                .filter(event => new Date(event.startDateTime) > new Date())
                                .map(event => ({
                                    date: event.startDateTime,
                                    debut: event.startDateTime,
                                    fin: event.endDateTime,
                                    matiere: event.course.label,
                                    type: event.course.type,
                                    salle: event.rooms[0]?.label || "Non définie",
                                    professeurs: event.teachers.map(teacher => teacher.displayname),
                                    groupes: event.groups.map(group => group.label)
                                }))
                                .sort((a, b) => new Date(a.debut) - new Date(b.debut))
                        }));
                        response = {
                            role: "tool",
                            content: JSON.stringify({ emploiDuTemps }),
                            tool_call_id: toolCall.id
                        };
                        break;
                }

                if (response) {
                    historique_messages.push(response);
                }
            }

            // Obtenir la réponse finale après l'utilisation des outils
            completion = await runConversation(historique_messages, userId);
        }

        // Ajouter la réponse à l'historique
        const reponseFinale = completion.choices[0].message.content;
        historique_messages.push({ 
            role: "assistant", 
            content: reponseFinale 
        });

        return reponseFinale;

    } catch (error) {
        console.error("Erreur dans processMessage:", error);
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

        // Initialiser l'historique des messages si ce n'est pas déjà fait
        if (!historique_messages) {
            historique_messages = await initier_conversation(userId);
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

        // Sauvegarder le message de l'utilisateur
        await storage.addMessage(conversationId, 'user', message);

        // Traiter le message avec OpenAI et obtenir la réponse
        const response = await processMessage(message, userId);

        // Sauvegarder la réponse du chatbot
        await storage.addMessage(conversationId, 'assistant', response);

        res.json({ response });
    } catch (error) {
        console.error('Erreur dans /api/chat:', error);
        res.status(500).json({ error: 'Une erreur est survenue' });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Initialiser le serveur au démarrage
initServer();

app.listen(port, () => {
    console.log(`Serveur démarré sur http://localhost:${port}`);
});