const OpenAI = require("openai");

if (!process.env.OPENAI_API_KEY) {
    throw new Error("La clé API OpenAI n'est pas définie dans le fichier .env");
}

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY.trim()
});

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

async function runConversation(historique_messages, userId) {
    const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini-2024-07-18",
        messages: historique_messages,
        tools,
        tool_choice: "auto"
    });

    return completion;
}

async function processMessage(message, userId, historique_messages, globalUser, storage) {
    try {
        const date_ajd = new Date().toJSON().slice(0, 10);
        
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

async function initierConversation(userId, storage) {
    // Récupérer les préférences de l'utilisateur
    const userPreferences = await storage.getUser(userId);
    const language = userPreferences.preferred_language;
    const preferredRestaurant = userPreferences.preferred_restaurant;
    const date_ajd = new Date().toJSON().slice(0, 10);

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

module.exports = {
    processMessage,
    initierConversation
}; 