# 🎮 Board Game Arena - Roadmap de Développement

## Légende
- [ ] À faire
- [x] Terminé
- 🔴 Bloquant (doit être fait avant de continuer)
- 🟡 Important
- 🟢 Bonus (peut être fait plus tard)

---

## Phase 1: Setup Initial du Projet 🔴

### 1.1 Structure de Base
- [x] Créer la structure de dossiers (monorepo)
- [x] Initialiser le projet racine avec package.json
- [x] Configurer .gitignore
- [x] Créer README.md principal

### 1.2 Setup Backend (Server)
- [x] Initialiser le projet Node.js dans `/server`
- [x] Installer les dépendances principales (Express, Socket.io, Mongoose, etc.)
- [x] Configurer TypeScript (tsconfig.json)
- [x] Créer le fichier d'entrée `/server/src/index.ts`
- [x] Configurer les variables d'environnement (.env)
- [x] Configurer nodemon pour le hot-reload

### 1.3 Setup Frontend (Client)
- [x] Initialiser le projet React avec Vite dans `/client`
- [x] Installer les dépendances (Socket.io-client, Zustand, Axios)
- [x] Configurer Tailwind CSS
- [x] Configurer TypeScript (tsconfig.json)
- [x] Créer la structure de dossiers (components, stores, services, etc.)
- [x] Créer un composant App.tsx de base

---

## Phase 2: Base de Données et Modèles 🔴

### 2.1 Configuration MongoDB
- [x] Installer MongoDB localement OU configurer MongoDB Atlas
- [x] Créer le fichier `/server/src/config/database.ts`
- [x] Tester la connexion à la base de données

### 2.2 Modèles Mongoose
- [x] Créer le modèle User (`/server/src/models/User.ts`)
- [x] Créer le modèle Room (`/server/src/models/Room.ts`)
- [x] Créer le modèle GameState (`/server/src/models/GameState.ts`)
- [x] Tester les modèles avec des données fictives

---

## Phase 3: Authentification 🔴

### 3.1 Backend - API d'Authentification
- [x] Créer les utilitaires JWT (`/server/src/utils/jwt.ts`)
- [x] Créer le middleware d'authentification (`/server/src/middleware/auth.middleware.ts`)
- [x] Créer les routes d'authentification (`/server/src/routes/auth.routes.ts`)
  - [x] POST `/api/auth/register` (inscription)
  - [x] POST `/api/auth/login` (connexion)
  - [x] GET `/api/auth/me` (profil utilisateur)
- [x] Hasher les mots de passe avec bcrypt
- [x] Tester les endpoints avec Postman/Insomnia

### 3.2 Frontend - Pages d'Authentification
- [x] Créer le store Zustand pour l'auth (`/client/src/stores/authStore.ts`)
- [x] Créer le service API (`/client/src/services/api.ts`)
- [x] Créer le composant Login (`/client/src/components/auth/Login.tsx`)
- [x] Créer le composant Register (`/client/src/components/auth/Register.tsx`)
- [x] Créer le hook useAuth (`/client/src/hooks/useAuth.ts`)
- [x] Implémenter la persistance du token (localStorage)
- [ ] Créer un ProtectedRoute pour les routes authentifiées

### 3.3 Intégration et Tests
- [x] Tester l'inscription d'un utilisateur
- [x] Tester la connexion
- [x] Tester la persistance (rafraîchir la page)
- [x] Tester la déconnexion

---

## Phase 4: Système de Rooms (Salons) 🔴

