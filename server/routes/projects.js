const express = require('express');
const multer = require('multer');
const pool = require('../db');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', async (req, res) => {
  const [rows] = await pool.query('SELECT p.*, m.college_id FROM projects p JOIN mous m ON p.mou_id = m.id ORDER BY p.start_date DESC');
  res.json({ projects: rows });
});

router.post('/', async (req, res) => {
  const { mou_id, title, description, start_date, end_date, status } = req.body;
  const [result] = await pool.execute('INSERT INTO projects (mou_id, title, description, start_date, end_date, status) VALUES (?,?,?,?,?,?)', [mou_id, title, description, start_date || null, end_date || null, status || 'Active']);
  res.status(201).json({ success: true, id: result.insertId });
});

router.post('/import', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const text = req.file.buffer.toString('utf8');
  const lines = text.split(/\r?\n/).filter(Boolean);
  const headers = lines.shift().split(/\t|,|;/).map(h => h.trim().toLowerCase());

  const find = (names) => headers.findIndex(h => names.includes(h)) + 1;
  const titleIdx = find(['title']);
  const mouIdx = find(['mou','mou_id']);
  const statusIdx = find(['status']);
  const startIdx = find(['start_date','start']);

  const results = { inserted: 0, errors: [] };
  const con = await pool.getConnection();
  try {
    await con.beginTransaction();
    for (let i = 0; i < lines.length; i++) {
      const cols = lines[i].split(/\t|,|;/).map(c => c.trim());
      const title = cols[titleIdx - 1] || null;
      const mouRef = cols[mouIdx - 1] || null;
      const status = cols[statusIdx - 1] || 'Active';
      const start_date_raw = cols[startIdx - 1] || null;
      let start_date = null;
      if (start_date_raw) {
        const d = new Date(start_date_raw);
        if (!Number.isNaN(d.getTime())) start_date = d.toISOString().split('T')[0];
      }

      if (!title) { results.errors.push({ row: i+2, error: 'Missing title' }); continue; }

      // try resolve mou_id by college name if needed
      let resolvedMouId = null;
      if (mouRef) {
        // If numeric, assume it's mou id
        if (/^\d+$/.test(mouRef)) resolvedMouId = Number(mouRef);
        else {
          const [r] = await con.execute('SELECT id FROM mous WHERE college_name = ? LIMIT 1', [mouRef]);
          if (r.length) resolvedMouId = r[0].id;
        }
      }

      await con.execute('INSERT INTO projects (mou_id, title, description, start_date, end_date, status) VALUES (?,?,?,?,?,?)', [resolvedMouId, title, null, start_date, null, status]);
      results.inserted++;
    }
    await con.commit();
    res.json({ success: true, results });
  } catch (e) { await con.rollback(); console.error(e); res.status(500).json({ error: 'Import failed', details: e.message }); }
  finally { con.release(); }
});

module.exports = router;
