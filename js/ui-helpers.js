/**
 * UI HELPERS
 * Toast notifications, slide panels, inline interactions
 */

// ============================================
// TOAST NOTIFICATIONS (replaces alert())
// ============================================

const toast = {
    container: null,

    init() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        }
    },

    show(message, type = 'info', duration = 4000) {
        this.init();

        const icons = {
            success: 'ri-checkbox-circle-line',
            error: 'ri-error-warning-line',
            info: 'ri-information-line',
            warning: 'ri-alert-line'
        };

        const toastEl = document.createElement('div');
        toastEl.className = `toast ${type}`;
        toastEl.innerHTML = `
            <i class="${icons[type]} toast-icon"></i>
            <div class="toast-content">
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="ri-close-line"></i>
            </button>
        `;

        this.container.appendChild(toastEl);

        if (duration > 0) {
            setTimeout(() => {
                toastEl.style.animation = 'slideInRight 0.3s ease reverse';
                setTimeout(() => toastEl.remove(), 300);
            }, duration);
        }

        return toastEl;
    },

    success(message, duration) {
        return this.show(message, 'success', duration);
    },

    error(message, duration) {
        return this.show(message, 'error', duration);
    },

    info(message, duration) {
        return this.show(message, 'info', duration);
    },

    warning(message, duration) {
        return this.show(message, 'warning', duration);
    }
};

// Export for global use
window.toast = toast;

// ============================================
// SLIDE PANELS (replaces modals)
// ============================================

const slidePanel = {
    overlay: null,

    init() {
        if (!this.overlay) {
            this.overlay = document.createElement('div');
            this.overlay.className = 'slide-panel-overlay';
            this.overlay.addEventListener('click', () => this.closeAll());
            document.body.appendChild(this.overlay);
        }
    },

    open(panelId) {
        this.init();

        const panel = document.getElementById(panelId);
        if (!panel) {
            console.error(`Panel ${panelId} not found`);
            return;
        }

        // Close any open panels
        this.closeAll();

        // Open new panel
        panel.classList.add('open');
        this.overlay.classList.add('visible');
        document.body.style.overflow = 'hidden';
    },

    close(panelId) {
        const panel = document.getElementById(panelId);
        if (panel) {
            panel.classList.remove('open');
        }

        // Check if any panels are still open
        const openPanels = document.querySelectorAll('.slide-panel.open');
        if (openPanels.length === 0) {
            if (this.overlay) {
                this.overlay.classList.remove('visible');
            }
            document.body.style.overflow = '';
        }
    },

    closeAll() {
        document.querySelectorAll('.slide-panel.open').forEach(panel => {
            panel.classList.remove('open');
        });
        if (this.overlay) {
            this.overlay.classList.remove('visible');
        }
        document.body.style.overflow = '';
    }
};

// Export for global use
window.slidePanel = slidePanel;

// ============================================
// EXPANDABLE CARDS
// ============================================

function toggleCard(cardId) {
    const card = document.getElementById(cardId);
    if (!card) return;

    card.classList.toggle('expanded');
}

// Auto-initialize expandable cards
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.card-header').forEach(header => {
        header.addEventListener('click', () => {
            const card = header.closest('.expandable-card');
            if (card) {
                card.classList.toggle('expanded');
            }
        });
    });
});

// ============================================
// CONFIRMATION DIALOGS (inline, not modal)
// ============================================

function showInlineConfirm(message, onConfirm, onCancel) {
    const confirmEl = document.createElement('div');
    confirmEl.className = 'inline-confirm';
    confirmEl.innerHTML = `
        <div style="padding: 1rem; background: var(--bg-elevated); border: 1px solid var(--border); border-radius: 8px; margin: 1rem 0;">
            <p style="margin: 0 0 1rem 0; color: var(--text-primary);">${message}</p>
            <div class="inline-actions">
                <button class="action-btn action-btn-danger" onclick="this.closest('.inline-confirm').confirm()">
                    <i class="ri-check-line"></i> Confirm
                </button>
                <button class="action-btn action-btn-secondary" onclick="this.closest('.inline-confirm').cancel()">
                    Cancel
                </button>
            </div>
        </div>
    `;

    confirmEl.confirm = function() {
        if (onConfirm) onConfirm();
        this.remove();
    };

    confirmEl.cancel = function() {
        if (onCancel) onCancel();
        this.remove();
    };

    return confirmEl;
}

// ============================================
// PROCESSING STATES
// ============================================

function showProcessing(container, message) {
    const processingEl = document.createElement('div');
    processingEl.className = 'processing-state';
    processingEl.innerHTML = `
        <i class="ri-loader-4-line processing-spinner" style="font-size: 1.5rem; color: var(--accent-primary);"></i>
        <div class="processing-text">${message}</div>
    `;

    if (typeof container === 'string') {
        container = document.getElementById(container);
    }

    if (container) {
        container.appendChild(processingEl);
    }

    return processingEl;
}

function showSuccess(container, message) {
    const successEl = document.createElement('div');
    successEl.className = 'success-state';
    successEl.innerHTML = `
        <i class="ri-checkbox-circle-fill" style="font-size: 1.5rem; color: var(--accent-success);"></i>
        <div style="color: var(--text-primary);">${message}</div>
    `;

    if (typeof container === 'string') {
        container = document.getElementById(container);
    }

    if (container) {
        container.appendChild(successEl);
    }

    return successEl;
}

function showError(container, message) {
    const errorEl = document.createElement('div');
    errorEl.className = 'error-state';
    errorEl.innerHTML = `
        <i class="ri-error-warning-fill" style="font-size: 1.5rem; color: var(--accent-error);"></i>
        <div style="color: var(--text-primary);">${message}</div>
    `;

    if (typeof container === 'string') {
        container = document.getElementById(container);
    }

    if (container) {
        container.appendChild(errorEl);
    }

    return errorEl;
}

// Export for global use
window.showProcessing = showProcessing;
window.showSuccess = showSuccess;
window.showError = showError;
window.showInlineConfirm = showInlineConfirm;
window.toggleCard = toggleCard;

// ============================================
// KEYBOARD SHORTCUTS
// ============================================

document.addEventListener('keydown', (e) => {
    // ESC to close slide panels
    if (e.key === 'Escape') {
        slidePanel.closeAll();
    }
});

// ============================================
// SMOOTH SCROLLING
// ============================================

function smoothScrollTo(element) {
    if (typeof element === 'string') {
        element = document.getElementById(element);
    }
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

window.smoothScrollTo = smoothScrollTo;

console.log('✓ UI Helpers loaded (toast, slidePanel, inline confirms)');
