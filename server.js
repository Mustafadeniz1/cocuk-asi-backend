// server.js
require('dotenv').config();             // .env dosyasını yükler
const express = require('express');
const cors = require('cors');          // CORS kütüphanesi
const db = require('./db');            // Veritabanı bağlantısı

// auth.js'den hem router hem verifyUser middleware'i alıyoruz
const { router: authRoutes, verifyUser } = require('./routes/auth');
const doktorRoutes = require('./routes/doktor');
const vaccineRoutes = require('./routes/vaccines');
const childrenRoutes = require('./routes/children');
const childVaccinesRoutes = require('./routes/childvaccines');
const appointmentsRoutes = require('./routes/appointments');  // Randevu işlemleri için yeni router
const chatRoutes = require('./routes/chat');                  // Chatbot rotası

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());  // JSON veri kabul etmesini sağlıyoruz

// Auth (kayıt, login vb.) işlemleri için iki ayrı yol tanımlıyoruz
app.use('/api', authRoutes);
app.use('/api/auth', authRoutes); // Bu satır ek; /api/auth/... olarak çağırabilirsin

// Doktor işlemleri için router
app.use('/doktor', doktorRoutes);

// Aşılar için router
app.use('/vaccines', vaccineRoutes);

// Çocuklar için router (kendi içinde verifyUser middleware kullanıyor)
app.use('/children', childrenRoutes);

// Çocukların aşıları için router (kendi içinde verifyUser middleware kullanıyor)
app.use('/child-vaccines', childVaccinesRoutes);

// Randevu işlemleri için router (verifyUser middleware kullanarak)
app.use('/appointments', appointmentsRoutes);

// Chatbot için rota (verifyUser ile korumalı)
app.use('/api/chat', chatRoutes);

// Kullanıcı girişi işlemi (login) - authRoutes içinde de olabilir, isteğe bağlı
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const query = 'SELECT * FROM users WHERE email = ?';
  db.query(query, [email], (err, results) => {
    if (err) {
      return res.status(500).send('Veritabanı hatası');
    }
    if (results.length === 0) {
      return res.status(400).send('Kullanıcı bulunamadı');
    }
    const user = results[0];
    if (password !== user.password) {
      return res.status(400).send('Hatalı şifre');
    }
    res.status(200).json({
      message: 'Giriş başarılı',
      role: user.role,
      id: user.id,
      name: user.name,
      email: user.email
    });
  });
});

// Sunucuyu başlat
app.listen(PORT, () => {
  console.log(`✅ Sunucu yayında! Port: ${PORT}`);
});
