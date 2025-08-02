const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { PDFDocument } = require('pdf-lib');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed!'), false);
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Upload PDF files
app.post('/api/upload', upload.array('pdfs', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        const fileInfo = [];
        
        for (const file of req.files) {
            try {
                // Read PDF to get page count
                const pdfBytes = fs.readFileSync(file.path);
                const pdfDoc = await PDFDocument.load(pdfBytes);
                const pageCount = pdfDoc.getPageCount();
                
                fileInfo.push({
                    id: file.filename,
                    originalName: file.originalname,
                    filename: file.filename,
                    path: file.path,
                    size: file.size,
                    pageCount: pageCount
                });
            } catch (error) {
                console.error('Error processing PDF:', error);
                // Clean up the problematic file
                if (fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
            }
        }

        res.json({
            success: true,
            files: fileInfo
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Upload failed' });
    }
});

// Merge PDFs with selected pages
app.post('/api/merge', async (req, res) => {
    try {
        const { files } = req.body;
        
        if (!files || files.length === 0) {
            return res.status(400).json({ error: 'No files to merge' });
        }

        console.log('Starting merge process for', files.length, 'files');
        const mergedPdf = await PDFDocument.create();

        for (let i = 0; i < files.length; i++) {
            const fileInfo = files[i];
            console.log(`Processing file ${i + 1}: ${fileInfo.originalName}`);
            
            try {
                const filePath = path.join(__dirname, 'uploads', fileInfo.filename);
                
                if (!fs.existsSync(filePath)) {
                    console.log(`File not found: ${filePath}`);
                    continue;
                }

                const pdfBytes = fs.readFileSync(filePath);
                const pdf = await PDFDocument.load(pdfBytes);
                const totalPages = pdf.getPageCount();
                
                console.log(`File has ${totalPages} pages`);
                console.log(`Selected pages string: "${fileInfo.selectedPages}"`);
                
                // Parse page ranges
                const pagesToCopy = parsePageRanges(fileInfo.selectedPages, totalPages);
                console.log(`Pages to copy: [${pagesToCopy.join(', ')}]`);
                
                if (pagesToCopy.length === 0) {
                    console.log('No valid pages to copy, skipping file');
                    continue;
                }
                
                // Copy selected pages
                const copiedPages = await mergedPdf.copyPages(pdf, pagesToCopy);
                console.log(`Copied ${copiedPages.length} pages`);
                
                // Add pages to merged document
                copiedPages.forEach((page, index) => {
                    mergedPdf.addPage(page);
                    console.log(`Added page ${index + 1} to merged document`);
                });
                
            } catch (error) {
                console.error(`Error processing file ${fileInfo.filename}:`, error);
                // Continue with other files instead of failing completely
            }
        }

        const totalMergedPages = mergedPdf.getPageCount();
        console.log(`Total pages in merged document: ${totalMergedPages}`);
        
        if (totalMergedPages === 0) {
            return res.status(400).json({ error: 'No pages were successfully merged' });
        }

        // Save merged PDF
        const mergedPdfBytes = await mergedPdf.save();
        const outputFilename = `merged-${Date.now()}.pdf`;
        const outputPath = path.join(__dirname, 'uploads', outputFilename);
        
        fs.writeFileSync(outputPath, mergedPdfBytes);
        console.log(`Merged PDF saved as: ${outputFilename}`);

        res.json({
            success: true,
            downloadUrl: `/api/download/${outputFilename}`,
            filename: outputFilename
        });

    } catch (error) {
        console.error('Merge error:', error);
        res.status(500).json({ error: 'Merge failed: ' + error.message });
    }
});

// Download merged PDF
app.get('/api/download/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'uploads', filename);
    
    if (fs.existsSync(filePath)) {
        res.download(filePath, 'merged-document.pdf', (err) => {
            if (!err) {
                // Clean up the file after download
                setTimeout(() => {
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }
                }, 5000);
            }
        });
    } else {
        res.status(404).json({ error: 'File not found' });
    }
});

// Clean up uploaded files
app.delete('/api/cleanup/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'uploads', filename);
    
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'File not found' });
    }
});

// Helper function to parse page ranges
function parsePageRanges(rangeString, totalPages) {
    if (!rangeString || rangeString.trim() === '' || rangeString === 'all') {
        // Return all pages if no range specified or "all" is selected
        return Array.from({ length: totalPages }, (_, i) => i);
    }

    const pages = new Set();
    const ranges = rangeString.split(',');

    for (let range of ranges) {
        range = range.trim();
        
        if (range.includes('-')) {
            const parts = range.split('-');
            const start = parseInt(parts[0].trim());
            const end = parseInt(parts[1].trim());
            
            if (!isNaN(start) && !isNaN(end) && start >= 1 && end <= totalPages && start <= end) {
                for (let i = start; i <= end; i++) {
                    pages.add(i - 1); // Convert to 0-based index
                }
            }
        } else {
            const pageNum = parseInt(range.trim());
            if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
                pages.add(pageNum - 1); // Convert to 0-based index
            }
        }
    }

    return Array.from(pages).sort((a, b) => a - b);
}

// Clean up old files periodically (every hour)
setInterval(() => {
    const uploadsDir = path.join(__dirname, 'uploads');
    if (fs.existsSync(uploadsDir)) {
        const files = fs.readdirSync(uploadsDir);
        const now = Date.now();
        
        files.forEach(file => {
            const filePath = path.join(uploadsDir, file);
            const stats = fs.statSync(filePath);
            const fileAge = now - stats.mtime.getTime();
            
            // Delete files older than 1 hour
            if (fileAge > 60 * 60 * 1000) {
                fs.unlinkSync(filePath);
                console.log(`Cleaned up old file: ${file}`);
            }
        });
    }
}, 60 * 60 * 1000);

app.listen(PORT, () => {
    console.log(`PDF Merger server running on http://localhost:${PORT}`);
});