require("dotenv").config();
const { authWithCredentials } = require("esup-multi.js");
const readline = require('node:readline/promises');
const { stdin: input, stdout: output } = require('node:process');
const rl = readline.createInterface({ input, output });

const OpenAI = require("openai");
const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});

const date_ajd = new Date().toJSON().slice(0, 10);

const language = "Français";

async function login(instanceUrl, username, password) {
  try {
      const user = await authWithCredentials(instanceUrl, { username, password });
      return user;
  } catch (error) {
      console.error("Erreur lors de la connexion :", error);
      throw error;
  }
}

async function runConversation(historique_messages) {
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
          required: [
              "name"
          ],
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
    model: "gpt-4o",
    messages: historique_messages,
    tools,
    tool_choice: "auto"
  });

  return completion;
}

async function initier_conversation() {
  const historique_messages = [];
  historique_messages.push({
    role: "developer",
    content: `Tu es un assistant qui rend service aux étudiants de l'Université Polytechnique des Hauts-de-France nommé "esup-chatbot".
    Formate tes réponses dans un language simple, en utilisant des paragraphes.
    Tu répondras aux questions posées par l'utilisateur uniquement dans la langue suivante : ${language} 
    Garde la conversation axée sur des thèmes liés a l'université ou aux disciplines universitaires en général. Ne réponds pas aux questions provocatrices, insultantes ou obscènes.
    Nous sommes le ${date_ajd}
    Utilise la fonction 'getActualities' lorsqu'un utilisateur veut obtenir les actualités de l'université.
    Utilise la fonction 'getContacts' lorsqu'un utilisateur veut obtenir le contact d'un membre de l'équipe pédagogique (administration et professeurs).
    Utilise la fonction 'getMenuRU' lorsqu'un utilisateur veut obtenir le menu d'un restaurant universitaire (seul le menu de la semaine en cours est disponible).
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
    Utilise la fonction 'getEDT' lorsqu'un utilisateur veut obtenir l'emploi du temps pour la semaine.`
  });
  return historique_messages;
}

async function loop(user) {
  let historique_messages = await initier_conversation();
  let message_utilisateur = "";
  let actualites = "";
  let contacts = "";

  while (true) {
    message_utilisateur = await rl.question("Quelle est votre question ? ");
    historique_messages.push({ role: "user", content: [{ type: "text", text: message_utilisateur }] });

    completion = await runConversation(historique_messages);
    
    if (completion.choices[0].message.tool_calls != null) {
      historique_messages.push(completion.choices[0].message);
      
      for (toolCall of completion.choices[0].message.tool_calls) {
        toolName = toolCall.function.name;
        let response;

        switch (toolName) {
          case "getActualities":
            try {
              actualites = await user.getActualities();
              actualites = actualites.slice(0, 5);
              response = {
                role: "tool",
                content: JSON.stringify({ actualites }),
                tool_call_id: toolCall.id
              };
            } catch (error) {
              console.error("Erreur lors de la récupération des actualités:", error);
              response = {
                role: "tool",
                content: JSON.stringify({ error: "Impossible de récupérer les actualités" }),
                tool_call_id: toolCall.id
              };
            }
            break;
            
          case "getContacts":
            try {
              args = JSON.parse(toolCall.function.arguments);
              console.log(args.name);
              contacts = await user.getContacts({type:"STAFF", value: args.name});
              response = {
                role: "tool",
                content: JSON.stringify({ contacts }),
                tool_call_id: toolCall.id
              };
            } catch (error) {
              console.error("Erreur lors de la recherche des contacts:", error);
              response = {
                role: "tool",
                content: JSON.stringify({ error: "Impossible de récupérer les contacts" }),
                tool_call_id: toolCall.id
              };
            }
            break;

          case "getMenuRU":
            try {
              args = JSON.parse(toolCall.function.arguments);
              menu_restaurant = await user.getRestaurantMenu(args.id);
              menu_restaurant_formate = [];
              menu_restaurant.forEach(menu => {
                if(date_ajd < menu.date){
                  menu_restaurant_formate.push(`${menu.date}, ${JSON.stringify(menu.meal)}`);
                }
              });
              response = {
                role: "tool",
                content: JSON.stringify({ menu_restaurant_formate }),
                tool_call_id: toolCall.id
              };
            } catch (error) {
              console.error("Erreur lors de la récupération du menu:", error);
              response = {
                role: "tool",
                content: JSON.stringify({ error: "Impossible de récupérer le menu du restaurant" }),
                tool_call_id: toolCall.id
              };
            }
            break;  

          case "getEDT":
            try {
              const date_fin = new Date();
              date_fin.setDate(date_fin.getDate() + 7);
              const date_fin_formatee = date_fin.toJSON().slice(0, 10);
              schedules = await user.getSchedules({startDate: date_ajd, endDate: date_fin_formatee});
          
              emploiDuTemps = schedules.plannings.map(planning => {
                return {
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
                };
              });
              response = {
                role: "tool",
                content: JSON.stringify({ emploiDuTemps }),
                tool_call_id: toolCall.id
              };
            } catch (error) {
              console.error("Erreur lors de la récupération de l'emploi du temps:", error);
              response = {
                role: "tool",
                content: JSON.stringify({ error: "Impossible de récupérer l'emploi du temps" }),
                tool_call_id: toolCall.id
              };
            }
            break;
        }

        if (response) {
          historique_messages.push(response);
        }
      }

      followUp = await runConversation(historique_messages);
      if (followUp.choices[0].message.content) {
        console.log(followUp.choices[0].message.content);
        historique_messages.push({
          role: "assistant",
          content: followUp.choices[0].message.content
        });
      }
    } else if (completion.choices[0].message.content) {
      console.log(completion.choices[0].message.content);
      historique_messages.push({ role: "assistant", content: completion.choices[0].message.content });
    }
  }
}

async function main() {
  let user;
  try {
    user = await login("https://appmob.uphf.fr/backend", process.env.UPHF_USERNAME, process.env.UPHF_PASSWORD);
    console.log("Utilisateur connecté");
    await loop(user);
  } catch (error) {
    console.error("Erreur de connexion :", error);
    process.exit(1);
  }
}

main();

