# College MOU Management System

A full-stack application for managing college Memorandums of Understanding (MOUs), related projects, interns, documents, and dashboard activity. The system is built with a React frontend, an Express backend, and a MySQL database.

## Project purpose

This project helps colleges and departments track:
- MOUs and their validity dates
- Partner colleges and departments
- Related projects and interns
- Uploaded supporting documents
- Excel/CSV imports for bulk data entry
- Dashboard metrics and recent activity
- Admin profile management
- Notifications based on MOU/project date status

## Tech stack

### Frontend
- React 19
- Vite
- React Router DOM
- Axios
- React Hot Toast
- Recharts
- jsPDF
- Lucide React
- date-fns

Location:
- client/
- client/src/

### Backend
- Node.js
- Express
- MySQL2
- JWT (JSON Web Tokens)
- bcryptjs
- multer
- ExcelJS
- dotenv
- cors

Location:
- server/
- server/app.js
- server/routes/
- server/middleware.js
- server/db.js

### Database
- MySQL
- Schema and table definitions stored in:
  - database/schema.sql

## Folder structure

```text
college-mou-management/
├── client/
│   ├── src/
│   ├── package.json
│   └── vite.config.*
├── server/
│   ├── routes/
│   ├── uploads/
│   ├── .env
│   ├── app.js
│   ├── db.js
│   ├── middleware.js
│   └── package.json
├── database/
│   └── schema.sql
├── package.json
├── README.md
└── .gitignore
```

## What each folder does

### client/
This is the user interface.

Main files:
- client/src/App.jsx: root application entry
- client/src/routes/AppRoutes.jsx: route definitions and protected route setup
- client/src/context/AuthContext.jsx: login/auth state handling
- client/src/pages/: page components such as Dashboard, MOUs, Projects, Interns, Documents, Reports, Notifications, Profile
- client/src/components/: reused UI elements like Navbar, Sidebar, layout wrappers, and buttons
- client/src/services/: Axios API wrappers for backend endpoints

### server/
This is the backend API and business logic.

Main files:
- server/app.js: Express app startup and route registration
- server/db.js: MySQL pool configuration
- server/middleware.js: JWT auth and admin access middleware
- server/routes/auth.js: login and profile APIs
- server/routes/mous.js: MOU CRUD logic
- server/routes/projects.js: project CRUD/import logic
- server/routes/resources.js: documents, reports, Excel import, and some utility endpoints
- server/uploads/: local storage for uploaded files
- server/.env: environment variables for database and app config

### database/
This holds the schema file used to create and understand the DB tables.

## Environment setup

Create or update the file:
- server/.env

