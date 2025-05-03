// models/Assignment.js
/*const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  question: { type: String, required: true },
  correctAnswer: { type: String, required: true },
  maxPoints: { type: Number, default: 100 }
}, { timestamps: true });

module.exports = mongoose.models.Assignment || mongoose.model('Assignment', assignmentSchema);
*/
// models/Assignment.js
const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  lessonId: { type: String, required: true }, // например, "1-lesson" или "2-lesson"
  question: { type: String, required: true },
  correctAnswer: { type: String, required: true },
  maxPoints: { type: Number, default: 100 }
  // ... другие поля, если нужно
}, { timestamps: true });

module.exports = mongoose.models.Assignment || mongoose.model('Assignment', assignmentSchema);

