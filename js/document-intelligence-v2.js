/**
 * DOCUMENT INTELLIGENCE V2
 * Modern inline UI with slide-out panels and toast notifications
 */

// Current state
let currentDocument = null;
let currentPage = 0;
let uploadedFile = null;
let uploadFormVisible = false;

// ============================================
// INLINE UPLOAD AREA
// ============================================

function toggleUploadForm() {
    uploadFormVisible = !uploadFormVisible;
    const form = document.getElementById('inline-upload-form');
    const btn = document.getElementById('toggle-upload-btn');

    if (uploadFormVisible) {
        form.classList.remove('collapsed');
        btn.innerHTML = '<i class="ri-close-line"></i> Cancel';
        btn.className = 'action-btn action-btn-secondary';
    } else {
        form.classList.add('collapsed');
        btn.innerHTML = '<i class="ri-upload-2-line"></i> Upload Document';
        btn.className = 'action-btn action-btn-primary';
        clearFileSelection();
    }
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
        toast.error('File too large. Maximum size is 10MB.');
        return;
    }

    uploadedFile = file;
    showFilePreview(file);
}

function showFilePreview(file) {
    const preview = document.getElementById('inline-file-preview');
    const uploadArea = document.getElementById('dropzone-inline');

    preview.classList.remove('hidden');
    uploadArea.classList.add('collapsed');

    document.getElementById('file-name-inline').textContent = file.name;
    document.getElementById('file-size-inline').textContent = formatFileSize(file.size);

    // Update icon
    const icon = preview.querySelector('.file-icon i');
    if (file.type.includes('pdf')) {
        icon.className = 'ri-file-pdf-line';
        icon.style.color = 'var(--accent-error)';
    } else if (file.type.includes('image')) {
        icon.className = 'ri-file-image-line';
        icon.style.color = 'var(--accent-primary)';
    }
}

function clearFileSelection() {
    uploadedFile = null;
    const preview = document.getElementById('inline-file-preview');
    const uploadArea = document.getElementById('dropzone-inline');
    const fileInput = document.getElementById('file-input-inline');

    preview.classList.add('hidden');
    uploadArea.classList.remove('collapsed');
    fileInput.value = '';

    document.getElementById('upload-doc-type-inline').value = 'pod';
    document.getElementById('upload-booking-number-inline').value = '';
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// Drag and drop
document.addEventListener('DOMContentLoaded', () => {
    const dropzone = document.getElementById('dropzone-inline');
    if (!dropzone) return;

    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');

        const file = e.dataTransfer.files[0];
        if (file) {
            uploadedFile = file;
            showFilePreview(file);
        }
    });

    dropzone.addEventListener('click', () => {
        document.getElementById('file-input-inline').click();
    });
});

// ============================================
// UPLOAD & PROCESSING
// ============================================

async function uploadDocumentInline() {
    if (!uploadedFile) {
        toast.error('Please select a file to upload');
        return;
    }

    const docType = document.getElementById('upload-doc-type-inline').value;
    const bookingNumber = document.getElementById('upload-booking-number-inline').value.trim();
    const autoCreate = document.getElementById('auto-create-inline').checked;
    const createTasks = document.getElementById('create-tasks-inline').checked;

    // Show processing
    const processingEl = showProcessing('inline-file-preview', 'Uploading and processing...');

    try {
        // Read file as base64
        const fileData = await readFileAsBase64(uploadedFile);

        // Create document record
        const document = window.localDB.documents.create({
            fileName: uploadedFile.name,
            fileSize: uploadedFile.size,
            fileType: uploadedFile.type,
            fileData: fileData,
            documentType: docType,
            bookingNumber: bookingNumber || null,
            uploadedBy: 'Demo User',
            processingStatus: 'pending'
        });

        // Remove processing indicator
        processingEl.remove();

        // Show success
        toast.success(`Document uploaded! Processing started.`);

        // Close upload form
        toggleUploadForm();

        // Start processing (async)
        processDocument(document.id, autoCreate, createTasks);

        // Reload documents list
        await loadDocuments();

    } catch (error) {
        console.error('Upload error:', error);
        processingEl.remove();
        toast.error('Failed to upload document: ' + error.message);
    }
}

function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// ============================================
// AI DOCUMENT PROCESSING
// ============================================

