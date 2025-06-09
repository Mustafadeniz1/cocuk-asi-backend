//login.js (backend)
const express = require('express');
const db = require('./db'); // MySQL bağlantısı

const router = express.Router();

router.post('/login', (req, res) => {
  const { email, password } = req.body;

  // Veritabanından kullanıcıyı al
  const query = 'SELECT * FROM users WHERE email = ?';
  db.query(query, [email], (err, results) => {
    if (err) {
      return res.status(500).send('Veritabanı hatası');
    }

    if (results.length === 0) {
      return res.status(400).send('Kullanıcı bulunamadı');
    }

    const user = results[0];

    // Düz metin şifreyi doğrula (bcrypt veya başka bir şifreleme kullanmıyoruz)
    if (password !== user.password) {
      return res.status(400).send('Hatalı şifre');
    }

    // Başarılı giriş sonrası kullanıcı bilgilerini döndür
    res.status(200).json({
      message: 'Giriş başarılı',
      user: {
        id: user.id,
        name: user.name,
        surname: user.surname,
        email: user.email,
        role: user.role
      }
    });
  });
});

module.exports = router;
