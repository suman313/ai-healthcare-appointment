const { checkSymptoms } = require('../ai/symptomService');

async function symptomCheck(req, res, next) {
  try {
    const { symptoms, patient_id } = req.body;
    if (!symptoms) return res.status(400).json({ error: 'symptoms field is required' });
    const result = await checkSymptoms(patient_id || null, symptoms);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { symptomCheck };
