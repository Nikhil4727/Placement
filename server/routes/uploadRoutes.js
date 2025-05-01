// import express from 'express';
// import multer from 'multer';
// import fs from 'fs';
// import path from 'path';
// import xlsx from 'xlsx';
// import { fileURLToPath } from 'url';
// import File from '../models/fileModel.js';
// import authenticateToken  from '../middleware/authMiddleware.js';

// const router = express.Router();

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const uploadDir = path.join(__dirname, '../uploads');
// if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// // Multer setup
// const storage = multer.diskStorage({
//     destination: (req, file, cb) => cb(null, uploadDir),
//     filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
// });
// const upload = multer({ storage });

// // Upload file
// router.post('/upload', upload.single('file'), async (req, res) => {
//     try {
//         const { year, course } = req.body;
//         const newFile = new File({ filename: req.file.filename, year, course });
//         await newFile.save();
//         res.status(200).json({ message: 'File uploaded successfully!' });
//     } catch (error) {
//         res.status(500).json({ error: 'Upload failed' });
//     }
// });

// // Upload with replacement
// router.post('/api/upload', authenticateToken, upload.single('file'), async (req, res) => {
//     try {
//         const { year, course, replace } = req.body;
//         if (replace === 'true') {
//             const existingFile = await File.findOne({ year, course });
//             if (existingFile) {
//                 const filePath = path.join(uploadDir, existingFile.filename);
//                 if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
//                 await File.deleteOne({ year, course });
//             }
//         }

//         const newFile = new File({ filename: req.file.filename, year, course });
//         await newFile.save();
//         res.status(200).json({ message: replace === 'true' ? 'File replaced' : 'File uploaded' });
//     } catch (error) {
//         res.status(500).json({ error: 'Upload or replacement failed' });
//     }
// });

// // Get all files with filters
// router.get('/files', async (req, res) => {
//     try {
//         const { year, section, course } = req.query;
//         const filters = {};
//         if (year && year !== 'All') filters.year = year;
//         if (section && section !== 'All') filters.section = section;
//         if (course && course !== 'All') filters.course = course;

//         const files = await File.find(filters).sort({ uploadDate: -1 });
//         res.status(200).json(files);
//     } catch (error) {
//         res.status(500).json({ error: 'Failed to fetch files' });
//     }
// });

// // Download a file
// router.get('/download/:filename', (req, res) => {
//     const filePath = path.join(uploadDir, req.params.filename);
//     if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'File not found' });

//     res.download(filePath, req.params.filename);
// });

// // Delete a file
// router.delete('/file/:filename', async (req, res) => {
//     try {
//         const filePath = path.join(uploadDir, req.params.filename);
//         if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'File not found' });

//         fs.unlinkSync(filePath);
//         await File.findOneAndDelete({ filename: req.params.filename });
//         res.status(200).json({ message: 'File deleted successfully' });
//     } catch (error) {
//         res.status(500).json({ error: 'Deletion failed' });
//     }
// });

// // Get students from all files for a specific year
// router.get('/students/:year', async (req, res) => {
//     try {
//         const files = await File.find({ year: req.params.year });
//         if (files.length === 0) return res.status(404).json({ message: 'No student data found' });

//         const studentsData = {};
//         for (const file of files) {
//             const filePath = path.join(uploadDir, file.filename);
//             if (fs.existsSync(filePath)) {
//                 const workbook = xlsx.readFile(filePath);
//                 const sheet = workbook.Sheets[workbook.SheetNames[0]];
//                 const data = xlsx.utils.sheet_to_json(sheet);

//                 data.forEach(student => {
//                     const regNo = student['Reg No'];
//                     if (!studentsData[regNo]) {
//                         studentsData[regNo] = { ...student };
//                     } else {
//                         Object.keys(student).forEach(key => {
//                             if (!studentsData[regNo][key]) {
//                                 studentsData[regNo][key] = student[key];
//                             }
//                         });
//                     }
//                 });
//             }
//         }

//         res.status(200).json({ students: Object.values(studentsData) });
//     } catch (error) {
//         res.status(500).json({ error: 'Failed to retrieve student data' });
//     }
// });

// // View a specific file’s content
// router.get('/file/:filename', (req, res) => {
//     const filePath = path.join(uploadDir, req.params.filename);
//     if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'File not found' });

//     const workbook = xlsx.readFile(filePath);
//     const sheet = workbook.Sheets[workbook.SheetNames[0]];
//     const jsonData = xlsx.utils.sheet_to_json(sheet);

