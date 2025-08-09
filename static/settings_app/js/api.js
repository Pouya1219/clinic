/**
 * کلاس مدیریت API برای ارتباط با سرور
 */
class CodingAPI {
    /**
     /**
     * دریافت CSRF توکن از کوکی
     * @returns {string} CSRF توکن
     */
    static getCSRFToken() {
        const name = 'csrftoken';
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
    
    /**
     * ارسال درخواست به سرور
     * @param {string} url - آدرس API
     * @param {Object} options - تنظیمات درخواست
     * @returns {Promise} نتیجه درخواست
     */
    static async fetchData(url, options = {}) {
        // اضافه کردن توکن CSRF به هدرها
        const fetchOptions = CSRFManager.getFetchOptions(options);
        
        try {
            const response = await fetch(url, fetchOptions);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `خطای ${response.status}: ${response.statusText}`);
            }
            
            // اگر پاسخ خالی باشد، آبجکت خالی برگردان
            if (response.status === 204) {
                return {};
            }
            
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }
    
    /**
     * دریافت لیست آیتم‌ها
     * @param {string} url - آدرس API
     * @returns {Promise} لیست آیتم‌ها
     */
    static async getList(url) {
        return this.fetchData(url);
    }
    
    /**
     * دریافت جزئیات یک آیتم
     * @param {string} url - آدرس API
     * @returns {Promise} جزئیات آیتم
     */
    static async getDetail(url) {
        return this.fetchData(url);
    }
    
    /**
     * ایجاد آیتم جدید
     * @param {string} url - آدرس API
     * @param {Object} data - داده‌های آیتم
     * @returns {Promise} آیتم ایجاد شده
     */
    static async create(url, data) {
        return this.fetchData(url, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }
    
    /**
     * بروزرسانی آیتم
     * @param {string} url - آدرس API
     * @param {Object} data - داده‌های آیتم
     * @returns {Promise} آیتم بروزرسانی شده
     */
    static async update(url, data) {
        return this.fetchData(url, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }
    
    /**
     * حذف آیتم
     * @param {string} url - آدرس API
     * @returns {Promise} نتیجه حذف
     */
    static async delete(url) {
        return this.fetchData(url, {
            method: 'DELETE',
        });
    }
    
    /**
     * ارسال فرم با داده‌های فایل
     * @param {string} url - آدرس API
     * @param {FormData} formData - داده‌های فرم
     * @param {string} method - متد HTTP
     * @returns {Promise} نتیجه ارسال فرم
     */
    static async submitFormData(url, formData, method = 'POST') {
        return this.fetchData(url, {
            method: method,
            headers: {
                'X-CSRFToken': this.getCSRFToken(),
                // Content-Type توسط مرورگر تنظیم می‌شود
            },
            body: formData,
            credentials: 'same-origin',
        });
    }
    
    /**
     * دریافت HTML فرم
     * @param {string} url - آدرس فرم
     * @returns {Promise<string>} HTML فرم
     */
    static async getForm(url) {
        try {
            const response = await fetch(url, {
                credentials: 'same-origin',
            });
            
            if (!response.ok) {
                throw new Error(`خطای ${response.status}: ${response.statusText}`);
            }
            
            return await response.text();
        } catch (error) {
            console.error('Form fetch error:', error);
            throw error;
        }
    }
}
