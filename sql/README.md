# MySQL Database Scripts (MySQL Workbench)

This directory contains the complete SQL scripts for creating and seeding the **Hostel Room Allocation System** (`hostel_allocation_db`) database.

---

## 🛠️ How to Use with MySQL Workbench

1. **Open MySQL Workbench** and connect to your local MySQL connection (usually `Local instance MySQL80` on port `3306`).
2. Go to **File → Open SQL Script...** (or press `Ctrl + Shift + O`).
3. Select [`hostel_allocation_db.sql`](file:///c:/Users/ASUS/OneDrive/DBMS-CapstoneProject/sql/hostel_allocation_db.sql).
4. Click the **Execute (Lightning Bolt ⚡)** button to run the entire script.
5. In the left **Schemas** navigator, right-click and choose **Refresh All**. You will see:
   - `hostel_allocation_db`
     - Tables: `admins`, `students`, `hostels`, `rooms`, `allocation_requests`, `allocations`
     - All initial records, sample students, demo admin, and test allocations.

---

## 📁 Files

| File | Description |
| :--- | :--- |
| `hostel_allocation_db.sql` | Complete script: creates database, tables, foreign keys, unique constraints, and seed data |
| `schema.sql` | Clean schema DDL definitions without sample data |

---

## 🔗 Connecting the Application

In your project `.env` file, ensure `DATABASE_URL` matches your local MySQL credentials:

```ini
DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/hostel_allocation_db"
```

Once connected, run:
```bash
npx prisma generate
npm run dev:all
```
