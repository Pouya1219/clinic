/**
 * کلاس مدیریت API برای ارتباط با سرور
 */
class TreatmentAPI {
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
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': this.getCSRFToken(),
            },
            credentials: 'same-origin',
        };
        
        const fetchOptions = { ...defaultOptions, ...options };
        
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
     * ایجاد درمان جدید
     * @param {Object} treatmentData - داده‌های درمان
     * @returns {Promise} نتیجه درخواست
     */
    static async createTreatment(treatmentData) {
        return this.fetchData(TREATMENT_CONFIG.API_URLS.CREATE_TREATMENT, {
            method: 'POST',
            body: JSON.stringify(treatmentData),
        });
    }
    
    /**
     * بروزرسانی درمان
     * @param {number} id - شناسه درمان
     * @param {Object} treatmentData - داده‌های درمان
     * @returns {Promise} نتیجه درخواست
     */
    static async updateTreatment(id, treatmentData) {
        return this.fetchData(TREATMENT_CONFIG.API_URLS.UPDATE_TREATMENT(id), {
            method: 'PUT',
            body: JSON.stringify(treatmentData),
        });
    }
    
    /**
     * حذف درمان
     * @param {number} id - شناسه درمان
     * @returns {Promise} نتیجه درخواست
     */
    static async deleteTreatment(id) {
        return this.fetchData(TREATMENT_CONFIG.API_URLS.DELETE_TREATMENT(id), {
            method: 'DELETE',
        });
    }
    
    /**
     * دریافت اطلاعات درمان
     * @param {number} id - شناسه درمان
     * @returns {Promise} نتیجه درخواست
     */
    static async getTreatment(id) {
        return this.fetchData(TREATMENT_CONFIG.API_URLS.GET_TREATMENT(id));
    }
    
    /**
     * دریافت لیست درمان‌های بیمار
     * @param {number} patientId - شناسه بیمار
     * @returns {Promise} نتیجه درخواست
     */
    static async listTreatments(patientId) {
        return this.fetchData(TREATMENT_CONFIG.API_URLS.LIST_TREATMENTS(patientId));
    }
    
    /**
     * ایجاد پرداخت جدید
     * @param {Object} paymentData - داده‌های پرداخت
     * @returns {Promise} نتیجه درخواست
     */
    static async createPayment(paymentData) {
        return this.fetchData(TREATMENT_CONFIG.API_URLS.CREATE_PAYMENT, {
            method: 'POST',
            body: JSON.stringify(paymentData),
        });
    }
    
    /**
     * دریافت جزئیات درمان‌ها بر اساس نوع درمان
     * @param {number} typeId - شناسه نوع درمان
     * @returns {Promise} نتیجه درخواست
     */
    static async getTreatmentDetails(typeId) {
        return this.fetchData(TREATMENT_CONFIG.API_URLS.GET_TREATMENT_DETAILS(typeId));
    }

    /**
     * دریافت اطلاعات بیمه‌گر
     * @param {number} providerId - شناسه بیمه‌گر
     * @returns {Promise} نتیجه درخواست
     */
    static async getInsuranceProvider(providerId) {
        return this.fetchData(TREATMENT_CONFIG.API_URLS.GET_INSURANCE_INFO(providerId));
    }
}
