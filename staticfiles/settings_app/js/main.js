/**
 * مدیریت اصلی درختواره تنظیمات
 */
class CodingTreeManager {
    constructor() {
        this.initEventListeners();
    }
    
    /**
     * راه‌اندازی گوش‌دهنده‌های رویداد
     */
    initEventListeners() {
        console.log("Initializing tree event listeners");
        // گوش‌دهنده برای کلیک روی آیتم‌های درختواره
        // گوش‌دهنده برای کلیک روی آیتم‌های درختواره
        document.addEventListener('click', (event) => {
            const toggle = event.target.closest('.coding_tree-toggle');
            if (toggle) {
                event.preventDefault();
                event.stopPropagation();
                console.log("Toggle clicked:", toggle);
                this.toggleTreeNode(toggle);
            }
            
            const content = event.target.closest('.coding_tree-content');
            if (content) {
                event.preventDefault();
                event.stopPropagation();
                console.log("Content clicked:", content);
                this.handleTreeItemClick(content);
            }
        });
        
        // گوش‌دهنده برای فرم‌های داینامیک
        document.addEventListener('submit', (event) => {
            const form = event.target;
            if (form.classList.contains('coding_form')) {
                event.preventDefault();
                console.log("Form submitted:", form);
                this.handleFormSubmit(form);
            }
        });
        
        // گوش‌دهنده برای دکمه‌های حذف
        document.addEventListener('click', (event) => {
            if (event.target.classList.contains('coding_delete-btn')) {
                event.preventDefault();
                console.log("Delete button clicked:", event.target);
                this.handleDeleteClick(event.target);
            }
        });
        
        // گوش‌دهنده برای دکمه‌های انصراف
        document.addEventListener('click', (event) => {
            if (event.target.classList.contains('coding_cancel-btn')) {
                event.preventDefault();
                console.log("Cancel button clicked");
                this.resetForm();
            }
        });
        
        console.log("Event listeners initialized");
    }
     /**
     * باز و بسته کردن گره درختواره
     */
    toggleTreeNode(element) {
        console.log("Toggling tree node");
        element.classList.toggle('open');
        
        // یافتن زیرمجموعه‌ها
        const parent = element.closest('.coding_tree-item');
        if (parent) {
            const children = parent.querySelector('.coding_tree-children');
            if (children) {
                if (element.classList.contains('open')) {
                    children.style.display = 'block';
                } else {
                    children.style.display = 'none';
                }
            }
        }
    }
    /**
     * مدیریت کلیک روی آیتم‌های درختواره
     * @param {HTMLElement} element - المان کلیک شده
     */
    
    /**
     * مدیریت کلیک روی آیتم‌های درختواره
     * @param {HTMLElement} element - المان کلیک شده
     */
    async handleTreeItemClick(element) {
    try {
        console.log("Handling tree item click");
        
        // فعال کردن آیتم انتخاب شده
        document.querySelectorAll('.coding_tree-content.active').forEach(item => {
            item.classList.remove('active');
        });
        element.classList.add('active');
        
        const type = element.dataset.type;
        const id = element.dataset.id;
        const parentId = element.dataset.parent;
        
        console.log("Item type:", type, "ID:", id, "Parent ID:", parentId);
        
        let url;
        let title;
        
        // تعیین URL و عنوان فرم بر اساس نوع آیتم
        switch (type) {
            case 'insurance-type':
                url = CODING_CONFIG.API_URLS.INSURANCE_TYPE.FORM(id);
                title = id ? 'ویرایش نوع بیمه' : 'افزودن نوع بیمه جدید';
                break;
            case 'insurance-provider':
                url = CODING_CONFIG.API_URLS.INSURANCE_PROVIDER.FORM(id, parentId);
                title = id ? 'ویرایش بیمه‌گر' : 'افزودن بیمه‌گر جدید';
                break;
            case 'treatment-type':
                url = CODING_CONFIG.API_URLS.TREATMENT_TYPE.FORM(id);
                title = id ? 'ویرایش نوع درمان' : 'افزودن نوع درمان جدید';
                break;
            case 'treatment-detail':
                url = CODING_CONFIG.API_URLS.TREATMENT_DETAIL.FORM(id, parentId);
                title = id ? 'ویرایش جزئیات درمان' : 'افزودن جزئیات درمان جدید';
                break;
            default:
                throw new Error('نوع آیتم نامشخص است');
        }
        
        console.log("Fetching form from:", url);
        
        // دریافت و نمایش فرم
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`خطای ${response.status}: ${response.statusText}`);
        }
        
