# Sologix Energy - Solar Booking Application

A web application for Sologix Energy that allows customers to book appointments for solar installations with an upfront payment of ₹2,000.

## Features

### Customer Portal
- View solar service offerings
- Book appointments with date/time selection
- Pay ₹2,000 booking fee via Razorpay
- Receive automated confirmation emails
- View booking history

### Admin Dashboard
- View all appointments with status
- Filter appointments by date, customer, status
- Confirm, reschedule, or cancel appointments
- Send custom emails to customers
- Manage services

## Tech Stack

- **Backend**: Node.js, Express.js
- **Frontend**: React.js, Tailwind CSS
- **Database**: MySQL
- **Payment**: Razorpay
- **Email**: Nodemailer (SMTP)

## Prerequisites

- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- Razorpay account (for payments)
- SMTP credentials (for emails)

## Installation

### 1. Clone the repository

```bash
cd solar-booking-app
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your credentials
# - Database credentials
# - Razorpay keys
# - SMTP credentials
# - JWT secret

# Create MySQL database
mysql -u root -p
CREATE DATABASE solar_booking;
exit;

# Initialize database with tables and seed data
npm run init-db

# Start the server
npm run dev
```

### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env if needed (default API URL is http://localhost:5000/api)

# Start the development server
npm start
```

### 4. Access the Application

- Customer Portal: http://localhost:3000
- Admin Dashboard: http://localhost:3000/admin/login

## Default Admin Credentials

- Email: `admin@sologixenergy.in`
- Password: `admin123`

**Important**: Change these credentials in production!

## Environment Variables

### Backend (.env)

```
PORT=5000

# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=solar_booking

# JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d

# Razorpay
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# SMTP (for emails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Default Admin
ADMIN_EMAIL=admin@sologixenergy.in
ADMIN_PASSWORD=admin123
```

### Frontend (.env)

```
REACT_APP_API_URL=http://localhost:5000/api
```

## API Endpoints

### Public Endpoints

- `GET /api/services` - Get all active services
- `GET /api/services/:id` - Get service details
- `POST /api/bookings` - Create a booking
- `GET /api/bookings/:id` - Get booking details
- `GET /api/bookings?email=xxx` - Get bookings by email
- `POST /api/payments/create-order` - Create Razorpay order
- `POST /api/payments/verify` - Verify payment

### Admin Endpoints (requires authentication)

- `POST /api/admin/login` - Admin login
- `GET /api/admin/me` - Get admin profile
- `GET /api/admin/dashboard/stats` - Dashboard statistics
- `GET /api/admin/bookings` - Get all bookings
- `PUT /api/admin/bookings/:id/status` - Update booking status
- `PUT /api/admin/bookings/:id/reschedule` - Reschedule appointment
- `POST /api/admin/bookings/:id/email` - Send email to customer
- `GET /api/admin/services` - Get all services
- `POST /api/admin/services` - Create service
- `PUT /api/admin/services/:id` - Update service
- `DELETE /api/admin/services/:id` - Delete service

## Project Structure

```
solar-booking-app/
├── backend/
│   ├── config/
│   │   ├── database.js
│   │   ├── email.js
│   │   └── initDatabase.js
│   ├── middleware/
│   │   └── auth.js
│   ├── routes/
│   │   ├── admin.js
│   │   ├── bookings.js
│   │   ├── payments.js
│   │   └── services.js
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Footer.js
│   │   │   ├── Navbar.js
│   │   │   └── ServiceCard.js
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   │   ├── AdminBookings.js
│   │   │   │   ├── AdminDashboard.js
│   │   │   │   ├── AdminLogin.js
│   │   │   │   └── AdminServices.js
│   │   │   ├── Booking.js
│   │   │   ├── BookingConfirmation.js
│   │   │   ├── BookingHistory.js
│   │   │   ├── Home.js
│   │   │   └── Services.js
│   │   ├── utils/
│   │   │   └── api.js
│   │   ├── App.js
│   │   ├── index.css
│   │   └── index.js
│   ├── .env.example
│   ├── package.json
│   ├── postcss.config.js
│   └── tailwind.config.js
└── README.md
```

## Production Deployment

### Backend

1. Set `NODE_ENV=production`
2. Use a process manager like PM2
3. Set up SSL/HTTPS
4. Use environment variables for sensitive data

### Frontend

1. Update `REACT_APP_API_URL` to production API URL
2. Run `npm run build`
3. Serve the build folder with nginx or similar

### Database

1. Use a managed MySQL service (AWS RDS, Google Cloud SQL, etc.)
2. Set up regular backups
3. Configure connection pooling

## Security Considerations

- Always use HTTPS in production
- Secure JWT secret and use strong passwords
- Implement rate limiting
- Validate all user inputs
- Sanitize database queries
- Keep dependencies updated

## About Sologix Energy

We are a Renewable Energy Company founded by a team of Engineering Graduates from IIT, NIT, and DTU with in-depth sectoral knowledge and skills.

Website: https://www.sologixenergy.in

## License

MIT
