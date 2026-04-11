const billingService = require('../services/billingService');

async function getMonthlyRevenue(req, res, next) {
  try {
    const data = await billingService.getMonthlyRevenue(req.user.clinic_id);
    res.json(data);
  } catch (err) { next(err); }
}

async function getList(req, res, next) {
  try {
    const data = await billingService.getBillingList(req.user.clinic_id);
    res.json(data);
  } catch (err) { next(err); }
}

async function getStats(req, res, next) {
  try {
    const data = await billingService.getBillingStats(req.user.clinic_id);
    res.json(data);
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const data = await billingService.createBilling(req.user.clinic_id, req.body);
    res.status(201).json(data);
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const data = await billingService.updateBilling(req.user.clinic_id, req.params.id, req.body);
    res.json(data);
  } catch (err) { next(err); }
}

module.exports = { getList, getStats, create, update, getMonthlyRevenue };