Example structure:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=college_mou
PORT=4000
JWT_SECRET=your-secret-key
NODE_ENV=development
```

Note:
- The MySQL password may contain special characters. Use the correct escaping/format expected by your environment.
- Keep credentials secure and do not commit production secrets to version control.

## Prerequisites

You need:
- Node.js 18+ recommended
- MySQL server running locally or in your environment
- A database named college_mou (or update DB_NAME in .env)

## Installation

From the project root:

```bash
npm install
cd client
npm install
cd ../server
npm install
```

## How to run the project

### 1) Start the backend
From server/:

```bash
cd server
npm start
```

For development with auto-reload:

```bash
cd server
npm run dev
```

### 2) Start the frontend
From client/:

```bash
cd client
npm run dev
```

This typically starts the app at:
- Frontend: http://localhost:5173
- Backend: http://localhost:4000

## Default admin login

The application is configured to work with a default admin account used during local setup.

Default values:
- Email: admin@college.edu
- Password: password123

## Main features implemented

### MOU management
- Create, view, edit, delete MOU records
- MOU fields include: college, department, dates, purpose, activities, students benefited, contact person, contact email, etc.
- MOU detail page includes document and project-related context
- PDF export of MOU details

### Project management
- Create/update/delete projects
- Link projects to specific MOU records
- Excel/CSV import for project list bulk import

### Intern management
- Manage interns linked to MOU and student records
- Display student names in intern-related flows

### Documents
- Upload documents attached to an MOU
- Metadata includes document type, version, document date, expiry date, required flag, remarks
- File validation for supported file types
- Local file storage under server/uploads

### Dashboard
- Total MOU/project/intern metrics
- Recent activity list
- MOU status distribution based on live data
- Dashboard quick actions and import button

### Notifications
- Date-driven notifications for MOU and project deadlines/status changes
- Notification page reads MOU/project dates and raises alerts when relevant

### Profile
- Admin profile page with editable fields
- Profile update saves to the backend database

### Excel import
- CSV/XLSX import support for bulk MOU/project-related data
- Dashboard includes a single upload action for Excel import

## Database and backend logic

### Database connection
The backend uses MySQL connection pooling from:
- server/db.js

### API structure
The backend exposes APIs under:
- /api/auth
- /api/colleges
- /api/departments
- /api/mous
- /api/projects
- /api/documents
- /api/reports
- /api/excel

### Auth
- JWT-based authentication is implemented in:
  - server/middleware.js
  - server/routes/auth.js

### Protected routes
Routes are guarded with authorization checks so authenticated users must have valid tokens to access protected data.

## How the app works

1. Frontend sends requests to the backend using Axios service modules in client/src/services.
2. Backend validates request data, checks JWT tokens, and uses MySQL queries.
3. Data is inserted/updated/read from the college_mou database.
4. Uploaded documents are stored locally in server/uploads and their path is saved in the database.
5. Dashboard and page logic aggregate data from API responses and render them in the React UI.

## Important project files

### Frontend
- client/src/routes/AppRoutes.jsx — app routes and protected paths
- client/src/context/AuthContext.jsx — auth state
- client/src/pages/Dashboard.jsx — dashboard summary and import logic
- client/src/pages/Documents.jsx — document vault UI
- client/src/pages/MOUs.jsx — MOU list and display
- client/src/pages/CreateMOU.jsx — create MOU form
- client/src/pages/EditMOU.jsx — edit MOU form
- client/src/pages/Profile.jsx — profile edit/view screen

### Backend
- server/app.js — start Express server and register routes
- server/routes/resources.js — document, report, and Excel import logic
- server/routes/auth.js — auth/login/profile endpoints
- server/routes/mous.js — MOU CRUD logic
- server/routes/projects.js — project routes

### Database
- database/schema.sql — schema reference used for the project database

## Notes and conventions

- The project is designed for a local development environment and uses MySQL as the main database.
- Uploaded file paths are stored in the database, while the file bytes are kept in the local uploads directory.
- The React app uses route-based navigation and component-based UI composition.
- Many pages are designed to resemble an internal college admin dashboard for MOU management.

## Common commands

### Install all dependencies
```bash
cd college-mou-management
npm install
cd client && npm install
cd ../server && npm install
```

### Run frontend
```bash
cd client
npm run dev
```

### Run backend
```bash
cd server
npm start
```

### Build frontend for production
```bash
cd client
npm run build
```

## Troubleshooting

- If login fails, verify that the MySQL database is running and the .env credentials match the actual DB user/password.
- If uploads fail, check the server/uploads directory and confirm the DB row has a valid file path.
- If a frontend page is blank or broken, check the browser console and confirm the backend is running on port 4000.
- If MySQL data imports fail, check Excel/CSV headers, date formats, and required fields.

## Summary

This project is a college MOU management portal with a React frontend, Express API, and MySQL database. It covers operational requirements such as MOU tracking, project/intern linking, document upload, dashboard analytics, notifications, Excel import, and admin profile management, making it suitable for internal institutional use in a local development setup.

## API endpoint overview

### Authentication
- POST /api/auth/login
- GET /api/auth/me
- PUT /api/auth/profile

### Colleges and departments
- GET /api/colleges
- POST /api/colleges
- PUT /api/colleges/:id
- DELETE /api/colleges/:id
- GET /api/departments
- POST /api/departments
- PUT /api/departments/:id
- DELETE /api/departments/:id

### MOUs
- GET /api/mous
- POST /api/mous
- GET /api/mous/:id
- PUT /api/mous/:id
- DELETE /api/mous/:id

### Projects
- GET /api/projects
- POST /api/projects
- PUT /api/projects/:id
- DELETE /api/projects/:id
- POST /api/projects/import

### Interns and students
- GET /api/interns
- POST /api/interns
- PUT /api/interns/:id
- DELETE /api/interns/:id
- GET /api/students
- POST /api/students
- PUT /api/students/:id
- DELETE /api/students/:id

### Documents
- GET /api/documents
- POST /api/documents/upload
- DELETE /api/documents/:id

### Reports and Excel
- GET /api/reports
- GET /api/reports/export/:type
- POST /api/excel/import

## Sample database schema overview

```text
users
  ├── id
  ├── name
  ├── email
  ├── password_hash
  ├── role
  ├── age
  ├── gender
  ├── phone
  ├── department
  ├── designation
  ├── address
  └── created_at / updated_at

