// backend/routes/chat.js
const express = require('express');
const router = express.Router();
const { OpenAI } = require('openai');
const connection = require('../db');         // callback-tabanlı bağlanma
const { verifyUser } = require('./auth');

// Promise wrapper
const db = connection.promise();

// OpenAI istemcisi
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.post('/', verifyUser, async (req, res) => {
  const userId  = req.user.id;
  const { childId, message } = req.body;

  console.log('📬 [Chat] incoming:', { userId, childId, message });
  console.log('🔑 OPENAI key set?:', !!process.env.OPENAI_API_KEY);

  try {
    // 1) Çocuğu al
    const [[child]] = await db.query(
      'SELECT name, birthdate FROM children WHERE id = ? AND user_id = ?',
      [childId, userId]
    );
    if (!child) {
      return res.status(404).json({ error: 'Çocuk bulunamadı.' });
    }

    // 2) Aşı kayıtları
    const [records] = await db.query(
      `SELECT cv.date_administered, cv.scheduled_date, v.name, v.disease
       FROM child_vaccines AS cv
       JOIN vaccines AS v ON cv.vaccine_id = v.id
       WHERE cv.child_id = ?`,
      [childId]
    );

    // 3) Yaş hesaplama
    const birthDate = new Date(child.birthdate);
    const ageMonths = Math.floor(
      (Date.now() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
    );

    // 4) Özet oluşturma
    const summary = records.map(r => {
      const status = r.date_administered
        ? `yapıldı: ${r.date_administered.toISOString().split('T')[0]}`
        : `planlı: ${r.scheduled_date.toISOString().split('T')[0]}`;
      return `- ${r.name} (${r.disease}): ${status}`;
    }).join('\n');

    // 5) System prompt
    const systemPrompt = `
Sen bir çocuk aşı danışmanı botusun.
Çocuğun adı: ${child.name}
Yaşı: ${ageMonths} ay
Aşı durumu:
${summary}

Kullanıcı mesajı: "${message}"
Eksik aşıları ve önerileri açıkla.
    `.trim();

    console.log('📝 systemPrompt:', systemPrompt);

    // 6) GPT-3.5 çağrısı
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: message }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const reply = completion.choices[0].message.content;
    console.log('✅ OpenAI reply:', reply);
    return res.json({ reply });

  } catch (error) {
    console.error('❌ [Chat] error:', error);
    return res
      .status(500)
      .json({ error: 'Bot servisi çalışırken hata oluştu.' });
  }
});

module.exports = router;
