// Global variables
let uploadedFiles = [];
let currentFileIndex = 0;

// DOM Elements
const fileInput = document.getElementById('fileInput');
const uploadArea = document.getElementById('uploadArea');
const filesSection = document.getElementById('filesSection');
const filesList = document.getElementById('filesList');
const mergeBtn = document.getElementById('mergeBtn');
const progressSection = document.getElementById('progressSection');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const downloadSection = document.getElementById('downloadSection');
const downloadLink = document.getElementById('downloadLink');
const pageModal = document.getElementById('pageModal');

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    showTab('home');
});

// Event Listeners
function initializeEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tab = this.getAttribute('data-tab');
            showTab(tab);
        });
    });

    // File upload
    fileInput.addEventListener('change', handleFileSelect);
    
    // Drag and drop
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    // Upload area click handler - only trigger on the button or when no files are uploaded
    uploadArea.addEventListener('click', (e) => {
        // Only trigger file input if clicking the upload button or the upload area itself (not child elements)
        if (e.target === uploadArea || e.target.classList.contains('upload-btn') || e.target.closest('.upload-btn')) {
            e.preventDefault();
            fileInput.click();
        }
    });

    // Page selection modal
    document.querySelectorAll('input[name="pageOption"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const pageRangeInput = document.getElementById('pageRangeInput');
            if (this.value === 'range') {
                pageRangeInput.style.display = 'block';
            } else {
                pageRangeInput.style.display = 'none';
            }
        });
    });

    // Rating stars
    document.querySelectorAll('.rating-stars i').forEach((star, index) => {
        star.addEventListener('click', function() {
            setRating(index + 1);
        });
    });
}

// Tab Navigation
function showTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName).classList.add('active');
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
}

// File Upload Handlers
function handleFileSelect(event) {
    const files = Array.from(event.target.files);
    uploadFiles(files);
}

function handleDragOver(event) {
    event.preventDefault();
    uploadArea.classList.add('dragover');
}

function handleDragLeave(event) {
    event.preventDefault();
    uploadArea.classList.remove('dragover');
}

function handleDrop(event) {
    event.preventDefault();
    uploadArea.classList.remove('dragover');
    const files = Array.from(event.dataTransfer.files);
    const pdfFiles = files.filter(file => file.type === 'application/pdf');
    
    if (pdfFiles.length !== files.length) {
        alert('Please upload only PDF files.');
    }
    
    if (pdfFiles.length > 0) {
        uploadFiles(pdfFiles);
    }
}

// Upload files to server
async function uploadFiles(files) {
    if (files.length === 0) return;

    const formData = new FormData();
    files.forEach(file => {
        formData.append('pdfs', file);
    });

    try {
        showProgress('Uploading files...', 30);
        
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        
        if (result.success) {
            uploadedFiles = [...uploadedFiles, ...result.files];
            renderFilesList();
            showFilesSection();
            hideProgress();
        } else {
            throw new Error(result.error || 'Upload failed');
        }
    } catch (error) {
        console.error('Upload error:', error);
        alert('Error uploading files: ' + error.message);
        hideProgress();
    }
}

// Render files list
function renderFilesList() {
    filesList.innerHTML = '';
    
    uploadedFiles.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <div class="file-header">
                <div class="file-info">
                    <i class="fas fa-file-pdf"></i>
                    <div class="file-details">
                        <h4>${file.originalName}</h4>
                        <p>${(file.size / (1024 * 1024)).toFixed(2)} MB • ${file.pageCount} pages</p>
                    </div>
                </div>
                <div class="file-actions">
                    <button class="action-btn select-pages-btn" onclick="openPageModal(${index})">
                        <i class="fas fa-list"></i> Select Pages
                    </button>
                    <button class="action-btn move-btn" onclick="moveFile(${index}, 'up')" ${index === 0 ? 'disabled' : ''}>
                        <i class="fas fa-arrow-up"></i>
                    </button>
                    <button class="action-btn move-btn" onclick="moveFile(${index}, 'down')" ${index === uploadedFiles.length - 1 ? 'disabled' : ''}>
                        <i class="fas fa-arrow-down"></i>
                    </button>
                    <button class="action-btn remove-btn" onclick="removeFile(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            ${file.selectedPages ? `
                <div class="page-selection">
                    <h5><i class="fas fa-check-circle"></i> Page Selection:</h5>
                    <p>${file.selectedPages === 'all' ? 'All pages selected' : `Pages: ${file.selectedPages}`}</p>
                </div>
            ` : ''}
        `;
        filesList.appendChild(fileItem);
    });

    // Update merge button state
    const allFilesHaveSelection = uploadedFiles.every(file => file.selectedPages);
    mergeBtn.disabled = !allFilesHaveSelection || uploadedFiles.length < 2;
}

