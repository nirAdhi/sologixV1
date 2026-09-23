const express = require('express');
const router = express.Router();

const STATIC_SERVICES = [
  { id: 1, name: 'Residential Solar Installation', description: 'Complete rooftop solar system for homes with installation, subsidy assistance, and net metering support.', price: 45000, duration_hours: 8, is_active: true },
  { id: 2, name: 'Commercial Solar Solution', description: 'Scalable solar arrays for offices, malls, and commercial properties with custom engineering design.', price: 120000, duration_hours: 24, is_active: true },
  { id: 3, name: 'Industrial Solar Plant', description: 'High-capacity solar infrastructure for factories and industrial campuses. End-to-end EPC services.', price: 350000, duration_hours: 72, is_active: true },
  { id: 4, name: 'Solar Water Heater', description: 'Energy-efficient solar water heating systems for homes and commercial establishments.', price: 25000, duration_hours: 4, is_active: true },
  { id: 5, name: 'Solar Inverter Setup', description: 'Hybrid solar inverter installation with battery backup for uninterrupted power supply.', price: 35000, duration_hours: 6, is_active: true },
  { id: 6, name: 'Operation & Maintenance', description: 'Comprehensive annual maintenance contract including cleaning, monitoring, and repairs.', price: 8000, duration_hours: 4, is_active: true },
];

let useStaticServices = false;

const db = require('../config/database');

router.get('/', async (req, res) => {
  try {
    if (useStaticServices) throw new Error('Using static services');
    const [services] = await db.query(
      'SELECT * FROM services WHERE is_active = true ORDER BY created_at DESC'
    );
    res.json({ success: true, data: services });
  } catch (error) {
    console.warn('DB unavailable, using static services:', error.message);
    useStaticServices = true;
    res.json({ success: true, data: STATIC_SERVICES });
  }
});

router.get('/:id', async (req, res) => {
  try {
    if (!useStaticServices) {
      const [services] = await db.query(
        'SELECT * FROM services WHERE id = ? AND is_active = true',
        [req.params.id]
      );
      
      if (services.length === 0) {
        return res.status(404).json({ success: false, message: 'Service not found' });
      }
      
      return res.json({ success: true, data: services[0] });
    }
    throw new Error('Using static services');
  } catch (error) {
    const service = STATIC_SERVICES.find(s => s.id === parseInt(req.params.id));
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    res.json({ success: true, data: service });
  }
});

module.exports = router;
