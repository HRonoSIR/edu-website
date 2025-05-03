// test-openai.js
require('dotenv').config(); // Загружаем переменные окружения
const fetch = require('node-fetch');

const apiKey = process.env.OPENAI_API_KEY; // Используем API-ключ из .env
const url = "https://api.openai.com/v1/models";

fetch(url, {
    method: "GET",
    headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
    }
})
  .then(response => response.json())
  .then(data => console.log("OpenAI API работает:", data))
  .catch(error => console.error("Ошибка запроса:", error));
  console.log("API Key из .env:", process.env.OPENAI_API_KEY);
