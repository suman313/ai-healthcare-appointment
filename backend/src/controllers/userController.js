const userService = require('../services/userService');

async function getUsers(req, res, next) {
  try {
    const data = await userService.getUsers(req.user.clinic_id);
    res.json(data);
  } catch (err) { next(err); }
}

async function createUser(req, res, next) {
  try {
    const data = await userService.createUser(req.user.clinic_id, req.body);
    res.status(201).json(data);
  } catch (err) { next(err); }
}

async function updateUser(req, res, next) {
  try {
    const data = await userService.updateUser(req.user.clinic_id, req.params.id, req.body);
    res.json(data);
  } catch (err) { next(err); }
}

async function deleteUser(req, res, next) {
  try {
    await userService.deleteUser(req.user.clinic_id, req.params.id);
    res.status(204).send();
  } catch (err) { next(err); }
}

async function resetPassword(req, res, next) {
  try {
    await userService.resetPassword(req.user.clinic_id, req.params.id, req.body);
    res.json({ message: 'Password updated' });
  } catch (err) { next(err); }
}

module.exports = { getUsers, createUser, updateUser, deleteUser, resetPassword };
