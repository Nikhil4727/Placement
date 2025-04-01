// File.js
import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  year: { type: String, required: true },
  course: { type: String, required: true },
  uploadDate: { type: Date, default: Date.now }
});

const File = mongoose.model('File', fileSchema);
export default File;
