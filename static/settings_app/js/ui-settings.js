/**
 * کلاس مدیریت رابط کاربری برای تنظیمات
 */
class CodingUISettings {
    /**
     * نمایش پیام به کاربر
     * @param {string} message - متن پیام
     * @param {string} type - نوع پیام (success, error, warning, info)
     * @param {number} duration - مدت زمان نمایش به میلی‌ثانیه
     */
    static showMessage(message, type = 'info', duration = 3000) {
        // اگر المان پیام وجود نداشت، آن را ایجاد کن
        let messageContainer = document.getElementById('coding_message-container');
        if (!messageContainer) {
            messageContainer = document.createElement('div');
            messageContainer.id = 'coding_message-container';
            messageContainer.className = 'coding_message-container';
            document.body.appendChild(messageContainer);
            
            // استایل برای کانتینر پیام‌ها
            messageContainer.style.position = 'fixed';
            messageContainer.style.top = '20px';
            messageContainer.style.left = '50%';
            messageContainer.style.transform = 'translateX(-50%)';
            messageContainer.style.zIndex = '9999';
            messageContainer.style.display = 'flex';
            messageContainer.style.flexDirection = 'column';
            messageContainer.style.alignItems = 'center';
        }
        
        // ایجاد المان پیام
        const messageElement = document.createElement('div');
        messageElement.className = `coding_message coding_message-${type}`;
        messageElement.textContent = message;
        
        // استایل برای المان پیام
        messageElement.style.padding = '10px 20px';
        messageElement.style.margin = '5px 0';
        messageElement.style.borderRadius = '4px';
        messageElement.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
        messageElement.style.minWidth = '250px';
        messageElement.style.textAlign = 'center';
        messageElement.style.opacity = '0';
        messageElement.style.transition = 'opacity 0.3s ease-in-out';
        
        // تنظیم رنگ بر اساس نوع پیام
        switch (type) {
            case 'success':
                messageElement.style.backgroundColor = '#d4edda';
                messageElement.style.color = '#155724';
                messageElement.style.borderColor = '#c3e6cb';
                break;
            case 'error':
                messageElement.style.backgroundColor = '#f8d7da';
                messageElement.style.color = '#721c24';
                messageElement.style.borderColor = '#f5c6cb';
                break;
            case 'warning':
                messageElement.style.backgroundColor = '#fff3cd';
                messageElement.style.color = '#856404';
                messageElement.style.borderColor = '#ffeeba';
                break;
            default: // info
                messageElement.style.backgroundColor = '#d1ecf1';
                messageElement.style.color = '#0c5460';
                messageElement.style.borderColor = '#bee5eb';
        }
        
        // افزودن پیام به کانتینر
        messageContainer.appendChild(messageElement);
        
        // نمایش پیام با انیمیشن
        setTimeout(() => {
            messageElement.style.opacity = '1';
        }, 10);
        
        // حذف پیام پس از مدت زمان مشخص
        setTimeout(() => {
            messageElement.style.opacity = '0';
            setTimeout(() => {
                messageContainer.removeChild(messageElement);
            }, 300);
        }, duration);
    }
    
    /**
     * باز و بسته کردن گره‌های درختواره
     * @param {HTMLElement} element - المان درختواره
     */
    static toggleTreeNode(element) {
        element.classList.toggle('open');
    }
    
    /**
     * فعال کردن یک آیتم در درختواره
     * @param {HTMLElement} element - المان مورد نظر
     */
    static activateTreeItem(element) {
        // غیرفعال کردن آیتم قبلی
        const activeItems = document.querySelectorAll('.coding_tree-content.active, .coding_tree-toggle.active');
        activeItems.forEach(item => item.classList.remove('active'));
        
        // فعال کردن آیتم جدید
        element.classList.add('active');
    }
    
    /**
     * نمایش فرم در بخش محتوا
     * @param {string} html - HTML فرم
     * @param {string} title - عنوان فرم
     */
    static showForm(html, title) {
        const formContainer = document.getElementById('coding_dynamic-form');
        const formTitle = document.getElementById('coding_form-title');
        
        formContainer.innerHTML = html;
        formTitle.textContent = title;
    }
    
    /**
     * نمایش مودال تأیید حذف
     * @returns {Promise} نتیجه تأیید یا رد
     */
    static showDeleteConfirmation() {
        return new Promise((resolve) => {
            const modal = document.getElementById('coding_delete-modal');
            const confirmBtn = document.getElementById('coding_confirm-delete');
            const closeBtns = modal.querySelectorAll('.coding_modal-close');
            
            // نمایش مودال
            modal.style.display = 'block';
            
            // تنظیم رویداد تأیید
            const handleConfirm = () => {
                modal.style.display = 'none';
                confirmBtn.removeEventListener('click', handleConfirm);
                closeBtns.forEach(btn => btn.removeEventListener('click', handleCancel));
                resolve(true);
            };
            
            // تنظیم رویداد لغو
            const handleCancel = () => {
                modal.style.display = 'none';
                confirmBtn.removeEventListener('click', handleConfirm);
                closeBtns.forEach(btn => btn.removeEventListener('click', handleCancel));
                resolve(false);
            };
            
            confirmBtn.addEventListener('click', handleConfirm);
            closeBtns.forEach(btn => btn.addEventListener('click', handleCancel));
        });
    }
    
    /**
     * اعتبارسنجی فرم
     * @param {HTMLFormElement} form - المان فرم
     * @returns {boolean} نتیجه اعتبارسنجی
     */
    static validateForm(form) {
        const requiredFields = form.querySelectorAll('[required]');
        let isValid = true;
        
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                field.classList.add('coding_invalid');
                isValid = false;
            } else {
                field.classList.remove('coding_invalid');
            }
        });
        
        return isValid;
    }
    
    /**
     * جمع‌آوری داده‌های فرم
     * @param {HTMLFormElement} form - المان فرم
     * @param {boolean} includeFiles - آیا فایل‌ها هم جمع‌آوری شوند
     * @returns {Object|FormData} داده‌های فرم
     */
    static collectFormData(form, includeFiles = false) {
        if (includeFiles) {
            return new FormData(form);
        }
        
        const formData = {};
        const elements = form.elements;
        
        for (let i = 0; i < elements.length; i++) {
            const element = elements[i];
            
            if (element.name) {
                if (element.type === 'checkbox') {
                    formData[element.name] = element.checked;
                } else if (element.type !== 'file' && element.type !== 'submit' && element.type !== 'button') {
                    formData[element.name] = element.value;
                }
            }
        }
        
        return formData;
    }
}
