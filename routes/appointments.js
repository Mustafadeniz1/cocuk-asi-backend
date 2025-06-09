// appointments.js (Backend)
const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyUser } = require('../routes/auth');

// Yeni randevu oluşturma
router.post('/', verifyUser, (req, res) => {
  const { child_id, doctor_id, scheduled_time } = req.body;
  const userId = req.user.id;
  const role = req.user.role;

  // Admin değilse çocuk sahibini kontrol et
  if (role !== 'admin') {
    const query = 'SELECT * FROM children WHERE id = ? AND user_id = ?';
    db.query(query, [child_id, userId], (err, results) => {
      if (err) return res.status(500).send('Veritabanı hatası');
      if (results.length === 0) return res.status(400).send('Çocuk bulunamadı veya yetkiniz yok');
      insertAppointment();
    });
  } else {
    insertAppointment();
  }

  function insertAppointment() {
    const query = 'INSERT INTO appointments (child_id, doctor_id, scheduled_time, status) VALUES (?, ?, ?, ?)';
    db.query(query, [child_id, doctor_id, scheduled_time, 'scheduled'], (err, result) => {
      if (err) return res.status(500).send('Randevu eklenirken bir hata oluştu');
      res.status(201).json({ message: 'Randevu başarıyla oluşturuldu', appointmentId: result.insertId });
    });
  }
});

// Randevuları listeleme (admin tümünü görür)
router.get('/', verifyUser, (req, res) => {
  const userId = req.user.id;
  const role = req.user.role;

  let sql = `
    SELECT 
      a.id AS id,
      a.scheduled_time, 
      a.status, 
      c.name AS child_name, 
      d.name AS doctor_name
    FROM appointments a
    JOIN children c ON a.child_id = c.id
    JOIN doctors d ON a.doctor_id = d.id
  `;

  const params = [];
  if (role !== 'admin') {
    sql += ' WHERE c.user_id = ?';
    params.push(userId);
  }

  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).send('Veritabanı hatası');
    res.json(results);
  });
});

// Durum güncelleme
router.put('/:id', verifyUser, (req, res) => {
  const { status } = req.body;
  const appointmentId = req.params.id;
  const userId = req.user.id;
  const role = req.user.role;

  const query = `
    SELECT a.id, c.user_id
    FROM appointments a
    JOIN children c ON a.child_id = c.id
    WHERE a.id = ?
  `;

  db.query(query, [appointmentId], (err, results) => {
    if (err) return res.status(500).send('Veritabanı hatası');
    if (results.length === 0 || (role !== 'admin' && results[0].user_id !== userId)) {
      return res.status(403).send('Yetkisiz erişim');
    }

    const updateQuery = 'UPDATE appointments SET status = ? WHERE id = ?';
    db.query(updateQuery, [status, appointmentId], (err) => {
      if (err) return res.status(500).send('Randevu güncellenirken bir hata oluştu');
      res.json({ message: 'Durum güncellendi' });
    });
  });
});

// Silme
router.delete('/:id', verifyUser, (req, res) => {
  const appointmentId = req.params.id;
  const userId = req.user.id;
  const role = req.user.role;

  const query = `
    SELECT a.id, c.user_id
    FROM appointments a
    JOIN children c ON a.child_id = c.id
    WHERE a.id = ?
  `;

  db.query(query, [appointmentId], (err, results) => {
    if (err) return res.status(500).send('Veritabanı hatası');
    if (results.length === 0 || (role !== 'admin' && results[0].user_id !== userId)) {
      return res.status(403).send('Silme yetkiniz yok');
    }

    const deleteQuery = 'DELETE FROM appointments WHERE id = ?';
    db.query(deleteQuery, [appointmentId], (err) => {
      if (err) return res.status(500).send('Silme hatası');
      res.json({ message: 'Randevu silindi' });
    });
  });
});

module.exports = router;