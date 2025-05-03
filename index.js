// index.js

// 1. Подключение необходимых модулей
require('dotenv').config();

const apiKey = process.env.OPENAI_API_KEY;
console.log("API Key:", apiKey ? "Загружен" : "НЕ загружен");
const express   = require('express');
const path      = require('path');
const mongoose  = require('mongoose');
const bcrypt    = require('bcrypt');
const session   = require('express-session');
const nodemailer= require('nodemailer');

// Подключаем модель пользователя (если нужна в этом файле)
const User = require('./models/User');

// Подключаем маршруты
const adminUsersRouter = require('./routes/adminUsers');
const adminAssignmentsRouter = require('./routes/adminAssignments');
const adminDashboardRouter = require('./routes/adminDashboard');
const studentAssignmentsRouter = require('./routes/studentAssignments');

// Создаём приложение
const app = express();
const port = process.env.PORT || 3000;

// 2. Подключение к MongoDB
mongoose.connect('mongodb://localhost:27017/edu-website', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('Connected to MongoDB...'))
  .catch(err => console.error('MongoDB connection error:', err));

// 3. Настройка middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'yourSecretKey',
  resave: false,
  saveUninitialized: false
}));
app.use(express.static(path.join(__dirname, 'public')));

// 4. Настройка EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 5. Основные маршруты
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Пример простого маршрута регистрации
app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).send('Введите имя пользователя, email и пароль.');
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).send('Пользователь с таким email уже существует.');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();
    res.send('Пользователь зарегистрирован!');
  } catch (err) {
    console.error('Ошибка регистрации:', err);
    res.status(500).send('Ошибка регистрации.');
  }
});

// 6. Подключение маршрутов админ-панели и студентских заданий
// Пример: http://localhost:3000/admin/users -> список пользователей
app.use('/admin', adminUsersRouter);
// Пример: http://localhost:3000/admin -> главная страница админ-панели
app.use('/admin', adminDashboardRouter);
// Пример: http://localhost:3000/admin/assignments -> управление заданиями
app.use('/admin', adminAssignmentsRouter);
// Пример: http://localhost:3000/assignments -> задания для студентов (если в studentAssignmentsRouter так задано)
app.use('/', studentAssignmentsRouter);


// 7. Запуск сервера
app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});
