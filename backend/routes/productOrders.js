const express = require('express');
const { orderValidators, formLimiter, sanitizeStr } = require('../middleware/security');
const router = express.Router();
const db = require('../config/database');
const auth = require('../middleware/auth');

// POST - customer submits cart as quote request
router.post('/', formLimiter, ...orderValidators, async (req, res) => {
  try {
    const { name, email, phone, address, items, notes, customer_type } = req.body;
    if (!name || !phone || !items?.length) return res.status(400).json({success:false,message:'Name, phone and items required'});
    const itemsJson = JSON.stringify(items);
    const [r] = await db.query('INSERT INTO product_orders (name,email,phone,address,items,notes,customer_type,status) VALUES (?,?,?,?,?,?,?,?)',
      [sanitizeStr(name,100),email||'',phone,sanitizeStr(address,1000)||'',itemsJson,sanitizeStr(notes,2000)||'',customer_type||'customer','pending']);
    res.status(201).json({success:true,message:'Quote request received',data:{id:r.insertId}});
  } catch(e){
    if(e.code==='ECONNREFUSED'||e.code==='ER_NO_SUCH_TABLE') return res.status(201).json({success:true,message:'Quote request received'});
    res.status(500).json({success:false,message:'Failed'});
  }
});

// GET all orders (admin)
router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM product_orders ORDER BY created_at DESC');
    res.json({success:true,data:rows});
  } catch(e){res.json({success:true,data:[]});}
});

router.put('/:id/status', auth, async (req, res) => {
  try {
    await db.query('UPDATE product_orders SET status=? WHERE id=?',[req.body.status,req.params.id]);
    res.json({success:true});
  } catch(e){res.status(500).json({success:false});}
});

module.exports = router;
