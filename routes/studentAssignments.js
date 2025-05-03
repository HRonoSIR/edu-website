// routes/studentAssignments.js
const express = require('express');
const router = express.Router();
const Assignment = require('../models/Assignment');
const User = require('../models/User');

// --- СТАРЫЙ КОД (вероятно, перестанет работать с openai v4+) ---
const { checkAnswer } = require('../aiChecker'); // Использует старый API v3

// Маршрут для проверки ТЕКСТОВОГО ответа студента (ИСПОЛЬЗУЕТ СТАРЫЙ aiChecker)
router.post('/check-assignment', async (req, res) => {
  console.log("INFO: Обращение к /check-assignment (использует aiChecker.js - старый API v3)");
  try {
    const { lessonId, studentAnswer } = req.body;
    const assignment = await Assignment.findOne({ lessonId });
    if (!assignment) return res.status(404).send('Задание не найдено');

    // --->>> ВНИМАНИЕ: Эта строка, скорее всего, вызовет ошибку, если установлена openai v4+ <<<---
    /*const grade = await checkAnswer(
      assignment.question,
      assignment.correctAnswer,
      studentAnswer
    );*/
    // --->>> Конец блока, который может не работать <<<---

    if (!req.session.userId) return res.status(401).send('Необходима авторизация');
    const user = await User.findById(req.session.userId);
    if (!user) return res.status(404).send('Пользователь не найден');

    const pointsEarned = Math.round((grade / 100) * assignment.maxPoints);
    user.points += pointsEarned;
    await user.save();
    res.send(`Вы набрали ${pointsEarned} баллов из ${assignment.maxPoints} возможных.`);
  } catch (error) {
    console.error('ОШИБКА в /check-assignment:', error); // Логгируем ошибку
    res.status(500).send('Ошибка сервера при проверке текстового задания');
  }
});
// --- КОНЕЦ СТАРОГО КОДА ---


// --- НОВЫЙ КОД для проверки КОДА через API (использует современный API v4+) ---
const { OpenAI } = require("openai"); // Импорт для v4+

// Создаем экземпляр клиента OpenAI (лучше делать это один раз вне обработчика)
// Убедитесь, что OPENAI_API_KEY есть в вашем .env файле
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Новый маршрут для проверки КОДА студента
router.post('/api/check-code', async (req, res) => {
    console.log("INFO: Обращение к /api/check-code (использует новый API v4+)");
    try {
        const studentCode = req.body.code;
        const assignmentDescription = req.body.assignment || "Не указано"; // Описание задания из запроса

        if (!studentCode) {
            console.log("WARN /api/check-code: Код не передан");
            return res.status(400).json({ error: "Код для проверки не был передан." });
        }

        console.log("INFO /api/check-code: Задание:", assignmentDescription);
        console.log("INFO /api/check-code: Отправка запроса в OpenAI...");

        const prompt = `
            Оцени следующий код студента по шкале от 0 до 100 баллов.
            Описание задания: "${assignmentDescription}".
            Критерии: правильность выполнения задачи согласно описанию, стиль, читаемость, эффективность.
            В ответе верни ТОЛЬКО одно число - итоговую оценку (например: 85). Без пояснений и текста.

            Код студента:
            \`\`\`
            ${studentCode}
            \`\`\`
        `;

        // Используем Chat Completions API (v4+)
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo", // Или "gpt-4" если доступен
            messages: [{ role: "user", content: prompt }],
            temperature: 0.2,
            max_tokens: 20,
        });

        const rawResult = completion.choices[0].message.content.trim();
        console.log("INFO /api/check-code: Сырой ответ OpenAI:", rawResult);

        // Извлечение числа из ответа
        const gradeMatch = rawResult.match(/^\d+$/); // Ищем строку, состоящую ТОЛЬКО из цифр
        let grade = 0;

        if (gradeMatch) {
            grade = parseInt(gradeMatch[0], 10);
            grade = Math.max(0, Math.min(100, grade)); // Ограничиваем 0-100
        } else {
            console.warn("WARN /api/check-code: Не удалось извлечь ЧИСТУЮ числовую оценку:", rawResult);
            // Попытка найти число внутри строки как запасной вариант
            const fallbackMatch = rawResult.match(/\d+/);
            if (fallbackMatch) {
                grade = parseInt(fallbackMatch[0], 10);
                grade = Math.max(0, Math.min(100, grade));
                console.log("INFO /api/check-code: Использована запасная оценка:", grade);
            } else {
               console.error("ERROR /api/check-code: Числовая оценка не найдена в ответе OpenAI.");
               // Можно вернуть ошибку или оставить 0
               // return res.status(500).json({ error: "ИИ вернул ответ в неожидаемом формате.", details: rawResult });
            }
        }

        console.log("INFO /api/check-code: Итоговая оценка:", grade);

        // Отправляем ответ клиенту (вашему мини-приложению)
        res.json({ grade: grade }); // Формат, который ожидает ваш фронтенд checkCode()

    } catch (error) {
        console.error("ОШИБКА в /api/check-code:", error);
        if (error instanceof OpenAI.APIError) { // Обработка ошибок API OpenAI v4+
           console.error("OpenAI API Error Status:", error.status);
           console.error("OpenAI API Error Message:", error.message);
        }
        res.status(500).json({ error: "Внутренняя ошибка сервера при проверке кода.", details: error.message });
    }
});
// --- КОНЕЦ НОВОГО КОДА ---

module.exports = router; // Экспорт роутера остается в конце файла
