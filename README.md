# Fruit Market — Application décentralisée blockchain

**Projet universitaire | Blockchain et contrats intelligents**

## Présentation

Fruit Market est une application décentralisée (DApp) de vente et d’achat de fruits. Le projet associe des contrats intelligents Solidity à une interface React pour interagir avec Ethereum via un portefeuille compatible.

## Fonctionnalités

- **Version 1 :** publication de fruits avec prix et stock, modification et désactivation par le vendeur, achat avec paiement en ether, mise à jour des stocks et historique des achats sur la blockchain.
- **Version 2 :** ajout d’un système de notation (1 à 5) accessible aux acheteurs, après mise à niveau du contrat.
- **Mise à niveau :** architecture UUPS avec OpenZeppelin, pour faire évoluer le contrat tout en conservant son état.
- **Interface :** application React/Vite connectée au contrat via ethers.js et un portefeuille Web3.
- **Tests et déploiement :** tests Hardhat et scripts de déploiement, de mise à niveau et de vérification, avec configuration pour Sepolia.

## Technologies

Solidity · Ethereum · Hardhat · OpenZeppelin Upgrades (UUPS) · JavaScript · React · Vite · ethers.js · MetaMask

## Structure

- `contracts/` : contrats intelligents V1 et V2
- `src/` : interface web React
- `scripts/` : déploiement et mise à niveau
- `test/` : tests automatisés Hardhat
- `hardhat.config.js` : configuration du projet

## Compétences mises en pratique

- Développement de contrats intelligents Solidity
- Gestion des transactions, achats et états sur blockchain
- Évolution d’un contrat avec le modèle de proxy UUPS
- Intégration frontend/Web3 avec React et ethers.js
- Tests et scripts d’automatisation avec Hardhat

## Contexte

Projet académique réalisé dans le cadre d’un travail pratique sur la chaîne de blocs. Les fichiers publiés présentent le travail technique et son organisation. La réussite des tests et la disponibilité d’un déploiement public ne sont pas garanties par ce dépôt.

## Sécurité

Les secrets, clés privées et configurations locales ne sont pas inclus. Créer un fichier `.env` local pour les paramètres nécessaires, sans jamais le commiter. Ne jamais réutiliser une clé privée ayant été partagée.

## 🎬 Démonstration vidéo

Une vidéo de démonstration présente le fonctionnement de **Fruit Market**, notamment l'interface React, la connexion avec MetaMask et les interactions avec les contrats intelligents sur Ethereum Sepolia.

**[▶ Voir la démonstration de Fruit Market](https://github.com/ousmanediedhiou/Fruit-market-blockchain/releases/tag/v1.0.0)**
