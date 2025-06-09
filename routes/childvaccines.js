//childvaccines.js (backend)
const express = require('express'); 
const router = express.Router();
const db = require('../db');
const { verifyUser } = require('../routes/auth');  // auth.js dosyasına doğru yolu veriyoruz

// Çocuğun aşı kayıtlarını getir (kullanıcı doğrulaması ile)
router.get('/:childId/:userId', verifyUser, (req, res) => {
  const childId = parseInt(req.params.childId);
  const userId = parseInt(req.params.userId);

  if (req.user.id !== userId) {
    return res.status(403).send('Yetkisiz erişim');
  }

  const checkChildSql = 'SELECT * FROM children WHERE id = ? AND user_id = ?';
  db.query(checkChildSql, [childId, userId], (err, childResults) => {
    if (err) {
      console.error('Çocuk kontrolü sırasında hata:', err);
      return res.status(500).send('Sunucu hatası');
    }
    if (childResults.length === 0) {
      return res.status(404).send('Çocuk bulunamadı veya yetkiniz yok');
    }

    const sql = `
      SELECT cv.id, v.name AS vaccine_name, cv.status, cv.scheduled_date, cv.date_administered
      FROM child_vaccines cv
      JOIN vaccines v ON cv.vaccine_id = v.id
      WHERE cv.child_id = ?`;
    db.query(sql, [childId], (err, vaccineResults) => {
      if (err) {
        console.error('Aşı kayıtları alınırken hata:', err);
        return res.status(500).send('Sunucu hatası');
      }
      res.json(vaccineResults);
    });
  });
});

// Aşı durumu güncelleme (yetki kontrolü dahil)
router.put('/:id', verifyUser, (req, res) => {
  const vaccineId = parseInt(req.params.id);
  const { status, date_administered } = req.body;

  const checkSql = `
    SELECT c.user_id FROM child_vaccines cv
    JOIN children c ON cv.child_id = c.id
    WHERE cv.id = ?`;

  db.query(checkSql, [vaccineId], (err, results) => {
    if (err) {
      console.error('Yetki kontrolü sırasında hata:', err);
      return res.status(500).send('Sunucu hatası');
    }
    if (results.length === 0) {
      return res.status(404).send('Aşı kaydı bulunamadı');
    }

    if (results[0].user_id !== req.user.id) {
      return res.status(403).send('Yetkisiz erişim');
    }

    const updateSql = 'UPDATE child_vaccines SET status = ?, date_administered = ? WHERE id = ?';
    db.query(updateSql, [status, date_administered, vaccineId], (err, result) => {
      if (err) {
        console.error('Aşı güncellenirken hata:', err);
        return res.status(500).send('Sunucu hatası');
      }
      res.json({ message: 'Aşı durumu güncellendi' });
    });
  });
});

module.exports = router;
