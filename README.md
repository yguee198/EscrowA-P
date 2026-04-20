# 🏦 Escrow Payment System

A secure and scalable escrow payment platform built with modern technologies. This system enables safe transactions between users with wallet management, escrow protection, and transaction tracking.

---

## 🚀 Features

* 🔐 Secure authentication (JWT + verifly user)
* 💰 Wallet management (using Method on wallets)
* 🔄 Transactions (we using some service to users)
* 🛡 Escrow protection for secure payments
* ⚡ Redis caching and rate limiting
* 📊 Transaction history & tracking

---

## 🏗 Tech Stack

### Backend

* NestJS (Node.js framework)
* PostgreSQL (database)
* Prisma (ORM)
* Redis (caching & queues)
* Winston (logging)

### Frontend

* React + TypeScript
* Tailwind CSS
* React Query / Axios

---

## 📂 Project Structure

```
backend/
  ├── src/
  ├── prisma/
  └── package.json

frontend/
  ├── src/
  └── package.json
```

---

## ⚙️ Setup Instructions

### 1. Clone the repository

```bash
git clone <repo-url>
cd EscrowA-P
```

### 2. Install dependencies

```bash
cd backend
npm install
```

### 3. Configure environment variables

Create a `.env` file in the backend folder:


### 4. Run development server

```bash
npm run start:dev
```
---


## 🌐 API Base URL

```
http://localhost:3000/api/v1
```

---

## 🔐 Security Notes

* Never commit `.env` files
* Do not expose credentials or secrets
* Use strong passwords and JWT secrets in production

---

## 🚀 Deployment

This project can be deployed on:

* Render 

Basic deployment steps:

```bash
npm install
npm run build
npm run start:prod
```

---

## 📄 License

MIT License

---

**Built for secure digital payments**
