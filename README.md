# 🚀 LMS 2026 – MERN Learning Management System

A modern Learning Management System (LMS) built with the MERN Stack, supporting authentication, role-based access control (RBAC), and real-time communication.


## 📌 Overview

This project is a **fullstack LMS platform** designed for scalable online education systems.

It provides:

- 🔐 **Authentication** (JWT + Google OAuth)
- 👥 **Multi-role RBAC** (Users can have multiple roles)
- 🔄 **Switch active role dynamically**
- 💬 **Real-time chat** (WebSocket / Socket.io)
- 🎯 **Admin Dashboard & User Interface**
- ⚡ **State management with Redux**

## 🧠 Key Features

### 🔑 Authentication
- **Login / Register** using JWT
- **Google OAuth 2.0** integration
- Secure session handling

### 👤 RBAC (Role-Based Access Control)
- Users can have **multiple roles**
- **Switch active role** dynamically
- **Permission-based access control**
- Supported roles:
  - Admin
  - Instructor
  - Student

### 💬 Realtime Chat
- Built with **Socket.io**
- **Instant messaging** between users
- Scalable **event-based communication**

### 🖥️ UI System
- User-facing interface
- Admin dashboard
- Fully **responsive design**

### 📦 State Management
- **Redux Toolkit**
- Centralized state management
- Async API handling

---

## 🛠️ Tech Stack

### 🎨 Frontend
- ReactJS
- Redux Toolkit
- TailwindCSS / CSS
- Axios

### ⚙️ Backend
- Node.js
- Express.js
- MongoDB (Mongoose)

### 🔌 Other
- Socket.io (Realtime communication)
- Google OAuth 2.0
- JWT Authentication
## 🏗️ System Architecture

```text
Client (React + Redux)
        ↓
REST API (Express.js)
        ↓
MongoDB Database
        ↓
WebSocket Server (Socket.io)
```
## 📂 Project Structure

```text
LMS-2026/
│
├── backend/                 # Node.js + Express backend
│   ├── configs/             # Database & app configuration
│   ├── constants/           # Constant values
│   ├── controllers/         # Request handlers
│   ├── middlewares/         # Custom middlewares
│   ├── models/              # Mongoose models
│   ├── routes/              # API routes
│   ├── services/            # Business logic layer
│   ├── sockets/             # Socket.io logic
│   ├── utils/               # Helper functions
│   ├── validators/          # Request validation
│   ├── index.js             # Entry point
│   └── package.json
│
├── frontend/                # React + Vite frontend
│   ├── public/              # Static assets
│   ├── src/                 # Main source code
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
└── README.md
```

## ⚙️ Installation & Setup

```bash
# 1. Clone repository
git clone https://github.com/thuannguyen113123/LMS-2026.git
cd LMS-2026

# =========================
# 🖥️ Backend Setup
# =========================
cd backend
npm install

# Create .env file
PORT=8080

# Database
MONGO_URL=your_mongodb_uri

# JWT
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_EXPIRES_IN=3h
JWT_REFRESH_EXPIRES_IN=7d

# Firebase
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_API_KEY=your_firebase_api_key

# Email Service
EMAIL_USERNAME=your_email
EMAIL_PASSWORD=your_email_password

# Twilio
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_MESSAGING_SERVICE_SID=your_service_sid

# Braintree
BRAINTREE_ENVIRONMENT=sandbox
BRAINTREE_MERCHANT_ID=your_merchant_id
BRAINTREE_PUBLIC_KEY=your_public_key
BRAINTREE_PRIVATE_KEY=your_private_key

# Client
CLIENT_URL=http://localhost:5173

# Run backend
npm run dev

# =========================
# 💻 Frontend Setup
# =========================
cd ../frontend
npm install

# Create .env file
VITE_APP_API_URL=http://localhost:8080

# Firebase
VITE_FIREBASE_API_KEY=your_firebase_api_key

# Cloudinary
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset

# Run frontend
npm run dev
```
## 🔐 RBAC (Role-Based Access Control)

### Example

```js
const user = {
  roles: ["student", "instructor"],
  activeRole: "student"
};
```
## 📸 Screenshots (Optional)
### 📊 Dashboard Admin

<img width="1877" height="904" alt="Dashboard Admin" src="https://github.com/user-attachments/assets/9e4126db-3fd1-4d9e-8e48-69f0203a0c8f" />

---

### 🏠 Home Page

<img width="1884" height="907" alt="Home Page" src="https://github.com/user-attachments/assets/c8671396-e5b6-4a24-b688-7bee25f0dd34" />

## 🚀 Deployment

- **Frontend:** https://lms-manager-2026.netlify.app  
- **Backend:** https://lms-2026-backend.onrender.com  
- **Database:** MongoDB Atlas  

---

## 🧪 Future Improvements

- ✅ Course management system  
- ✅ Payment integration  
- ✅ Notification system  
- ⏳ Video streaming (HLS)  
- ⏳ Microservices architecture  

---

## 🤝 Contributing

Pull requests are welcome.  
For major changes, please open an issue first to discuss what you would like to change.

---

## 📄 License

This project is licensed under the MIT License.

---

## 📬 Contact

- **Author:** Thuan Nguyen  
- **GitHub:** https://github.com/thuannguyen113123  
