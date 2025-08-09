/**
 * API Patient Module
 * مدیریت درخواست‌های API مربوط به بیماران
 */

const ApiPatient = {
    /**
     * دریافت اطلاعات بیمار
     * @param {number} patientId - شناسه بیمار
     * @returns {Promise} - پاسخ درخواست
     */
    getPatientDetails: function(patientId) {
        return fetch(`/Patient/detail/${patientId}/`, {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('خطا در دریافت اطلاعات بیمار');
            }
            return response.json();
        });
    },

    /**
     * بروزرسانی اطلاعات بیمار
     * @param {number} patientId - شناسه بیمار
     * @param {FormData} formData - داده‌های فرم
     * @returns {Promise} - پاسخ درخواست
     */
updatePatient: function(patientId, formData) {
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
    
    return fetch(`/Patient/edit_patient/${patientId}/`, {
        method: 'POST',  // از POST استفاده کنید
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': csrfToken
        },
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('خطا در بروزرسانی اطلاعات بیمار');
        }
        return response.json();
    });
}




    /**
     * صدور کارت بیمار
     * @param {number} patientId - شناسه بیمار
     * @returns {Promise} - پاسخ درخواست
     */
    issuePatientCard: function(patientId) {
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
        
        return fetch('/Patient/generate-card/', {
            method: 'POST',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify({ patient_id: patientId })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('خطا در صدور کارت بیمار');
            }
            return response.json();
        });
    },

    /**
     * تولید مجدد تصویر کارت
     * @param {number} cardId - شناسه کارت
     * @returns {Promise} - پاسخ درخواست
     */
    regenerateCardImage: function(cardId) {
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
        
        return fetch(`/Patient/generate-card-image/${cardId}/`, {
            method: 'POST',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': csrfToken
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('خطا در تولید مجدد تصویر کارت');
            }
            return response.json();
        });
    }
};
