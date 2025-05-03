// aiChecker.js (Обновлено для OpenAI API v4+)
require('dotenv').config();
const { OpenAI } = require("openai"); // Используем импорт для v4+

// Создаем экземпляр клиента OpenAI один раз при загрузке модуля
// Это более эффективно, чем создавать его при каждом вызове функции
let openai;
try {
    openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });
    // Опционально: проверка, что клиент создался (можно убрать после тестов)
    if (!process.env.OPENAI_API_KEY) {
         console.warn("ПРЕДУПРЕЖДЕНИЕ (aiChecker.js): OPENAI_API_KEY не найден в .env. Проверка ответов не будет работать.");
    } else {
         console.log("INFO (aiChecker.js): Клиент OpenAI v4+ успешно инициализирован.");
    }
} catch (error) {
    console.error("КРИТИЧЕСКАЯ ОШИБКА (aiChecker.js): Не удалось инициализировать клиент OpenAI:", error);
    // Если клиент не создался, дальнейшая работа невозможна
    openai = null; // Устанавливаем в null, чтобы функция проверки знала об ошибке
}


/**
 * Оценивает текстовый ответ студента с помощью OpenAI API v4+.
 * @param {string} question - Текст вопроса/задания.
 * @param {string} correctAnswer - Эталонный правильный ответ.
 * @param {string} studentAnswer - Ответ, данный студентом.
 * @returns {Promise<number>} - Оценка от 0 до 100, или 0 в случае ошибки.
 */
async function checkAnswer(question, correctAnswer, studentAnswer) {
  // Проверяем, был ли клиент OpenAI успешно создан при запуске
  if (!openai) {
      console.error("ОШИБКА (checkAnswer): Клиент OpenAI не был инициализирован. Проверка невозможна.");
      return 0; // Возвращаем 0, если клиент не готов
  }

  // Формируем промпт для чат-модели (gpt-3.5-turbo)
  const prompt = `
      Пожалуйста, сравни ответ студента с правильным ответом на заданный вопрос.
      Вопрос: "${question}"
      Эталонный правильный ответ: "${correctAnswer}"
      Ответ студента: "${studentAnswer}"

      Оцени, насколько ответ студента соответствует смыслу и содержанию эталонного ответа, по шкале от 0 до 100.
      100 баллов означает полное смысловое совпадение или очень близкое к нему.
      0 баллов означает полное несоответствие или бессмысленный ответ.

      В своем ответе верни ТОЛЬКО ОДНО ЧИСЛО - итоговую оценку (например: 75).
      Не добавляй никаких пояснений, слов "балл(ов)" или другой текстовой информации. Только число.
  `;

  try {
    console.log(`INFO (checkAnswer): Отправка запроса в OpenAI для вопроса: "${question.substring(0, 50)}..."`); // Логгируем начало запроса

    // Используем Chat Completions API (v4+)
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5",       // Используем современную чат-модель
      messages: [{ role: "user", content: prompt }], // Передаем промпт в сообщении пользователя
      temperature: 0.1,             // Низкая температура для более стабильной оценки
      max_tokens: 15,               // Достаточно для числа 0-100 и небольшого запаса
    });

    // Извлекаем текстовый ответ из структуры v4+
    const rawResult = completion.choices[0].message.content.trim();
    console.log(`INFO (checkAnswer): Сырой ответ OpenAI: "${rawResult}"`); // Логгируем сырой ответ

    // Пытаемся извлечь число из ответа (ищем только цифры в строке)
    const gradeMatch = rawResult.match(/^\d+$/);
    let grade = 0; // Оценка по умолчанию

    if (gradeMatch) {
        grade = parseInt(gradeMatch[0], 10);
        // Ограничиваем оценку диапазоном 0-100
        grade = Math.max(0, Math.min(100, grade));
        console.log(`INFO (checkAnswer): Извлеченная оценка: ${grade}`);
    } else {
        console.warn(`ПРЕДУПРЕЖДЕНИЕ (checkAnswer): Не удалось извлечь ЧИСТУЮ числовую оценку из ответа OpenAI: "${rawResult}". Попытка найти любое число...`);
        // Запасной вариант: ищем любое число в строке
        const fallbackMatch = rawResult.match(/\d+/);
        if (fallbackMatch) {
            grade = parseInt(fallbackMatch[0], 10);
            grade = Math.max(0, Math.min(100, grade));
            console.log(`INFO (checkAnswer): Использована запасная оценка: ${grade}`);
        } else {
            console.error(`ОШИБКА (checkAnswer): Числовая оценка не найдена в ответе OpenAI: "${rawResult}"`);
            // Оставляем grade = 0
        }
    }

    return grade; // Возвращаем полученную оценку (или 0)

  } catch (error) {
    console.error("ОШИБКА (checkAnswer): Ошибка при обращении к OpenAI API:", error);
    // Логгируем специфичные ошибки API OpenAI v4+, если они есть
    if (error instanceof OpenAI.APIError) {
        console.error("OpenAI API Error Status:", error.status);
        console.error("OpenAI API Error Message:", error.message);
        console.error("OpenAI API Error Code:", error.code);
        console.error("OpenAI API Error Type:", error.type);
    }
    return 0; // Возвращаем 0 в случае любой ошибки
  }
}

// Экспортируем обновленную функцию
module.exports = { checkAnswer };