### 4.1 Backend - API des Rooms
- [x] Créer les utilitaires de génération de code (`/server/src/utils/roomCode.ts`)
- [x] Créer les routes des rooms (`/server/src/routes/room.routes.ts`)
  - [x] POST `/api/rooms` (créer un salon)
  - [x] GET `/api/rooms` (liste des salons publics)
  - [x] GET `/api/rooms/:code` (infos d'un salon)
  - [x] DELETE `/api/rooms/:code` (supprimer un salon - host uniquement)
- [x] Tester les endpoints

### 4.2 Frontend - Interface des Rooms
- [x] Créer le store Zustand pour les rooms (`/client/src/stores/roomStore.ts`)
- [x] Créer le composant Lobby (`/client/src/components/lobby/Lobby.tsx`)
- [x] Créer le composant CreateRoomModal (`/client/src/components/lobby/CreateRoomModal.tsx`)
- [x] Créer le composant JoinRoomModal (`/client/src/components/lobby/JoinRoomModal.tsx`)
- [x] Créer le composant RoomCard (`/client/src/components/lobby/RoomCard.tsx`)
- [x] Implémenter la création de salon
- [x] Implémenter la recherche de salon par code

---

## Phase 5: WebSocket et Temps Réel 🔴

### 5.1 Backend - Configuration Socket.io
- [ ] Créer le setup Socket.io (`/server/src/socket/index.ts`)
- [ ] Créer le middleware d'authentification Socket (`/server/src/socket/auth.socket.ts`)
- [ ] Créer le handler de room (`/server/src/socket/handlers/room.handler.ts`)
  - [ ] Événement `room:join` (rejoindre un salon)
  - [ ] Événement `room:leave` (quitter un salon)
  - [ ] Événement `disconnect` (déconnexion)
  - [ ] Événement `room:reconnect` (reconnexion)
- [ ] Intégrer Socket.io avec Express

### 5.2 Frontend - Client Socket.io
- [ ] Créer le service Socket.io (`/client/src/services/socket.ts`)
- [ ] Connecter le socket à l'authentification (envoyer le JWT)
- [ ] Créer le composant WaitingRoom (`/client/src/components/room/WaitingRoom.tsx`)
- [ ] Afficher la liste des joueurs en temps réel
- [ ] Implémenter les notifications (joueur rejoint/quitte)
- [ ] Créer le hook useRoom (`/client/src/hooks/useRoom.ts`)

### 5.3 Tests d'Intégration Temps Réel
- [ ] Tester avec 2 navigateurs : créer un salon et le rejoindre
- [ ] Vérifier que les joueurs s'affichent en temps réel
- [ ] Tester la déconnexion/reconnexion
- [ ] Tester le système de timeout (60 secondes)

---

## Phase 6: Architecture de Jeu (Game Logic) 🔴

### 6.1 Interface et Structure
- [ ] Créer l'interface IGameManager (`/server/src/games/GameManager.interface.ts`)
- [ ] Créer le fichier index (`/server/src/games/index.ts`)
- [ ] Créer les types partagés (`/server/src/types/game.types.ts`)

### 6.2 Backend - Handler de Jeu
- [ ] Créer le handler de jeu (`/server/src/socket/handlers/game.handler.ts`)
  - [ ] Événement `game:start` (démarrer la partie)
  - [ ] Événement `game:action` (action de jeu)
  - [ ] Événement `game:end` (terminer la partie)
- [ ] Implémenter la validation des actions
- [ ] Implémenter le système d'historique

### 6.3 Frontend - Store de Jeu
- [ ] Créer le store Zustand pour le jeu (`/client/src/stores/gameStore.ts`)
- [ ] Créer le hook useGame (`/client/src/hooks/useGame.ts`)
- [ ] Gérer les mises à jour en temps réel

---

## Phase 7: Premier Jeu - Perudo 🟡

### 7.1 Backend - Logique Perudo
- [ ] Créer les types Perudo (`/server/src/games/perudo/perudo.types.ts`)
- [ ] Créer PerudoManager (`/server/src/games/perudo/PerudoManager.ts`)
  - [ ] Implémenter `initGame()` (initialiser la partie)
  - [ ] Implémenter `validateAction()` (valider les actions)
  - [ ] Implémenter `executeAction()` (exécuter les actions)
    - [ ] Action: ROLL_DICE
    - [ ] Action: BID
    - [ ] Action: CALL_BLUFF
  - [ ] Implémenter `getPublicState()` (état visible par tous)
  - [ ] Implémenter `getPrivateData()` (dés du joueur)
  - [ ] Implémenter `checkWinCondition()` (vérifier la victoire)
- [ ] Tester la logique avec des cas de test

### 7.2 Frontend - Interface Perudo
- [ ] Créer le composant PerudoBoard (`/client/src/components/games/perudo/PerudoBoard.tsx`)
- [ ] Créer le composant DiceDisplay (`/client/src/components/games/perudo/DiceDisplay.tsx`)
- [ ] Créer le composant BidControls (`/client/src/components/games/perudo/BidControls.tsx`)
- [ ] Créer le composant PlayerList (`/client/src/components/games/perudo/PlayerList.tsx`)
- [ ] Implémenter l'affichage des dés du joueur
- [ ] Implémenter le système d'enchères (UI)
- [ ] Implémenter le bouton "Menteur!" (Call Bluff)
- [ ] Afficher l'historique des actions

### 7.3 Tests Perudo
- [ ] Tester une partie complète avec 2 joueurs
- [ ] Tester une partie avec 4+ joueurs
- [ ] Tester tous les cas limites (1 dé restant, égalité, etc.)
- [ ] Tester la révélation des dés après "Menteur!"

---

## Phase 8: Système d'Amis 🟡

### 8.1 Backend - API Amis
- [ ] Créer les routes utilisateur (`/server/src/routes/user.routes.ts`)
  - [ ] POST `/api/users/friends/request` (envoyer une demande d'ami)
  - [ ] POST `/api/users/friends/accept/:requestId` (accepter une demande)
  - [ ] POST `/api/users/friends/reject/:requestId` (refuser une demande)
  - [ ] GET `/api/users/friends` (liste des amis)
  - [ ] DELETE `/api/users/friends/:friendId` (supprimer un ami)
- [ ] Implémenter les notifications en temps réel (Socket.io)

### 8.2 Frontend - Interface Amis
- [ ] Créer le composant FriendsList (`/client/src/components/friends/FriendsList.tsx`)
- [ ] Créer le composant AddFriendModal (`/client/src/components/friends/AddFriendModal.tsx`)
- [ ] Créer le composant FriendRequests (`/client/src/components/friends/FriendRequests.tsx`)
- [ ] Afficher le statut en ligne des amis
- [ ] Permettre d'inviter un ami dans un salon

---

## Phase 9: Deuxième Jeu - Codenames 🟢

### 9.1 Backend - Logique Codenames
- [ ] Créer les types Codenames (`/server/src/games/codenames/codenames.types.ts`)
- [ ] Créer CodenamesManager (`/server/src/games/codenames/CodenamesManager.ts`)
  - [ ] Implémenter `initGame()` (grille de 25 mots)
  - [ ] Implémenter la sélection des espions (spymasters)
  - [ ] Implémenter les actions (donner un indice, choisir un mot)
  - [ ] Implémenter la logique d'équipes (Rouge vs Bleu)
  - [ ] Implémenter la condition de victoire
- [ ] Créer une base de données de mots

### 9.2 Frontend - Interface Codenames
- [ ] Créer le composant CodenamesBoard (`/client/src/components/games/codenames/CodenamesBoard.tsx`)
- [ ] Créer le composant WordGrid (`/client/src/components/games/codenames/WordGrid.tsx`)
- [ ] Créer le composant SpymasterView (`/client/src/components/games/codenames/SpymasterView.tsx`)
- [ ] Créer le composant ClueInput (`/client/src/components/games/codenames/ClueInput.tsx`)
- [ ] Implémenter la vue différenciée (espion vs joueur)
- [ ] Afficher le score des équipes

---

## Phase 10: Troisième Jeu - Quiz 🟢

### 10.1 Backend - Logique Quiz
- [ ] Créer les types Quiz (`/server/src/games/quiz/quiz.types.ts`)
- [ ] Créer QuizManager (`/server/src/games/quiz/QuizManager.ts`)
  - [ ] Implémenter `initGame()` (charger les questions)
  - [ ] Implémenter le système de tours (question par question)
  - [ ] Implémenter le système de points
  - [ ] Implémenter le chronomètre (temps limité par question)
- [ ] Créer une base de données de questions (API externe ou JSON)

### 10.2 Frontend - Interface Quiz
- [ ] Créer le composant QuizBoard (`/client/src/components/games/quiz/QuizBoard.tsx`)
- [ ] Créer le composant Question (`/client/src/components/games/quiz/Question.tsx`)
- [ ] Créer le composant AnswerButtons (`/client/src/components/games/quiz/AnswerButtons.tsx`)
- [ ] Créer le composant Scoreboard (`/client/src/components/games/quiz/Scoreboard.tsx`)
- [ ] Implémenter le chronomètre visuel
- [ ] Afficher les bonnes/mauvaises réponses

---

## Phase 11: Améliorations UX/UI 🟡

### 11.1 Design et Style
- [ ] Créer une palette de couleurs cohérente
- [ ] Créer un système de composants réutilisables (Button, Input, Modal, etc.)
- [ ] Ajouter des animations Tailwind (transitions)
- [ ] Créer un logo et une favicon
- [ ] Rendre l'interface responsive (mobile, tablette, desktop)

### 11.2 Notifications et Feedback
- [ ] Implémenter un système de toasts (react-hot-toast)
- [ ] Ajouter des sons (rejoindre salon, tour de jeu, victoire)
- [ ] Ajouter des confettis à la victoire
- [ ] Afficher des loaders pendant les chargements

### 11.3 Navigation
- [ ] Créer un Navbar avec navigation
- [ ] Créer une page d'accueil (Home)
- [ ] Créer une page de profil utilisateur
- [ ] Créer une page "Comment jouer" pour chaque jeu

---

## Phase 12: Sécurité et Performance 🔴

### 12.1 Sécurité
- [ ] Implémenter le rate limiting (Express + Socket.io)
- [ ] Sanitiser les inputs utilisateur
- [ ] Ajouter CORS correctement configuré
- [ ] Implémenter la validation Zod/Joi sur toutes les routes
- [ ] Ajouter helmet.js pour sécuriser les headers HTTP
- [ ] Audit de sécurité avec `npm audit`

### 12.2 Performance
- [ ] Ajouter des index MongoDB sur les champs fréquemment requêtés
- [ ] Implémenter la pagination pour la liste des salons
- [ ] Optimiser les requêtes Socket.io (ne pas broadcast inutilement)
- [ ] Ajouter du caching (Redis) pour les sessions 🟢
- [ ] Lazy loading des composants React

---

## Phase 13: Tests 🟡

### 13.1 Tests Backend
- [ ] Installer Jest et Supertest
- [ ] Tester les routes d'authentification
- [ ] Tester les routes de rooms
- [ ] Tester la logique de jeu (PerudoManager, etc.)
- [ ] Tester les handlers Socket.io

### 13.2 Tests Frontend
- [ ] Installer Vitest et Testing Library
- [ ] Tester les composants d'authentification
- [ ] Tester les stores Zustand
- [ ] Tester les composants de jeu

---

## Phase 14: Déploiement 🟢

### 14.1 Préparation
- [ ] Configurer les variables d'environnement pour production
- [ ] Builder le client React (`npm run build`)
- [ ] Configurer Express pour servir le build React
- [ ] Tester en mode production localement

### 14.2 Déploiement Backend
- [ ] Choisir un hébergeur (Render, Railway, Fly.io, DigitalOcean)
- [ ] Déployer le serveur Node.js
- [ ] Configurer MongoDB Atlas (si pas déjà fait)
- [ ] Configurer les variables d'environnement

### 14.3 Déploiement Frontend
- [ ] Déployer sur Vercel/Netlify (optionnel si séparé)
- [ ] OU servir via Express (plus simple)
- [ ] Configurer le DNS et HTTPS

### 14.4 Post-Déploiement
- [ ] Tester toutes les fonctionnalités en production
- [ ] Configurer la surveillance (logs, erreurs)
- [ ] Mettre en place des backups de la base de données

---

## Phase 15: Fonctionnalités Bonus 🟢

### 15.1 Améliorations Sociales
- [ ] Chat textuel dans les salons
- [ ] Système d'avatars personnalisés
- [ ] Historique des parties jouées
- [ ] Classement/Leaderboard global

### 15.2 Améliorations Gameplay
- [ ] Mode spectateur (regarder une partie en cours)
- [ ] Système de replay (rejouer une partie)
- [ ] Tournois avec brackets
- [ ] Parties classées vs non classées

### 15.3 Administration
- [ ] Panel d'administration
- [ ] Modération des salons
- [ ] Système de signalement
- [ ] Bannissement d'utilisateurs

---

## 📊 Progression Globale

- **Phase 1-5** : Fondations (Infrastructure) - **PRIORITÉ MAXIMALE**
- **Phase 6-7** : Premier Jeu Jouable - **PRIORITÉ HAUTE**
- **Phase 8-10** : Expansion des Fonctionnalités - **PRIORITÉ MOYENNE**
- **Phase 11-14** : Polish et Déploiement - **PRIORITÉ HAUTE**
- **Phase 15** : Long Terme - **PRIORITÉ BASSE**

---

## 🎯 Prochaine Étape

✅ **Phase 1 : Setup Initial - TERMINÉE !**
✅ **Phase 2 : Base de Données et Modèles - TERMINÉE !**
✅ **Phase 3 : Authentification - TERMINÉE !**
✅ **Phase 4 : Système de Rooms - TERMINÉE !**

👉 **Prochaine : Phase 5 - WebSocket et Temps Réel**

Tape "phase 5" ou "go" pour continuer !
