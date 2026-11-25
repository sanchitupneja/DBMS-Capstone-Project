# Deploying to Render (MySQL / MySQL Workbench version)

The application uses **MySQL** with Prisma ORM 6.19. The complete SQL script for MySQL Workbench is located in [`sql/hostel_allocation_db.sql`](file:///c:/Users/ASUS/OneDrive/DBMS-CapstoneProject/sql/hostel_allocation_db.sql).

The Render Blueprint provisions two services:

| Service | Purpose | Runtime |
| :--- | :--- | :--- |
| `hostel-allocation-api` | Express REST API | Docker |
| `hostel-allocation-frontend` | Next.js User Interface | Node.js (v18+) |

---

## 1. Cloud MySQL Database (Free Options)

To run the backend on Render, you can connect any cloud MySQL instance. Free and popular options include:

- **[Aiven for MySQL](https://aiven.io/mysql)**: Free tier MySQL database with SSL.
- **[TiDB Cloud](https://tidbcloud.com)**: Free Serverless MySQL-compatible database.
- **[Clever Cloud](https://www.clever-cloud.com)**: Free MySQL addon.

After creating your database, get the connection URI:
```text
mysql://USER:PASSWORD@HOST:PORT/hostel_allocation_db
```

---

## 2. Deploy with Render Blueprint

1. Sign in to your [Render Dashboard](https://dashboard.render.com).
2. Click **New +** → **Blueprint**.
3. Connect your repository: `sanchitupneja/DBMS-Capstone-Project` (branch `main`).
4. When prompted for `DATABASE_URL`, paste your MySQL connection string.
5. Click **Apply**.

Render will automatically:
- Build the Docker container for the Express backend.
- Run `prisma db push` to synchronize tables and indexes.
- Seed initial demo accounts and hostels on first deploy.
- Build and serve the Next.js frontend with live styling.

---

## 3. Demo Credentials

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@hostel.edu` | `Admin@123` |
| **Student** | `sanchit@student.edu` | `Student@123` |
| **Student (Alt)** | `aarav.sharma001@gmail.com` | `Student@123` |

---

## 4. Local Development with MySQL Workbench

1. Open **MySQL Workbench** and execute [`sql/hostel_allocation_db.sql`](file:///c:/Users/ASUS/OneDrive/DBMS-CapstoneProject/sql/hostel_allocation_db.sql).
2. Set your credentials in `.env`:
   ```ini
   DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/hostel_allocation_db"
   ```
3. Run:
   ```bash
   npm install
   npm install --prefix frontend
   npm run dev:all
   ```
4. Access the frontend at [http://localhost:3000](http://localhost:3000) and backend API at [http://localhost:5000](http://localhost:5000).
