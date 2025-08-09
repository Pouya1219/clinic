/**
 * تنظیمات پایه برای سیستم درمان
 */
const TREATMENT_CONFIG = {
    // مسیرهای API
    API_URLS: {
        CREATE_TREATMENT: '/Patient/treatment/create/',
        UPDATE_TREATMENT: (id) => `/Patient/treatment/update/${id}/`,
        DELETE_TREATMENT: (id) => `/Patient/treatment/delete/${id}/`,
        GET_TREATMENT: (id) => `/Patient/treatment/get/${id}/`,
        LIST_TREATMENTS: (patientId) => `/Patient/treatment/list/${patientId}/`,
        CREATE_PAYMENT: '/Patient/treatment/payment/create/',
        GET_TREATMENT_DETAILS: (typeId) => `/Patient/treatment/get-details/${typeId}/`,
        GET_INSURANCE_INFO: (providerId) => `/Patient/treatment/insurance-providers/${providerId}/`,
        GET_DISCOUNT_TYPES: '/Patient/treatment/discount-types/',
        // --- URL های جدید برای سیستم پرداخت ---
        DEPOSIT_TO_WALLET: (patientId) => `/Patient/payment/wallet/deposit/${patientId}/`,
        PAY_FROM_WALLET: (treatmentId) => `/Patient/payment/wallet/pay/${treatmentId}/`,
        TRANSFER_FROM_WALLET: (patientId) => `/Patient/payment/wallet/transfer/${patientId}/`,
        CREATE_DIRECT_PAYMENT: (treatmentId) => `/Patient/payment/direct/${treatmentId}/`,
        CREATE_INSTALLMENT_PLAN: (treatmentId) => `/Patient/payment/installment/create/${treatmentId}/`,
        GET_INSTALLMENT_PLAN_DETAILS: (planId) => `/Patient/payment/installment/details/${planId}/`,
        DELETE_PAYMENT: (paymentId) => `/Patient/payment/delete/${paymentId}/`,
        PAY_INSTALLMENT: (installmentId) => `/Patient/payment/installment/pay/${installmentId}/`,
        // URL برای رفرش کردن تب پرداخت
        REFRESH_PAYMENT_TAB: (patientId) => `/Patient/payment/refresh_tab/${patientId}/`,
        REFUND_PAYMENT: (paymentId) => `/Patient/payment/refund/${paymentId}/`,
        CLEAR_CHECK_PAYMENT: (paymentId) => `/Patient/payment/check/clear/${paymentId}/`,
        PRINT_TREATMENT: (treatmentId) => `/Patient/print_treatment/${treatmentId}/`,
        GENERATE_INVOICE: (treatmentId) => `/Patient/generate_invoice/${treatmentId}/`,
        REFRESH_TREATMENT_TAB: (patientId) => `/Patient/treatment_view/${patientId}/`,
        REFRESH_INSURANCE_TAB: (patientId) => `/Patient/insurance_view/${patientId}/`,
        GET_PATIENT_ACTIVE_INSURANCES: (patientId) => `/Patient/active-insurances/${patientId}/`,
    },
    
    // انواع چارت
    CHART_TYPES: {
        ADULT_TEETH: 'adult_teeth',
        CHILD_TEETH: 'child_teeth',
        FACE: 'face',
        BODY: 'body',
    },
    
    // پیام‌های خطا
    ERROR_MESSAGES: {
        FETCH_FAILED: 'خطا در دریافت اطلاعات از سرور',
        SAVE_FAILED: 'خطا در ذخیره اطلاعات',
        DELETE_FAILED: 'خطا در حذف اطلاعات',
        VALIDATION_FAILED: 'لطفاً تمام فیلدهای الزامی را پر کنید',
    },
    
    // پیام‌های موفقیت
    SUCCESS_MESSAGES: {
        SAVE_SUCCESS: 'اطلاعات با موفقیت ذخیره شد',
        DELETE_SUCCESS: 'حذف با موفقیت انجام شد',
    },
};
