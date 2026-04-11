const prescriptionService = require('../services/prescriptionService');

async function getByPatient(req, res, next) {
  try {
    const data = await prescriptionService.getPrescriptionsByPatient(req.user.clinic_id, req.params.patientId);
    res.json(data);
  } catch (err) { next(err); }
}

async function getByDoctor(req, res, next) {
  try {
    const data = await prescriptionService.getPrescriptionsByDoctor(req.user.clinic_id, req.params.doctorId);
    res.json(data);
  } catch (err) { next(err); }
}

async function getOne(req, res, next) {
  try {
    const data = await prescriptionService.getPrescription(req.user.clinic_id, req.params.id);
    res.json(data);
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const data = await prescriptionService.createPrescription(req.user.clinic_id, req.body);
    res.status(201).json(data);
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const data = await prescriptionService.updatePrescription(req.user.clinic_id, req.params.id, req.body);
    res.json(data);
  } catch (err) { next(err); }
}

module.exports = { getByPatient, getByDoctor, getOne, create, update };
