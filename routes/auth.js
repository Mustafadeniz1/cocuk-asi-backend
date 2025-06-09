const express = require('express');
const db = require('../db');
const cors = require('cors');
const router = express.Router();

router.use(cors());

// ✅ verifyUser middleware — header’dan userid alır, role ve id ile req.user oluşturur
function verifyUser(req, res, next) {
  const userId = req.headers['userid'];
  if (!userId) {
    return res.status(401).send('Kullanıcı bilgisi gerekli');
  }

  const sql = 'SELECT id, role FROM users WHERE id = ?';
  db.query(sql, [userId], (err, results) => {
    if (err || results.length === 0) {
      return res.status(403).send('Kullanıcı doğrulanamadı');
    }

    req.user = {
      id: results[0].id,
      role: results[0].role
    };

    next();
  });
}

// ✅ Kayıt
router.post('/register', (req, res) => {
  const { name, surname, email, password, dob } = req.body;

  db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
    if (err) {
      console.error('Veritabanı hatası:', err);
      return res.status(500).send('Veritabanı hatası');
    }
    if (results.length > 0) {
      return res.status(400).send('Bu e-posta adresi zaten kayıtlı.');
    }

    if (email === 'mavimustafa112@gmail.com' || email.endsWith('@doktor.com')) {
      return res.status(400).json({ message: 'Bu e-posta adresi kullanılamaz.' });
    }

    const role = 'user';
    const sql = `
      INSERT INTO users (name, surname, email, password, dob, role)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    db.query(sql, [name, surname, email, password, dob, role], (err2) => {
      if (err2) {
        console.error('Kayıt sırasında hata:', err2);
        return res.status(500).send('Kayıt sırasında bir hata oluştu');
      }
      res.status(201).send('Kayıt başarılı');
    });
  });
});

// ✅ Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const sql = 'SELECT * FROM users WHERE email = ?';

  db.query(sql, [email], (err, results) => {
    if (err) {
      console.error('Veritabanı hatası:', err);
      return res.status(500).send('Veritabanı hatası');
    }
    if (results.length === 0) {
      return res.status(400).send('Kullanıcı bulunamadı');
    }

    const user = results[0];
    if (password !== user.password) {
      return res.status(400).send('Hatalı şifre');
    }

    if (email === 'mavimustafa112@gmail.com') {
      user.role = 'admin';
    }

    res.status(200).json({
      message: 'Giriş başarılı',
      id: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
    });
  });
});

// ✅ Profil Bilgisi Getirme
router.get('/profile', verifyUser, (req, res) => {
  const userId = req.user.id;
  const sql = 'SELECT id, name, surname, email, role FROM users WHERE id = ?';

  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error('Veritabanı hatası:', err);
      return res.status(500).send('Veritabanı hatası');
    }
    if (results.length === 0) {
      return res.status(404).send('Kullanıcı bulunamadı');
    }
    res.json(results[0]);
  });
});

// ✅ Profil Güncelleme
router.put('/profile', verifyUser, (req, res) => {
  const userId = req.user.id;
  const { name, surname, email, password } = req.body;

  db.query('SELECT role FROM users WHERE id = ?', [userId], (err, rows) => {
    if (err) {
      console.error('Veritabanı hatası:', err);
      return res.status(500).send('Veritabanı hatası');
    }
    if (rows.length === 0) {
      return res.status(404).send('Kullanıcı bulunamadı');
    }
    if (rows[0].role === 'admin') {
      return res.status(403).send('Admin profili güncelleyemez.');
    }

    const fields = [];
    const values = [];

    if (name)     { fields.push('name = ?');     values.push(name); }
    if (surname)  { fields.push('surname = ?');  values.push(surname); }
    if (email)    { fields.push('email = ?');    values.push(email); }
    if (password) { fields.push('password = ?'); values.push(password); }

    if (fields.length === 0) {
      return res.status(400).send('Güncellenecek alan yok.');
    }

    const sqlUpdate = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
    values.push(userId);

    db.query(sqlUpdate, values, (err2) => {
      if (err2) {
        console.error('Güncelleme hatası:', err2);
        return res.status(500).send('Profil güncellenirken hata oluştu');
      }
      res.send('Profil başarıyla güncellendi.');
    });
  });
});

module.exports = {
  router,
  verifyUser
};
