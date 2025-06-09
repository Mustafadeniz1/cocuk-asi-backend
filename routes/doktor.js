//doktor.js(backend)
const express = require('express');
const router = express.Router();
const db = require('../db');

// Tüm doktorları listele
router.get('/', (req, res) => {
  db.query('SELECT * FROM doctors', (err, results) => {
    if (err) {
      console.error('Veritabanı hatası:', err);
      return res.status(500).send('Veritabanı hatası');
    }
    res.json(results);
  });
});

// Doktor sayısını dönen endpoint
router.get('/count', (req, res) => {
  db.query('SELECT COUNT(*) AS total FROM doctors', (err, results) => {
    if (err) {
      console.error('Doktor sayısı alınırken hata:', err);
      return res.status(500).send('Sunucu hatası');
    }
    res.json({ count: results[0].total });
  });
});

// Yeni doktor ekle
router.post('/', (req, res) => {
  const { name, specialty } = req.body;

  if (!name || !specialty) {
    return res.status(400).send('Doktor ismi ve uzmanlık alanı zorunludur.');
  }

  const query = 'INSERT INTO doctors (name, specialty) VALUES (?, ?)';
  db.query(query, [name, specialty], (err, result) => {
    if (err) {
      console.error('Doktor eklenirken hata:', err);
      return res.status(500).send('Doktor ekleme hatası');
    }
    res.status(201).json({ message: 'Doktor eklendi', id: result.insertId });
  });
});

// Doktor sil
router.delete('/:id', (req, res) => {
  const doctorId = req.params.id;

  const query = 'DELETE FROM doctors WHERE id = ?';
  db.query(query, [doctorId], (err, result) => {
    if (err) {
      console.error('Doktor silinirken hata:', err);
      return res.status(500).send('Doktor silme hatası');
    }
    if (result.affectedRows === 0) {
      return res.status(404).send('Doktor bulunamadı');
    }
    res.json({ message: 'Doktor silindi' });
  });
});

module.exports = router;
