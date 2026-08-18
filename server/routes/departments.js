const express = require('express');
const pool = require('../db');
const { auth, adminOnly } = require('../middleware');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const [departments] = await connection.execute(`
      SELECT d.id, d.name, d.college_id, c.name as college_name 
      FROM departments d 
      JOIN colleges c ON d.college_id = c.id 
      ORDER BY c.name, d.name
    `);
    res.json({ departments });
  } catch (err) { res.status(500).json({ error: 'Failed to fetch departments' }); }
  finally { connection.release(); }
});

router.get('/college/:collegeId', auth, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const [departments] = await connection.execute('SELECT id, name FROM departments WHERE college_id = ? ORDER BY name', [req.params.collegeId]);
    res.json({ departments });
  } catch (err) { res.status(500).json({ error: 'Failed to fetch departments' }); }
  finally { connection.release(); }
});

router.post('/', auth, adminOnly, async (req, res) => {
  const { college_id, name } = req.body;
  if (!college_id || !name) return res.status(400).json({ error: 'College ID and name required' });
  const connection = await pool.getConnection();
  try {
    const [result] = await connection.execute('INSERT INTO departments (college_id, name) VALUES (?, ?)', [college_id, name]);
    res.json({ success: true, id: result.insertId });
  } catch (err) { res.status(500).json({ error: 'Failed to create department' }); }
  finally { connection.release(); }
});

router.put('/:id', auth, adminOnly, async (req, res) => {
  const { name } = req.body;
  const connection = await pool.getConnection();
  try {
    await connection.execute('UPDATE departments SET name=? WHERE id=?', [name, req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed to update department' }); }
  finally { connection.release(); }
});

router.delete('/:id', auth, adminOnly, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.execute('DELETE FROM departments WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed to delete department' }); }
  finally { connection.release(); }
});

module.exports = router;
