import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  Regnumber: { type: String, required: true, unique: true },
  sec: { type: String, required: true },
  year: { type: Number, required: true },
  Batch:{type:String,required:true},
  CodeChef: { type: Object, default: {} },
  Aws: { type: Array, default: [] },
  QALR: { type: Array, default: [] },
},{strict : false});

const Student = mongoose.model('Student', studentSchema);
export default Student;
