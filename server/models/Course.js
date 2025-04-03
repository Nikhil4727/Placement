// course.js
import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  coursename: { type: String, required: true, unique: true},
});

const course = mongoose.model('course', courseSchema);
export default course;