colleges
  ├── id
  ├── name
  ├── short_name
  ├── address
  ├── city
  ├── state
  ├── country
  ├── contact_person
  ├── email
  └── phone

departments
  ├── id
  ├── college_id -> colleges.id
  ├── name
  └── created_at

mous
  ├── id
  ├── serial_no
  ├── national_or_international
  ├── college_id -> colleges.id
  ├── department_id -> departments.id
  ├── mou_date
  ├── valid_upto
  ├── purpose
  ├── activities
  ├── students_benefited
  ├── contact_name
  ├── contact_designation
  ├── contact_email
  ├── contact_phone
  └── created_at / updated_at

students
  ├── id
  ├── name
  ├── email
  ├── phone
  ├── college_id -> colleges.id
  ├── department_id -> departments.id
  └── created_at

interns
  ├── id
  ├── mou_id -> mous.id
  ├── student_id -> students.id
  ├── start_date
  ├── end_date
  ├── status
  └── created_at / updated_at

projects
  ├── id
  ├── mou_id -> mous.id
  ├── title
  ├── description
  ├── start_date
  ├── end_date
  ├── status
  └── created_at / updated_at

documents
  ├── id
  ├── mou_id -> mous.id
  ├── title
  ├── document_name
  ├── document_type
  ├── file_path
  ├── file_type
  ├── version
  ├── document_date
  ├── expiry_date
  ├── required
  ├── remarks
  ├── uploaded_by -> users.id
  └── uploaded_at

import_logs
  ├── id
  ├── filename
  ├── imported_by
  ├── inserted_count
  ├── skipped_count
  ├── error_count
  ├── details
  └── created_at
```

## Screenshot section

Add screenshots here once captured in a real environment:

```text
1. Dashboard
2. MOU List
3. Create MOU Form
4. Documents Upload Section
5. Project Management Page
6. Notifications Page
7. Profile Page
```

Example image placeholders:

- Dashboard screenshot: `docs/screenshots/dashboard.png`
- MOU page screenshot: `docs/screenshots/mous.png`
- Document vault screenshot: `docs/screenshots/documents.png`

## Architecture diagram

```text
+------------------------------------------------------------+
|                       Browser / User                        |
|  React Frontend (client/)                                  |
|  - Login page                                              |
|  - Dashboard                                               |
|  - MOU pages                                               |
|  - Documents                                               |
|  - Projects / Interns                                      |
|  - Reports / Notifications                                  |
+---------------------------+--------------------------------+
                            |
                            | HTTP / JSON / FormData
                            v
