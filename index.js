require("dotenv").config();
const { authWithCredentials } = require("esup-multi.js");
const readline = require('node:readline/promises');
const { stdin: input, stdout: output } = require('node:process');
const rl = readline.createInterface({ input, output });

const OpenAI = require("openai");
const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});

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
  ];

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: historique_messages,
    tools,
    tool_choice: "auto"
  });

  return completion;
}

async function main() {
  let user;

  try {
    user = await login("https://appmob.uphf.fr/backend", process.env.UPHF_USERNAME, process.env.UPHF_PASSWORD);
    console.log("Utilisateur connecté");
  } catch (error) {
    console.error("Impossible d'utiliser l'utilisateur :", error);
  }

  let historique_messages = [];
  let message_utilisateur = "";
  let actualites = "";
  let contacts = "";

  historique_messages.push({
    role: "developer",
    content: `Tu es un assistant qui rend service aux étudiants de l'Université Polytechnique des Hauts-de-France.
    Formate tes réponses dans un language simple, en utilisant des paragraphes.
    Utilise la fonction 'getActualities' lorsqu'un utilisateur veut obtenir les actualités de l'université.
    Utilise la fonction 'getContacts' lorsqu'un utilisateur veut obtenir le contact d'un membre de l'équipe pédagogique ou de l'administation de l'université.`
  });

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
            actualites = await user.getActualities();
            actualites = actualites.slice(0, 5);
            response = {
              role: "tool",
              content: JSON.stringify({ actualites }),
              tool_call_id: toolCall.id
            };
            break;
            
          case "getContacts":
            args = JSON.parse(toolCall.function.arguments);
            console.log(args.name);
            contacts = await user.getContacts({type:"STAFF", value: args.name});
            response = {
              role: "tool",
              content: JSON.stringify({ contacts }),
              tool_call_id: toolCall.id
            };
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


main();

