const mongoose = require('mongoose');

const historySchema = new mongoose.Schema(
  {
    action: { type: String, required: true },
    details: { type: String, default: '' },
    auteur: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const commentSchema = new mongoose.Schema(
  {
    contenu: { type: String, required: true, trim: true },
    auteur: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const ticketSchema = new mongoose.Schema(
  {
    numero: { type: String, unique: true },
    titre: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    statut: {
      type: String,
      enum: ['Nouveau', 'En cours', 'En attente', 'Résolu', 'Clôturé'],
      default: 'Nouveau',
    },
    priorite: {
      type: String,
      enum: ['Basse', 'Moyenne', 'Haute', 'Critique'],
      default: 'Moyenne',
    },
    categorie: {
      type: String,
      enum: ['Technique', 'Fonctionnel', 'Accès', 'Demande', 'Autre'],
      default: 'Autre',
    },
    demandeur: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    responsable: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    historique: [historySchema],
    commentaires: [commentSchema],
  },
  { timestamps: true }
);

ticketSchema.pre('save', async function assignNumero() {
  if (this.numero) return;
  const last = await mongoose.model('Ticket').findOne().sort({ createdAt: -1 }).select('numero');
  let next = 1;
  if (last?.numero) {
    const parsed = parseInt(String(last.numero).replace(/\D/g, ''), 10);
    if (!Number.isNaN(parsed)) next = parsed + 1;
  }
  this.numero = `TK-${String(next).padStart(5, '0')}`;
});

module.exports = mongoose.model('Ticket', ticketSchema);
