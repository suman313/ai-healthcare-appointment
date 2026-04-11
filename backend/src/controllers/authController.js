const authService = require('../services/authService');

async function registerClinic(req, res, next) {
  try {
    const result = await authService.registerClinic(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const result = await authService.login(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { registerClinic, login };
