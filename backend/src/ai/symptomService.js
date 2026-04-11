const axios = require('axios');
const pool = require('../config/db');
const env = require('../config/env');

async function checkSymptoms(patientId, symptoms) {
  const prompt = `Patient symptoms: ${symptoms}.\nYou are a medical triage assistant. Based on the symptoms, suggest the most suitable medical specialist and urgency level.\nRespond in JSON only with this exact format:\n{"recommended_specialist": "<specialist>", "urgency": "<low|medium|high>"}`;

  let aiResponseText = '';
  let parsed = { recommended_specialist: 'General Physician', urgency: 'medium' };

  try {
    const response = await axios.post(`${env.ollama.baseUrl}/api/generate`, {
      model: env.ollama.model,
      prompt,
      stream: false,
    });

    aiResponseText = response.data.response || '';

    // Extract JSON from response
    const jsonMatch = aiResponseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[0]);
    }
  } catch (err) {
    console.error('Ollama AI error:', err.message);
    aiResponseText = 'AI service unavailable';
  }

  // Store log if patient is provided
  if (patientId) {
    await pool.query(
      'INSERT INTO ai_symptom_logs (patient_id, symptoms, ai_response) VALUES ($1, $2, $3)',
      [patientId, symptoms, aiResponseText]
    );
  }

  return {
    recommended_specialist: parsed.recommended_specialist || 'General Physician',
    urgency: parsed.urgency || 'medium',
  };
}

module.exports = { checkSymptoms };
