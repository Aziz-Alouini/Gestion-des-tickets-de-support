const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const populateFields = [
  { path: 'demandeur', select: 'nom email role' },
  { path: 'responsable', select: 'nom email role' },
  { path: 'historique.auteur', select: 'nom email role' },
  { path: 'commentaires.auteur', select: 'nom email role' },
];

const canAccessTicket = (user, ticket) => {
  if (user.role === 'admin' || user.role === 'agent') return true;
  return String(ticket.demandeur._id || ticket.demandeur) === String(user._id);
};

const buildTicketFilter = (user, query) => {
  const filter = {};

  if (user.role === 'demandeur') {
    filter.demandeur = user._id;
  }

  if (query.statut) filter.statut = query.statut;
  if (query.priorite) filter.priorite = query.priorite;
  if (query.categorie) filter.categorie = query.categorie;
  if (query.responsable) filter.responsable = query.responsable;
  if (query.demandeur && user.role !== 'demandeur') filter.demandeur = query.demandeur;
  if (query.search) {
    filter.$or = [
      { titre: { $regex: query.search, $options: 'i' } },
      { description: { $regex: query.search, $options: 'i' } },
      { numero: { $regex: query.search, $options: 'i' } },
    ];
  }

  return filter;
};

router.get('/', auth, async (req, res) => {
  try {
    const filter = buildTicketFilter(req.user, req.query);
    const tickets = await Ticket.find(filter)
      .populate(populateFields)
      .sort({ updatedAt: -1 });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/stats', auth, async (req, res) => {
  try {
    const base =
      req.user.role === 'demandeur' ? { demandeur: req.user._id } : {};

    const [parStatut, parPriorite, total, resolus, enCours] = await Promise.all([
      Ticket.aggregate([{ $match: base }, { $group: { _id: '$statut', count: { $sum: 1 } } }]),
      Ticket.aggregate([{ $match: base }, { $group: { _id: '$priorite', count: { $sum: 1 } } }]),
      Ticket.countDocuments(base),
      Ticket.countDocuments({ ...base, statut: { $in: ['Résolu', 'Clôturé'] } }),
      Ticket.countDocuments({ ...base, statut: { $in: ['Nouveau', 'En cours', 'En attente'] } }),
    ]);

    const recent = await Ticket.find(base)
      .populate('demandeur', 'nom email')
      .populate('responsable', 'nom email')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      total,
      resolus,
      enCours,
      tauxResolution: total ? Math.round((resolus / total) * 100) : 0,
      parStatut: Object.fromEntries(parStatut.map((s) => [s._id, s.count])),
      parPriorite: Object.fromEntries(parPriorite.map((p) => [p._id, p.count])),
      recent,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/import', auth, authorize('admin', 'agent'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Fichier Excel requis' });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    if (!rows.length) {
      return res.status(400).json({ message: 'Le fichier est vide' });
    }

    const created = [];
    const errors = [];

    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i];
      const titre = row.titre || row.Titre || row.title;
      const description = row.description || row.Description || row.desc;
      if (!titre || !description) {
        errors.push({ ligne: i + 2, message: 'Titre ou description manquant' });
        continue;
      }

      let demandeurId = req.user._id;
      const emailDemandeur = row.demandeur || row.Demandeur || row.email;
      if (emailDemandeur) {
        const found = await User.findOne({ email: String(emailDemandeur).toLowerCase() });
        if (found) demandeurId = found._id;
      }

      let responsableId = null;
      const emailResp = row.responsable || row.Responsable;
      if (emailResp) {
        const found = await User.findOne({
          email: String(emailResp).toLowerCase(),
          role: { $in: ['admin', 'agent'] },
        });
        if (found) responsableId = found._id;
      }

      const priorite = row.priorite || row.Priorite || row.Priorité || 'Moyenne';
      const categorie = row.categorie || row.Categorie || row.Catégorie || 'Autre';
      const validPriorites = ['Basse', 'Moyenne', 'Haute', 'Critique'];
      const validCategories = ['Technique', 'Fonctionnel', 'Accès', 'Demande', 'Autre'];

      const ticket = await Ticket.create({
        titre: String(titre),
        description: String(description),
        priorite: validPriorites.includes(priorite) ? priorite : 'Moyenne',
        categorie: validCategories.includes(categorie) ? categorie : 'Autre',
        demandeur: demandeurId,
        responsable: responsableId,
        historique: [
          {
            action: 'Import Excel',
            details: `Importé depuis fichier (ligne ${i + 2})`,
            auteur: req.user._id,
          },
        ],
      });
      created.push(ticket.numero);
    }

    res.status(201).json({
      message: `${created.length} ticket(s) importé(s)`,
      created,
      errors,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id).populate(populateFields);
    if (!ticket) return res.status(404).json({ message: 'Ticket introuvable' });
    if (!canAccessTicket(req.user, ticket)) {
      return res.status(403).json({ message: 'Accès refusé' });
    }
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { titre, description, priorite, categorie, responsable } = req.body;
    if (!titre || !description) {
      return res.status(400).json({ message: 'Titre et description requis' });
    }

    let demandeurId = req.user._id;
    if (req.body.demandeur && (req.user.role === 'admin' || req.user.role === 'agent')) {
      demandeurId = req.body.demandeur;
    }

    let responsableId = responsable || null;
    if (responsableId) {
      const agent = await User.findById(responsableId);
      if (!agent || !['admin', 'agent'].includes(agent.role)) {
        return res.status(400).json({ message: 'Responsable invalide' });
      }
    }

    const ticket = await Ticket.create({
      titre,
      description,
      priorite: priorite || 'Moyenne',
      categorie: categorie || 'Autre',
      demandeur: demandeurId,
      responsable: responsableId,
      historique: [
        {
          action: 'Création',
          details: 'Ticket créé',
          auteur: req.user._id,
        },
      ],
    });

    const populated = await Ticket.findById(ticket._id).populate(populateFields);
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/:id', auth, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket introuvable' });
    if (!canAccessTicket(req.user, ticket)) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const isStaff = ['admin', 'agent'].includes(req.user.role);
    const changes = [];

    if (req.body.titre !== undefined && (isStaff || String(ticket.demandeur) === String(req.user._id))) {
      if (ticket.titre !== req.body.titre) {
        changes.push(`Titre: "${ticket.titre}" → "${req.body.titre}"`);
        ticket.titre = req.body.titre;
      }
    }

    if (req.body.description !== undefined && (isStaff || String(ticket.demandeur) === String(req.user._id))) {
      if (ticket.description !== req.body.description) {
        changes.push('Description mise à jour');
        ticket.description = req.body.description;
      }
    }

    if (req.body.statut !== undefined) {
      if (!isStaff) return res.status(403).json({ message: 'Seul le support peut changer le statut' });
      if (ticket.statut !== req.body.statut) {
        changes.push(`Statut: ${ticket.statut} → ${req.body.statut}`);
        ticket.statut = req.body.statut;
      }
    }

    if (req.body.priorite !== undefined) {
      if (!isStaff && String(ticket.demandeur) !== String(req.user._id)) {
        return res.status(403).json({ message: 'Accès refusé' });
      }
      if (ticket.priorite !== req.body.priorite) {
        changes.push(`Priorité: ${ticket.priorite} → ${req.body.priorite}`);
        ticket.priorite = req.body.priorite;
      }
    }

    if (req.body.categorie !== undefined && isStaff) {
      if (ticket.categorie !== req.body.categorie) {
        changes.push(`Catégorie: ${ticket.categorie} → ${req.body.categorie}`);
        ticket.categorie = req.body.categorie;
      }
    }

    if (req.body.responsable !== undefined && isStaff) {
      const next = req.body.responsable || null;
      const prev = ticket.responsable ? String(ticket.responsable) : null;
      if (prev !== (next ? String(next) : null)) {
        changes.push('Responsable mis à jour');
        ticket.responsable = next;
      }
    }

    if (changes.length) {
      ticket.historique.push({
        action: 'Mise à jour',
        details: changes.join(' | '),
        auteur: req.user._id,
      });
      await ticket.save();
    }

    const populated = await Ticket.findById(ticket._id).populate(populateFields);
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/comments', auth, async (req, res) => {
  try {
    const { contenu } = req.body;
    if (!contenu?.trim()) {
      return res.status(400).json({ message: 'Commentaire vide' });
    }

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket introuvable' });
    if (!canAccessTicket(req.user, ticket)) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    ticket.commentaires.push({ contenu: contenu.trim(), auteur: req.user._id });
    ticket.historique.push({
      action: 'Commentaire',
      details: 'Nouveau commentaire ajouté',
      auteur: req.user._id,
    });
    await ticket.save();

    const populated = await Ticket.findById(ticket._id).populate(populateFields);
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const ticket = await Ticket.findByIdAndDelete(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket introuvable' });
    res.json({ message: 'Ticket supprimé' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
