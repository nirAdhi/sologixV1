const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const db = require('../config/database');
const auth = require('../middleware/auth');
const { requirePermission } = require('../middleware/auth');
const canManage = requirePermission('manage_services');

// Configure Cloudinary
const cloudinary = require('cloudinary').v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Log Cloudinary configuration status
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.warn('WARNING: Cloudinary environment variables not fully configured. Cloud features may not work.');
} else {
  console.log('Cloudinary configured for cloud:', process.env.CLOUDINARY_CLOUD_NAME);
}

console.log('Upload route loaded');

// Allowed MIME types for uploads
const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const validateUpload = (filename, mimetype, size) => {
  const ext = require('path').extname(filename).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) throw new Error('File type not allowed. Only images are accepted.');
  if (!ALLOWED_MIME_TYPES.includes(mimetype)) throw new Error('Invalid file MIME type.');
  if (size > MAX_FILE_SIZE) throw new Error('File too large. Maximum 5MB allowed.');
  // Prevent null bytes in filename
  if (filename.includes('\0') || filename.includes('%00')) throw new Error('Invalid filename.');
  return true;
};


// Use project directory for uploads (will be committed to git)
const uploadDir = path.join(__dirname, '..', 'uploads');
console.log('Upload directory:', uploadDir);

// Ensure directory exists
try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('Created upload directory:', uploadDir);
  }
} catch (err) {
  console.error('Error creating upload dir:', err);
}

// Convert Google Drive URL to direct download URL
function convertGoogleDriveUrl(url) {
  // Handle different Google Drive URL formats
  // Format 1: https://drive.google.com/file/d/FILE_ID/view
  // Format 2: https://drive.google.com/open?id=FILE_ID
  // Format 3: https://drive.google.com/uc?id=FILE_ID
  
  // Check if this is a folder URL
  if (url.includes('/folders/') || url.includes('folder?id=')) {
    throw new Error('Google Drive folder URLs are not supported. Please use a direct file link (right-click file → "Get link" → "Anyone with the link" → Copy link)');
  }
  
  let fileId = null;
  
  // Extract file ID from various URL formats
  const patterns = [
    /\/file\/d\/([^\/]+)/,
    /[?&]id=([^&]+)/,
    /\/d\/([^\/]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      fileId = match[1];
      break;
    }
  }
  
  if (fileId) {
    // Return direct download URL
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  }
  
  // If no file ID found, throw error
  throw new Error('Invalid Google Drive URL. Please use a direct file link (right-click file → "Get link" → "Anyone with the link" → Copy link)');
}

// Allowed MIME types for image uploads
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
// ALLOWED_EXTENSIONS defined above in security validation block

function isValidImageType(mimeType) {
  return ALLOWED_IMAGE_TYPES.includes(mimeType);
}

function validateFileExtension(filename) {
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return ALLOWED_EXTENSIONS.includes(ext);
}

// Upload image to Cloudinary from Google Drive URL (admin only)
router.post('/cloudinary/upload-from-drive', auth, canManage, async (req, res) => {
  try {
    const { googleDriveUrl, serviceId, serviceName } = req.body;
    
    if (!googleDriveUrl) {
      return res.status(400).json({ success: false, message: 'No Google Drive URL provided' });
    }

    // Validate URL format
    if (!googleDriveUrl.startsWith('http://') && !googleDriveUrl.startsWith('https://')) {
      return res.status(400).json({ success: false, message: 'Invalid URL format' });
    }

    // Convert Google Drive URL to direct download URL
    let directUrl;
    try {
      directUrl = convertGoogleDriveUrl(googleDriveUrl);
    } catch (conversionError) {
      return res.status(400).json({ success: false, message: conversionError.message });
    }
    console.log('Converted URL:', directUrl);

    // Generate a public ID for the image
    const publicId = `sologix/services/${serviceName || 'service'}-${serviceId || 'temp'}-${Date.now()}`;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(directUrl, {
      public_id: publicId,
      folder: 'sologix/services',
      transformation: [
        { width: 800, height: 600, crop: 'fill' },
        { quality: 'auto' },
        { fetch_format: 'auto' }
      ]
    });

    console.log('Cloudinary upload result:', result.secure_url);

    // Update service with Cloudinary URL if serviceId provided
    if (serviceId) {
      await db.query('UPDATE services SET image_url = ? WHERE id = ?', [result.secure_url, serviceId]);
      console.log('Updated service:', serviceId);
    }

    res.json({ 
      success: true, 
      message: 'Image uploaded to Cloudinary',
      imageUrl: result.secure_url,
      publicId: result.public_id
    });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    res.status(500).json({ success: false, message: 'Upload failed' });
  }
});

