import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import xlsx from 'xlsx';
import File from '../models/File.js';

 // Make sure to add .js if using ES modules
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Ensure 'uploads' folder exists
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log(`Uploads directory created at: ${uploadDir}`);
} else {
    console.log(`Uploads directory exists at: ${uploadDir}`);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Upload Route
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        const { year, course } = req.body;
        const newFile = new File({
            filename: req.file.filename,
            year,
            course
        });
        await newFile.save();
        res.status(200).json({ message: 'File uploaded successfully!' });
    } catch (error) {
        console.error("Error saving file to database:", error);
        res.status(500).json({ error: 'Failed to upload file' });
    }
});

// Fetch files with filters
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
        console.error("Error fetching files:", error);
        res.status(500).json({ error: 'Failed to fetch files' });
    }
});
// Download Route
router.get('/download/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(uploadDir, filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'File not found' });
    }

    // Send the file as a download
    res.download(filePath, filename, (err) => {
        if (err) {
            console.error("Error downloading file:", err);
            res.status(500).json({ message: 'Failed to download file' });
        }
    });
});
// Delete Route
router.delete('/file/:filename', async (req, res) => {
    try {
        const filename = req.params.filename;
        const filePath = path.join(__dirname, "../uploads", filename); // Use absolute path

        console.log(`Attempting to delete file at: ${filePath}`);

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            console.error('File not found:', filePath);
            return res.status(404).json({ message: 'File not found' });
        }

        // Delete file from the server
        fs.unlinkSync(filePath);

        // Delete file from the database
        await File.findOneAndDelete({ filename });

        console.log('File deleted successfully:', filename);
        res.status(200).json({ message: 'File deleted successfully' });
    } catch (error) {
        console.error("Error deleting file:", error);
        res.status(500).json({ message: 'Failed to delete file' });
    }
});

router.get('/students/:year', async (req, res) => {
    try {
        const { year } = req.params;

        // Find all files for the given year
        const files = await File.find({ year });

        if (files.length === 0) {
            return res.status(404).json({ message: `No student data found for ${year}` });
        }

        let studentsData = {};

        // Read and process each file
        for (const file of files) {
            const filePath = path.join(uploadDir, file.filename);

            if (fs.existsSync(filePath)) {
                const workbook = xlsx.readFile(filePath);
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const jsonData = xlsx.utils.sheet_to_json(sheet);

                jsonData.forEach(student => {
                    const regNo = student["Reg No"];

                    if (!studentsData[regNo]) {
                        studentsData[regNo] = { ...student }; // Initialize with first occurrence
                    } else {
                        // Merge data dynamically, ensuring no data loss
                        Object.keys(student).forEach(key => {
                            if (!studentsData[regNo][key]) {
                                studentsData[regNo][key] = student[key];
                            }
                        });
                    }
                });
            }
        }

        // Convert the object to an array
        const mergedStudents = Object.values(studentsData);

        res.status(200).json({ students: mergedStudents });

    } catch (error) {
        console.error("Error fetching students:", error);
        res.status(500).json({ message: 'Error retrieving student data' });
    }
});
// Route to fetch file content
router.get("/file/:filename", (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(uploadDir, filename);

    console.log(`Looking for file at: ${filePath}`);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        return res.status(404).json({ message: "File not found" });
    }

    // Read the Excel file using 'xlsx'
    try {
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = xlsx.utils.sheet_to_json(sheet);

        console.log(`File read successfully: ${filename}`);
        res.status(200).json({ data: jsonData });
    } catch (error) {
        console.error("Error reading file:", error);
        res.status(500).json({ message: "Error reading file" });
    }
});

// Route to list all files in the 'uploads' directory
router.get("/uploads", (req, res) => {
    fs.readdir(uploadDir, (err, files) => {
        if (err) {
            console.error("Failed to read directory:", err);
            return res.status(500).json({ error: "Failed to read directory" });
        }

        const xlsxFiles = files.filter(file => file.endsWith('.xlsx'));

        if (xlsxFiles.length === 0) {
            return res.status(404).json({ error: "No files found" });
        }

        res.json({ files: xlsxFiles });
    });
});

// Route to get the latest uploaded file
router.get("/latest", (req, res) => {
    fs.readdir(uploadDir, (err, files) => {
        if (err) {
            return res.status(500).json({ error: "Failed to read directory" });
        }

        const xlsxFiles = files.filter(file => file.endsWith('.xlsx'));

        if (xlsxFiles.length === 0) {
            return res.status(404).json({ error: "No files found" });
        }

        const sortedFiles = xlsxFiles
            .map(file => ({
                name: file,
                time: fs.statSync(path.join(uploadDir, file)).mtime.getTime()
            }))
            .sort((a, b) => b.time - a.time);

        const latestFileName = sortedFiles[0].name;
        res.json({ filename: latestFileName });
    });
});

export default router;
