const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

const signToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || 'dev_secret_change_me',
    { expiresIn: '7d' }
  );

router.post('/register', auth, authorize('admin'), async (req, res) => {
  try {
    const { nom, email, password, role } = req.body;
    if (!nom || !email || !password) {
      return res.status(400).json({ message: 'Nom, email et mot de passe requis' });
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(409).json({ message: 'Cet email est déjà utilisé' });
    }

    const user = await User.create({
      nom,
      email,
      password,
      role: role || 'demandeur',
    });

    res.status(201).json({ user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email et mot de passe requis' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Identifiants incorrects' });
    }
    if (!user.actif) {
      return res.status(403).json({ message: 'Compte désactivé' });
    }

    res.json({ token: signToken(user), user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/me', auth, (req, res) => {
  res.json({ user: req.user.toSafeObject() });
});

router.get('/users', auth, authorize('admin', 'agent'), async (req, res) => {
  try {
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.actif !== undefined) filter.actif = req.query.actif === 'true';

    const users = await User.find(filter).select('-password').sort({ nom: 1 });
    res.json(
      users.map((u) => ({
        id: u._id,
        nom: u.nom,
        email: u.email,
        role: u.role,
        actif: u.actif,
        createdAt: u.createdAt,
      }))
    );
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/users/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const { nom, role, actif, password } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });

    if (nom !== undefined) user.nom = nom;
    if (role !== undefined) user.role = role;
    if (actif !== undefined) user.actif = actif;
    if (password) user.password = password;

    await user.save();
    res.json({ user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