// Upload image to Cloudinary from base64 (admin only)
router.post('/cloudinary/upload-base64', auth, canManage, async (req, res) => {
  try {
    const { image, serviceId, serviceName } = req.body;
    
    if (!image) {
      return res.status(400).json({ success: false, message: 'No image provided' });
    }

    // Generate a public ID for the image
    const publicId = `sologix/services/${serviceName || 'service'}-${serviceId || 'temp'}-${Date.now()}`;

    // Upload to Cloudinary
    // SECURITY: same local-file-path issue as upload-url; require a real image data URI.
    if (typeof image !== 'string' || !/^data:image\/(png|jpe?g|gif|webp);base64,[A-Za-z0-9+/=]+$/.test(image)) {
      return res.status(400).json({ success: false, message: 'image must be a base64 PNG/JPEG/GIF/WebP data URI' });
    }
    const result = await cloudinary.uploader.upload(image, {
      public_id: publicId,
      folder: 'sologix/services',
      transformation: [
        { width: 800, height: 600, crop: 'fill' },
        { quality: 'auto' },
        { fetch_format: 'auto' }
      ]
    });

    console.log('Cloudinary upload result:', result.secure_url);

    // Update service with Cloudinary URL if serviceId provided
    if (serviceId) {
      await db.query('UPDATE services SET image_url = ? WHERE id = ?', [result.secure_url, serviceId]);
      console.log('Updated service:', serviceId);
    }

    res.json({ 
      success: true, 
      message: 'Image uploaded to Cloudinary',
      imageUrl: result.secure_url,
      publicId: result.public_id
    });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    res.status(500).json({ success: false, message: 'Upload failed' });
  }
});

// Upload image to Cloudinary from URL (admin only)
router.post('/cloudinary/upload-url', auth, canManage, async (req, res) => {
  try {
    const { imageUrl, serviceId, serviceName } = req.body;
    
    if (!imageUrl) {
      return res.status(400).json({ success: false, message: 'No image URL provided' });
    }

    // Generate a public ID for the image
    const publicId = `sologix/services/${serviceName || 'service'}-${serviceId || 'temp'}-${Date.now()}`;

    // Upload to Cloudinary
    // SECURITY: the Cloudinary SDK treats a non-URL string as a LOCAL FILE PATH and
    // uploads it — e.g. "/app/backend/.env". Only https URLs are accepted.
    let parsedUrl;
    try { parsedUrl = new URL(imageUrl); } catch (_) { parsedUrl = null; }
    if (!parsedUrl || parsedUrl.protocol !== 'https:') {
      return res.status(400).json({ success: false, message: 'imageUrl must be an https:// URL' });
    }
    const result = await cloudinary.uploader.upload(imageUrl, {
      public_id: publicId,
      folder: 'sologix/services',
      transformation: [
        { width: 800, height: 600, crop: 'fill' },
        { quality: 'auto' },
        { fetch_format: 'auto' }
      ]
    });

    console.log('Cloudinary upload result:', result.secure_url);

    // Update service with Cloudinary URL if serviceId provided
    if (serviceId) {
      await db.query('UPDATE services SET image_url = ? WHERE id = ?', [result.secure_url, serviceId]);
      console.log('Updated service:', serviceId);
    }

    res.json({ 
      success: true, 
      message: 'Image uploaded to Cloudinary',
      imageUrl: result.secure_url,
      publicId: result.public_id
    });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    res.status(500).json({ success: false, message: 'Upload failed' });
  }
});

// Delete image from Cloudinary (admin only)
router.delete('/cloudinary/delete', auth, canManage, async (req, res) => {
  try {
    const { publicId } = req.body;
    
    if (!publicId) {
      return res.status(400).json({ success: false, message: 'No public ID provided' });
    }

    // Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId);
    console.log('Cloudinary delete result:', result);

    res.json({ success: true, message: 'Image deleted from Cloudinary' });
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    res.status(500).json({ success: false, message: 'Delete failed: ' + error.message });
  }
});

