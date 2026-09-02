# Gestion des tickets de support

Plateforme web MVP pour centraliser, suivre et traiter les demandes de support.

## Stack

- **Frontend** : React (Vite) + React Router
- **Backend** : Node.js + Express
- **Base de données** : MongoDB (Mongoose)
- **Import Excel** : SheetJS (XLSX)
- **Auth** : JWT + rôles `admin`, `agent`, `demandeur`

## Fonctionnalités

- Authentification et gestion des utilisateurs (admin)
- Création / liste / détail des tickets
- Statuts : Nouveau, En cours, En attente, Résolu, Clôturé
- Commentaires et historique d’actions
- Import Excel en masse (admin / agent)
- Tableau de bord (KPI et répartition)

## Démarrage

### Backend

```bash
cd Backend
cp .env.example .env   # puis renseigner MONGO_URI et JWT_SECRET
npm install
npm run seed
npm run dev
```

API : `http://localhost:5000`

### Frontend

```bash
cd Frontend
cp .env.example .env
npm install
npm run dev
```

UI : `http://localhost:5173`

## Comptes de démo (après seed)

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| admin | admin@support.local | Admin123! |
| agent | agent@support.local | Agent123! |
| demandeur | alice@support.local | User123! |

## Format Excel d’import

Colonnes : `titre`, `description`, optionnel `priorite`, `categorie`, `demandeur` (email), `responsable` (email).