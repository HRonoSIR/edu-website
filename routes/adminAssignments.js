// routes/adminAssignments.js
const express = require('express');
const router = express.Router();
const Assignment = require('../models/Assignment'); // Убедитесь, что модель существует

// Обработчик GET-запроса для отображения списка заданий
router.get('/assignments', async (req, res) => {
  try {
    const assignments = await Assignment.find({}).lean();
    res.render('adminAssignments', { assignments });
  } catch (error) {
    console.error("Ошибка при получении заданий:", error);
    res.status(500).send("Ошибка сервера при получении заданий");
  }
});

// Обработчик GET-запроса для отображения формы добавления задания
router.get('/assignments/new', (req, res) => {
  res.render('newAssignment');
});

// Обработчик POST-запроса для создания нового задания
router.post('/assignments', async (req, res) => {
  try {
    // Получаем все данные из тела запроса
    const { title, question, correctAnswer, maxPoints, lessonId } = req.body;

    // Создаем новое задание, включая поле lessonId
    const newAssignment = new Assignment({
      title,
      question,
      correctAnswer,
      maxPoints,
      lessonId  // Добавляем lessonId
    });

    // Сохраняем задание в базе данных
    await newAssignment.save();

    // Перенаправляем на страницу со списком заданий
    res.redirect('/admin/assignments');
  } catch (error) {
    console.error("Ошибка при создании задания:", error);
    res.status(500).send("Ошибка сервера при создании задания");
  }
});

module.exports = router;


