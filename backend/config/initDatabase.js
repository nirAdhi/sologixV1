require('dotenv').config();
const db = require('./database');

async function initDatabase() {
  const connection = await db.getConnection();
  
  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS services (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        duration_hours INT DEFAULT 4,
        image_url LONGTEXT,
        features JSON,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Fix image_url column size for existing tables
    try {
      await connection.query(`ALTER TABLE services MODIFY COLUMN image_url LONGTEXT`);
      console.log('Image URL column updated to LONGTEXT');
    } catch (err) {
      console.log('Image URL column already correct or error:', err.message);
    }

    await connection.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        phone VARCHAR(20) NOT NULL,
        password VARCHAR(255),
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add password column if it doesn't exist
    try {
      await connection.query(`ALTER TABLE customers ADD COLUMN password VARCHAR(255)`);
      console.log('Password column added to customers');
    } catch (err) {
      if (err.code !== 'ER_DUP_FIELDNAME') console.log('Password column error:', err.message);
    }

    // Add extra registration fields
    const newCustomerColumns = [
      { name: 'alternate_phone', type: 'VARCHAR(20)' },
      { name: 'city', type: 'VARCHAR(100)' },
      { name: 'state', type: 'VARCHAR(100)' },
      { name: 'pincode', type: 'VARCHAR(10)' },
      { name: 'service_interest', type: 'VARCHAR(100)' },
      { name: 'how_heard', type: 'VARCHAR(100)' }
    ];

    for (const col of newCustomerColumns) {
      try {
        await connection.query(`ALTER TABLE customers ADD COLUMN ${col.name} ${col.type}`);
        console.log(`Column ${col.name} added to customers`);
      } catch (err) {
        if (err.code !== 'ER_DUP_FIELDNAME') console.log(`${col.name} column error:`, err.message);
      }
    }

    await connection.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        booking_id VARCHAR(50) NOT NULL UNIQUE,
        customer_id INT,
        service_id INT NOT NULL,
        appointment_date DATE NOT NULL,
        appointment_time TIME NOT NULL,
        status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending',
        payment_status ENUM('pending', 'pending_verification', 'completed', 'failed', 'refunded') DEFAULT 'pending',
        payment_id VARCHAR(255),
        razorpay_order_id VARCHAR(255),
        razorpay_payment_id VARCHAR(255),
        total_amount DECIMAL(10, 2) DEFAULT 2000.00,
        notes TEXT,
        admin_notes TEXT,
        delivery_status ENUM('pending', 'ordered', 'shipped', 'delivered', 'not_applicable') DEFAULT 'not_applicable',
        delivery_date DATE,
        delivery_notes TEXT,
        installation_scheduled_date DATE,
        installation_completed_date DATE,
        installation_notes TEXT,
        work_progress ENUM('not_started', 'materials_ordered', 'site_preparation', 'installation', 'testing', 'completed') DEFAULT 'not_started',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
        FOREIGN KEY (service_id) REFERENCES services(id)
      )
    `);

    // Fix payment_status enum for existing databases
    try {
      await connection.query(`
        ALTER TABLE bookings MODIFY COLUMN payment_status ENUM('pending', 'pending_verification', 'completed', 'failed', 'refunded') DEFAULT 'pending'
      `);
      console.log('Payment status enum updated');
    } catch (err) {
      if (err.code !== 'ER_DUP_ENTRY') console.log('Payment status enum already correct or error:', err.message);
    }

    // Add delivery and installation columns if they don't exist
    const columnsToAdd = [
      { name: 'delivery_status', type: "ENUM('pending', 'ordered', 'shipped', 'delivered', 'not_applicable') DEFAULT 'not_applicable'" },
      { name: 'delivery_date', type: 'DATE' },
      { name: 'delivery_notes', type: 'TEXT' },
      { name: 'installation_scheduled_date', type: 'DATE' },
      { name: 'installation_completed_date', type: 'DATE' },
      { name: 'installation_notes', type: 'TEXT' },
      { name: 'work_progress', type: "ENUM('not_started', 'materials_ordered', 'site_preparation', 'installation', 'testing', 'completed') DEFAULT 'not_started'" }
    ];

    for (const col of columnsToAdd) {
      try {
        await connection.query(`ALTER TABLE bookings ADD COLUMN ${col.name} ${col.type}`);
        console.log(`Column ${col.name} added to bookings`);
      } catch (err) {
        if (err.code !== 'ER_DUP_FIELDNAME') console.log(`${col.name} column error:`, err.message);
      }
    }

    // Add payment tracking columns
    const paymentColumns = [
      { name: 'payment_method', type: "VARCHAR(50) DEFAULT NULL" },
      { name: 'payment_failure_reason', type: 'TEXT' },
      { name: 'payment_gateway', type: "VARCHAR(20) DEFAULT 'none'" },
      { name: 'payment_completed_at', type: 'TIMESTAMP NULL' }
    ];

    for (const col of paymentColumns) {
      try {
        await connection.query(`ALTER TABLE bookings ADD COLUMN ${col.name} ${col.type}`);
        console.log(`Column ${col.name} added to bookings`);
      } catch (err) {
        if (err.code !== 'ER_DUP_FIELDNAME') console.log(`${col.name} column error:`, err.message);
      }
    }

    await connection.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        role ENUM('super_admin', 'admin', 'staff') DEFAULT 'staff',
        permissions JSON,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add new columns to admins if they don't exist
    try {
      await connection.query(`ALTER TABLE admins MODIFY COLUMN role ENUM('super_admin', 'admin', 'staff') DEFAULT 'staff'`);
      console.log('Admin role enum updated');
    } catch (err) {
      console.log('Admin role enum error:', err.message);
    }

    try {
      await connection.query(`ALTER TABLE admins ADD COLUMN permissions JSON`);
      console.log('Permissions column added to admins');
    } catch (err) {
      if (err.code !== 'ER_DUP_FIELDNAME') console.log('Permissions column error:', err.message);
    }

    try {
      await connection.query(`ALTER TABLE admins ADD COLUMN is_active BOOLEAN DEFAULT true`);
      console.log('is_active column added to admins');
    } catch (err) {
      if (err.code !== 'ER_DUP_FIELDNAME') console.log('is_active column error:', err.message);
    }

    // Update existing admin to super_admin
    try {
      await connection.query(`UPDATE admins SET role = 'super_admin' WHERE email = 'admin@sologixenergy.in'`);
      console.log('Main admin updated to super_admin');
    } catch (err) {
      console.log('Admin role update error:', err.message);
    }

    // WhatsApp Conversation States Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS whatsapp_conversations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        phone VARCHAR(20) NOT NULL UNIQUE,
        current_step VARCHAR(50) DEFAULT 'START',
        temp_data JSON,
        customer_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_phone (phone)
      )
    `);

    // WhatsApp Messages Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS whatsapp_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        phone VARCHAR(20) NOT NULL,
        booking_id VARCHAR(50),
        message TEXT NOT NULL,
        direction ENUM('INBOUND', 'OUTBOUND') NOT NULL,
        whatsapp_message_id VARCHAR(255),
        image_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_phone_time (phone, created_at),
        INDEX idx_booking (booking_id)
      )
    `);

    // Add image_url column if it doesn't exist
    try {
      await connection.query(`ALTER TABLE whatsapp_messages ADD COLUMN image_url VARCHAR(500)`);
    } catch (err) {
      if (err.code !== 'ER_DUP_FIELDNAME') console.log('image_url column error:', err.message);
    }

    // WhatsApp Quick Replies Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS whatsapp_quick_replies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        keyword VARCHAR(100) NOT NULL UNIQUE,
        response TEXT NOT NULL,
        action VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Callback Requests Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS callback_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        message TEXT,
        status ENUM('pending', 'contacted', 'failed') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Image Mappings Table (for Google Drive to Cloudinary sync)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS image_mappings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        service_id INT NULL,
        google_drive_url TEXT NOT NULL,
        cloudinary_public_id VARCHAR(255),
        cloudinary_url TEXT,
        last_synced_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL
      )
    `);

    // Payment Transactions audit log table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS payment_transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        booking_id VARCHAR(50) NOT NULL,
        transaction_type ENUM('razorpay_order', 'razorpay_payment', 'razorpay_webhook', 'manual_upi', 'admin_confirm') NOT NULL,
        razorpay_order_id VARCHAR(255),
        razorpay_payment_id VARCHAR(255),
        payment_method VARCHAR(50),
        amount DECIMAL(10,2),
        currency VARCHAR(10) DEFAULT 'INR',
        status ENUM('created', 'authorized', 'captured', 'failed', 'refunded') NOT NULL,
        failure_reason TEXT,
        gateway_response JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_pt_booking (booking_id),
        INDEX idx_pt_status (status),
        INDEX idx_pt_created (created_at)
      )
    `);
    console.log('Payment transactions table created');

    // Insert default quick replies
    const [replies] = await connection.query('SELECT COUNT(*) as count FROM whatsapp_quick_replies');
    if (replies[0].count === 0) {
      await connection.query(`
        INSERT INTO whatsapp_quick_replies (keyword, response, action) VALUES
        ('booking', 'Great! Let me help you book a solar consultation. What is your name?', 'START'),
        ('status', 'To check your booking status, please provide your booking ID or phone number.', 'CHECK_STATUS'),
        ('contact', 'You can reach us at:\n📞 +91 9876543210\n📧 info@sologixenergy.in\n🌐 www.sologixenergy.in', 'CONTACT'),
        ('services', 'We offer:\n1. Residential Solar\n2. Commercial Solar\n3. Solar Water Heater\n4. Solar Inverter\n5. Maintenance\n\nReply with the number to know more!', 'SERVICES'),
        ('help', 'I can help you with:\n- Booking a consultation\n- Checking booking status\n- Information about our services\n- Contact details\n\nJust type your query!', 'HELP')
      `);
      console.log('Default WhatsApp quick replies inserted');
    }

    const [services] = await connection.query('SELECT COUNT(*) as count FROM services');
    if (services[0].count === 0) {
      await connection.query(`
        INSERT INTO services (name, description, price, duration_hours, features, is_active) VALUES
        ('Residential Solar Installation', 'Complete solar panel installation for homes with high-efficiency panels and professional setup.', 150000, 8, '["High-efficiency panels", "Professional installation", "25-year warranty", "Free maintenance for 1 year"]', true),
        ('Commercial Solar Installation', 'Large-scale solar solutions for businesses and commercial properties.', 500000, 16, '["Industrial-grade panels", "Custom design", "ROI analysis", "Government subsidy assistance"]', true),
        ('Solar Water Heater', 'Solar water heating systems for residential and commercial use.', 25000, 4, '["Energy-efficient", "Low maintenance", "Instant hot water", "5-year warranty"]', true),
        ('Solar Inverter Setup', 'High-capacity solar inverter installation with battery backup.', 35000, 4, '["Power backup", "Smart monitoring", "Battery included", "2-year warranty"]', true),
        ('Solar Panel Maintenance', 'Comprehensive maintenance and cleaning service for existing solar installations.', 2000, 2, '["Panel cleaning", "Performance check", "Minor repairs", "Detailed report"]', true)
      `);
      console.log('Sample services inserted');
    }

    const [admins] = await connection.query('SELECT COUNT(*) as count FROM admins');
    if (admins[0].count === 0) {
      try {
        const bcrypt = require('bcryptjs');
const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Adminpass2', 12);
        const allPermissions = JSON.stringify({
          manage_services: true,
          manage_bookings: true,
          manage_subadmins: true,
          manage_customers: true,
          manage_leads: true,
          manage_whatsapp: true,
          manage_testimonials: true,
          manage_delivery: true,
          view_reports: true,
          manage_settings: true
        });
        await connection.query(`
          INSERT INTO admins (email, password, name, role, permissions, is_active) VALUES (?, ?, 'Super Admin', 'super_admin', ?, true)
        `, [process.env.ADMIN_EMAIL || 'admin@sologixenergy.in', hashedPassword, allPermissions]);
        console.log('Default super admin created');
      } catch (err) {
        if (err.code !== 'ER_DUP_ENTRY') throw err;
        console.log('Admin already exists');
      }
    }
    
    // Ensure at least one super admin exists
    try {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 12);
      const allPermissions = JSON.stringify({
        manage_services: true,
        manage_bookings: true,
        manage_subadmins: true,
        manage_customers: true,
        view_reports: true,
        manage_settings: true
      });
      
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@sologixenergy.in';
      const [existing] = await connection.query('SELECT id FROM admins WHERE email = ?', [adminEmail]);
      
      if (existing.length > 0) {
        // If we are in production and have a specific password provided in ENV, update it
        if (process.env.ADMIN_PASSWORD) {
          await connection.query(
            'UPDATE admins SET password = ?, role = ?, permissions = ?, is_active = true WHERE email = ?',
            [hashedPassword, 'super_admin', allPermissions, adminEmail]
          );
          console.log('Admin password and role updated from environment variables');
        } else {
          // Just ensure role and permissions are correct, don't touch password
          await connection.query(
            'UPDATE admins SET role = ?, permissions = ?, is_active = true WHERE email = ?',
            ['super_admin', allPermissions, adminEmail]
          );
          console.log('Admin role and permissions ensured');
        }
      } else {
        await connection.query(`
          INSERT INTO admins (email, password, name, role, permissions, is_active) VALUES (?, ?, 'Super Admin', 'super_admin', ?, true)
        `, [adminEmail, hashedPassword, allPermissions]);
        console.log('Super admin created');
      }
    } catch (err) {
      console.warn('Could not setup admin:', err.message);
    }


    // Testimonials table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS testimonials (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(255),
        company VARCHAR(255),
        location VARCHAR(255),
        review TEXT NOT NULL,
        capacity VARCHAR(50),
        savings VARCHAR(50),
        rating TINYINT DEFAULT 5,
        photo_url TEXT,
        is_active BOOLEAN DEFAULT true,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('Testimonials table ready');

    
    // Site settings table (key-value store for homepage content)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS site_settings (
        \`key\` VARCHAR(100) PRIMARY KEY,
        \`value\` MEDIUMTEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Projects table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        location VARCHAR(255),
        capacity VARCHAR(50),
        type VARCHAR(50) DEFAULT 'Residential',
        description TEXT,
        image_url TEXT,
        savings VARCHAR(100),
        is_featured BOOLEAN DEFAULT false,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_featured (is_featured),
        INDEX idx_sort (sort_order)
      )
    `);
    console.log('Site settings and projects tables ready');

    
    // Product catalog table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS product_catalog (
        id INT AUTO_INCREMENT PRIMARY KEY,
        category VARCHAR(100) NOT NULL,
        brand VARCHAR(100) NOT NULL,
        model VARCHAR(255) NOT NULL,
        specs TEXT,
        price_range VARCHAR(100) DEFAULT 'Contact for pricing',
        image_url TEXT,
        badge VARCHAR(50) DEFAULT '',
        in_stock BOOLEAN DEFAULT true,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_category (category),
        INDEX idx_sort (sort_order)
      )
    `);

    // Product orders table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS product_orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(20) NOT NULL,
        address TEXT,
        items MEDIUMTEXT NOT NULL,
        notes TEXT,
        customer_type ENUM('customer','distributor','installer') DEFAULT 'customer',
        status ENUM('pending','contacted','confirmed','completed','cancelled') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_status (status),
        INDEX idx_created (created_at)
      )
    `);

    // Safe column migrations (MySQL 5.7 compatible — add each column separately, ignore if exists)
    const safeAddColumn = async (table, col, def) => {
      try { await db.query('ALTER TABLE ' + table + ' ADD COLUMN ' + col + ' ' + def); }
      catch(e) { /* column already exists — ignore */ }
    };
    await safeAddColumn('product_orders', 'razorpay_order_id', 'VARCHAR(100) DEFAULT NULL');
    await safeAddColumn('product_orders', 'payment_id', 'VARCHAR(100) DEFAULT NULL');
    await safeAddColumn('product_orders', 'amount', 'DECIMAL(12,2) DEFAULT NULL');
    await safeAddColumn('product_catalog', 'price', 'DECIMAL(12,2) DEFAULT NULL');
    await safeAddColumn('product_catalog', 'unit', "VARCHAR(50) DEFAULT 'per NOS'");
    await safeAddColumn('product_catalog', 'discount_price', 'DECIMAL(12,2) DEFAULT NULL');
    await safeAddColumn('product_catalog', 'show_price', 'TINYINT(1) DEFAULT 0');

    console.log('Product catalog and orders tables ready');

        // Leads CRM table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(20) NOT NULL,
        address TEXT,
        service_interest VARCHAR(100),
        message TEXT,
        source VARCHAR(50) DEFAULT 'website',
        stage ENUM('new','contacted','qualified','proposal_sent','won','lost') DEFAULT 'new',
        priority ENUM('low','medium','high') DEFAULT 'medium',
        assigned_to VARCHAR(255),
        notes TEXT,
        follow_up_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_stage (stage),
        INDEX idx_created (created_at)
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS lead_notes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        lead_id INT NOT NULL,
        note TEXT NOT NULL,
        created_by VARCHAR(255) DEFAULT 'Admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
      )
    `);
    console.log('All tables ready');

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = initDatabase;
