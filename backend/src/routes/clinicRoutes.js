const router = require('express').Router();
const pool = require('../config/db');

// Public: get basic clinic info for the booking page
router.get('/:id', async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT id, name, address, phone FROM clinics WHERE id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Clinic not found' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
