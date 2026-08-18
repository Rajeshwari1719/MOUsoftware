const pool = require('./db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

(async () => {
  try {
    const email = process.env.ADMIN_EMAIL || 'admin@college.edu';
    // Generate a secure random password (16 bytes -> 22 chars base64)
    let password = crypto.randomBytes(16).toString('base64');
    // Make it URL-safe and remove padding
    password = password.replace(/\+/g, 'A').replace(/\//g, 'B').replace(/=/g, 'C');

    const hash = await bcrypt.hash(password, 10);

    const conn = await pool.getConnection();
    try {
      // If user exists, update password and role; otherwise insert
      const [rows] = await conn.execute('SELECT id FROM users WHERE email = ?', [email]);
      if (rows.length) {
        await conn.execute('UPDATE users SET password_hash = ?, role = ? WHERE id = ?', [hash, 'admin', rows[0].id]);
        console.log(JSON.stringify({ success: true, message: 'Admin user updated', email, password }));
      } else {
        const [res] = await conn.execute('INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)', [email, hash, 'Initial Admin', 'admin']);
        console.log(JSON.stringify({ success: true, message: 'Admin user created', id: res.insertId, email, password }));
      }
    } finally {
      conn.release();
    }
    process.exit(0);
  } catch (err) {
    console.error(JSON.stringify({ success: false, error: err.message }));
    process.exit(1);
  }
})();
