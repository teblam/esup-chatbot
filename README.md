# ESUP Chatbot

Un chatbot intelligent pour les étudiants et le personnel des établissements d'enseignement supérieur (uniquement l'Université Polytechnique des Hauts-de-France pour l'instant), offrant des réponses instantanées aux questions concernant les cours, les restaurants universitaires, et d'autres services du campus.

**Note: ce programme est mis à disposition à titre expérimental: aucune garantie ne peut être fournie en termes de sécurité ou de stabilité quant à son utilisation, nous déconseillons la mise en production du projet sur un serveur ouvert à Internet.**

<img width="1380" height="867" alt="Image_PNG" src="https://github.com/user-attachments/assets/4949a06f-573f-45d5-88cd-c93f81304b7f" />

## Fonctionnalités

- **Interface moderne et responsive** avec thème clair/sombre
- **Historique des conversations** sauvegardé automatiquement
- **Suggestions prédéfinies** pour démarrer rapidement une conversation
- **Authentification sécurisée** des utilisateurs
- **Support du Markdown et des images** pour une mise en forme riche des réponses
- **Animations fluides** pour une meilleure expérience utilisateur
- **Gestion des rôles** et interface d'administration

<img width="1284" height="227" alt="Image_PNG2" src="https://github.com/user-attachments/assets/991cc6fd-0283-443f-8843-4349974c764b" />


## Technologies

- **Front-end**: React, Chakra UI, Framer Motion
- **Back-end**: Node.js, Express
- **Base de données**: MongoDB
- **API IA**: Intégration avec les modèles d'IA via une API externe

### Prérequis

- Node.js (v18+)
- npm
- Serveur MongoDB (local ou distant)
- Clé d'API OpenAI (non fournie)

### Installation et configuration

1. Clonez le dépôt:

   ```bash
   git clone https://github.com/teblam/esup-chatbot.git
   cd esup-chatbot
   ```

2. Installez les dépendances:

   ```bash
   npm run prep
   ```

3. Configurez les variables d'environnement:
   - Copiez le fichier `.env.example` en `.env`
   - Modifiez les variables selon votre configuration

4. Lancez l'application:

   ```bash
   npm run dev
   ```

## Architecture du projet

- `/client` - Application front-end React
  - `/src/components` - Composants UI réutilisables
  - `/src/contexts` - Contextes React (auth, conversations)
  - `/src/pages` - Pages principales de l'application

- `/server` - API backend Express

## Informations disponibles

- Consultation de l'emploi du temps
- Consultation du menu des restaurants universitaires
- Recherche d'informations de contact sur les professeurs et personnels de l'université
- Consultation des actualités de l'université

## Contribution

Les contributions sont les bienvenues!

---

Développé avec ❤️ par Corentin MALBET et Kyllian LEVENT
