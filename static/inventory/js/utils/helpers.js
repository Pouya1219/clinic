// static/inventory/js/utils/helpers.js

// Date formatting utilities
function formatDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fa-IR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(date);
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fa-IR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

// Number formatting
function formatNumber(number) {
    if (number === null || number === undefined) return '0';
    return new Intl.NumberFormat('fa-IR').format(number);
}

function formatCurrency(amount) {
    if (amount === null || amount === undefined) return '0 ریال';
    return new Intl.NumberFormat('fa-IR').format(amount) + ' ریال';
}

// Toast notifications
function showToast(message, type = 'info', duration = 5000) {
    const toastContainer = document.getElementById('toastContainer') || createToastContainer();
    
    const toastId = 'toast_' + Date.now();
    const toastHTML = `
        <div id="${toastId}" class="toast align-items-center text-white bg-${getToastColor(type)} border-0" role="alert">
            <div class="d-flex">
                <div class="toast-body">
                    <i class="fas ${getToastIcon(type)} me-2"></i>
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `;
    
    toastContainer.insertAdjacentHTML('beforeend', toastHTML);
    
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, { delay: duration });
    toast.show();
    
    // Remove toast element after it's hidden
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container position-fixed top-0 end-0 p-3';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
    return container;
}

function getToastColor(type) {
    const colors = {
        'success': 'success',
        'error': 'danger',
        'warning': 'warning',
        'info': 'primary'
    };
    return colors[type] || 'primary';
}

function getToastIcon(type) {
    const icons = {
        'success': 'fa-check-circle',
        'error': 'fa-exclamation-circle',
        'warning': 'fa-exclamation-triangle',
        'info': 'fa-info-circle'
    };
    return icons[type] || 'fa-info-circle';
}

// Loading utilities
function showLoading(target = null) {
    if (target) {
        target.innerHTML = `
            <div class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">در حال بارگذاری...</span>
                </div>
            </div>
        `;
    } else {
        const loader = document.getElementById('globalLoader') || createGlobalLoader();
        loader.style.display = 'flex';
    }
}

function hideLoading(target = null) {
    if (target) {
        // Target-specific loading will be replaced by actual content
    } else {
        const loader = document.getElementById('globalLoader');
        if (loader) loader.style.display = 'none';
    }
}

function createGlobalLoader() {
    const loader = document.createElement('div');
    loader.id = 'globalLoader';
    loader.className = 'position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center';
    loader.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
    loader.style.zIndex = '9998';
    loader.style.display = 'none';
    
    loader.innerHTML = `
        <div class="text-center">
            <div class="spinner-border text-primary mb-3" style="width: 3rem; height: 3rem;" role="status">
                <span class="visually-hidden">در حال بارگذاری...</span>
            </div>
            <div class="text-muted">در حال بارگذاری...</div>
        </div>
    `;
    
        document.body.appendChild(loader);
    return loader;
}

// Form validation utilities
function validateForm(form) {
    const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
    let isValid = true;
    
    inputs.forEach(input => {
        if (!input.value.trim()) {
            input.classList.add('is-invalid');
            isValid = false;
        } else {
            input.classList.remove('is-invalid');
        }
    });
    
    return isValid;
}

function clearFormValidation(form) {
    const inputs = form.querySelectorAll('.is-invalid');
    inputs.forEach(input => {
        input.classList.remove('is-invalid');
    });
}

// CSRF Token utility
function getCsrfToken() {
    const token = document.querySelector('[name=csrfmiddlewaretoken]');
    return token ? token.value : '';
}

// Debounce utility
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Local storage utilities
function saveToLocalStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
}

function getFromLocalStorage(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error('Error reading from localStorage:', error);
        return defaultValue;
    }
}

// URL utilities
function updateUrlParams(params) {
    const url = new URL(window.location);
    Object.keys(params).forEach(key => {
        if (params[key]) {
            url.searchParams.set(key, params[key]);
        } else {
            url.searchParams.delete(key);
        }
    });
    window.history.replaceState({}, '', url);
}

function getUrlParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// File utilities
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function validateFileType(file, allowedTypes) {
    return allowedTypes.includes(file.type);
}

function validateFileSize(file, maxSizeInMB) {
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    return file.size <= maxSizeInBytes;
}

// Image utilities
function createImagePreview(file, container) {
    const reader = new FileReader();
    reader.onload = function(e) {
        container.innerHTML = `
            <img src="${e.target.result}" 
                 class="img-thumbnail" 
                 style="max-width: 200px; max-height: 200px;">
        `;
    };
    reader.readAsDataURL(file);
}

// Export utilities
function exportToCSV(data, filename) {
    const csvContent = convertToCSV(data);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

function convertToCSV(data) {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');
    
    const csvRows = data.map(row => {
        return headers.map(header => {
            const value = row[header];
            return typeof value === 'string' ? `"${value}"` : value;
        }).join(',');
    });
    
    return [csvHeaders, ...csvRows].join('\n');
}

// Print utilities
function printElement(elementId) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>چاپ</title>
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
                <style>
                    body { font-family: 'IRANSans', sans-serif; direction: rtl; }
                    @media print {
                        .no-print { display: none !important; }
                    }
                </style>
            </head>
            <body>
                ${element.innerHTML}
            </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
}

