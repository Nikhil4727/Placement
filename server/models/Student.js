import mongoose from 'mongoose';

const StudentSchema = new mongoose.Schema({
  Regnumber: { type: String, required: true, unique: true },
  sec: { type: String, required: true },
  year: { type: Number, required: true },
  Batch:{type:String,required:true},
  CodeChef: { type: Object, default: {} },
  Aws: { type: Array, default: [] },
  QALR: { type: Array, default: [] },
});

const Student = mongoose.model('Student', StudentSchema);
export default Student;
