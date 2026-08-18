const express = require('express');
const multer = require('multer');
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const pool = require('../db');
const { auth } = require('../middleware');

const router = express.Router();
const uploadsDir = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const asyncRoute = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const DOCUMENT_TYPES = [
  'Signed MOU',
  'Annexure',
  'Renewal Letter',
  'Amendment',
  'Activity Report',
  'Internship Agreement',
  'Project Agreement',
  'Supporting Document',
  'Other',
];
const FILE_TYPES = ['pdf', 'doc', 'docx', 'xls', 'xlsx'];

const ensureDocumentColumns = async (connection) => {
  const columns = [
    ['document_type', 'VARCHAR(100) NULL'],
    ['document_name', 'VARCHAR(255) NULL'],
    ['description', 'TEXT NULL'],
    ['version', 'VARCHAR(50) NOT NULL DEFAULT "1.0"'],
    ['document_date', 'DATE NULL'],
    ['expiry_date', 'DATE NULL'],
    ['required', 'TINYINT(1) NOT NULL DEFAULT 0'],
    ['remarks', 'TEXT NULL'],
  ];

  for (const [columnName, columnType] of columns) {
    const [rows] = await connection.execute(
      'SELECT COUNT(*) AS count FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
      ['documents', columnName]
    );

    if (rows[0].count === 0) {
      await connection.execute(`ALTER TABLE documents ADD COLUMN ${columnName} ${columnType}`);
    }
  }
};

const normalizeDocumentItem = (row) => ({
  id: row.id,
  mou_id: row.mou_id,
  mou_name: row.mou_name || row.mou_title || null,
  college_name: row.college_name || null,
  title: row.title || row.document_name || row.file_name || 'Document',
  document_name: row.document_name || row.title || row.file_name || 'Document',
  document_type: row.document_type || 'Other',
  file_path: row.file_path || null,
  file_type: row.file_type || 'application/octet-stream',
  version: row.version || '1.0',
  uploaded_by: row.uploaded_by || null,
  uploaded_by_name: row.uploaded_by_name || null,
  uploaded_at: row.uploaded_at || null,
  document_date: row.document_date || null,
  expiry_date: row.expiry_date || null,
  required: Number(row.required) === 1 || row.required === true || row.required === '1',
  remarks: row.remarks || null,
  description: row.description || null,
});

const parseCsvRows = (buffer) => {
  const text = buffer.toString('utf8');
  const rows = [];
  let currentRow = [];
  let currentValue = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        currentValue += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      currentRow.push(currentValue);
      currentValue = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') i += 1;
      currentRow.push(currentValue);
      if (currentRow.some((value) => String(value).trim() !== '')) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentValue = '';
      continue;
    }

    currentValue += char;
  }

  if (currentValue.length || currentRow.length) {
    currentRow.push(currentValue);
    if (currentRow.some((value) => String(value).trim() !== '')) {
      rows.push(currentRow);
    }
  }

  return rows;
};

const crud = (name, table, fields, joins = '') => {
  router.get(`/${name}`, auth, asyncRoute(async (_req, res) => {
    let query = `SELECT ${table}.* FROM ${table} ORDER BY ${table}.created_at DESC`;
    if (name === 'interns') {
      query = `SELECT i.*, s.name AS student_name FROM interns i LEFT JOIN students s ON i.student_id = s.id ORDER BY i.created_at DESC`;
    }
    if (name === 'students') {
      query = `SELECT s.* FROM students s ORDER BY s.created_at DESC`;
    }
    const [rows] = await pool.query(query);
    res.json({ [name]: rows });
  }));
  router.post(`/${name}`, auth, asyncRoute(async (req, res) => {
    const values = fields.map((f) => req.body[f] ?? null);
    const [result] = await pool.execute(`INSERT INTO ${table} (${fields.join(',')}) VALUES (${fields.map(() => '?').join(',')})`, values);
    res.status(201).json({ success: true, id: result.insertId });
  }));
  router.put(`/${name}/:id`, auth, asyncRoute(async (req, res) => {
    const values = fields.map((f) => req.body[f] ?? null);
    await pool.execute(`UPDATE ${table} SET ${fields.map((f) => `${f}=?`).join(',')} WHERE id=?`, [...values, req.params.id]);
    res.json({ success: true });
  }));
  router.delete(`/${name}/:id`, auth, asyncRoute(async (req, res) => {
    await pool.execute(`DELETE FROM ${table} WHERE id=?`, [req.params.id]);
    res.json({ success: true });
  }));
};

crud('students', 'students', ['name', 'email', 'phone', 'college_id', 'department_id'], 'LEFT JOIN colleges c ON students.college_id=c.id');
crud('interns', 'interns', ['mou_id', 'student_id', 'start_date', 'end_date', 'status'], 'LEFT JOIN students s ON interns.student_id=s.id');
crud('projects', 'projects', ['mou_id', 'title', 'description', 'start_date', 'end_date', 'status']);