//     res.status(200).json({ data: jsonData });
// });

// // List all uploaded Excel files
// router.get('/uploads', (req, res) => {
//     fs.readdir(uploadDir, (err, files) => {
//         if (err) return res.status(500).json({ error: 'Failed to read upload directory' });

//         const xlsxFiles = files.filter(file => file.endsWith('.xlsx'));
//         if (xlsxFiles.length === 0) return res.status(404).json({ error: 'No files found' });

//         res.json({ files: xlsxFiles });
//     });
// });

// export default router;

import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import xlsx from 'xlsx';
import { fileURLToPath } from 'url';
import File from '../models/fileModel.js';
import authenticateToken from '../middleware/authMiddleware.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Multer setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});
const upload = multer({ storage });


// ✅ Upload with replacement logic
router.post('/api/upload', authenticateToken, upload.single('file'), async (req, res) => {
    try {
        const { year, course, replace } = req.body;
        console.log('Received Upload - Replace:', replace, 'Year:', year, 'Course:', course);

        // If replace is true, remove existing file
        if (replace === 'true') {
            const existingFile = await File.findOneAndDelete({ year, course });
            if (existingFile) {
                const filePath = path.join(uploadDir, existingFile.filename);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    console.log('Old file deleted:', existingFile.filename);
                }
            }
        }

        // Save new file
        const newFile = new File({
            filename: req.file.filename,
            year,
            course
        });
        await newFile.save();

        res.status(200).json({
            message: replace === 'true' ? 'File replaced successfully!' : 'File uploaded successfully!'
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Upload or replacement failed' });
    }
});


// ✅ Upload without replacement
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        const { year, course } = req.body;
        const newFile = new File({ filename: req.file.filename, year, course });
        await newFile.save();
        res.status(200).json({ message: 'File uploaded successfully!' });
    } catch (error) {
        res.status(500).json({ error: 'Upload failed' });
    }
});


// ✅ Get all files with optional filters
router.get('/files', async (req, res) => {
    try {
        const { year, section, course } = req.query;
        const filters = {};
        if (year && year !== 'All') filters.year = year;
        if (section && section !== 'All') filters.section = section;
        if (course && course !== 'All') filters.course = course;

        const files = await File.find(filters).sort({ uploadDate: -1 });
        res.status(200).json(files);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch files' });
    }
});


// ✅ Download a file
router.get('/download/:filename', (req, res) => {
    const filePath = path.join(uploadDir, req.params.filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'File not found' });
    res.download(filePath, req.params.filename);
});


// ✅ Delete a file
router.delete('/file/:filename', async (req, res) => {
    try {
        const filePath = path.join(uploadDir, req.params.filename);
        if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'File not found' });

        fs.unlinkSync(filePath);
        await File.findOneAndDelete({ filename: req.params.filename });
        res.status(200).json({ message: 'File deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Deletion failed' });
    }
});


// ✅ Get combined student data by year
router.get('/students/:year', async (req, res) => {
    try {
        const files = await File.find({ year: req.params.year });
        if (files.length === 0) return res.status(404).json({ message: 'No student data found' });

        const studentsData = {};
        for (const file of files) {
            const filePath = path.join(uploadDir, file.filename);
            if (fs.existsSync(filePath)) {
                const workbook = xlsx.readFile(filePath);
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const data = xlsx.utils.sheet_to_json(sheet);

                data.forEach(student => {
                    const regNo = student['Reg No'];
                    if (!studentsData[regNo]) {
                        studentsData[regNo] = { ...student };
                    } else {
                        Object.keys(student).forEach(key => {
                            if (!studentsData[regNo][key]) {
                                studentsData[regNo][key] = student[key];
                            }
                        });
                    }
                });
            }
        }

        res.status(200).json({ students: Object.values(studentsData) });
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve student data' });
    }
});


// ✅ View content of one Excel file
router.get('/file/:filename', (req, res) => {
    const filePath = path.join(uploadDir, req.params.filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'File not found' });

    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = xlsx.utils.sheet_to_json(sheet);

    res.status(200).json({ data: jsonData });
});


// ✅ List all uploaded Excel files
router.get('/uploads', (req, res) => {
    fs.readdir(uploadDir, (err, files) => {
        if (err) return res.status(500).json({ error: 'Failed to read upload directory' });

        const xlsxFiles = files.filter(file => file.endsWith('.xlsx'));
        if (xlsxFiles.length === 0) return res.status(404).json({ error: 'No files found' });

        res.json({ files: xlsxFiles });
    });
});

export default router;
