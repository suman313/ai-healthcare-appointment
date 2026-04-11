const express = require('express');
const cors = require('cors');
const errorMiddleware = require('./src/middlewares/errorMiddleware');

const authRoutes = require('./src/routes/authRoutes');
const clinicRoutes = require('./src/routes/clinicRoutes');
const doctorRoutes = require('./src/routes/doctorRoutes');
const patientRoutes = require('./src/routes/patientRoutes');
const appointmentRoutes = require('./src/routes/appointmentRoutes');
const aiRoutes = require('./src/routes/aiRoutes');
const medicalRecordRoutes = require('./src/routes/medicalRecordRoutes');
const prescriptionRoutes = require('./src/routes/prescriptionRoutes');
const billingRoutes = require('./src/routes/billingRoutes');
const userRoutes = require('./src/routes/userRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const subscriptionRoutes = require('./src/routes/subscriptionRoutes');
const manageAppointmentRoutes = require('./src/routes/manageAppointmentRoutes');
const queueRoutes = require('./src/routes/queueRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/clinics', clinicRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/medical-records', medicalRecordRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/manage', manageAppointmentRoutes);
app.use('/api/queue', queueRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use(errorMiddleware);

module.exports = app;
