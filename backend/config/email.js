const nodemailer = require('nodemailer');

// Helper to escape HTML entities and prevent XSS in email templates
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const isEmailConfigured = process.env.SMTP_USER && process.env.SMTP_PASS && process.env.SMTP_USER !== 'your_email@gmail.com';

const transporter = isEmailConfigured ? nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
}) : null;

const sendBookingConfirmation = async (booking) => {
  if (!transporter) {
    console.log('Email not configured, skipping confirmation email');
    return;
  }
  
  const formattedDate = new Date(booking.appointment_date).toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const mailOptions = {
    from: `"Sologix Energy" <${process.env.SMTP_USER}>`,
    to: booking.customer_email,
    subject: `Booking Confirmed - ${booking.booking_id} | Sologix Energy`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Poppins', Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #059669 0%, #10b981 50%, #14b8a6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .booking-id { font-size: 24px; font-weight: bold; margin-top: 10px; }
          .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .detail-label { font-weight: bold; color: #666; }
          .amount { font-size: 24px; color: #059669; font-weight: bold; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .logo { display: flex; align-items: center; justify-content: center; gap: 10px; }
          .logo-text { text-align: left; }
          .logo-main { font-size: 28px; font-weight: bold; }
          .logo-sub { font-size: 16px; opacity: 0.9; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">
              <div>
                <svg width="50" height="50" viewBox="0 0 60 60" fill="none">
                  <circle cx="30" cy="30" r="28" fill="#065f46"/>
                  <circle cx="30" cy="30" r="20" fill="#10b981"/>
                  <circle cx="30" cy="30" r="8" fill="#fbbf24"/>
                  <circle cx="30" cy="30" r="4" fill="#f97316"/>
                </svg>
              </div>
              <div class="logo-text">
                <div class="logo-main">Sologix</div>
                <div class="logo-sub">Energy</div>
              </div>
            </div>
            <p style="margin-top: 15px; font-size: 14px;">Invest in Clean and Environment Friendly Energy Generation</p>
          </div>
          <div class="content">
            <h2>Booking Confirmed!</h2>
            <p>Dear ${escapeHtml(booking.customer_name)},</p>
            <p>Thank you for choosing Sologix Energy for your solar installation. Your appointment has been successfully booked.</p>
            
            <div class="details">
              <div class="detail-row">
                <span class="detail-label">Booking ID:</span>
                <span class="booking-id">${booking.booking_id}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Service:</span>
                <span>${booking.service_name}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Date:</span>
                <span>${formattedDate}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Time:</span>
                <span>${booking.appointment_time}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Duration:</span>
                <span>${booking.duration_hours || 4} hours</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span>Free Booking — Confirmed</span>
              </div>
            </div>
            
            <p><strong>What's Next?</strong></p>
            <p>Our technical team will contact you within 24 hours to confirm the details and discuss the next steps for your solar installation.</p>
            
            <p><strong>Contact Us:</strong></p>
            <p>📞 Phone: +91 9876543210<br>
            📧 Email: info@sologixenergy.in<br>
            🌐 Website: www.sologixenergy.in</p>
            
            <p style="margin-top: 20px; padding: 15px; background: #ecfdf5; border-radius: 5px; border-left: 4px solid #10b981;">
              <strong>Important:</strong> No payment required at booking. Our team will provide a detailed quote after the initial consultation.
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Sologix Energy. All rights reserved.</p>
            <p>Ranchi, Jharkhand, India</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Booking confirmation email sent to ${booking.customer_email}`);
  } catch (error) {
    console.error('Error sending booking confirmation email:', error);
  }
};

const sendStatusUpdate = async (booking) => {
  if (!transporter) {
    console.log('Email not configured, skipping status update email');
    return;
  }

  const statusMessages = {
    pending: 'is pending review',
    confirmed: 'has been confirmed',
    cancelled: 'has been cancelled',
    completed: 'has been completed',
    rescheduled: 'has been rescheduled'
  };

  const formattedDate = new Date(booking.appointment_date).toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const mailOptions = {
    from: `"Sologix Energy" <${process.env.SMTP_USER}>`,
    to: booking.customer_email,
    subject: `Appointment Update - ${booking.booking_id} | Sologix Energy`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Poppins', Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #059669; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .detail-label { font-weight: bold; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>☀️ Sologix Energy</h1>
            <p>Appointment Update</p>
          </div>
          <div class="content">
            <p>Dear ${escapeHtml(booking.customer_name)},</p>
            <p>Your appointment <strong>${booking.booking_id}</strong> ${statusMessages[booking.status] || 'has been updated'}.</p>
            
            <div class="details">
              <div class="detail-row">
                <span class="detail-label">Service:</span>
                <span>${booking.service_name}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Date:</span>
                <span>${formattedDate}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Time:</span>
                <span>${booking.appointment_time}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span style="text-transform: capitalize; font-weight: bold; color: #059669;">${booking.status}</span>
              </div>
            </div>
            
            ${booking.admin_notes ? `<p><strong>Notes:</strong> ${escapeHtml(booking.admin_notes)}</p>` : ''}
            
            <p>If you have any questions, please contact us at +91 9876543210 or email info@sologixenergy.in</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Status update email sent to ${booking.customer_email}`);
  } catch (error) {
    console.error('Error sending status update email:', error);
  }
};

const sendCustomEmail = async (to, subject, message, customerName = 'Customer') => {
  if (!transporter) {
    console.log('Email not configured, skipping custom email');
    return;
  }

  const mailOptions = {
    from: `"Sologix Energy" <${process.env.SMTP_USER}>`,
    to,
    subject: `${subject} | Sologix Energy`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Poppins', Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>☀️ Sologix Energy</h1>
          </div>
          <div class="content">
            <p>Dear ${escapeHtml(customerName)},</p>
            <div style="white-space: pre-wrap;">${escapeHtml(message)}</div>
            <br>
            <p>Best regards,<br>Sologix Energy Team</p>
            <p style="font-size: 12px; color: #666;">
              📞 +91 9876543210 | 📧 info@sologixenergy.in<br>
              🌐 www.sologixenergy.in
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Custom email sent to ${to}`);
  } catch (error) {
    console.error('Error sending custom email:', error);
    throw error;
  }
};

module.exports = { sendBookingConfirmation, sendStatusUpdate, sendCustomEmail };
