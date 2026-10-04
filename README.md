# GLBITM Hostel Complaint Portal 🏢

A web-based complaint management system customized for the hostels of **GL Bajaj Institute of Technology & Management, Greater Noida**. Students can report hostel issues, and wardens can efficiently track, manage, and resolve complaints.

---

## 📸 Screenshots

### GLBITM Hostel Complaint Portal

![GLBITM Hostel Complaint Portal](screenshots/1.png)

### Create Account

![Create Account](screenshots/2.png)

### Admin Login

![Admin Login](screenshots/3.png)

### Admin Dashboard

![Admin Dashboard](screenshots/4.png)

### Student Dashboard

![Student Dashboard](screenshots/5.png)

### Add Complaint

![Add Complaint](screenshots/6.png)

---

## ✨ Features

This portal provides distinct functionalities for students and administrators to ensure a smooth complaint resolution process.

### For Students 🧑‍🎓

* **Secure Registration:** Easy onboarding using a unique Hostel No, Room No, Email, and Phone.
* **Raise Complaints:** Quickly report problems across predefined categories:
    * 💧 Water
    * 💡 Electricity
    * 🌐 Network / Wi-Fi
    * 🍲 Mess / Canteen
    * 🚻 Washrooms
    * 🛠️ General Maintenance
* **My Complaints Section:** A dedicated dashboard to view the status of all complaints you have submitted.
* **Mark as Resolved:** Students can close the loop by marking their own complaints as resolved once the issue is fixed.
* **Filter Complaints:** Filter the complaint list by category to see specific types of issues.

### For Admins (Wardens) 👨‍💼

* **Admin Login:** A secure login portal for hostel wardens and administrative staff.
* **Centralized Dashboard:** View all active and resolved complaints of the hostel in a single, organized interface.
* **Resolve Complaints:** Admins can update the status of a complaint to "Resolved" from their end.
* **Powerful Filtering:** Filter complaints by category (water, electricity, etc.) or status to prioritize and manage tasks effectively.

### Upcoming Features 🚀

* 📊 Complaint Analytics Dashboard
* 📸 Image Upload with Complaints
* ⚡ Priority-Based Complaint Management
* 📧 Email Notifications
* 🔍 Advanced Complaint Search & Filtering

---

## 🛠️ Tech Stack

| Technology       | Usage                 |
| ---------------- | --------------------- |
| **Node.js**      | Backend Runtime       |
| **Express.js**   | Web Framework         |
| **MongoDB**      | Database              |
| **Mongoose**     | ODM for MongoDB       |
| **EJS**          | Server-Side Rendering |
| **JavaScript**   | Application Logic     |
| **HTML/CSS**     | Frontend UI           |
| **Git & GitHub** | Version Control       |

## ⚙️ Architecture

* MVC-inspired project structure with modular routes, controllers, and middleware
* Express.js based backend server
* MongoDB database integration using Mongoose (MongoDB Atlas)
* JWT-based authentication and authorization
* Complaint management workflow for students and administrators

---

## 🚀 Getting Started

To get a local copy up and running, follow these steps.

### Prerequisites

Make sure you have the following installed on your machine:

* [Node.js](https://nodejs.org/en/) (includes npm)
* A MongoDB database ([MongoDB Atlas](https://www.mongodb.com/atlas) free tier or local [MongoDB](https://www.mongodb.com/try/download/community))
* [Git](https://git-scm.com/)

### Installation

1. **Clone the repository**

```sh
   git clone https://github.com/singhharsh006/Hostel-Grievance-Management-System.git
```

2. **Navigate to the project directory**

```sh
   cd Hostel-Grievance-Management-System
```

3. **Install NPM packages**

```sh
   npm install
```

4. **Create an environment file**

   Create a `.env` file in the root directory and add the following variables:

```env
   MONGODB_URI=your_mongodb_connection_string
   PORT=1080
   JWT_SECRET=a_strong_and_long_random_secret_string
   JWT_EXPIRES_IN=1d
```

5. **Start the server**

```sh
   npm start
```

   For development with auto-restart, use `npm run dev`.
   The application will be running at `http://localhost:1080`.

### Creating an Admin Account

Students register from the registration page, but admin accounts are created directly in the database. Add a document to the `adminusers` collection with these fields:

| Field       | Description                                           |
| ----------- | ----------------------------------------------------- |
| `username`  | Admin login username                                  |
| `password`  | Admin login password                                  |
| `hostel_no` | Must match the hostel number students use (e.g. `H1`) |
| `type`      | `admin`                                               |

The admin dashboard shows complaints of the admin's own hostel only, so `hostel_no` must match the students' hostel number.

---

## 👨‍💻 Developer

**Harsh Kumar Singh**
B.Tech Computer Science Engineering
GL Bajaj Institute of Technology & Management, Greater Noida

GitHub: https://github.com/singhharsh006

Based on the open-source MANIT Hostel Complaint Portal by Ravi Prakash,
used under the GNU GPL v3.0. See the `LICENSE` file.

## 📄 License

This project is distributed under the GNU General Public License v3.0.
See the `LICENSE` file for complete license terms.