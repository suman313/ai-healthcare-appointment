const doctorService = require('../services/doctorService');

async function getDoctors(req, res, next) {
  try {
    const clinicId = req.user?.clinic_id || req.query.clinic_id || null;
    const doctors = await doctorService.getDoctors(clinicId);
    res.json(doctors);
  } catch (err) {
    next(err);
  }
}

async function createDoctor(req, res, next) {
  try {
    const doctor = await doctorService.createDoctor(req.user.clinic_id, req.body);
    res.status(201).json(doctor);
  } catch (err) {
    next(err);
  }
}

async function updateDoctor(req, res, next) {
  try {
    const doctor = await doctorService.updateDoctor(req.user.clinic_id, req.params.id, req.body);
    res.json(doctor);
  } catch (err) {
    next(err);
  }
}

async function deleteDoctor(req, res, next) {
  try {
    await doctorService.deleteDoctor(req.user.clinic_id, req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

async function getAvailability(req, res, next) {
  try {
    const slots = await doctorService.getAvailability(req.params.id, req.user.clinic_id);
    res.json(slots);
  } catch (err) {
    next(err);
  }
}

async function setAvailability(req, res, next) {
  try {
    await doctorService.setAvailability(req.params.id, req.user.clinic_id, req.body.slots);
    res.json({ message: 'Availability updated' });
  } catch (err) {
    next(err);
  }
}

async function getAvailableSlots(req, res, next) {
  try {
    const { date, clinic_id } = req.query;
    if (!date) return res.status(400).json({ error: 'date query param required (YYYY-MM-DD)' });
    const clinicId = req.user?.clinic_id || clinic_id || null;
    const slots = await doctorService.getAvailableSlots(req.params.id, clinicId, date);
    res.json({ slots });
  } catch (err) {
    next(err);
  }
}

module.exports = { getDoctors, createDoctor, updateDoctor, deleteDoctor, getAvailability, setAvailability, getAvailableSlots };
