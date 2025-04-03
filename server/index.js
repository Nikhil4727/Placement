import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import uploadRoutes from "./routes/uploadRoutes.js"; // Use named import
import Course from './models/Course.js';
import Year from './models/year.js';

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

app.post('/add-course', async (req, res) => {
  const { coursename } = req.body;
  try {
    const course = new Course({ coursename });
    await course.save();
    res.status(201).json(course);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Error creating course' });
  }
})
app.post('/add-year', async (req, res) => {
  const { year: yearValue } = req.body;  // Use a different name for the request body variable
  try {
    const newYear = new Year({ year: yearValue });  // Use a different variable name here
    await newYear.save();
    res.status(201).json(newYear);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Error creating year' });
  }
});

app.get('/data', async (req, res) => {
  try {
    const courses = await Course.find();
    const years = await Year.find();

    const formattedCourses = courses.map(course => ({
      id: course._id,
      coursename: course.coursename,
      year: course.year,
    }));

    const formattedYears = years.map(year => ({
      id: year._id,
      year: year.year,
    }));

    res.status(200).json({ courses: formattedCourses, years: formattedYears });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Error fetching data' });
  }
});


app.delete('/delete-year', async (req, res) => {
  const { id } = req.body;  
  try {
    await Year.deleteOne({ _id: id });  
    res.status(200).json({ message: 'Year deleted' });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Error deleting year' });
  }
});


app.delete('/delete-course', async (req, res) => {
  const { id } = req.body;  // Expecting 'id' in the request body
  try {
    await Course.deleteOne({ _id: id });  // Use _id for deletion
    res.status(200).json({ message: 'Course deleted' });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Error deleting Course' });
  }
});


// Routes
app.use('/api/auth', authRoutes);
app.use("/api", uploadRoutes);
const PORT = process.env.PORT || 5000;

connectDB();

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