// Save image from base64 to file (legacy - admin only)
router.post('/save-image-url', auth, canManage, async (req, res) => {
  try {
    const { imageUrl, serviceId } = req.body;
    
    if (!imageUrl) {
      return res.status(400).json({ success: false, message: 'No image provided' });
    }

    // SECURITY: serviceId was interpolated into a filesystem path unvalidated.
    const serviceIdNum = Number.parseInt(serviceId, 10);
    if (!Number.isInteger(serviceIdNum) || serviceIdNum <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid serviceId' });
    }
    const dataUriMatch = /^data:image\/(png|jpe?g|gif|webp);base64,([A-Za-z0-9+/=]+)$/.exec(imageUrl || '');
    if (!dataUriMatch) {
      return res.status(400).json({ success: false, message: 'imageUrl must be a base64 PNG/JPEG/GIF/WebP data URI' });
    }
    if (dataUriMatch[2].length > 4 * 1024 * 1024) { // ~3MB decoded
      return res.status(413).json({ success: false, message: 'Image too large (max ~3MB)' });
    }
    const ext = dataUriMatch[1] === 'jpeg' ? 'jpg' : dataUriMatch[1];
    let filename = `service-${serviceIdNum}-${Date.now()}.${ext}`;
    let filepath = path.join(uploadDir, filename);
    
    // If it's base64 data, save to file
    if (imageUrl.startsWith('data:')) {
      const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      fs.writeFileSync(filepath, buffer);
      filename = `/uploads/${filename}`;
    } else {
      // It's a URL - just save the URL
      filename = imageUrl;
    }

    if (serviceId) {
      await db.query('UPDATE services SET image_url = ? WHERE id = ?', [filename, serviceId]);
      console.log('Image saved for service:', serviceId, filename);
    }

    res.json({ success: true, message: 'Image saved successfully', imageUrl: filename });
  } catch (error) {
    console.error('Save error:', error);
    res.status(500).json({ success: false, message: 'Failed to save: ' + error.message });
  }
});

// Delete service image (legacy - admin only)
router.delete('/delete-service-image', auth, canManage, async (req, res) => {
  try {
    const { imageUrl, serviceId } = req.body;

    // If it's a local file, delete it
    if (imageUrl && imageUrl.startsWith('/uploads/')) {
      // SECURITY (was High): "/uploads/../server.js" passed the startsWith check and
      // path.join normalised the "..", allowing deletion of ANY file on the server.
      // Only a bare filename inside the uploads directory is accepted now.
      const uploadsRoot = path.resolve(__dirname, '..', 'uploads');
      const filename = path.basename(imageUrl.slice('/uploads/'.length));
      const filepath = path.resolve(uploadsRoot, filename);
      if (!filename || !filepath.startsWith(uploadsRoot + path.sep)) {
        return res.status(400).json({ success: false, message: 'Invalid image path' });
      }
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
        console.log('Deleted file:', filepath);
      }
    }

    if (serviceId) {
      await db.query('UPDATE services SET image_url = NULL WHERE id = ?', [serviceId]);
    }

    res.json({ success: true, message: 'Image deleted' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ success: false, message: 'Delete failed' });
  }
});

// ===== IMAGE MAPPINGS (Google Drive to Cloudinary sync) =====

// Get all image mappings with service names
router.get('/image-mappings', auth, async (req, res) => {
  try {
    const [mappings] = await db.query(`
      SELECT im.*, s.name as service_name 
      FROM image_mappings im
      LEFT JOIN services s ON im.service_id = s.id
      ORDER BY im.created_at DESC
    `);
    res.json({ success: true, data: mappings });
  } catch (error) {
    console.error('Error fetching image mappings:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch image mappings' });
  }
});