async function processDocument(documentId, autoCreate = true, createTasks = true) {
    const document = window.localDB.documents.getById(documentId);
    if (!document) return;

    // Update status
    window.localDB.documents.update(documentId, {
        processingStatus: 'processing',
        processingStarted: new Date().toISOString()
    });

    // Reload UI
    await loadDocuments();

    try {
        // Simulate processing delay
        await sleep(2000);

        // Extract pages from document
        const pages = await extractPages(document);

        // Create page records
        let autoCreatedCount = 0;
        for (const pageData of pages) {
            const page = window.localDB.documentPages.create({
                documentId: document.id,
                ...pageData
            });

            // Perform AI extraction on relevant pages
            if (page.isRelevant) {
                const extraction = await performAIExtraction(document, page);

                const extractionResult = window.localDB.extractionResults.create({
                    documentId: document.id,
                    pageId: page.id,
                    ...extraction
                });

                // Auto-create transaction if confidence is high
                if (autoCreate && extractionResult.overallConfidence >= 0.85) {
                    const created = await autoCreateTransaction(extractionResult);
                    if (created) autoCreatedCount++;
                }

                // Create review task if confidence is low
                if (createTasks && extractionResult.requiresReview) {
                    createReviewTask(document, extractionResult);
                }
            }
        }

        // Count relevant pages
        const allPages = window.localDB.documentPages.getByDocumentId(documentId);
        const relevantPages = allPages.filter(p => p.isRelevant).length;
        const extractions = window.localDB.extractionResults.getByDocumentId(documentId);

        // Calculate average confidence
        const avgConfidence = extractions.length > 0
            ? extractions.reduce((sum, e) => sum + e.overallConfidence, 0) / extractions.length
            : 0;

        // Update document status
        window.localDB.documents.update(documentId, {
            processingStatus: 'completed',
            processingCompleted: new Date().toISOString(),
            totalPages: pages.length,
            relevantPages: relevantPages,
            confidence: avgConfidence,
            requiresReview: avgConfidence < 0.85
        });

        // Log event
        window.localDB.events.create({
            eventType: 'DocumentProcessed',
            bookingId: null,
            location: 'System',
            performedBy: 'AI',
            source: 'document_intelligence',
            description: `Processed ${document.fileName}: ${relevantPages} relevant pages, ${autoCreatedCount} auto-created`,
            confidence: avgConfidence
        });

        // Show completion toast
        if (autoCreatedCount > 0) {
            toast.success(`Processing complete! ${autoCreatedCount} transaction${autoCreatedCount > 1 ? 's' : ''} auto-created.`, 6000);
        } else {
            toast.info(`Processing complete! ${relevantPages} relevant page${relevantPages > 1 ? 's' : ''} extracted.`, 6000);
        }

    } catch (error) {
        console.error('Processing error:', error);
        window.localDB.documents.update(documentId, {
            processingStatus: 'failed',
            processingCompleted: new Date().toISOString()
        });
        toast.error('Processing failed: ' + error.message);
    }

    // Reload UI
    await loadDocuments();
}

// ============================================
// AI EXTRACTION (SIMULATED)
// ============================================

async function extractPages(document) {
    const numPages = document.documentType === 'pod'
        ? Math.floor(Math.random() * 3) + 1
        : Math.floor(Math.random() * 5) + 2;

    const pages = [];
    for (let i = 0; i < numPages; i++) {
        const relevanceScore = i === 0 ? 0.95 : Math.random();

        pages.push({
            pageNumber: i + 1,
            imageData: null,
            width: 595,
            height: 842,
            relevanceScore: relevanceScore,
            classifiedAs: relevanceScore > 0.5 ? document.documentType : 'irrelevant'
        });
    }

    return pages;
}

async function performAIExtraction(document, page) {
    await sleep(1000);

    const extractedFields = {
        bookingNumber: document.bookingNumber || generateMockBookingNumber(),
        equipmentType: randomChoice(['EUR', 'H1', 'CAGE', 'IBC']),
        quantity: Math.floor(Math.random() * 50) + 10,
        origin: randomChoice(['Berlin Warehouse', 'Munich DC', 'Hamburg Hub']),
        destination: randomChoice(['Stuttgart DC', 'Dresden Warehouse', 'Frankfurt Hub']),
        date: new Date().toISOString().split('T')[0],
        signature: Math.random() > 0.3 ? 'Present' : null
    };

    const fieldConfidences = {
        bookingNumber: randomConfidence(0.7, 1.0),
        equipmentType: randomConfidence(0.6, 1.0),
        quantity: randomConfidence(0.7, 1.0),
        origin: randomConfidence(0.5, 0.95),
        destination: randomConfidence(0.5, 0.95),
        date: randomConfidence(0.8, 1.0),
        signature: extractedFields.signature ? randomConfidence(0.6, 0.9) : 0
    };

    const confidenceValues = Object.values(fieldConfidences).filter(v => v > 0);
    const overallConfidence = confidenceValues.reduce((sum, v) => sum + v, 0) / confidenceValues.length;

    return {
        pageNumber: page.pageNumber,
        extractedFields,
        fieldConfidences,
        overallConfidence: parseFloat(overallConfidence.toFixed(2))
    };
}