router.get('/documents', auth, asyncRoute(async (_req, res) => {
  const connection = await pool.getConnection();
  try {
    await ensureDocumentColumns(connection);
    const [documents] = await connection.query(`
      SELECT d.*, m.mou_date, m.valid_upto, c.name AS college_name, u.name AS uploaded_by_name,
             COALESCE(d.document_name, d.title, d.file_path) AS document_name,
             COALESCE(d.document_type, 'Other') AS document_type,
             COALESCE(d.version, '1.0') AS version,
             COALESCE(d.required, 0) AS required,
             m.id AS mou_number
      FROM documents d
      LEFT JOIN mous m ON d.mou_id = m.id
      LEFT JOIN colleges c ON m.college_id = c.id
      LEFT JOIN users u ON d.uploaded_by = u.id
      ORDER BY d.uploaded_at DESC
    `);
    res.json({ documents: documents.map(normalizeDocumentItem) });
  } finally {
    connection.release();
  }
}));
router.post('/documents/upload', auth, upload.single('file'), asyncRoute(async (req, res) => {
  if (!req.file || !req.body.mou_id) {
    return res.status(400).json({ error: 'Select an MOU and a document to upload.' });
  }

  const ext = path.extname(req.file.originalname).toLowerCase().replace('.', '');
  if (!FILE_TYPES.includes(ext)) {
    return res.status(400).json({ error: 'Invalid file type. Only PDF, DOC, DOCX, XLS, and XLSX files are supported.' });
  }

  const connection = await pool.getConnection();
  try {
    await ensureDocumentColumns(connection);

    const mouId = Number(req.body.mou_id);
    const documentType = req.body.document_type || 'Other';
    const documentName = req.body.document_name || req.body.title || req.file.originalname;
    const description = req.body.description || null;
    const version = req.body.version || '1.0';
    const documentDate = req.body.document_date || null;
    const expiryDate = req.body.expiry_date || null;
    const requiredFlag = req.body.required === 'true' || req.body.required === '1' || req.body.required === true ? 1 : 0;
    const remarks = req.body.remarks || null;
    const storedName = `${crypto.randomUUID()}.${ext}`;
    fs.writeFileSync(path.join(uploadsDir, storedName), req.file.buffer);

    let uploadedBy = null;
    if (req.userId) {
      const [rows] = await connection.execute('SELECT id FROM users WHERE id = ?', [req.userId]);
      if (rows.length) uploadedBy = req.userId;
    }

    const [result] = await connection.execute(
      `INSERT INTO documents (
        mou_id, title, document_name, document_type, description, file_path, file_type, version,
        document_date, expiry_date, required, remarks, uploaded_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        mouId,
        documentName,
        documentName,
        documentType,
        description,
        `/uploads/${storedName}`,
        req.file.mimetype || 'application/octet-stream',
        version,
        documentDate || null,
        expiryDate || null,
        requiredFlag,
        remarks,
        uploadedBy,
      ]
    );

    res.status(201).json({ success: true, id: result.insertId, file_path: `/uploads/${storedName}` });
  } finally {
    connection.release();
  }
}));
router.delete('/documents/:id', auth, asyncRoute(async (req, res) => {
  const [rows] = await pool.execute('SELECT file_path FROM documents WHERE id=?', [req.params.id]);
  if (rows[0]?.file_path) { const file = path.join(__dirname, '..', rows[0].file_path); if (fs.existsSync(file)) fs.unlinkSync(file); }
  await pool.execute('DELETE FROM documents WHERE id=?', [req.params.id]);
  res.json({ success: true });
}));

router.get('/reports', auth, asyncRoute(async (_req, res) => {
  const [[mous]] = await pool.query('SELECT COUNT(*) total, SUM(valid_upto >= CURDATE()) active FROM mous');
  const [[students]] = await pool.query('SELECT COUNT(*) total FROM students');
  const [[projects]] = await pool.query('SELECT COUNT(*) total FROM projects');
  res.json({ totalMous: mous.total, activeMous: mous.active || 0, students: students.total, projects: projects.total });
}));
router.get('/reports/export/:type', auth, asyncRoute(async (_req, res) => {
  const [rows] = await pool.query('SELECT m.id, c.name AS partner, m.national_or_international, m.mou_date, m.valid_upto, m.purpose, m.students_benefited FROM mous m JOIN colleges c ON m.college_id=c.id ORDER BY m.mou_date DESC');
  const book = new ExcelJS.Workbook(); const sheet = book.addWorksheet('MOU Report');
  sheet.columns = Object.keys(rows[0] || { id: 'ID', partner: 'Partner' }).map((key) => ({ header: key.replaceAll('_', ' '), key, width: 22 }));
  sheet.addRows(rows);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="mou-report.xlsx"');
  await book.xlsx.write(res); res.end();
}));

router.post('/excel/import', auth, upload.single('file'), asyncRoute(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Choose a CSV or Excel file.' });

  let sheet;
  if (/\.csv$/i.test(req.file.originalname)) {
    const rows = parseCsvRows(req.file.buffer);
    sheet = {
      rowCount: rows.length,
      getRow: (rowIndex) => {
        const values = rows[rowIndex - 1] || [];
        return {
          values,
          getCell: (cellIndex) => {
            const value = values[cellIndex - 1] ?? '';
            return { value, text: String(value) };
          },
        };
      },
    };
  } else {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);
    sheet = workbook.worksheets[0];
  }

  if (!sheet) return res.status(400).json({ error: 'The file has no worksheet.' });
  const firstRowCell2 = String(sheet.getRow(1).getCell(2).text || '').toLowerCase();
  const firstRowCell3 = String(sheet.getRow(1).getCell(3).text || '').toLowerCase();
  const isMouTemplate = firstRowCell2.includes('national') || firstRowCell3.includes('college');
  const headers = sheet.getRow(isMouTemplate ? 2 : 1).values.map((v) => String(v || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '_'));
  const col = (row, names) => { const i = headers.findIndex((h) => names.includes(h)); return i > 0 ? row.getCell(i).text.trim() : ''; };
  let inserted = 0; const errors = [];
  const con = await pool.getConnection();
  try { await con.beginTransaction();
    const parseToISO = (raw) => {
      if (!raw) return null;
      const s = String(raw).trim();
      const d1 = new Date(s);
      if (!Number.isNaN(d1.getTime())) return d1.toISOString().split('T')[0];
      const m = s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
      if (m) { const dd = m[1].padStart(2,'0'); const mm = m[2].padStart(2,'0'); const yyyy = m[3]; return `${yyyy}-${mm}-${dd}`; }
      const m2 = s.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})/);
      if (m2) { const yyyy = m2[1]; const mm = m2[2].padStart(2,'0'); const dd = m2[3].padStart(2,'0'); return `${yyyy}-${mm}-${dd}`; }
      return null;
    };

    for (let i = 2; i <= sheet.rowCount; i++) {
      const row = sheet.getRow(i);
      const partner = isMouTemplate ? row.getCell(3).text.trim() : col(row, ['partner','college_name','college','organization','name_of_the_college']);
      const rawMouDate = isMouTemplate ? row.getCell(5).text.trim() : col(row, ['mou_date','start_date','date','date_of_mou']);
      const mouDate = parseToISO(rawMouDate);

      if (!partner && !mouDate) continue;
      if (!partner || !mouDate) { errors.push({ row: i, error: 'Partner and MOU date are required or date format is invalid' }); continue; }

      const [existingCollege] = await con.execute('SELECT id FROM colleges WHERE name=?', [partner]); let collegeId = existingCollege[0]?.id;
      if (!collegeId) { const [r] = await con.execute('INSERT INTO colleges(name) VALUES(?)', [partner]); collegeId = r.insertId; }

      let departmentId = null; const department = isMouTemplate ? row.getCell(4).text.trim() : col(row, ['department']);
      if (department) { const [d] = await con.execute('SELECT id FROM departments WHERE college_id=? AND name=?', [collegeId, department]); if (d.length) departmentId=d[0].id; else { const [r] = await con.execute('INSERT INTO departments(college_id,name) VALUES(?,?)', [collegeId, department]); departmentId=r.insertId; } }

      const get = (cell, names) => isMouTemplate ? row.getCell(cell).text.trim() : col(row, names);

      const rawValid = get(6,['valid_upto','end_date']) || null;
      const valid_upto = parseToISO(rawValid);

      try {
        await con.execute(
          'INSERT INTO mous (serial_no,national_or_international,college_id,department_id,mou_date,valid_upto,purpose,activities,students_benefited,contact_name,contact_designation,contact_email,contact_phone) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
          [
            Number(get(1,['sr_no','serial_no'])) || null,
            get(2,['national_or_international','type']).toLowerCase().includes('inter') ? 'International' : 'National',
            collegeId,
            departmentId,
            mouDate,
            valid_upto || null,
            get(7,['purpose','objectives','broad_purpose_s_of_the_mou']) || null,
            get(8,['activities','activities_conducted_so_far_under_the_mou']) || null,
            Number(get(9,['students_benefited','students','number_of_studetns_benefited_so_far'])) || 0,
            get(10,['name']) || null,
            get(11,['designation']) || null,
            get(12,['email_id','email']) || null,
            get(13,['phone_no','phone']) || null,
          ]
        );
        inserted++;
      }
      catch (e) { if (e.code === 'ER_DUP_ENTRY') errors.push({ row: i, error: 'Duplicate MOU' }); else throw e; }
    }
    await con.commit(); res.json({ success: true, results: { inserted, skipped: errors.length, errors } });
  } catch (e) { await con.rollback(); throw e; } finally { con.release(); }
}));
module.exports = router;