// Create new image mapping
router.post('/image-mappings', auth, canManage, async (req, res) => {
  try {
    const { service_id, google_drive_url } = req.body;
    
    if (!google_drive_url) {
      return res.status(400).json({ success: false, message: 'Google Drive URL is required' });
    }

    // Validate Google Drive URL format
    try {
      convertGoogleDriveUrl(google_drive_url);
    } catch (conversionError) {
      return res.status(400).json({ success: false, message: conversionError.message });
    }

    const [result] = await db.query(
      'INSERT INTO image_mappings (service_id, google_drive_url) VALUES (?, ?)',
      [service_id || null, google_drive_url]
    );

    const [newMapping] = await db.query(
      'SELECT * FROM image_mappings WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({ 
      success: true, 
      message: 'Image mapping created',
      data: newMapping[0]
    });
  } catch (error) {
    console.error('Error creating image mapping:', error);
    res.status(500).json({ success: false, message: 'Failed to create image mapping' });
  }
});

// Update image mapping
router.put('/image-mappings/:id', auth, canManage, async (req, res) => {
  try {
    const { id } = req.params;
    const { service_id, google_drive_url } = req.body;
    
    if (google_drive_url) {
      // Validate Google Drive URL format
      try {
        convertGoogleDriveUrl(google_drive_url);
      } catch (conversionError) {
        return res.status(400).json({ success: false, message: conversionError.message });
      }
    }

    await db.query(
      'UPDATE image_mappings SET service_id = ?, google_drive_url = ? WHERE id = ?',
      [service_id || null, google_drive_url, id]
    );

    const [updatedMapping] = await db.query(
      'SELECT * FROM image_mappings WHERE id = ?',
      [id]
    );

    if (updatedMapping.length === 0) {
      return res.status(404).json({ success: false, message: 'Mapping not found' });
    }

    res.json({ 
      success: true, 
      message: 'Image mapping updated',
      data: updatedMapping[0]
    });
  } catch (error) {
    console.error('Error updating image mapping:', error);
    res.status(500).json({ success: false, message: 'Failed to update image mapping' });
  }
});

// Delete image mapping
router.delete('/image-mappings/:id', auth, canManage, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Optionally delete from Cloudinary if we have public_id
    const [mapping] = await db.query(
      'SELECT cloudinary_public_id FROM image_mappings WHERE id = ?',
      [id]
    );
    
    if (mapping.length > 0 && mapping[0].cloudinary_public_id) {
      try {
        await cloudinary.uploader.destroy(mapping[0].cloudinary_public_id);
      } catch (cloudinaryError) {
        console.warn('Failed to delete from Cloudinary:', cloudinaryError.message);
      }
    }
    
    await db.query('DELETE FROM image_mappings WHERE id = ?', [id]);
    
    res.json({ success: true, message: 'Image mapping deleted' });
  } catch (error) {
    console.error('Error deleting image mapping:', error);
    res.status(500).json({ success: false, message: 'Failed to delete image mapping' });
  }
});

// Sync all mappings (or specific mapping)
router.post('/sync-from-drive', auth, canManage, async (req, res) => {
  try {
    const { mapping_id } = req.query; // Optional: sync single mapping
    
    let query = 'SELECT im.*, s.name as service_name FROM image_mappings im LEFT JOIN services s ON im.service_id = s.id';
    const params = [];
    
    if (mapping_id) {
      query += ' WHERE im.id = ?';
      params.push(mapping_id);
    }
    
    const [mappings] = await db.query(query, params);
    
    if (mappings.length === 0) {
      return res.status(404).json({ success: false, message: 'No mappings found' });
    }
    
    const results = [];
    let successCount = 0;
    let errorCount = 0;
    
    for (const mapping of mappings) {
      try {
        // Convert Google Drive URL
        let directUrl;
        try {
          directUrl = convertGoogleDriveUrl(mapping.google_drive_url);
        } catch (conversionError) {
          console.error(`Failed to convert Google Drive URL for mapping ${mapping.id}:`, conversionError.message);
          results.push({
            mapping_id: mapping.id,
            service_name: mapping.service_name,
            success: false,
            error: conversionError.message
          });
          errorCount++;
          continue; // Skip to next mapping
        }
        console.log(`Syncing mapping ${mapping.id}: ${mapping.google_drive_url} -> ${directUrl}`);
        
        // Generate public ID (keep same if already exists)
        const publicId = mapping.cloudinary_public_id || 
                        `sologix/mapping-${mapping.id}-${Date.now()}`;
        
        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(directUrl, {
          public_id: publicId,
          folder: 'sologix/mappings',
          transformation: [
            { width: 800, height: 600, crop: 'fill' },
            { quality: 'auto' },
            { fetch_format: 'auto' }
          ],
          overwrite: true
        });
        
        // Update mapping
        await db.query(
          'UPDATE image_mappings SET cloudinary_public_id = ?, cloudinary_url = ?, last_synced_at = NOW() WHERE id = ?',
          [result.public_id, result.secure_url, mapping.id]
        );
        
        // Update service image if mapping has service_id
        if (mapping.service_id) {
          await db.query(
            'UPDATE services SET image_url = ? WHERE id = ?',
            [result.secure_url, mapping.service_id]
          );
        }
        
        results.push({
          mapping_id: mapping.id,
          service_name: mapping.service_name,
          success: true,
          cloudinary_url: result.secure_url
        });
        successCount++;
        
      } catch (error) {
        console.error(`Error syncing mapping ${mapping.id}:`, error);
        results.push({
          mapping_id: mapping.id,
          service_name: mapping.service_name,
          success: false,
          error: error.message
        });
        errorCount++;
      }
    }
    
    res.json({
      success: true,
      message: `Sync completed: ${successCount} successful, ${errorCount} failed`,
      summary: { total: mappings.length, successful: successCount, failed: errorCount },
      results
    });
    
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ success: false, message: 'Sync failed: ' + error.message });
  }
});