async function autoCreateTransaction(extractionResult) {
    try {
        const booking = window.localDB.bookings.getByNumber(extractionResult.bookingNumber);
        if (!booking) {
            console.log('Booking not found:', extractionResult.bookingNumber);
            return false;
        }

        const stops = window.localDB.stops.getByBookingId(booking.id);
        if (stops.length === 0) {
            console.log('No stops found for booking:', booking.bookingNumber);
            return false;
        }

        const destinationStop = stops.find(s => s.stopType === 'destination') || stops[stops.length - 1];

        const transaction = window.localDB.transactions.create({
            stopId: destinationStop.id,
            stopNumber: destinationStop.stopNumber,
            bookingId: booking.id,
            bookingNumber: booking.bookingNumber,
            direction: 'in',
            quantity: extractionResult.extractedFields.quantity,
            expectedQuantity: booking.quantity,
            variance: extractionResult.extractedFields.quantity - booking.quantity,
            hasVariance: Math.abs(extractionResult.extractedFields.quantity - booking.quantity) > 0,
            equipmentType: extractionResult.extractedFields.equipmentType || booking.equipmentType,
            quality: booking.quality,
            fromCompany: { name: 'Carrier' },
            toCompany: destinationStop.company,
            performedBy: 'AI Auto-Create',
            timestamp: new Date().toISOString(),
            notes: `Auto-created from document (confidence: ${(extractionResult.overallConfidence * 100).toFixed(0)}%)`
        });

        window.localDB.extractionResults.update(extractionResult.id, {
            autoCreated: true
        });

        window.localDB.events.create({
            eventType: 'TransactionCreated',
            bookingId: booking.id,
            bookingNumber: booking.bookingNumber,
            location: destinationStop.location.name,
            performedBy: 'AI',
            source: 'document_intelligence',
            description: `Auto-created from POD: ${extractionResult.extractedFields.quantity} ${extractionResult.extractedFields.equipmentType}`,
            confidence: extractionResult.overallConfidence
        });

        console.log('✓ Auto-created transaction:', transaction.transactionNumber);
        return true;

    } catch (error) {
        console.error('Auto-create error:', error);
        return false;
    }
}

function createReviewTask(document, extractionResult) {
    window.localDB.tasks.create({
        bookingId: null,
        bookingNumber: extractionResult.bookingNumber,
        taskType: 'document_review',
        priority: 'medium',
        description: `Review low-confidence extraction from ${document.fileName} (${(extractionResult.overallConfidence * 100).toFixed(0)}% confidence)`,
        status: 'pending',
        assignedTo: null,
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
    });
}

// ============================================
// DOCUMENT LIST
// ============================================