// File management functions
function removeFile(index) {
    const file = uploadedFiles[index];
    
    // Clean up file on server
    fetch(`/api/cleanup/${file.filename}`, {
        method: 'DELETE'
    });
    
    uploadedFiles.splice(index, 1);
    renderFilesList();
    
    if (uploadedFiles.length === 0) {
        hideFilesSection();
    }
}

function moveFile(index, direction) {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < uploadedFiles.length) {
        [uploadedFiles[index], uploadedFiles[targetIndex]] = [uploadedFiles[targetIndex], uploadedFiles[index]];
        renderFilesList();
    }
}

// Page selection modal
function openPageModal(fileIndex) {
    currentFileIndex = fileIndex;
    const file = uploadedFiles[fileIndex];
    
    document.getElementById('modalFileName').textContent = file.originalName;
    document.getElementById('modalPageCount').textContent = file.pageCount;
    
    // Reset modal inputs
    document.querySelector('input[name="pageOption"][value="all"]').checked = true;
    document.getElementById('pageRangeInput').style.display = 'none';
    document.getElementById('pageRange').value = '';
    
    // Pre-fill if already selected
    if (file.selectedPages) {
        if (file.selectedPages === 'all') {
            document.querySelector('input[name="pageOption"][value="all"]').checked = true;
        } else {
            document.querySelector('input[name="pageOption"][value="range"]').checked = true;
            document.getElementById('pageRangeInput').style.display = 'block';
            document.getElementById('pageRange').value = file.selectedPages;
        }
    }
    
    pageModal.style.display = 'block';
}

function closePageModal() {
    pageModal.style.display = 'none';
}

function confirmPageSelection() {
    const selectedOption = document.querySelector('input[name="pageOption"]:checked').value;
    let selectedPages;
    
    if (selectedOption === 'all') {
        selectedPages = 'all';
    } else {
        const pageRange = document.getElementById('pageRange').value.trim();
        if (!pageRange) {
            alert('Please enter page numbers or ranges.');
            return;
        }
        
        // Validate page range format
        if (!isValidPageRange(pageRange, uploadedFiles[currentFileIndex].pageCount)) {
            alert('Invalid page range. Please use format like: 1-3, 5, 8-10');
            return;
        }
        
        selectedPages = pageRange;
    }
    
    uploadedFiles[currentFileIndex].selectedPages = selectedPages;
    renderFilesList();
    closePageModal();
}

// Validate page range
function isValidPageRange(rangeString, totalPages) {
    const ranges = rangeString.split(',');
    
    for (let range of ranges) {
        range = range.trim();
        
        if (range.includes('-')) {
            const [start, end] = range.split('-').map(n => parseInt(n.trim()));
            if (isNaN(start) || isNaN(end) || start < 1 || end > totalPages || start > end) {
                return false;
            }
        } else {
            const pageNum = parseInt(range);
            if (isNaN(pageNum) || pageNum < 1 || pageNum > totalPages) {
                return false;
            }
        }
    }
    
    return true;
}

