const medicalRecordService = require('../services/medicalRecordService');

async function getByPatient(req, res, next) {
  try {
    const records = await medicalRecordService.getRecordsByPatient(req.user.clinic_id, req.params.patientId);
    res.json(records);
  } catch (err) { next(err); }
}

async function getByDoctor(req, res, next) {
  try {
    const records = await medicalRecordService.getRecordsByDoctor(req.user.clinic_id, req.params.doctorId);
    res.json(records);
  } catch (err) { next(err); }
}

async function getOne(req, res, next) {
  try {
    const record = await medicalRecordService.getRecord(req.user.clinic_id, req.params.id);
    res.json(record);
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const record = await medicalRecordService.createRecord(req.user.clinic_id, req.body);
    res.status(201).json(record);
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const record = await medicalRecordService.updateRecord(req.user.clinic_id, req.params.id, req.body);
    res.json(record);
  } catch (err) { next(err); }
}

module.exports = { getByPatient, getByDoctor, getOne, create, update };
