# ESUP Chatbot

Un chatbot intelligent pour les étudiants et le personnel des établissements d'enseignement supérieur (uniquement l'Université Polytechnique des Hauts-de-France pour l'instant), offrant des réponses instantanées aux questions concernant les cours, les restaurants universitaires, et d'autres services du campus.

## Fonctionnalités

- **Interface moderne et responsive** avec thème clair/sombre
- **Historique des conversations** sauvegardé automatiquement
- **Suggestions prédéfinies** pour démarrer rapidement une conversation
- **Authentification sécurisée** des utilisateurs
- **Support Markdown** pour une mise en forme riche des réponses
- **Animations fluides** pour une meilleure expérience utilisateur

## Technologies

- **Front-end**: React, Chakra UI, Framer Motion
- **Back-end**: Node.js, Express
- **Base de données**: MongoDB (pour le stockage des conversations et utilisateurs)
- **API IA**: Intégration avec les modèles d'IA via une API externe

### Prérequis

- Node.js (v18+)
- npm ou yarn
- MongoDB (local ou distant)

### Installation et configuration

1. Clonez le dépôt:
   ```
   git clone https://github.com/teblam/esup-chatbot.git
   cd esup-chatbot
   ```

2. Installez les dépendances:
   ```
   npm run prep
   ```

3. Configurez les variables d'environnement:
   - Copiez le fichier `.env.example` en `.env`
   - Modifiez les variables selon votre configuration

4. Lancez l'application:
   ```

   npm run dev
   ```

## Architecture du projet

- `/client` - Application front-end React
  - `/src/components` - Composants UI réutilisables
  - `/src/contexts` - Contextes React (auth, conversations)
  - `/src/pages` - Pages principales de l'application

- `/server` - API backend Express

### Interface principale

- **Barre latérale**: Accès à l'historique des conversations et aux paramètres
- **Barre supérieure**: Changer entre thème clair/sombre et se déconnecter
- **Zone principale**: Interface de chat avec l'assistant

### Créer une nouvelle conversation

1. Cliquez sur "Nouvelle conversation" dans la barre latérale
2. Saisissez votre question ou sélectionnez une suggestion
3. Le chatbot répondra instantanément à votre demande

## Fonctionnalités détaillées

### Suggestions intelligentes

Le chatbot propose des suggestions contextuelles basées sur les cas d'utilisation courants des étudiants:
- Consulter l'emploi du temps
- Vérifier les menus du restaurant universitaire


### Thème personnalisable

- **Mode clair**: Parfait pour une utilisation en journée
- **Mode sombre**: Réduit la fatigue oculaire en conditions de faible luminosité
- **Mode système**: S'adapte automatiquement aux préférences de votre appareil

### Animations fluides

L'interface utilise Framer Motion pour offrir:
- Animations des messages entrants et sortants
- Transitions douces entre les écrans
- Retours visuels lors des interactions


## Contribution

Les contributions sont les bienvenues! 

---

Développé avec ❤️ par Corentin MALBET et Kyllian LEVENT