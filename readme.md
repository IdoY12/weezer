# 🎸 Weezer – Modern Social Platform

A modern full-stack social platform built with a production-first mindset.  
Dockerized architecture with real-time communication, authentication, cloud-ready services, and clean service separation.

---

## ⚡ Quick Start

Run the entire system:

```bash
docker compose up -d
```

This starts all services:
- **backend**
- **frontend**
- **mysql**
- **localstack**
- **sockets**

Run a single service:

```bash
docker compose up backend
docker compose up frontend
docker compose up mysql
docker compose up localstack
```

---

## 👥 Seeded Users

The project includes pre-seeded user accounts for testing purposes. You can use any of these credentials to log in:

| Username | Password |
|----------|----------|
| `bob000` | `123456` |
| `alice0` | `123456` |
| `charlie` | `123456` |
| `gustav` | `123456` |
| `diana` | `123456` |

---

## 🐳 Docker & Configuration

- All environment variables and ports are defined in `docker-compose.yml`
- Each service has its own Dockerfile:
  - `backend/`
  - `frontend/`
  - `io/`
- Services communicate internally using Docker service names (not localhost)

---

## 🛠 Tech Stack

**TypeScript** · **Node.js** · **Express** · **React** · **Socket.IO** · **MySQL** · **Docker** · **OAuth** · **Stripe** · **AWS** · **LocalStack**

---

## 📂 Project Structure

```
weezer/
├── backend/          # Express API server
├── frontend/         # React client application
├── io/               # Socket.IO real-time server
└── docker-compose.yml
```

---

## 🌟 Features

- 🔒 Secure authentication with OAuth 2.0
- 💬 Real-time messaging and notifications
- 👥 User profiles and social connections
- 📸 Media uploads and sharing
- ⚡ Real-time updates via Socket.IO
- 🌐 RESTful API architecture
- 🎨 Modern React UI
- 📦 Fully containerized with Docker
- ☁️ AWS-ready with LocalStack for local development