async function loadDocuments() {
    const documents = window.localDB.documents.getAll();
    const container = document.getElementById('document-list');

    // Update stats
    const total = documents.length;
    const processed = documents.filter(d => d.processingStatus === 'completed').length;
    const pendingReview = documents.filter(d => d.requiresReview).length;
    const extractions = window.localDB.extractionResults.getAll();
    const autoCreated = extractions.filter(e => e.autoCreated).length;

    document.getElementById('doc-total').textContent = total;
    document.getElementById('doc-processed').textContent = processed;
    document.getElementById('doc-pending-review').textContent = pendingReview;
    document.getElementById('doc-auto-created').textContent = autoCreated;

    if (documents.length === 0) {
        container.innerHTML = `
            <div style="padding: 3rem; text-align: center; color: var(--text-tertiary);">
                <i class="ri-file-upload-line" style="font-size: 3rem; opacity: 0.3;"></i>
                <p style="margin-top: 1rem;">No documents uploaded yet</p>
                <p style="font-size: 0.875rem; margin-top: 0.5rem;">Click "Upload Document" to get started</p>
            </div>
        `;
        return;
    }

    const sortedDocs = [...documents].sort((a, b) =>
        new Date(b.uploadedAt) - new Date(a.uploadedAt)
    );

    container.innerHTML = sortedDocs.map(doc => {
        const iconClass = getDocumentIcon(doc.documentType);
        const statusClass = doc.processingStatus;
        const statusText = doc.processingStatus.replace('_', ' ').toUpperCase();

        const confidenceClass = doc.confidence >= 0.85 ? '' :
                               doc.confidence >= 0.70 ? 'medium' : 'low';

        return `
            <div class="document-card" onclick="openDocumentViewer(${doc.id})">
                <div class="document-icon ${doc.documentType}">
                    <i class="${iconClass}"></i>
                </div>
                <div class="document-info">
                    <div class="document-title">${doc.fileName}</div>
                    <div class="document-meta">
                        <div class="document-meta-item">
                            <i class="ri-calendar-line"></i>
                            ${formatDate(doc.uploadedAt)}
                        </div>
                        <div class="document-meta-item">
                            <i class="ri-file-line"></i>
                            ${doc.totalPages} ${doc.totalPages === 1 ? 'page' : 'pages'}
                        </div>
                        ${doc.bookingNumber ? `
                            <div class="document-meta-item">
                                <i class="ri-link-line"></i>
                                ${doc.bookingNumber}
                            </div>
                        ` : ''}
                    </div>
                </div>
                <div class="document-status ${statusClass}">
                    ${statusText}
                </div>
                ${doc.processingStatus === 'completed' ? `
                    <div class="document-confidence">
                        <div class="confidence-bar">
                            <div class="confidence-fill ${confidenceClass}" style="width: ${doc.confidence * 100}%"></div>
                        </div>
                        <div class="confidence-value">${(doc.confidence * 100).toFixed(0)}%</div>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

function getDocumentIcon(type) {
    const icons = {
        pod: 'ri-file-check-line',
        cmr: 'ri-file-list-line',
        invoice: 'ri-file-text-line',
        packing_list: 'ri-file-list-2-line',
        other: 'ri-file-line'
    };
    return icons[type] || icons.other;
}

// ============================================
// DOCUMENT VIEWER (SLIDE PANEL)
// ============================================

function openDocumentViewer(documentId) {
    currentDocument = window.localDB.documents.getById(documentId);
    if (!currentDocument) {
        toast.error('Document not found');
        return;
    }

    document.getElementById('viewer-doc-name').textContent = currentDocument.fileName;
    currentPage = 0;

    loadDocumentViewer();
    slidePanel.open('document-viewer-panel');
}

function closeDocumentViewer() {
    slidePanel.close('document-viewer-panel');
    currentDocument = null;
}

function loadDocumentViewer() {
    if (!currentDocument) return;

    const pages = window.localDB.documentPages.getByDocumentId(currentDocument.id);
    const extractions = window.localDB.extractionResults.getByDocumentId(currentDocument.id);

    // Update page info
    document.getElementById('viewer-page-info').textContent =
        `Page ${currentPage + 1} of ${pages.length}`;

    // Enable/disable navigation
    document.getElementById('viewer-prev-btn').disabled = currentPage === 0;
    document.getElementById('viewer-next-btn').disabled = currentPage === pages.length - 1;

    // Render extraction results
    renderExtractionResults(extractions);

    // Render page
    renderPageCanvas(pages[currentPage]);
}

function renderExtractionResults(extractions) {
    const container = document.getElementById('extraction-results-list');

    if (extractions.length === 0) {
        container.innerHTML = `
            <div style="padding: 2rem; text-align: center; color: var(--text-tertiary);">
                <i class="ri-information-line" style="font-size: 2rem; opacity: 0.3;"></i>
                <p style="margin-top: 0.5rem; font-size: 0.875rem;">No extractions found</p>
            </div>
        `;
        return;
    }

    container.innerHTML = extractions.map(ext => {
        const confidenceClass = ext.overallConfidence >= 0.85 ? 'high' :
                               ext.overallConfidence >= 0.70 ? 'medium' : 'low';

        return `
            <div class="extraction-item">
                <div class="extraction-header">
                    <div class="extraction-page-label">Page ${ext.pageNumber}</div>
                    <div class="extraction-confidence ${confidenceClass}">
                        ${(ext.overallConfidence * 100).toFixed(0)}%
                    </div>
                </div>

                <div class="extraction-fields">
                    ${Object.entries(ext.extractedFields).map(([key, value]) => {
                        const confidence = ext.fieldConfidences[key] || 0;
                        const confClass = confidence >= 0.85 ? '' :
                                        confidence >= 0.70 ? 'medium' : 'low';

                        return `
                            <div class="extraction-field">
                                <div class="extraction-field-label">${formatFieldName(key)}</div>
                                <div class="extraction-field-value ${value ? '' : 'empty'}">
                                    ${value || 'Not detected'}
                                </div>
                                ${value ? `
                                    <div class="extraction-field-confidence">
                                        <span class="confidence-dot ${confClass}"></span>
                                        ${(confidence * 100).toFixed(0)}% confidence
                                    </div>
                                ` : ''}
                            </div>
                        `;
                    }).join('')}
                </div>

                ${ext.autoCreated ? `
                    <div style="margin-top: 1rem;">
                        <span class="auto-created-badge">
                            <i class="ri-check-line"></i>
                            Auto-Created
                        </span>
                    </div>
                ` : ext.requiresReview ? `
                    <div style="margin-top: 1rem;">
                        <span class="requires-review-badge">
                            <i class="ri-alert-line"></i>
                            Requires Review
                        </span>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

function renderPageCanvas(page) {
    const canvas = document.getElementById('viewer-canvas');

    if (!page) {
        canvas.innerHTML = '<p style="padding: 2rem; color: var(--text-tertiary);">No page data</p>';
        return;
    }

    canvas.innerHTML = `
        <div style="background: white; width: 595px; height: 842px; display: flex; align-items: center; justify-content: center; flex-direction: column; padding: 2rem; text-align: center;">
            <i class="ri-file-text-line" style="font-size: 4rem; color: #cbd5e1; margin-bottom: 1rem;"></i>
            <p style="color: #64748b; font-size: 1.125rem; font-weight: 600;">Page ${page.pageNumber}</p>
            <p style="color: #94a3b8; font-size: 0.875rem; margin-top: 0.5rem;">
                ${page.classifiedAs.replace('_', ' ').toUpperCase()}
            </p>
            <p style="color: #94a3b8; font-size: 0.875rem; margin-top: 0.25rem;">
                Relevance: ${(page.relevanceScore * 100).toFixed(0)}%
            </p>
            <p style="color: #cbd5e1; font-size: 0.75rem; margin-top: 2rem;">
                [Document image would be rendered here]
            </p>
        </div>
    `;
}

function viewerPrevPage() {
    if (currentPage > 0) {
        currentPage--;
        loadDocumentViewer();
    }
}

function viewerNextPage() {
    const pages = window.localDB.documentPages.getByDocumentId(currentDocument.id);
    if (currentPage < pages.length - 1) {
        currentPage++;
        loadDocumentViewer();
    }
}

function deleteDocumentConfirm() {
    if (!currentDocument) return;

    const confirmMsg = `Delete ${currentDocument.fileName}? This cannot be undone.`;

    toast.show(
        `<div style="font-weight: 600; margin-bottom: 0.5rem;">Delete document?</div>
         <div style="margin-bottom: 1rem;">${currentDocument.fileName}</div>
         <div style="display: flex; gap: 0.5rem;">
            <button class="action-btn action-btn-danger" onclick="executeDeleteDocument()">Delete</button>
            <button class="action-btn action-btn-secondary" onclick="toast.container.querySelector('.toast').remove()">Cancel</button>
         </div>`,
        'warning',
        0 // Don't auto-dismiss
    );
}

function executeDeleteDocument() {
    if (!currentDocument) return;

    window.localDB.documents.delete(currentDocument.id);
    toast.success('Document deleted');
    closeDocumentViewer();
    loadDocuments();
}

// ============================================
// UTILITIES
// ============================================

function formatFieldName(field) {
    return field
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase());
}

function formatDate(isoString) {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randomConfidence(min, max) {
    return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}

function generateMockBookingNumber() {
    const bookings = window.localDB.bookings.getAll();
    if (bookings.length > 0) {
        return randomChoice(bookings).bookingNumber;
    }
    return `BK-2026-${String(Math.floor(Math.random() * 1000)).padStart(4, '0')}`;
}

// Initialize when documents tab is loaded
if (window.location.hash === '#documents' || document.readyState === 'complete') {
    setTimeout(() => {
        if (document.getElementById('document-list')) {
            loadDocuments();
        }
    }, 100);
}

console.log('✓ Document Intelligence V2 loaded (modern inline UI)');
