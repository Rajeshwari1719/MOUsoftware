const express = require('express');
const multer = require('multer');
const ExcelJS = require('exceljs');
const pool = require('./db');
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

async function getOrCreateCollege(connection, name) {
  const [rows] = await connection.execute('SELECT id FROM colleges WHERE name = ?', [name]);
  if (rows.length) return rows[0].id;
  const [res] = await connection.execute('INSERT INTO colleges (name) VALUES (?)', [name]);
  return res.insertId;
}

async function getOrCreateDepartment(connection, collegeId, name) {
  if (!name) return null;
  const [rows] = await connection.execute('SELECT id FROM departments WHERE college_id = ? AND name = ?', [collegeId, name]);
  if (rows.length) return rows[0].id;
  const [res] = await connection.execute('INSERT INTO departments (college_id, name) VALUES (?, ?)', [collegeId, name]);
  return res.insertId;
}

router.post('/import', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(req.file.buffer);
  } catch (err) {
    return res.status(400).json({ error: 'Invalid Excel file' });
  }

  const sheet = workbook.worksheets[0];
  if (!sheet) return res.status(400).json({ error: 'No worksheet found in file' });

  const results = { inserted: 0, skipped: 0, errors: [] };
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    for (let rowIndex = 2; rowIndex <= sheet.rowCount; rowIndex++) {
      const row = sheet.getRow(rowIndex);
      // skip empty rows
      const isEmpty = (row.values || []).every(v => v === null || v === undefined || (typeof v === 'string' && v.trim() === ''));
      if (isEmpty) continue;

      const serial_no = row.getCell(1).value;
      const nat_int = row.getCell(2).value;
      const college_name = row.getCell(3).value;
      const department_name = row.getCell(4).value;
      const mou_date = row.getCell(5).value;
      const valid_upto = row.getCell(6).value;
      const purpose = row.getCell(7).value;
      const activities = row.getCell(8).value;
      const students_benefited = row.getCell(9).value;
      const contact_name = row.getCell(10).value;
      const contact_designation = row.getCell(11).value;
      const contact_email = row.getCell(12).value;
      const contact_phone = row.getCell(13).value;

      const collegeNameStr = (college_name || '').toString().trim();
      if (!collegeNameStr) {
        results.errors.push({ row: rowIndex, error: 'Missing college name' });
        continue;
      }

      // parse dates (ExcelJS may return Date objects or numbers)
      let mouDate = null;
      let validUptoDate = null;
      try {
        if (mou_date instanceof Date) mouDate = mou_date;
        else if (mou_date && mou_date.result) mouDate = new Date(mou_date.result);
        else if (mou_date) mouDate = new Date(mou_date);
      } catch (e) {
        mouDate = null;
      }

      if (!mouDate || isNaN(mouDate.getTime())) {
        results.errors.push({ row: rowIndex, error: 'Invalid or missing Date of MOU' });
        continue;
      }

      try {
        if (valid_upto instanceof Date) validUptoDate = valid_upto;
        else if (valid_upto && valid_upto.result) validUptoDate = new Date(valid_upto.result);
        else if (valid_upto) validUptoDate = new Date(valid_upto);
      } catch (e) {
        validUptoDate = null;
      }

      const collegeId = await getOrCreateCollege(connection, collegeNameStr);
      const departmentId = await getOrCreateDepartment(connection, collegeId, (department_name || '').toString().trim());

      // duplicate check
      const [existing] = await connection.execute('SELECT id FROM mous WHERE college_id = ? AND mou_date = ?', [collegeId, mouDate.toISOString().split('T')[0]]);
      if (existing.length) {
        results.skipped++;
        continue;
      }

      const nationalOrInternational = (nat_int || '').toString().trim().toLowerCase().includes('inter') ? 'International' : 'National';

      await connection.execute(
        `INSERT INTO mous
          (serial_no, national_or_international, college_id, department_id, mou_date, valid_upto, purpose, activities, students_benefited, contact_name, contact_designation, contact_email, contact_phone)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          serial_no ? Number(serial_no) : null,
          nationalOrInternational,
          collegeId,
          departmentId,
          mouDate.toISOString().split('T')[0],
          validUptoDate && !isNaN(validUptoDate.getTime()) ? validUptoDate.toISOString().split('T')[0] : null,
          purpose ? purpose.toString().trim() : null,
          activities ? activities.toString().trim() : null,
          students_benefited ? parseInt(students_benefited) || 0 : 0,
          contact_name ? contact_name.toString().trim() : null,
          contact_designation ? contact_designation.toString().trim() : null,
          contact_email ? contact_email.toString().trim() : null,
          contact_phone ? contact_phone.toString().trim() : null
        ]
      );

      results.inserted++;
    }

    // log import
    await connection.execute(
      'INSERT INTO import_logs (filename, imported_by, inserted_count, skipped_count, error_count, details) VALUES (?, ?, ?, ?, ?, ?)',
      [req.file.originalname, req.body.uploaded_by || 'unknown', results.inserted, results.skipped, results.errors.length, JSON.stringify(results.errors)]
    );

    await connection.commit();
    res.json({ success: true, results });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ error: 'Import failed', details: err.message });
  } finally {
    connection.release();
  }
});

module.exports = router;