// Animation utilities
function animateValue(element, start, end, duration) {
    const startTimestamp = performance.now();
    
    function step(timestamp) {
        const elapsed = timestamp - startTimestamp;
        const progress = Math.min(elapsed / duration, 1);
        
        const current = start + (end - start) * progress;
        element.textContent = formatNumber(Math.floor(current));
        
        if (progress < 1) {
            requestAnimationFrame(step);
        }
    }
    
    requestAnimationFrame(step);
}

function fadeIn(element, duration = 300) {
    element.style.opacity = '0';
    element.style.display = 'block';
    
    const start = performance.now();
    
    function animate(timestamp) {
        const elapsed = timestamp - start;
        const progress = Math.min(elapsed / duration, 1);
        
        element.style.opacity = progress;
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    }
    
    requestAnimationFrame(animate);
}

function fadeOut(element, duration = 300) {
    const start = performance.now();
    
    function animate(timestamp) {
        const elapsed = timestamp - start;
        const progress = Math.min(elapsed / duration, 1);
        
        element.style.opacity = 1 - progress;
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            element.style.display = 'none';
        }
    }
    
    requestAnimationFrame(animate);
}

// Keyboard shortcuts
function addKeyboardShortcut(key, callback, ctrlKey = false, altKey = false) {
    document.addEventListener('keydown', function(e) {
        if (e.key === key && e.ctrlKey === ctrlKey && e.altKey === altKey) {
            e.preventDefault();
            callback();
        }
    });
}

// Initialize common keyboard shortcuts
document.addEventListener('DOMContentLoaded', function() {
    // Ctrl+S for save
    addKeyboardShortcut('s', function() {
        const activeForm = document.querySelector('form:focus-within');
        if (activeForm) {
            const submitBtn = activeForm.querySelector('button[type="submit"]');
            if (submitBtn) submitBtn.click();
        }
    }, true);
    
    // Escape to close modals
    addKeyboardShortcut('Escape', function() {
        const openModal = document.querySelector('.modal.show');
        if (openModal) {
            const modal = bootstrap.Modal.getInstance(openModal);
            if (modal) modal.hide();
        }
    });
});

// Error handling utilities
function handleApiError(error, context = '') {
    console.error(`API Error ${context}:`, error);
    
    if (error.status === 401) {
        showToast('جلسه شما منقضی شده است. لطفا دوباره وارد شوید.', 'error');
        setTimeout(() => {
            window.location.href = '/login/';
        }, 2000);
    } else if (error.status === 403) {
        showToast('شما دسترسی لازم برای این عملیات را ندارید.', 'error');
    } else if (error.status === 404) {
        showToast('اطلاعات مورد نظر یافت نشد.', 'error');
    } else if (error.status >= 500) {
        showToast('خطای سرور. لطفا بعدا تلاش کنید.', 'error');
    } else {
        showToast('خطا در ارتباط با سرور.', 'error');
    }
}

// Confirmation utilities
function showConfirmDialog(message, onConfirm, onCancel = null) {
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">تأیید</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <p>${message}</p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">انصراف</button>
                    <button type="button" class="btn btn-primary" id="confirmBtn">تأیید</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    const bootstrapModal = new bootstrap.Modal(modal);
    bootstrapModal.show();
    
    modal.querySelector('#confirmBtn').addEventListener('click', () => {
        bootstrapModal.hide();
        if (onConfirm) onConfirm();
    });
    
    modal.addEventListener('hidden.bs.modal', () => {
        document.body.removeChild(modal);
        if (onCancel) onCancel();
    });
}

// Notification utilities
function showNotification(title, message, type = 'info') {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
            body: message,
            icon: '/static/inventory/img/icon.png'
        });
    } else {
        showToast(`${title}: ${message}`, type);
    }
}

function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

// Initialize notification permission request
document.addEventListener('DOMContentLoaded', function() {
    requestNotificationPermission();
});

// Theme utilities
function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
}

function getTheme() {
    return localStorage.getItem('theme') || 'light';
}

function toggleTheme() {
    const currentTheme = getTheme();
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
}

// Initialize theme
document.addEventListener('DOMContentLoaded', function() {
    setTheme(getTheme());
});

// Search utilities
function highlightSearchTerm(text, term) {
    if (!term) return text;
    
    const regex = new RegExp(`(${term})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}

function fuzzySearch(items, query, keys) {
    if (!query) return items;
    
    const queryLower = query.toLowerCase();
    
    return items.filter(item => {
        return keys.some(key => {
            const value = item[key];
            if (typeof value === 'string') {
                return value.toLowerCase().includes(queryLower);
            }
            return false;
        });
    });
}

// Responsive utilities
function isMobile() {
    return window.innerWidth <= 768;
}

function isTablet() {
    return window.innerWidth > 768 && window.innerWidth <= 1024;
}

function isDesktop() {
    return window.innerWidth > 1024;
}

// Initialize responsive handlers
window.addEventListener('resize', debounce(() => {
    // Handle responsive changes
    const event = new CustomEvent('responsiveChange', {
        detail: {
            isMobile: isMobile(),
            isTablet: isTablet(),
            isDesktop: isDesktop()
        }
    });
    document.dispatchEvent(event);
}, 250));