        const formHtml = await response.text();
        
        const formContainer = document.getElementById('coding_dynamic-form');
        const formTitle = document.getElementById('coding_form-title');
        
        formContainer.innerHTML = formHtml;
        formTitle.textContent = title;
        
        console.log("Form loaded successfully");
        
    } catch (error) {
        console.error('Error loading form:', error);
        alert('خطا در بارگذاری فرم: ' + error.message);
    }
}


    
    /**
     * مدیریت ارسال فرم
     * @param {HTMLFormElement} form - فرم ارسال شده
     */
    async handleFormSubmit(form) {
    try {
        // اعتبارسنجی فرم
        if (!CodingUISettings.validateForm(form)) {
            CodingUISettings.showMessage(CODING_CONFIG.ERROR_MESSAGES.VALIDATION_FAILED, 'warning');
            return;
        }
        
        const type = form.dataset.type;
        const id = form.dataset.id;
        const hasFiles = form.querySelector('input[type="file"]') !== null;
        
        let url;
        let method;
        
        // تعیین URL و متد بر اساس نوع آیتم و وجود ID
        switch (type) {
            case 'insurance-type':
                url = id ? CODING_CONFIG.API_URLS.INSURANCE_TYPE.UPDATE(id) : CODING_CONFIG.API_URLS.INSURANCE_TYPE.CREATE;
                method = id ? 'PUT' : 'POST';
                break;
            case 'insurance-provider':
                url = id ? CODING_CONFIG.API_URLS.INSURANCE_PROVIDER.UPDATE(id) : CODING_CONFIG.API_URLS.INSURANCE_PROVIDER.CREATE;
                method = id ? 'PUT' : 'POST';
                break;
            case 'treatment-type':
                url = id ? CODING_CONFIG.API_URLS.TREATMENT_TYPE.UPDATE(id) : CODING_CONFIG.API_URLS.TREATMENT_TYPE.CREATE;
                method = id ? 'PUT' : 'POST';
                break;
            case 'treatment-detail':
                url = id ? CODING_CONFIG.API_URLS.TREATMENT_DETAIL.UPDATE(id) : CODING_CONFIG.API_URLS.TREATMENT_DETAIL.CREATE;
                method = id ? 'PUT' : 'POST';
                break;
            default:
                throw new Error('نوع فرم نامشخص است');
        }
        
        console.log("Submitting form to:", url, "Method:", method);
        
        let response;
        
        if (hasFiles) {
            // استفاده از FormData برای فرم‌های حاوی فایل
            const formData = new FormData(form);
            
            // استفاده از CSRFManager برای دریافت تنظیمات fetch
            const fetchOptions = CSRFManager.getFetchOptions({
                method: method,
                body: formData
                // برای FormData نباید Content-Type تنظیم شود
            });
            
            response = await fetch(url, fetchOptions);
        } else {
            // تبدیل داده‌های فرم به JSON برای فرم‌های بدون فایل
            const formData = {};
            new FormData(form).forEach((value, key) => {
                if (key !== 'csrfmiddlewaretoken') {
                    formData[key] = value;
                }
            });
            
            // استفاده از CSRFManager برای دریافت تنظیمات fetch
            const fetchOptions = CSRFManager.getFetchOptions({
                method: method,
                body: JSON.stringify(formData),
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            response = await fetch(url, fetchOptions);
        }
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `خطای ${response.status}: ${response.statusText}`);
        }
        
        // نمایش پیام موفقیت
        CodingUISettings.showMessage(CODING_CONFIG.SUCCESS_MESSAGES.SAVE_SUCCESS, 'success');
        
        // بارگذاری مجدد صفحه برای نمایش تغییرات
        setTimeout(() => {
            window.location.reload();
        }, 1000);
        
    } catch (error) {
        CodingUISettings.showMessage(CODING_CONFIG.ERROR_MESSAGES.SAVE_FAILED, 'error');
        console.error('Error submitting form:', error);
    }
}



    
    /**
     * مدیریت کلیک روی دکمه حذف
     * @param {HTMLElement} button - دکمه کلیک شده
     */
    async handleDeleteClick(button) {
    try {
        const type = button.dataset.type;
        const id = button.dataset.id;
        
        if (!id) {
            throw new Error('شناسه آیتم برای حذف یافت نشد');
        }
        
        // نمایش مودال تأیید حذف
        const confirmed = await CodingUISettings.showDeleteConfirmation();
        if (!confirmed) {
            return;
        }
        
        let url;
        
        // تعیین URL بر اساس نوع آیتم
        switch (type) {
            case 'insurance-type':
                url = CODING_CONFIG.API_URLS.INSURANCE_TYPE.DELETE(id);
                break;
            case 'insurance-provider':
                url = CODING_CONFIG.API_URLS.INSURANCE_PROVIDER.DELETE(id);
                break;
            case 'treatment-type':
                url = CODING_CONFIG.API_URLS.TREATMENT_TYPE.DELETE(id);
                break;
            case 'treatment-detail':
                url = CODING_CONFIG.API_URLS.TREATMENT_DETAIL.DELETE(id);
                break;
            default:
                throw new Error('نوع آیتم نامشخص است');
        }
        
        // استفاده از CSRFManager برای دریافت تنظیمات fetch
        const fetchOptions = CSRFManager.getFetchOptions({
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        // ارسال درخواست حذف به سرور
        const response = await fetch(url, fetchOptions);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `خطای ${response.status}: ${response.statusText}`);
        }
        
        // نمایش پیام موفقیت
        CodingUISettings.showMessage(CODING_CONFIG.SUCCESS_MESSAGES.SAVE_SUCCESS, 'success');
        
        // بارگذاری مجدد صفحه برای نمایش تغییرات
        setTimeout(() => {
            window.location.reload();
        }, 1000);
        
    } catch (error) {
        CodingUISettings.showMessage(CODING_CONFIG.ERROR_MESSAGES.DELETE_FAILED, 'error');
        console.error('Error deleting item:', error);
    }
}

    
    /**
     * بازنشانی فرم و نمایش پیام راهنما
     */
    resetForm() {
        const formContainer = document.getElementById('coding_dynamic-form');
        const formTitle = document.getElementById('coding_form-title');
        
        formTitle.textContent = 'لطفاً یک گزینه از درختواره انتخاب کنید';
        formContainer.innerHTML = `
            <div class="coding_placeholder">
                <div class="coding_placeholder-icon">
                    <i class="coding_icon coding_icon-info-circle"></i>
                </div>
                <div class="coding_placeholder-text">
                    برای ویرایش یا افزودن مورد جدید، از درختواره سمت راست انتخاب کنید
                </div>
            </div>
        `;
    }
}


// راه‌اندازی مدیریت درختواره پس از بارگذاری صفحه
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded");
    window.treeManager = new CodingTreeManager();
    
    // باز کردن اولین گره درختواره به صورت پیش‌فرض
    setTimeout(() => {
        const firstToggle = document.querySelector('.coding_tree-toggle');
        if (firstToggle) {
            console.log("Opening first tree node");
            window.treeManager.toggleTreeNode(firstToggle);
        }
    }, 500);
});
