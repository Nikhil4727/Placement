// year.js
import mongoose from 'mongoose';

const yearSchema = new mongoose.Schema({
  year: { type: String, required: true, unique: true },
});

const Year = mongoose.model('Year', yearSchema);  // Notice the name 'Year' (Capitalized)
export default Year;
