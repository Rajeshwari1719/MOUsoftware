const express = require('express');
const multer = require('multer');
const ExcelJS = require('exceljs');
const pool = require('../db');
const { auth, adminOnly } = require('../middleware');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', auth, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const [mous] = await connection.execute(`
      SELECT m.*, c.name as college_name, d.name as department_name 
      FROM mous m 
      JOIN colleges c ON m.college_id = c.id 
      LEFT JOIN departments d ON m.department_id = d.id 
      ORDER BY m.mou_date DESC
    `);
    res.json({ mous });
  } catch (err) { res.status(500).json({ error: 'Failed to fetch MOUs' }); }
  finally { connection.release(); }
});

router.get('/:id', auth, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const [mous] = await connection.execute(`
      SELECT m.*, c.name as college_name, d.name as department_name 
      FROM mous m 
      JOIN colleges c ON m.college_id = c.id 
      LEFT JOIN departments d ON m.department_id = d.id 
      WHERE m.id = ?
    `, [req.params.id]);
    res.json({ mou: mous[0] || null });
  } catch (err) { res.status(500).json({ error: 'Failed to fetch MOU' }); }
  finally { connection.release(); }
});

router.post('/', auth, async (req, res) => {
  const { serial_no, national_or_international, college_id, department_id, college_name, department_name, mou_date, valid_upto, purpose, activities, students_benefited, contact_name, contact_designation, contact_email, contact_phone } = req.body;
  const trimmedCollegeName = String(college_name || '').trim();
  const trimmedMouDate = String(mou_date || '').trim();

  if ((!college_id && !trimmedCollegeName) || !trimmedMouDate) {
    return res.status(400).json({ error: 'College name and MOU date are required' });
  }

  const connection = await pool.getConnection();
  try {
    let resolvedCollegeId = college_id;
    if (!resolvedCollegeId) {
      const [existing] = await connection.execute('SELECT id FROM colleges WHERE name = ?', [trimmedCollegeName]);
      if (existing.length) resolvedCollegeId = existing[0].id;
      else { const [created] = await connection.execute('INSERT INTO colleges (name) VALUES (?)', [trimmedCollegeName]); resolvedCollegeId = created.insertId; }
    }
    let resolvedDepartmentId = department_id || null;
    if (!resolvedDepartmentId && department_name?.trim()) {
      const [existing] = await connection.execute('SELECT id FROM departments WHERE college_id = ? AND name = ?', [resolvedCollegeId, department_name.trim()]);
      if (existing.length) resolvedDepartmentId = existing[0].id;
      else { const [created] = await connection.execute('INSERT INTO departments (college_id, name) VALUES (?, ?)', [resolvedCollegeId, department_name.trim()]); resolvedDepartmentId = created.insertId; }
    }
    const [result] = await connection.execute(
      'INSERT INTO mous (serial_no, national_or_international, college_id, department_id, mou_date, valid_upto, purpose, activities, students_benefited, contact_name, contact_designation, contact_email, contact_phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        serial_no ?? null,
        national_or_international || 'National',
        resolvedCollegeId,
        resolvedDepartmentId ?? null,
        trimmedMouDate,
        valid_upto || null,
        purpose ?? null,
        activities ?? null,
        students_benefited ?? 0,
        contact_name ?? null,
        contact_designation ?? null,
        contact_email ?? null,
        contact_phone ?? null,
      ]
    );
    res.json({ success: true, id: result.insertId });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to create MOU' }); }
  finally { connection.release(); }
});

router.put('/:id', auth, async (req, res) => {
  const {
    serial_no,
    national_or_international,
    college_id,
    department_id,
    college_name,
    department_name,
    mou_date,
    valid_upto,
    purpose,
    activities,
    students_benefited,
    contact_name,
    contact_designation,
    contact_email,
    contact_phone,
  } = req.body;

  const trimmedCollegeName = String(college_name || '').trim();
  const trimmedMouDate = String(mou_date || '').trim();

  if ((!college_id && !trimmedCollegeName) || !trimmedMouDate) {
    return res.status(400).json({ error: 'College name and MOU date are required' });
  }

  const connection = await pool.getConnection();
  try {
    let resolvedCollegeId = college_id;
    if (!resolvedCollegeId && trimmedCollegeName) {
      const [existingCollege] = await connection.execute('SELECT id FROM colleges WHERE name = ?', [trimmedCollegeName]);
      if (existingCollege.length) {
        resolvedCollegeId = existingCollege[0].id;
      } else {
        const [created] = await connection.execute('INSERT INTO colleges (name) VALUES (?)', [trimmedCollegeName]);
        resolvedCollegeId = created.insertId;
      }
    }

    let resolvedDepartmentId = department_id || null;
    if (!resolvedDepartmentId && department_name?.trim()) {
      const [existingDepartment] = await connection.execute('SELECT id FROM departments WHERE college_id = ? AND name = ?', [resolvedCollegeId, department_name.trim()]);
      if (existingDepartment.length) {
        resolvedDepartmentId = existingDepartment[0].id;
      } else {
        const [created] = await connection.execute('INSERT INTO departments (college_id, name) VALUES (?, ?)', [resolvedCollegeId, department_name.trim()]);
        resolvedDepartmentId = created.insertId;
      }
    }

    await connection.execute(
      'UPDATE mous SET serial_no=?, national_or_international=?, college_id=?, department_id=?, mou_date=?, valid_upto=?, purpose=?, activities=?, students_benefited=?, contact_name=?, contact_designation=?, contact_email=?, contact_phone=?, updated_at=NOW() WHERE id=?',
      [
        serial_no ?? null,
        national_or_international || 'National',
        resolvedCollegeId ?? null,
        resolvedDepartmentId ?? null,
        trimmedMouDate,
        valid_upto || null,
        purpose ?? null,
        activities ?? null,
        students_benefited ?? 0,
        contact_name ?? null,
        contact_designation ?? null,
        contact_email ?? null,
        contact_phone ?? null,
        req.params.id,
      ]
    );
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to update MOU' }); }
  finally { connection.release(); }
});

router.delete('/:id', auth, adminOnly, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.execute('DELETE FROM mous WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed to delete MOU' }); }
  finally { connection.release(); }
});

router.post('/import', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(req.file.buffer);
  } catch (err) { return res.status(400).json({ error: 'Invalid Excel file' }); }
  
  const sheet = workbook.worksheets[0];
  if (!sheet) return res.status(400).json({ error: 'No worksheet found' });

  const results = { inserted: 0, skipped: 0, errors: [] };
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    for (let rowIndex = 2; rowIndex <= sheet.rowCount; rowIndex++) {
      const row = sheet.getRow(rowIndex);
      const isEmpty = (row.values || []).every(v => !v);
      if (isEmpty) continue;

      const college_name = (row.getCell(3).value || '').toString().trim();
      if (!college_name) { results.errors.push({ row: rowIndex, error: 'Missing college name' }); continue; }

      let mouDate = null;
      try {
        const d = row.getCell(5).value;
        mouDate = d instanceof Date ? d : d ? new Date(d) : null;
      } catch (e) {}
      if (!mouDate || isNaN(mouDate.getTime())) { results.errors.push({ row: rowIndex, error: 'Invalid MOU date' }); continue; }

      let validUpto = null;
      try {
        const d = row.getCell(6).value;
        validUpto = d instanceof Date ? d : d ? new Date(d) : null;
      } catch (e) {}

      const [colleges] = await connection.execute('SELECT id FROM colleges WHERE name = ?', [college_name]);
      let collegeId = colleges.length ? colleges[0].id : null;
      if (!collegeId) {
        const [res2] = await connection.execute('INSERT INTO colleges (name) VALUES (?)', [college_name]);
        collegeId = res2.insertId;
      }

      const dept_name = (row.getCell(4).value || '').toString().trim();
      let departmentId = null;
      if (dept_name) {
        const [depts] = await connection.execute('SELECT id FROM departments WHERE college_id = ? AND name = ?', [collegeId, dept_name]);
        departmentId = depts.length ? depts[0].id : null;
        if (!departmentId) {
          const [res2] = await connection.execute('INSERT INTO departments (college_id, name) VALUES (?, ?)', [collegeId, dept_name]);
          departmentId = res2.insertId;
        }
      }

      const [existing] = await connection.execute('SELECT id FROM mous WHERE college_id = ? AND mou_date = ?', [collegeId, mouDate.toISOString().split('T')[0]]);
      if (existing.length) { results.skipped++; continue; }

      const nat_int = (row.getCell(2).value || '').toString().toLowerCase().includes('inter') ? 'International' : 'National';
      await connection.execute(
        'INSERT INTO mous (serial_no, national_or_international, college_id, department_id, mou_date, valid_upto, purpose, activities, students_benefited, contact_name, contact_designation, contact_email, contact_phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [row.getCell(1).value, nat_int, collegeId, departmentId, mouDate.toISOString().split('T')[0], validUpto && !isNaN(validUpto.getTime()) ? validUpto.toISOString().split('T')[0] : null, row.getCell(7).value, row.getCell(8).value, parseInt(row.getCell(9).value) || 0, row.getCell(10).value, row.getCell(11).value, row.getCell(12).value, row.getCell(13).value]
      );
      results.inserted++;
    }

    await connection.execute('INSERT INTO import_logs (filename, imported_by, inserted_count, skipped_count, error_count, details) VALUES (?, ?, ?, ?, ?, ?)', [req.file.originalname, 'system', results.inserted, results.skipped, results.errors.length, JSON.stringify(results.errors)]);
    await connection.commit();
    res.json({ success: true, results });
  } catch (err) { await connection.rollback(); console.error(err); res.status(500).json({ error: 'Import failed', details: err.message }); }
  finally { connection.release(); }
});

module.exports = router;
