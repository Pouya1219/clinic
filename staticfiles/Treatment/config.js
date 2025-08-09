/**
 * تنظیمات پایه برای سیستم درمان
 */
const TREATMENT_CONFIG = {
    // مسیرهای API
    API_URLS: {
        CREATE_TREATMENT: '/treatment/create/',
        UPDATE_TREATMENT: (id) => `/treatment/update/${id}/`,
        DELETE_TREATMENT: (id) => `/treatment/delete/${id}/`,
        GET_TREATMENT: (id) => `/treatment/get/${id}/`,
        LIST_TREATMENTS: (patientId) => `/treatment/list/${patientId}/`,
        CREATE_PAYMENT: '/treatment/payment/create/',
        GET_TREATMENT_DETAILS: (typeId) => `/treatment/get-details/${typeId}/`,
        GET_INSURANCE_INFO: (providerId) => `/treatment/api/insurance-providers/${providerId}/`,
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
