const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Shown ONLY if the database is unreachable for a given request, so the public
// pages still render something. Previously a single DB error set a process-wide
// flag that kept serving this hard-coded list until the next restart, even after
// the database recovered, and bookings made against these ids could fail.
const FALLBACK_SERVICES = [
  { id: 1, name: 'Residential Solar Installation', description: 'Complete rooftop solar system for homes with installation, subsidy assistance, and net metering support.', price: 45000, duration_hours: 8, is_active: true },
  { id: 2, name: 'Commercial Solar Solution', description: 'Scalable solar arrays for offices, malls, and commercial properties with custom engineering design.', price: 120000, duration_hours: 24, is_active: true },
  { id: 3, name: 'Industrial Solar Plant', description: 'High-capacity solar infrastructure for factories and industrial campuses. End-to-end EPC services.', price: 350000, duration_hours: 72, is_active: true },
  { id: 4, name: 'Solar Water Heater', description: 'Energy-efficient solar water heating systems for homes and commercial establishments.', price: 25000, duration_hours: 4, is_active: true },
  { id: 5, name: 'Solar Inverter Setup', description: 'Hybrid solar inverter installation with battery backup for uninterrupted power supply.', price: 35000, duration_hours: 6, is_active: true },
  { id: 6, name: 'Operation & Maintenance', description: 'Comprehensive annual maintenance contract including cleaning, monitoring, and repairs.', price: 8000, duration_hours: 4, is_active: true },
];

router.get('/', async (req, res) => {
  try {
    const [services] = await db.query(
      'SELECT * FROM services WHERE is_active = true ORDER BY created_at DESC'
    );
    res.json({ success: true, data: services });
  } catch (error) {
    // Per-request fallback only; the next request tries the database again.
    console.error('DB unavailable for services list, serving fallback list:', error.message);
    res.json({ success: true, data: FALLBACK_SERVICES, fallback: true });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [services] = await db.query(
      'SELECT * FROM services WHERE id = ? AND is_active = true',
      [req.params.id]
    );
    if (services.length === 0) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    res.json({ success: true, data: services[0] });
  } catch (error) {
    console.error('Error fetching service:', error.message);
    res.status(503).json({ success: false, message: 'Service temporarily unavailable' });
  }
});

module.exports = router;
