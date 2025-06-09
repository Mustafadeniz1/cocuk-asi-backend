const express = require('express');
const router = express.Router();
const db = require('../db');

// Tüm aşıları getir
router.get('/', (req, res) => {
  const sql = 'SELECT * FROM vaccines';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Aşılar alınırken hata:', err);
      return res.status(500).send('Sunucu hatası');
    }
    res.json(results);
  });
});

// Toplam aşı sayısını getir
router.get('/count', (req, res) => {
  const sql = 'SELECT COUNT(*) AS total FROM vaccines';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Aşı sayısı alınırken hata:', err);
      return res.status(500).send('Sunucu hatası');
    }
    res.json({ total: results[0].total });
  });
});

module.exports = router;
