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
 * دریافت انواع تخفیف
 * @returns {Promise} نتیجه درخواست
 */
static async getDiscountTypes() {
    return this.fetchData(TREATMENT_CONFIG.API_URLS.GET_DISCOUNT_TYPES);
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
 /**
     * شارژ کیف پول بیمار
     * @param {number} patientId - شناسه بیمار
     * @param {Object} data - داده‌های واریز (amount, description)
     */
    static async depositToWallet(patientId, data) {
        return this.fetchData(TREATMENT_CONFIG.API_URLS.DEPOSIT_TO_WALLET(patientId), {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * پرداخت هزینه درمان از کیف پول
     * @param {number} treatmentId - شناسه درمان
     * @param {Object} data - داده‌های پرداخت (amount)
     */
    static async payFromWallet(treatmentId, data) {
        return this.fetchData(TREATMENT_CONFIG.API_URLS.PAY_FROM_WALLET(treatmentId), {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * انتقال وجه از کیف پول یک بیمار به دیگری
     * @param {number} patientId - شناسه بیمار فرستنده
     * @param {Object} data - داده‌های انتقال (amount, recipient_file_num, description)
     */
    static async transferFromWallet(patientId, data) {
        return this.fetchData(TREATMENT_CONFIG.API_URLS.TRANSFER_FROM_WALLET(patientId), {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * ثبت پرداخت مستقیم برای یک درمان
     * @param {number} treatmentId - شناسه درمان
     * @param {Object} data - داده‌های پرداخت
     */
    static async createDirectPayment(treatmentId, data) {
        return this.fetchData(TREATMENT_CONFIG.API_URLS.CREATE_DIRECT_PAYMENT(treatmentId), {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * ایجاد طرح اقساط برای یک درمان
     * @param {number} treatmentId - شناسه درمان
     * @param {Object} data - داده‌های طرح اقساط
     */
    static async createInstallmentPlan(treatmentId, data) {
        return this.fetchData(TREATMENT_CONFIG.API_URLS.CREATE_INSTALLMENT_PLAN(treatmentId), {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
static async deletePayment(paymentId) {
        return this.fetchData(TREATMENT_CONFIG.API_URLS.DELETE_PAYMENT(paymentId), {
            method: 'DELETE',
        });
    }
 /**
     * [جدید] پرداخت یک قسط مشخص
     * @param {number} installmentId - شناسه قسط
     * @returns {Promise} نتیجه درخواست
     */
    static async payInstallment(installmentId) {
        return this.fetchData(TREATMENT_CONFIG.API_URLS.PAY_INSTALLMENT(installmentId), {
            method: 'POST',
            // چون هیچ داده‌ای ارسال نمی‌کنیم، body نیاز نیست
        });
    }
    static async refundPayment(paymentId, data) {
        return this.fetchData(TREATMENT_CONFIG.API_URLS.REFUND_PAYMENT(paymentId), {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }
    static async clearCheckPayment(paymentId) {
        return this.fetchData(TREATMENT_CONFIG.API_URLS.CLEAR_CHECK_PAYMENT(paymentId), {
            method: 'POST',
        });
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
     * دریافت HTML پرینت درمان
     * @param {number} treatmentId - شناسه درمان
     * @returns {Promise} نتیجه درخواست
     */
    static async printTreatment(treatmentId) {
        return fetch(TREATMENT_CONFIG.API_URLS.PRINT_TREATMENT(treatmentId), {
            credentials: 'same-origin',
        });
    }
    
    /**
     * دریافت HTML فاکتور درمان
     * @param {number} treatmentId - شناسه درمان
     * @returns {Promise} نتیجه درخواست
     */
    static async generateInvoice(treatmentId) {
        return fetch(TREATMENT_CONFIG.API_URLS.GENERATE_INVOICE(treatmentId), {
            credentials: 'same-origin',
        });
    }
    
    /**
     * رفرش تب درمان
     * @param {number} patientId - شناسه بیمار
     * @returns {Promise} نتیجه درخواست
     */
    static async refreshTreatmentTab(patientId) {
        return fetch(TREATMENT_CONFIG.API_URLS.REFRESH_TREATMENT_TAB(patientId), {
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'same-origin',
        });
    }
    
    /**
     * رفرش تب بیمه
     * @param {number} patientId - شناسه بیمار
     * @returns {Promise} نتیجه درخواست
     */
    static async refreshInsuranceTab(patientId) {
        return fetch(TREATMENT_CONFIG.API_URLS.REFRESH_INSURANCE_TAB(patientId), {
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'same-origin',
        });
    }
    

    static getPatientActiveInsurances(patientId) {
    return fetch(`/Patient/active-insurances/${patientId}/`, {
        method: 'GET',
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('خطا در دریافت بیمه‌های فعال');
        }
        return response.json();
    });
}

}