// List images from Cloudinary
router.get('/cloudinary/list', auth, async (req, res) => {
  try {
    const { next_cursor } = req.query;
    // Force the app's own folder and clamp page size (Cloudinary Admin API is rate limited).
    const folder = 'sologix/';
    const max_results = Math.min(Math.max(parseInt(req.query.max_results, 10) || 20, 1), 50);
    
    // Debug: Log Cloudinary configuration status (redacted for security)
    const cloudName = cloudinary.config().cloud_name;
    const apiKey = cloudinary.config().api_key;
    const apiSecret = cloudinary.config().api_secret;
    
    console.log('Cloudinary config check:', {
      cloud_name: cloudName ? `${cloudName.substring(0, 4)}...` : 'MISSING',
      api_key: apiKey ? `${apiKey.substring(0, 4)}...` : 'MISSING',
      api_secret: apiSecret ? 'SET' : 'MISSING'
    });
    
    // Check if Cloudinary is configured
    if (!cloudName || !apiKey || !apiSecret) {
      console.log('Cloudinary not configured, returning empty list');
      
      // Determine which variables are missing
      const missing = [];
      if (!cloudName) missing.push('CLOUDINARY_CLOUD_NAME');
      if (!apiKey) missing.push('CLOUDINARY_API_KEY');
      if (!apiSecret) missing.push('CLOUDINARY_API_SECRET');
      
      return res.json({
        success: true,
        data: {
          resources: [],
          next_cursor: null,
          total_count: 0,
          warning: `Cloudinary is not configured. Missing: ${missing.join(', ')}. Please set these environment variables in Railway.`
        }
      });
    }
    
    const options = {
      type: 'upload',
      max_results: parseInt(max_results),
      resource_type: 'image'
    };
    
    if (folder) {
      options.prefix = folder;
    }
    
    if (next_cursor) {
      options.next_cursor = next_cursor;
    }
    
    const result = await cloudinary.api.resources(options);
    
    res.json({
      success: true,
      data: {
        resources: result.resources,
        next_cursor: result.next_cursor,
        total_count: result.total_count
      }
    });
  } catch (error) {
    console.error('Cloudinary list error:', error);
    console.error('Error stack:', error.stack);
    
    // Return empty list instead of error to prevent frontend crashes
    res.json({
      success: true,
      data: {
        resources: [],
        next_cursor: null,
        total_count: 0,
        error: 'Failed to fetch Cloudinary images: ' + error.message
      }
    });
  }
});

// Check Cloudinary configuration
router.get('/cloudinary/config-check', auth, (req, res) => {
  const config = cloudinary.config();
  res.json({
    success: true,
    data: {
      cloud_name_set: !!config.cloud_name,
      api_key_set: !!config.api_key,
      api_secret_set: !!config.api_secret,
      cloud_name_preview: config.cloud_name ? `${config.cloud_name.substring(0, 4)}...` : null,
      api_key_preview: config.api_key ? `${config.api_key.substring(0, 4)}...` : null
    }
  });
});

module.exports = router;
