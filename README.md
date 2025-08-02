# PDF Merger Application

A professional web application for merging PDF files with page selection functionality.  
**Built with Node.js, Express.js, and vanilla JavaScript.**

---

## Features

- 🚀 **Fast PDF Processing** — Efficient merging with `pdf-lib`
- 📄 **Page Selection** — Choose specific pages or ranges from each PDF
- 🔄 **File Reordering** — Drag and arrange files before merging
- 📱 **Responsive Design** — Works on desktop, tablet, and mobile
- 🔒 **Secure** — Files are automatically cleaned up after processing
- 🎨 **Modern UI** — Clean, professional interface with animations
- ⚡ **Real-time Progress** — Visual feedback during processing

---

## Screenshots

**Home Page**
- Clean upload interface with drag-and-drop support
- File management with page selection
- Progress tracking during merge

**Page Selection Modal**
- Intuitive page range selection
- Support for individual pages and ranges (e.g., `1-3, 5, 8-10`)
- Validation for page numbers

---

## Installation

1. **Clone or download the project files**
2. **Install dependencies**
    ```bash
    npm install
    ```
3. **Start the server**
    ```bash
    npm start
    ```
4. **For development with auto-restart:**
    ```bash
    npm run dev
    ```
5. **Open your browser:**  
   [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
pdf-merger-app/
├── package.json          # Dependencies and scripts
├── server.js             # Express server and API endpoints
├── README.md             # This file
├── public/               # Frontend files
│   ├── index.html        # Main HTML file
│   ├── styles.css        # CSS styles
│   └── script.js         # Frontend JavaScript
└── uploads/              # Temporary file storage (auto-created)
```

---

## API Endpoints

### `POST /api/upload`
Upload PDF files and get file information including page counts.

**Request:**  
FormData with PDF files

**Response:**
```json
{
  "success": true,
  "files": [
    {
      "id": "filename",
      "originalName": "document.pdf",
      "filename": "unique-filename.pdf",
      "size": 1024000,
      "pageCount": 10
    }
  ]
}
```

---

### `POST /api/merge`
Merge uploaded PDFs with selected pages.

**Request:**
```json
{
  "files": [
    {
      "filename": "file1.pdf",
      "selectedPages": "1-3, 5"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "downloadUrl": "/api/download/merged-file.pdf",
  "filename": "merged-file.pdf"
}
```

---

### `GET /api/download/:filename`
Download the merged PDF file.

---

### `DELETE /api/cleanup/:filename`
Clean up uploaded files.

---

## Usage

1. **Upload PDFs:** Drag and drop or click to select PDF files
2. **Select Pages:** Click "Select Pages" for each file to choose specific pages
3. **Arrange Order:** Use up/down arrows to reorder files
4. **Merge:** Click "Merge PDFs" to combine the files
5. **Download:** Download your merged PDF

---

## Page Selection Format

- **All pages:** Select "All pages" option
- **Specific pages:** Use comma-separated values
    - Single pages: `1, 3, 5`
    - Page ranges: `1-5, 8-10`
    - Mixed: `1-3, 5, 8-10, 15`

---

## Dependencies

- `express` — Web framework
- `multer` — File upload handling
- `pdf-lib` — PDF manipulation library
- `cors` — Cross-origin resource sharing
- `path` — File path utilities

### Development Dependencies

- `nodemon` — Development server with auto-restart

---

## Configuration

- **Maximum file size:** 10MB per file
- **Maximum files per upload:** 10 files
- **Supported format:** PDF only

---

## Cleanup

- Uploaded files are automatically deleted after 1 hour
- Merged files are deleted 5 seconds after download

---

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Modern mobile browsers

**Required Features:**  
FormData API, Fetch API, ES6+ JavaScript support

---

## Security Features

- File type validation (PDF only)
- File size limits
- Automatic cleanup of temporary files
- Path traversal protection
- CORS enabled

---

## Error Handling

- Invalid file types are rejected
- Oversized files are blocked
- Invalid page ranges are validated
- Network errors are handled gracefully
- User-friendly error messages

---

## Performance

- Efficient memory usage with streams
- Automatic cleanup prevents disk space issues
- Optimized PDF processing with pdf-lib
- Responsive UI with smooth animations

---

## Customization

**Styling:**  
Edit `public/styles.css` to customize appearance (colors, layout, animations).

**Functionality:**  
Modify `server.js` for backend changes (file size limits, cleanup intervals, new endpoints).

**Frontend:**  
Update `public/script.js` for UI enhancements (features, validations).

---

## Troubleshooting

**Port Already in Use**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm start
```

**File Upload Issues**
- Check file size (max 10MB)
- Ensure files are valid PDFs
- Check available disk space

**Memory Issues**
- Restart the server
- Reduce file sizes
- Check system memory

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## License

MIT License — feel free to use this project for personal or commercial purposes.

---

## Support

For issues or questions:
- Check the troubleshooting section
- Review the console for error messages
- Ensure all dependencies are installed
- Verify your browser supports required features

---

## Future Enhancements

- Password-protected PDF support
- Bookmark preservation
- Metadata editing
- Batch processing
- Cloud storage integration
- User accounts and history
- API rate limiting
- Docker containerization