+------------------------------------------------------------+
|                 Express API Server (server/)                |
|  - Authentication (JWT)                                    |
|  - Route handlers                                          |
|  - Business validation                                     |
|  - File upload handling                                     |
|  - Excel import processing                                  |
|  - Dashboard/report aggregation                             |
+---------------------------+--------------------------------+
                            |
                            | MySQL queries
                            v
+------------------------------------------------------------+
|                        MySQL Database                       |
|  - users                                                   |
|  - colleges                                                |
|  - departments                                             |
|  - mous                                                    |
|  - students                                                |
|  - interns                                                 |
|  - projects                                                |
|  - documents                                               |
|  - import_logs                                             |
+------------------------------------------------------------+
```

## How this app flows from login to final MOU creation

```text
1. User opens frontend
   └─ Browser loads the app and shows login page

2. User logs in
   ├─ Frontend sends email + password to /api/auth/login
   ├─ Backend validates credentials against MySQL users table
   ├─ Backend creates and returns a JWT token
   └─ Frontend stores token in local storage and redirects to dashboard

3. User sees dashboard
   ├─ React app loads dashboard widgets
   ├─ Dashboard fetches metrics from /api/reports
   ├─ Dashboard fetches MOU/project/intern data from relevant APIs
   └─ User can navigate to MOU, Projects, Documents, etc.

4. User creates a new MOU
   ├─ User clicks MOU section and chooses Create MOU
   ├─ Form collects fields such as:
   │    - college
   │    - department
   │    - MOU date
   │    - valid upto
   │    - purpose
   │    - activities
   │    - students benefited
   │    - contact person / email
   ├─ Frontend submits payload to POST /api/mous
   ├─ Backend validates required values and stores row in mous table
   └─ User is redirected or shown success confirmation

5. MOU is stored and can be viewed later
   ├─ MOU list reads records from /api/mous
   ├─ User can open MOU details page
   ├─ MOU details may show linked projects, interns, and documents
   └─ PDF report can be generated for the selected MOU

6. User may attach documents
   ├─ On the Documents page or MOU detail page, user selects a file
   ├─ Backend validates supported file type and size
   ├─ Document metadata is saved in documents table
   ├─ File is written to server/uploads
   └─ Document is linked to chosen MOU

7. Dashboard updates with live data
   ├─ Metrics are refreshed from database
   ├─ MOU status distribution is recalculated based on real date data
   ├─ Recent activity reflects MOU/project/intern events
   └─ Notifications can reflect deadline/expiry/start conditions

8. Final use case
   └─ The college admin can manage the lifecycle of MOUs from creation to activity tracking to document storage and reporting
```

## Deployment notes

This project is structured for a local development environment but can be adapted to deployment in production.

### Local deployment
- Run the MySQL database on a local or managed server.
- Update .env values with the production DB credentials.
- Start frontend with Vite and backend with Node.

### Production considerations
- Use a production-grade hosting provider for frontend and backend.
- Move file uploads to cloud storage such as S3-compatible storage instead of local server storage.
- Secure secrets via environment variables or platform secrets manager.
- Set up SSL/TLS and reverse proxy configuration.
- Add automated backups for MySQL.
- Restrict database user permissions to the minimum needed.
- Use rate limiting, security headers, and validation hardening for public deployments.

### Example deployment architecture

```text
Browser
  ↓
Frontend (Vite / static hosting or Node SSR host)
  ↓
Express API (Node.js)
  ↓
MySQL Database
  ↓
File Storage (Local uploads in dev, S3-compatible in prod)
```

## Future enhancement ideas

- Add dedicated document verification workflow with role-based approval
- Add full document search and filter panel across all MOUs
- Add PDF preview in-browser with secure file access
- Add version history and audit trail UI for every document change
- Add export of all document data to spreadsheet/report formats
- Add automation for renewal reminder emails and notifications
- Add user management and role-based access control for admins, faculty, and viewers

## License

This project is intended for internal college administration use and is not currently published as a public package. License terms may depend on your institutional or organization requirements.
