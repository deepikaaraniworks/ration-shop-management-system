# 🌾 Ration Shop Stock & Notification Management System

A full-stack web application for managing Public Distribution System (PDS) ration shops. Supports beneficiary OTP login, staff management dashboard, real-time stock updates, multi-language support (Tamil/English/Hindi), and a voice assistant.

---

## 📁 Project Structure

```
ration-system/
├── backend/
│   ├── config/
│   │   └── database.js          # MySQL connection pool
│   ├── middleware/
│   │   └── auth.js              # JWT authentication middleware
│   ├── routes/
│   │   ├── auth.js              # Login, OTP routes
│   │   ├── stock.js             # Stock CRUD routes
│   │   └── api.js               # All other API routes
│   ├── server.js                # Express + Socket.io server
│   ├── package.json
│   └── .env.example             # Environment variables template
├── frontend/
│   ├── index.html               # Landing page
│   ├── shared/
│   │   ├── styles.css           # Shared CSS styles
│   │   └── api.js               # Shared API helpers & i18n
│   ├── beneficiary/
│   │   ├── index.html           # Beneficiary login (OTP)
│   │   └── dashboard.html       # Beneficiary dashboard
│   └── staff/
│       ├── index.html           # Staff login
│       └── dashboard.html       # Staff dashboard
└── database/
    └── schema.sql               # MySQL schema + sample data
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | Node.js + Express.js |
| Database | MySQL 8+ |
| Real-time | Socket.io (WebSockets) |
| Auth | JWT + OTP (beneficiary), Password (staff) |
| Styling | Custom CSS (no Bootstrap dependency) |

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js v16+
- MySQL 8.0+
- npm

---

### Step 1: Database Setup

1. Open MySQL shell or MySQL Workbench
2. Run the schema file:
```sql
source /path/to/ration-system/database/schema.sql
```
Or:
```bash
mysql -u root -p < database/schema.sql
```

This creates the `ration_system` database with all tables and sample data.

---

### Step 2: Backend Setup

```bash
cd backend

# Copy environment file
cp .env.example .env

# Edit .env with your MySQL credentials
nano .env
```

Your `.env` should look like:
```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=ration_system
JWT_SECRET=change_this_to_a_long_random_string
JWT_EXPIRES_IN=24h
OTP_EXPIRY_MINUTES=10
NODE_ENV=development
```

```bash
# Install dependencies
npm install

# Start server
npm start
# OR for development with auto-reload:
npm run dev
```

The server starts at: **http://localhost:3000**

---

### Step 3: Access the Application

| URL | Description |
|-----|-------------|
| http://localhost:3000 | Landing Page |
| http://localhost:3000/beneficiary | Beneficiary Login |
| http://localhost:3000/staff | Staff Login |
| http://localhost:3000/api/health | API Health Check |

---

## 🔑 Demo Credentials

### Beneficiary Login (OTP)
| Field | Value |
|-------|-------|
| Ration Card Number | `TN1234567890` |
| Mobile Number | `9123456789` |

> The OTP is shown on screen for demo purposes (in production, SMS integration needed)

### Staff Login (Password)
| Field | Value |
|-------|-------|
| Mobile | `9876543210` |
| Password | `password` |

---

## 🌟 Features

### Beneficiary Portal
- ✅ OTP-based login (ration card + mobile)
- ✅ View assigned shop address, opening hours, and status
- ✅ Real-time shop open/closed status indicator
- ✅ Today's stock with Available/Limited/Out of Stock status
- ✅ Monthly quota per card type (AAY/BPL/APL/PHH)
- ✅ Push notifications from staff
- ✅ Submit feedback/complaints
- ✅ Voice assistant (text-to-speech for shop status, stock, alerts)
- ✅ Multi-language: Tamil, English, Hindi

### Staff Portal
- ✅ Secure password-based login
- ✅ Toggle shop Open/Closed status
- ✅ Stock management (Add/Update/Delete)
- ✅ Quick quantity editing inline
- ✅ Send notifications with predefined templates
- ✅ View and manage beneficiary feedback
- ✅ View registered beneficiaries
- ✅ Activity logs with pagination

### System Features
- ✅ Real-time updates via Socket.io
- ✅ JWT authentication
- ✅ Rate limiting on auth routes
- ✅ Activity logging for all staff actions
- ✅ Responsive design (mobile-friendly)

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/beneficiary/request-otp` | Send OTP |
| POST | `/api/auth/beneficiary/verify-otp` | Verify OTP & login |
| POST | `/api/auth/staff/login` | Staff login |
| GET | `/api/auth/me` | Get current user |

### Stock
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stock/:shop_id` | Get all stock |
| POST | `/api/stock` | Add stock item |
| PUT | `/api/stock/:id` | Update stock |
| DELETE | `/api/stock/:id` | Delete stock |

### Other
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/shop/:id` | Get shop details |
| PUT | `/api/shop/:id/status` | Toggle shop status |
| GET | `/api/notifications/:shop_id` | Get notifications |
| POST | `/api/notifications` | Send notification |
| GET | `/api/quota/:shop_id` | Get monthly quota |
| POST | `/api/feedback` | Submit feedback |
| GET | `/api/feedback/:shop_id` | Get feedback (staff) |
| GET | `/api/logs/:shop_id` | Get activity logs |
| GET | `/api/beneficiaries/:shop_id` | List beneficiaries |

---

## 🔄 Real-Time Events (Socket.io)

| Event | Direction | Trigger |
|-------|-----------|---------|
| `join_shop` | Client → Server | On login |
| `stock_updated` | Server → Client | Stock add/update/delete |
| `shop_status_changed` | Server → Client | Shop open/close toggle |
| `new_notification` | Server → Client | Notification sent |

---

## 🗄️ Database Tables

| Table | Description |
|-------|-------------|
| `ration_shops` | Shop details, hours, status |
| `staff` | Staff accounts with hashed passwords |
| `beneficiaries` | Ration card holders |
| `stock_items` | Stock quantities and status |
| `monthly_quota` | Per-card-type monthly entitlements |
| `notifications` | Notifications from staff |
| `notification_reads` | Track read status per beneficiary |
| `feedback` | Beneficiary feedback and complaints |
| `activity_logs` | All staff actions |

---

## 📱 SMS Integration (Production)

Replace the demo OTP section in `backend/routes/auth.js` with:
- **Twilio**: `npm install twilio`
- **AWS SNS**: `npm install @aws-sdk/client-sns`
- **MSG91**: HTTP API integration

---

## 🔐 Production Checklist

- [ ] Change `JWT_SECRET` to a strong random string
- [ ] Remove `demo_otp` from OTP response
- [ ] Add SMS gateway for real OTP delivery
- [ ] Enable HTTPS (SSL/TLS)
- [ ] Set `NODE_ENV=production`
- [ ] Add database backup strategy
- [ ] Configure reverse proxy (nginx)
- [ ] Hash passwords when creating new staff accounts

---

## � GitHub Setup

Use the following commands to initialize the repository and push it to GitHub:

```bash
echo "# ration-shop-management-system" >> README.md
git init
git add README.md
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/deepikaaraniworks/ration-shop-management-system.git
git push -u origin main
```

## �📝 License

This project is for educational and government use purposes.