// Merge PDFs
async function mergePDFs() {
    if (uploadedFiles.length < 2) {
        alert('Please upload at least 2 PDF files.');
        return;
    }

    const allFilesHaveSelection = uploadedFiles.every(file => file.selectedPages);
    if (!allFilesHaveSelection) {
        alert('Please select pages for all uploaded files.');
        return;
    }

    try {
        showProgress('Merging PDFs...', 50);
        
        console.log('Sending files for merge:', uploadedFiles);
        
        const response = await fetch('/api/merge', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                files: uploadedFiles
            })
        });

        const result = await response.json();
        console.log('Merge result:', result);
        
        if (result.success) {
            showProgress('Merge completed!', 100);
            setTimeout(() => {
                hideProgress();
                showDownloadSection(result.downloadUrl, result.filename);
            }, 1000);
        } else {
            throw new Error(result.error || 'Merge failed');
        }
    } catch (error) {
        console.error('Merge error:', error);
        alert('Error merging PDFs: ' + error.message);
        hideProgress();
    }
}

// UI Helper Functions
function showFilesSection() {
    filesSection.style.display = 'block';
}

function hideFilesSection() {
    filesSection.style.display = 'none';
}

function showProgress(text, percentage) {
    progressText.textContent = text;
    progressFill.style.width = percentage + '%';
    progressSection.style.display = 'block';
}

function hideProgress() {
    progressSection.style.display = 'none';
}

function showDownloadSection(downloadUrl, filename) {
    downloadLink.href = downloadUrl;
    downloadLink.download = filename;
    downloadSection.style.display = 'block';
    
    // Hide files section
    filesSection.style.display = 'none';
}

function resetApp() {
    // Clean up uploaded files
    uploadedFiles.forEach(file => {
        fetch(`/api/cleanup/${file.filename}`, {
            method: 'DELETE'
        });
    });
    
    uploadedFiles = [];
    fileInput.value = '';
    
    // Reset UI
    hideFilesSection();
    hideProgress();
    downloadSection.style.display = 'none';
    
    renderFilesList();
}

// Feedback Functions
function setRating(rating) {
    document.querySelectorAll('.rating-stars i').forEach((star, index) => {
        if (index < rating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}

function submitFeedback() {
    const rating = document.querySelectorAll('.rating-stars i.active').length;
    const type = document.getElementById('feedbackType').value;
    const subject = document.getElementById('feedbackSubject').value;
    const message = document.getElementById('feedbackMessage').value;
    const email = document.getElementById('feedbackEmail').value;
    
    if (!message.trim()) {
        alert('Please provide your feedback message.');
        return;
    }
    
    // Here you would typically send the feedback to your server
    console.log('Feedback submitted:', { rating, type, subject, message, email });
    
    alert('Thank you for your feedback! We appreciate your input.');
    
    // Reset form
    document.querySelectorAll('.rating-stars i').forEach(star => star.classList.remove('active'));
    document.getElementById('feedbackType').value = '';
    document.getElementById('feedbackSubject').value = '';
    document.getElementById('feedbackMessage').value = '';
    document.getElementById('feedbackEmail').value = '';
}

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target === pageModal) {
        closePageModal();
    }
}

// Keyboard shortcuts
document.addEventListener('keydown', function(event) {
    // Close modal with Escape key
    if (event.key === 'Escape' && pageModal.style.display === 'block') {
        closePageModal();
    }
    
    // Quick navigation with number keys (when not in input fields)
    if (event.target.tagName !== 'INPUT' && event.target.tagName !== 'TEXTAREA') {
        switch(event.key) {
            case '1':
                showTab('home');
                break;
            case '2':
                showTab('about');
                break;
            case '3':
                showTab('feedback');
                break;
        }
    }
});

// Utility function to format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Check if browser supports required features
function checkBrowserSupport() {
    if (!window.FormData) {
        alert('Your browser does not support file uploads. Please update your browser.');
        return false;
    }
    
    if (!window.fetch) {
        alert('Your browser does not support modern web features. Please update your browser.');
        return false;
    }
    
    return true;
}

// Initialize browser support check
if (!checkBrowserSupport()) {
    document.body.innerHTML = '<div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;"><h2>Browser Not Supported</h2><p>Please update your browser to use this application.</p></div>';
}