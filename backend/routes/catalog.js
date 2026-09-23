const express = require('express');
const router = express.Router();
const db = require('../config/database');
const auth = require('../middleware/auth');

// Static product catalog (seeded on first run, editable by admin)
const SEED = [
  // Solar Panels
  { category:'Solar Panels', brand:'Adani Solar', model:'Mono PERC 580W', specs:'580W, 21.5% efficiency, 25yr warranty, DCR', price_range:'Contact for pricing', image_url:'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=400&h=300&fit=crop', badge:'Best Seller', in_stock:1, sort_order:1 },
  { category:'Solar Panels', brand:'Adani Solar', model:'Mono PERC 600W', specs:'600W, 22.1% efficiency, 25yr warranty, DCR', price_range:'Contact for pricing', image_url:'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=400&h=300&fit=crop', badge:'', in_stock:1, sort_order:2 },
  { category:'Solar Panels', brand:'Tata Power Solar', model:'575W Mono', specs:'575W, 21.8% efficiency, Tier-1 manufacturer', price_range:'Contact for pricing', image_url:'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=400&h=300&fit=crop', badge:'', in_stock:1, sort_order:3 },
  { category:'Solar Panels', brand:'Rayzon Solar', model:'545W PERC', specs:'545W, high-efficiency, strong build quality', price_range:'Contact for pricing', image_url:'https://images.unsplash.com/photo-1497440001374-f26997328c1b?w=400&h=300&fit=crop', badge:'', in_stock:1, sort_order:4 },
  { category:'Solar Panels', brand:'ZEN Energy', model:'590W Mono', specs:'590W, better temp performance, long lifecycle', price_range:'Contact for pricing', image_url:'https://images.unsplash.com/photo-1559302504-64aae6ca6b6d?w=400&h=300&fit=crop', badge:'', in_stock:1, sort_order:5 },
  // On-Grid Inverters
  { category:'On-Grid Inverters', brand:'Deye', model:'3kW On-Grid', specs:'3kW, WiFi monitoring, high conversion efficiency', price_range:'Contact for pricing', image_url:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop', badge:'', in_stock:1, sort_order:10 },
  { category:'On-Grid Inverters', brand:'Deye', model:'10kW On-Grid', specs:'10kW, dual MPPT, smart monitoring', price_range:'Contact for pricing', image_url:'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=400&h=300&fit=crop', badge:'Best Seller', in_stock:1, sort_order:11 },
  { category:'On-Grid Inverters', brand:'Growatt', model:'5kW On-Grid', specs:'5kW, reliable, cost-effective, residential', price_range:'Contact for pricing', image_url:'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=400&h=300&fit=crop', badge:'', in_stock:1, sort_order:12 },
  { category:'On-Grid Inverters', brand:'Microtek', model:'3kW Solar Inverter', specs:'3kW, user-friendly, small business & homes', price_range:'Contact for pricing', image_url:'https://images.unsplash.com/photo-1624397640148-949b1732bb0a?w=400&h=300&fit=crop', badge:'', in_stock:1, sort_order:13 },
  // Hybrid Inverters
  { category:'Hybrid Inverters', brand:'LuxPower', model:'3kW Hybrid', specs:'3kW, battery ready, UPS-level backup switching', price_range:'Contact for pricing', image_url:'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=400&h=300&fit=crop', badge:'', in_stock:1, sort_order:20 },
  { category:'Hybrid Inverters', brand:'LuxPower', model:'6kW Hybrid', specs:'6kW, smart energy management, remote monitoring', price_range:'Contact for pricing', image_url:'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=400&h=300&fit=crop', badge:'Popular', in_stock:1, sort_order:21 },
  { category:'Hybrid Inverters', brand:'LuxPower', model:'12kW Hybrid', specs:'12kW, high capacity, commercial applications', price_range:'Contact for pricing', image_url:'https://images.unsplash.com/photo-1497440001374-f26997328c1b?w=400&h=300&fit=crop', badge:'', in_stock:1, sort_order:22 },
  { category:'Hybrid Inverters', brand:'Deye', model:'8kW Hybrid', specs:'8kW, dual battery bank, generator support', price_range:'Contact for pricing', image_url:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop', badge:'', in_stock:1, sort_order:23 },
  // Lithium Batteries
  { category:'Lithium Batteries', brand:'Bi-Tech', model:'5 kWh LiFePO4', specs:'5 kWh, 6000+ cycles, compact, low maintenance', price_range:'Contact for pricing', image_url:'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=400&h=300&fit=crop', badge:'Best Seller', in_stock:1, sort_order:30 },
  { category:'Lithium Batteries', brand:'Solis', model:'5 kWh Storage', specs:'5 kWh, smart BMS, hybrid inverter compatible', price_range:'Contact for pricing', image_url:'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=400&h=300&fit=crop', badge:'', in_stock:1, sort_order:31 },
  { category:'Lithium Batteries', brand:'Bi-Tech', model:'10 kWh LiFePO4', specs:'10 kWh, high capacity, residential & commercial', price_range:'Contact for pricing', image_url:'https://images.unsplash.com/photo-1624397640148-949b1732bb0a?w=400&h=300&fit=crop', badge:'', in_stock:1, sort_order:32 },
  // Distribution Boxes & Accessories
  { category:'BOS & Accessories', brand:'Sologix', model:'AC Distribution Box', specs:'4-way, IP65, surge protection, 32A MCB', price_range:'Contact for pricing', image_url:'https://images.unsplash.com/photo-1559302504-64aae6ca6b6d?w=400&h=300&fit=crop', badge:'', in_stock:1, sort_order:40 },
  { category:'BOS & Accessories', brand:'Sologix', model:'DC Junction Box', specs:'IP67, 6-string, anti-reverse protection', price_range:'Contact for pricing', image_url:'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=400&h=300&fit=crop', badge:'', in_stock:1, sort_order:41 },
  { category:'BOS & Accessories', brand:'Sologix', model:'Solar DC Cable 4mm', specs:'TUV certified, UV resistant, per metre', price_range:'Contact for pricing', image_url:'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=400&h=300&fit=crop', badge:'', in_stock:1, sort_order:42 },
  { category:'BOS & Accessories', brand:'Sologix', model:'Mounting Structure — RCC', specs:'GI hot-dip galvanised, RCC roof, adjustable tilt', price_range:'Contact for pricing', image_url:'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=400&h=300&fit=crop', badge:'', in_stock:1, sort_order:43 },
  { category:'BOS & Accessories', brand:'Sologix', model:'MC4 Connector Pair', specs:'IP68, 30A rated, UV stabilised', price_range:'Contact for pricing', image_url:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop', badge:'', in_stock:1, sort_order:44 },
];

let useStatic = false;
let seeded = false;

const seed = async () => {
  if (seeded) return;
  try {
    const [rows] = await db.query('SELECT COUNT(*) as c FROM product_catalog');
    if (rows[0].c === 0) {
      for (const p of SEED) {
        await db.query('INSERT INTO product_catalog (category,brand,model,specs,price_range,image_url,badge,in_stock,sort_order) VALUES (?,?,?,?,?,?,?,?,?)',
          [p.category,p.brand,p.model,p.specs,p.price_range,p.image_url,p.badge||'',p.in_stock,p.sort_order]);
      }
    }
    seeded = true;
  } catch(e) { useStatic = true; }
};

router.get('/', async (req, res) => {
  if (useStatic) return res.json({ success:true, data: SEED.map((p,i)=>({...p,id:i+1})) });
  await seed();
  try {
    const cat = req.query.category;
    const q = cat ? 'SELECT * FROM product_catalog WHERE category=? ORDER BY sort_order ASC' : 'SELECT * FROM product_catalog ORDER BY sort_order ASC';
    const [rows] = await db.query(q, cat ? [cat] : []);
    res.json({ success:true, data: rows });
  } catch(e) {
    if (e.code==='ECONNREFUSED'||e.code==='ER_NO_SUCH_TABLE') { useStatic=true; return res.json({success:true,data:SEED.map((p,i)=>({...p,id:i+1}))}); }
    res.status(500).json({success:false,message:'Failed'});
  }
});

router.get('/categories', async (req, res) => {
  const cats = [...new Set(SEED.map(p=>p.category))];
  if (useStatic) return res.json({success:true,data:cats});
  try {
    const [rows] = await db.query('SELECT DISTINCT category FROM product_catalog ORDER BY sort_order ASC');
    res.json({success:true,data:rows.map(r=>r.category)});
  } catch(e) { res.json({success:true,data:cats}); }
});

// POST create (admin)
router.post('/', auth, async (req, res) => {
  try {
    const {category,brand,model,specs,price_range,image_url,badge,in_stock,sort_order,price,unit,discount_price,show_price} = req.body;
    const [r] = await db.query('INSERT INTO product_catalog (category,brand,model,specs,price_range,image_url,badge,in_stock,sort_order,price,unit,discount_price,show_price) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [category,brand,model||'',specs||'',price_range||'Contact for pricing',image_url||'',badge||'',in_stock?1:0,sort_order||0,price||null,unit||'per NOS',discount_price||null,show_price?1:0]);
    const [[p]] = await db.query('SELECT * FROM product_catalog WHERE id=?',[r.insertId]);
    res.status(201).json({success:true,data:p});
  } catch(e){res.status(500).json({success:false,message:'Failed'});}
});

router.put('/:id', auth, async (req, res) => {
  try {
    const fields=['category','brand','model','specs','price_range','image_url','badge','in_stock','sort_order','price','unit','discount_price','show_price'];
    const updates=[],params=[];
    fields.forEach(f=>{if(req.body[f]!==undefined){updates.push(f+'=?');params.push(req.body[f]);}});
    params.push(req.params.id);
    await db.query('UPDATE product_catalog SET '+updates.join(',')+ ' WHERE id=?',params);
    const [[p]] = await db.query('SELECT * FROM product_catalog WHERE id=?',[req.params.id]);
    res.json({success:true,data:p});
  } catch(e){res.status(500).json({success:false,message:'Failed'});}
});

router.delete('/:id', auth, async (req, res) => {
  try{await db.query('DELETE FROM product_catalog WHERE id=?',[req.params.id]);res.json({success:true});}
  catch(e){res.status(500).json({success:false,message:'Failed'});}
});

module.exports = router;
