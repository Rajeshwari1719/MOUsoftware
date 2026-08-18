const express = require('express');
const pool = require('../db');
const { auth, adminOnly } = require('../middleware');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const [colleges] = await connection.execute('SELECT * FROM colleges ORDER BY name');
    res.json({ colleges });
  } catch (err) { res.status(500).json({ error: 'Failed to fetch colleges' }); }
  finally { connection.release(); }
});

router.post('/', auth, adminOnly, async (req, res) => {
  const { name, short_name, address, city, state, country, contact_person, email, phone } = req.body;
  if (!name) return res.status(400).json({ error: 'College name required' });
  const connection = await pool.getConnection();
  try {
    const [result] = await connection.execute('INSERT INTO colleges (name, short_name, address, city, state, country, contact_person, email, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [name, short_name, address, city, state, country, contact_person, email, phone]);
    res.json({ success: true, id: result.insertId });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to create college' }); }
  finally { connection.release(); }
});

router.put('/:id', auth, adminOnly, async (req, res) => {
  const { name, short_name, address, city, state, country, contact_person, email, phone } = req.body;
  const connection = await pool.getConnection();
  try {
    await connection.execute('UPDATE colleges SET name=?, short_name=?, address=?, city=?, state=?, country=?, contact_person=?, email=?, phone=? WHERE id=?', [name, short_name, address, city, state, country, contact_person, email, phone, req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed to update college' }); }
  finally { connection.release(); }
});

router.delete('/:id', auth, adminOnly, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.execute('DELETE FROM colleges WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed to delete college' }); }
  finally { connection.release(); }
});

module.exports = router;
