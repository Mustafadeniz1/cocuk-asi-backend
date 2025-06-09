const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyUser } = require('../routes/auth');

// Tüm çocukları listeleme
router.get('/', verifyUser, (req, res) => {
  const userId = req.user.id;
  const role = req.user.role;

  const sql = role === 'admin'
    ? 'SELECT * FROM children'
    : 'SELECT * FROM children WHERE user_id = ?';
  const params = role === 'admin' ? [] : [userId];

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error('Veri çekme hatası (children):', err);
      return res.status(500).send('Sunucu hatası');
    }
    res.json(results);
  });
});

// Yeni çocuk ekleme — sadece kullanıcı rolü için izin verilir
router.post('/', verifyUser, (req, res) => {
  const { name, dob } = req.body;
  const userId = req.user.id;
  const role = req.user.role;

  if (role !== 'user') {
    return res.status(403).send('Sadece kullanıcılar çocuk ekleyebilir.');
  }

  const sql = 'INSERT INTO children (user_id, name, birthdate) VALUES (?, ?, ?)';
  db.query(sql, [userId, name, dob], (err, result) => {
    if (err) {
      console.error('Çocuk eklenemedi:', err);
      return res.status(500).send('Veritabanı hatası');
    }

    res.status(201).json({
      id: result.insertId,
      name,
      birthdate: dob
    });
  });
});

// Silme işlemi — admin tümünü, kullanıcı sadece kendi çocuklarını silebilir
router.delete('/:id', verifyUser, (req, res) => {
  const childId = req.params.id;
  const userId = req.user.id;
  const role = req.user.role;

  const checkQuery = role === 'admin'
    ? 'SELECT * FROM children WHERE id = ?'
    : 'SELECT * FROM children WHERE id = ? AND user_id = ?';

  const params = role === 'admin' ? [childId] : [childId, userId];

  db.query(checkQuery, params, (err, results) => {
    if (err) {
      console.error('Silme kontrol hatası:', err);
      return res.status(500).send('Sunucu hatası');
    }

    if (results.length === 0) {
      return res.status(403).send('Silme yetkiniz yok veya kayıt bulunamadı');
    }

    const deleteQuery = 'DELETE FROM children WHERE id = ?';
    db.query(deleteQuery, [childId], (err) => {
      if (err) {
        console.error('Silme hatası:', err);
        return res.status(500).send('Silme sırasında hata oluştu');
      }
      res.send('Kayıt başarıyla silindi');
    });
  });
});

module.exports = router;
