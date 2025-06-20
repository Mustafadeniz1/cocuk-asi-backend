// db.js
const mysql = require('mysql2');
require('dotenv').config(); // .env'yi yükle

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT, // EKLENDİ
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

connection.connect(err => {
  if (err) console.error('Veritabanına bağlanılamadı ❌:', err);
  else console.log('MySQL bağlantısı başarılı ✅');
});

module.exports = connection;
