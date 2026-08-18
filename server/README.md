Setup and run the MOU import server

1. Copy .env.sample to .env and update DB connection values (DB_USER/DB_PASSWORD if different):
   cp .env.sample .env

2. Install dependencies (run inside server/):
   npm install express multer exceljs mysql2 dotenv cors

3. Start the server:
   node app.js

4. Import Excel file (use curl or Postman):
   curl -X POST -F "file=@/path/to/mous.xlsx" -F "uploaded_by=you" http://localhost:4000/api/mous/import

Notes:
- The server expects the Excel file in the first worksheet with columns matching the template.
- Duplicates (same college + mou_date) are skipped by default.
- Import results and errors are stored in import_logs table.
