const appointmentService = require('../services/appointmentService');

async function getAppointments(req, res, next) {
  try {
    const appointments = await appointmentService.getAppointments(req.user.clinic_id);
    res.json(appointments);
  } catch (err) {
    next(err);
  }
}

async function createAppointment(req, res, next) {
  try {
    const clinicId = req.user?.clinic_id || null;
    const appointment = await appointmentService.createAppointment(clinicId, req.body);
    res.status(201).json(appointment);
  } catch (err) {
    next(err);
  }
}

async function updateAppointment(req, res, next) {
  try {
    const appointment = await appointmentService.updateAppointment(req.user.clinic_id, req.params.id, req.body);
    res.json(appointment);
  } catch (err) {
    next(err);
  }
}

async function deleteAppointment(req, res, next) {
  try {
    await appointmentService.deleteAppointment(req.user.clinic_id, req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { getAppointments, createAppointment, updateAppointment, deleteAppointment };
