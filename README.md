# QuickBazzar – Express Backend

This repository contains the **backend server for QuickBazzar**, built using **Node.js and Express.js**. It provides REST APIs for authentication, users, products, orders, and related e‑commerce operations. The backend is designed to be scalable, secure, and easily deployable on cloud platforms.

---

## 🚀 Features

* 🔐 **Authentication & Authorization** (JWT-based)
* 👤 User management APIs
* 📦 Product & category management
* 🛒 Order & order item handling
* 🧾 Clean REST API structure
* 🗄️ MySQL database integration
* 🌍 Environment-based configuration
* ⚙️ Modular and maintainable codebase

---

## 🛠️ Tech Stack

* **Runtime:** Node.js
* **Framework:** Express.js
* **Database:** MySQL (Aiven / Cloud-hosted)
* **ORM / Driver:** mysql2 / sequelize (as used in project)
* **Auth:** JSON Web Tokens (JWT)
* **Environment Config:** dotenv
* **Version Control:** Git & GitHub

---

## 📂 Project Structure

```
express_Backend/
│
├── src/
│   ├── config/          # DB & app configuration
│   ├── controllers/    # Request handlers
│   ├── middleware/     # Auth & custom middleware
│   ├── models/         # Database models
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   └── utils/          # Helper utilities
│
├── .env.example         # Sample environment variables
├── .gitignore
├── package.json
├── package-lock.json
└── server.js / index.js # Entry point
```

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory:

```env
PORT=5000
DB_HOST=your-db-host
DB_USER=your-db-username
DB_PASSWORD=your-db-password
DB_NAME=your-db-name
DB_PORT=3306
JWT_SECRET=your-secret-key
```

> ⚠️ Never commit your real `.env` file to GitHub.

---

## ▶️ Getting Started

### 1️⃣ Clone the repository

```bash
git clone https://github.com/QuickBazzar/express_Backend.git
cd express_Backend
```

### 2️⃣ Install dependencies

```bash
npm install
```

### 3️⃣ Start the server

```bash
npm start
```

or (for development)

```bash
npm run dev
```

Server will start at:

```
http://localhost:5000
```

---

## 🔗 API Overview (Sample)

| Method | Endpoint           | Description       |
| ------ | ------------------ | ----------------- |
| POST   | /api/auth/login    | User login        |
| POST   | /api/auth/register | User registration |
| GET    | /api/products      | Get all products  |
| POST   | /api/orders        | Create new order  |
| GET    | /api/orders/:id    | Get order details |

---

## 🧪 API Testing (Postman)

You can test all QuickBazzar backend APIs using the official **Postman Collection**:

🔗 **Postman Collection Link:**
[https://adityakotame17-4009243.postman.co/workspace/QuickBazzar~cf2c62db-ca36-444d-9203-2118d6844693/collection/50660794-784788d2-9935-4d79-b856-7fd546ee8e67](https://adityakotame17-4009243.postman.co/workspace/QuickBazzar~cf2c62db-ca36-444d-9203-2118d6844693/collection/50660794-784788d2-9935-4d79-b856-7fd546ee8e67)

### How to Use

1. Open the link in Postman
2. Fork or import the collection into your workspace
3. Set environment variables (e.g., `BASE_URL`, `TOKEN`)
4. Start testing authentication, products, and order APIs

---

## ☁️ Deployment

This backend can be deployed on **Render**, **Railway**, or any Node-compatible cloud platform.

General steps:

1. Push code to GitHub
2. Add environment variables on the hosting platform
3. Set start command:

   ```bash
   npm start
   ```

---

## 👥 Contributors

* **Aditya Kotame**
* **Abhishek Pagar** 
* **Anuprita Borude**

---

## 📌 Notes

* Ensure MySQL database is publicly accessible if using cloud DB
* Check firewall & hostname issues (`ENOTFOUND`) while connecting DB
* Use proper branch strategy (`feature/*`, `backend/*`)

---

## 📜 License

This project is for **educational and project use**.

---

⭐ If you find this project useful, consider giving it a star on GitHub!
