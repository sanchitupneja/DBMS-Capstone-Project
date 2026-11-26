# 🏠 HostelIQ — Smart Hostel Room Allocation Platform
### *DBMS Capstone Project (MySQL & MySQL Workbench)*

![Next.js](https://img.shields.io/badge/Next.js-16.4-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?logo=react)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8?logo=tailwindcss)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?logo=typescript)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js)
![Express](https://img.shields.io/badge/Express-5.x-000000?logo=express)
![Prisma](https://img.shields.io/badge/Prisma-6.19-2d3748?logo=prisma)
![MySQL](https://img.shields.io/badge/MySQL-8.0%20%2F%20Workbench-4479A1?logo=mysql&logoColor=white)
![Render](https://img.shields.io/badge/Deploy-Render-46e3b7?logo=render)

A modern, full-stack campus accommodation and automated room allocation management system powered by **MySQL** and **Prisma ORM**. HostelIQ empowers students with a seamless room reservation portal while providing hostel wardens and campus administrators with automated room assignment algorithms, real-time occupancy statistics, and comprehensive student housing analytics.

---

## 🌐 Live Cloud Deployment

| Service | Live URL | Description |
| :--- | :--- | :--- |
| **Frontend Portal** | [https://hostel-allocation-frontend.onrender.com](https://hostel-allocation-frontend.onrender.com) | Responsive Next.js Web Application |
| **Backend API** | [https://hostel-allocation-api.onrender.com](https://hostel-allocation-api.onrender.com) | Express & TypeScript REST API |
| **API Health Check** | [https://hostel-allocation-api.onrender.com/api/health](https://hostel-allocation-api.onrender.com/api/health) | Real-time container & database status |

---

## 🔑 Demo Credentials

| Role | Email Address | Password | Permissions & Features |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@hostel.edu` | `Admin@123` | Full dashboard access, hostel/room CRUD, 1-click auto-allocate, request approvals, student directory |
| **Student** | `sanchit@student.edu` | `Student@123` | Room browsing, hostel filtering, priority application submission, roommate details |
| **Student (Alt)** | `aarav.sharma001@gmail.com` | `Student@123` | Pre-allocated student account with active room assignment |

---

## ✨ Key Features

### 🎓 Student Experience
- **Interactive Room Catalog**: Browse Boys and Girls hostels with dynamic filters (AC / Non-AC, floor levels, monthly pricing, and amenities).
- **Preference-Based Requests**: Submit accommodation requests selecting up to 3 prioritized room preferences.
- **My Room Dashboard**: View active room assignment details, hostel contact information, fee details, and roommate information.
- **Application Tracking**: Monitor real-time status of submitted requests (`PENDING`, `APPROVED`, `ALLOCATED`, `REJECTED`).

### 🛡️ Admin Command Center
- **Real-Time KPI Metrics**: Live statistics on total students, active allocations, available vs. occupied capacity, and occupancy rate percentage.
- **Automated Allocation Engine**: High-throughput rule engine that automatically matches unassigned students to vacant rooms based on gender compatibility and priority rankings.
- **Hostel & Room Management**: Create and configure hostels, add floors/rooms, customize bed capacity, and adjust rental rates.
- **Student Database**: Search and filter enrolled student profiles, academic courses, and contact information.

### 🔒 Enterprise-Grade Security
- **JWT Authentication**: Short-lived access tokens with automatic rotation via HTTP refresh tokens.
- **Role-Based Access Control (RBAC)**: Enforced middleware boundaries guarding administrative endpoints.
- **Bcrypt Encryption**: 12-round salted hashing for all stored credentials.
- **Concurrency & ACID Transactions**: Pessimistic row locking (`SELECT ... FOR UPDATE`) with serializable isolation preventing double allocation of beds.

---

## 🏛️ System Architecture

```mermaid
flowchart LR
    subgraph Client ["Frontend (Next.js 16 + React 19)"]
        UI["Tailwind CSS v4 Dark UI"]
        AuthCtx["Auth Context (JWT)"]
        ApiClient["Dynamic API Client"]
    end

    subgraph Server ["Backend (Express 5 + TypeScript)"]
        Router["Express Router & Validation"]
        AuthCtrl["Auth & RBAC Middleware"]
        AllocEngine["Allocation Algorithm Engine\n(Pessimistic Row Locking)"]
        PrismaORM["Prisma Client 6.19"]
    end

    subgraph Database ["Database Layer (MySQL / Workbench)"]
        MySQLDb[("MySQL 8.0 Server\n(InnoDB Engine)")]
        Tables[("Tables: students, admins,\nhostels, rooms, allocations")]
    end

    UI --> AuthCtx
    AuthCtx --> ApiClient
    ApiClient -->|HTTPS / JSON| Router
    Router --> AuthCtrl
    Router --> AllocEngine
    AllocEngine --> PrismaORM
    AuthCtrl --> PrismaORM
    PrismaORM -->|Connection Pool / SQL| MySQLDb
    MySQLDb --- Tables
```

---

## 🛠️ Setting up with MySQL Workbench

The database is built on relational principles using **MySQL** (InnoDB engine for ACID compliance and foreign key constraints).

### Step 1: Open & Execute Script in MySQL Workbench
1. Open **MySQL Workbench** and connect to your local MySQL instance (`localhost:3306`).
2. Go to **File → Open SQL Script...** (or press `Ctrl + Shift + O`).
3. Select [`sql/hostel_allocation_db.sql`](file:///c:/Users/ASUS/OneDrive/DBMS-CapstoneProject/sql/hostel_allocation_db.sql).
4. Click the **Execute (Lightning Bolt ⚡)** button to run the script.
5. In the **Navigator** pane on the left, right-click and choose **Refresh All**. You will see `hostel_allocation_db` populated with all tables, constraints, and initial records!

### Relational Schema Overview

| Table Name | Description | Key Constraints |
| :--- | :--- | :--- |
| `admins` | Administrative users & wardens | Primary Key: `id` (UUID), Unique `email` |
| `students` | Registered student profiles | Primary Key: `id` (UUID), Unique `email`, Unique `studentId` |
| `hostels` | Hostel buildings & properties | Primary Key: `id` (UUID), Unique `name`, Enum `gender` |
| `rooms` | Living quarters & bed capacity | Composite Unique `(hostelId, roomNumber)`, Foreign Key `hostelId` |
| `allocation_requests` | Student room applications | Composite Unique `(studentId, academicYear, semester)` |
| `allocations` | Active room occupancy records | Composite Unique `(studentId, status, academicYear, semester)` |

---

## 🚀 Quick Start & Local Development

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or later)
- [MySQL Server](https://dev.mysql.com/downloads/mysql/) & [MySQL Workbench](https://dev.mysql.com/downloads/workbench/) installed and running on port 3306.

### 1. Clone & Install Dependencies
```bash
# Clone the repository
git clone https://github.com/sanchitupneja/DBMS-Capstone-Project.git
cd DBMS-Capstone-Project

# Install backend dependencies
npm install

# Install frontend dependencies
npm install --prefix frontend
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and set your MySQL password:
```bash
cp .env.example .env
```
Ensure `DATABASE_URL` in `.env` matches your MySQL credentials:
```ini
DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/hostel_allocation_db"
```

### 3. Sync Database & Seed Data
```bash
# Push schema & generate Prisma Client
npx prisma db push
npx prisma generate

# Seed sample data (hostels, rooms, 160+ students, demo accounts)
npm run db:seed
```

### 4. Start Development Servers
Start both backend API and frontend Next.js server with one unified command:
```bash
npm run dev:all
```

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5000](http://localhost:5000)
- **Prisma Studio (Web GUI)**: `npm run db:studio` (available at [http://localhost:5555](http://localhost:5555))

---

## ☁️ Deployment Guide (Render)

The repository includes a ready-to-use [`render.yaml`](file:///c:/Users/ASUS/OneDrive/DBMS-CapstoneProject/render.yaml) Blueprint that provisions both the Express backend and Next.js frontend.

1. Create a cloud MySQL database on any free cloud provider (e.g. [Aiven](https://aiven.io/mysql), [TiDB Cloud](https://tidbcloud.com), or [Clever Cloud](https://www.clever-cloud.com)).
2. In [Render Dashboard](https://dashboard.render.com), click **New +** → **Blueprint**.
3. Select your repository `sanchitupneja/DBMS-Capstone-Project` (branch `main`).
4. When prompted for `DATABASE_URL`, paste your MySQL connection string:
   ```text
   mysql://USER:PASSWORD@HOST:PORT/hostel_allocation_db
   ```
5. Click **Apply**. Render will automatically deploy both services!

---

## 📡 RESTful API Reference

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register/student` | Register a new student account | Public |
| `POST` | `/api/auth/login` | Authenticate user (Admin or Student) | Public |
| `POST` | `/api/auth/refresh-token` | Renew expired access token | Public |
| `GET` | `/api/auth/me` | Fetch authenticated profile details | Bearer Token |
| `POST` | `/api/auth/logout` | Invalidate active session | Bearer Token |

### Hostels & Rooms (`/api/hostels`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/hostels` | List hostels with room count & filtering | Public |
| `GET` | `/api/hostels/:id` | Get hostel details with room availability | Public |
| `POST` | `/api/hostels` | Create new hostel | Admin Only |
| `PUT` | `/api/hostels/:id` | Update hostel information | Admin Only |
| `DELETE` | `/api/hostels/:id` | Soft-deactivate hostel | Admin Only |
| `GET` | `/api/hostels/:id/rooms` | List rooms inside specific hostel | Public |

### Allocations & Requests (`/api`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/requests` | List allocation requests | Student / Admin |
| `POST` | `/api/requests` | Submit new room allocation request | Student Only |
| `PATCH` | `/api/requests/:id` | Approve, reject, or cancel request | Admin Only |
| `POST` | `/api/allocations/auto` | Trigger automatic allocation engine | Admin Only |
| `GET` | `/api/allocations/my` | View student's current room assignment | Student Only |
| `GET` | `/api/allocations/admin/dashboard` | Aggregated analytics & KPI statistics | Admin Only |

### Health Check (`/api/health`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Service uptime and database connectivity probe | Public |

---

## 📂 Project Directory Structure

```text
DBMS-CapstoneProject/
├── Dockerfile                  # Production container definition for backend API
├── docker-entrypoint.sh        # Startup script for database sync & validation
├── render.yaml                 # Infrastructure-as-code Blueprint for Render
├── package.json                # Backend scripts and dependencies
├── tsconfig.json               # Backend TypeScript configuration
├── .env.example                # Template for environment configuration
│
├── prisma/
│   ├── schema.prisma           # Prisma 6 MySQL relational models
│   ├── migrations/             # Migration history for MySQL
│   ├── seed.ts                 # Database seeder (hostels, rooms, 160+ students)
│   └── seed-allocations.ts     # Allocation record generation script
│
├── sql/
│   ├── hostel_allocation_db.sql# Complete SQL script for MySQL Workbench
│   ├── schema.sql              # Clean relational DDL definitions
│   └── README.md               # Guide for executing scripts in MySQL Workbench
│
├── src/
│   ├── server.ts               # Express application entrypoint
│   ├── app.ts                  # Middleware pipeline, CORS & route mounting
│   ├── config/database.ts      # Singleton Prisma Client instance
│   ├── controllers/            # Request handlers (auth, hostels, allocations)
│   ├── middleware/             # Authentication & Zod schema validation
│   ├── routes/                 # Express route definitions
│   ├── services/               # Business logic & auto-allocation algorithms
│   └── utils/                  # JWT utilities & standardized error classes
│
└── frontend/                   # Next.js 16 Web Application
    ├── package.json            # Frontend dependencies (React 19, Tailwind v4)
    ├── next.config.ts          # Next.js build and environment configuration
    ├── postcss.config.mjs      # Tailwind CSS v4 PostCSS pipeline
    ├── contexts/AuthContext.tsx# Client-side authentication provider
    ├── lib/api.ts              # Dynamic API client with Render auto-detection
    └── app/
        ├── layout.tsx          # Root HTML layout and providers
        ├── page.tsx            # Landing redirect
        ├── login/              # Unified Admin/Student sign-in page
        ├── register/           # Student registration page
        ├── dashboard/          # Role-based dashboard (Student / Admin KPI)
        ├── hostels/            # Interactive room explorer
        ├── my-room/            # Student allocation & roommate view
        ├── my-request/         # Application history & submission
        └── admin/              # Management views (hostels, rooms, requests)
```

---

## 📜 Academic Attribution & License

Developed as a comprehensive Capstone Project for the **Database Management Systems (DBMS)** curriculum.  
Released under the [ISC License](LICENSE).
