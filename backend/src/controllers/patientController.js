const patientService = require('../services/patientService');

async function getPatients(req, res, next) {
  try {
    const patients = await patientService.getPatients(req.user.clinic_id);
    res.json(patients);
  } catch (err) {
    next(err);
  }
}

async function createPatient(req, res, next) {
  try {
    const clinicId = req.user?.clinic_id || null;
    const patient = await patientService.createPatient(clinicId, req.body);
    res.status(201).json(patient);
  } catch (err) {
    next(err);
  }
}

module.exports = { getPatients, createPatient };
