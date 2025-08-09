/**
 * Main Application Module
 * ماژول اصلی برنامه
 */

const App = {
    /**
     * راه‌اندازی اولیه برنامه
     */
    init: function() {
        this.setupGlobalEventHandlers();
        this.setupAjaxDefaults();
    },

    /**
     * راه‌اندازی event handler های سراسری
     */
    setupGlobalEventHandlers: function() {
        // مدیریت کلیک خارج از مودال‌ها
        document.addEventListener('click', function(event) {
            const modals = document.querySelectorAll('.modal');
            modals.forEach(modal => {
                if (event.target === modal) {
                    modal.style.display = 'none';
                }
            });
        });

        // مدیریت کلید ESC برای بستن مودال‌ها
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape') {
                const modals = document.querySelectorAll('.modal');
                modals.forEach(modal => {
                    modal.style.display = 'none';
                });
            }
        });
    },

    /**
     * تنظیم پیش‌فرض‌های Ajax
     */
    setupAjaxDefaults: function() {
        // اضافه کردن CSRF token به تمام درخواست‌های fetch
        const originalFetch = window.fetch;
        window.fetch = function(url, options = {}) {
            // اگر درخواست POST، PUT یا DELETE است، CSRF token را اضافه کن
            if (options.method && ['POST', 'PUT', 'DELETE'].includes(options.method.toUpperCase())) {
                if (!options.headers) {
                    options.headers = {};
                }
                
                // اگر CSRF token قبلاً تنظیم نشده است
                if (!options.headers['X-CSRFToken']) {
                    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value;
                    if (csrfToken) {
                        options.headers['X-CSRFToken'] = csrfToken;
                    }
                }
            }
            
            return originalFetch(url, options);
        };
    },

    /**
     * نمایش پیام به کاربر
     * @param {string} message - متن پیام
     * @param {string} type - نوع پیام (success, error, warning, info)
     */
    showMessage: function(message, type = 'info') {
        const messagesContainer = document.querySelector('.messages');
        if (!messagesContainer) {
            return;
        }
        
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.textContent = message;
        
        messagesContainer.appendChild(alertDiv);
        
        // حذف پیام بعد از 5 ثانیه
        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }
};

// راه‌اندازی برنامه بعد از بارگذاری صفحه
document.addEventListener('DOMContentLoaded', function() {
    App.init();
});
