const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Ticket = require('./models/Ticket');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/gestion_tickets');
  console.log('Connected to MongoDB');

  const users = [
    { nom: 'Admin Support', email: 'admin@support.local', password: 'Admin123!', role: 'admin' },
    { nom: 'Agent Martin', email: 'agent@support.local', password: 'Agent123!', role: 'agent' },
    { nom: 'Alice Demandeur', email: 'alice@support.local', password: 'User123!', role: 'demandeur' },
  ];

  const createdUsers = {};
  for (const u of users) {
    let user = await User.findOne({ email: u.email });
    if (!user) {
      user = await User.create(u);
      console.log(`Created ${u.role}: ${u.email}`);
    } else {
      console.log(`Exists ${u.role}: ${u.email}`);
    }
    createdUsers[u.role === 'demandeur' ? 'demandeur' : u.role] = user;
  }

  const count = await Ticket.countDocuments();
  if (count === 0) {
    const samples = [
      {
        titre: 'Impossible de se connecter au VPN',
        description: 'Erreur timeout lors de la connexion VPN depuis le domicile.',
        priorite: 'Haute',
        categorie: 'Accès',
        statut: 'Nouveau',
        demandeur: createdUsers.demandeur._id,
        responsable: createdUsers.agent._id,
        historique: [
          { action: 'Création', details: 'Ticket de démonstration', auteur: createdUsers.demandeur._id },
        ],
      },
      {
        titre: 'Demande de nouvelle licence Office',
        description: "Besoin d'une licence Microsoft 365 pour un nouveau collaborateur.",
        priorite: 'Moyenne',
        categorie: 'Demande',
        statut: 'En cours',
        demandeur: createdUsers.demandeur._id,
        responsable: createdUsers.agent._id,
        historique: [
          { action: 'Création', details: 'Ticket de démonstration', auteur: createdUsers.demandeur._id },
          { action: 'Mise à jour', details: 'Statut: Nouveau → En cours', auteur: createdUsers.agent._id },
        ],
        commentaires: [
          { contenu: 'Licence en cours de commande.', auteur: createdUsers.agent._id },
        ],
      },
      {
        titre: 'Bug affichage tableau de bord',
        description: 'Les graphiques ne se chargent pas sur Chrome.',
        priorite: 'Critique',
        categorie: 'Technique',
        statut: 'En attente',
        demandeur: createdUsers.demandeur._id,
        historique: [
          { action: 'Création', details: 'Ticket de démonstration', auteur: createdUsers.demandeur._id },
        ],
      },
    ];

    for (const sample of samples) {
      await Ticket.create(sample);
    }
    console.log('Sample tickets created');
  } else {
    console.log(`Tickets already present (${count}), skipped sample data`);
  }

  console.log('\nComptes de test :');
  console.log('  admin@support.local / Admin123!');
  console.log('  agent@support.local / Agent123!');
  console.log('  alice@support.local / User123!');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
