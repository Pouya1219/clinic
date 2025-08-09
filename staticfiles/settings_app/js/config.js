const CODING_CONFIG = {
    // مسیرهای API
    API_URLS: {
        INSURANCE_TYPE: {
            LIST: '/settings/api/insurance-types/',
            DETAIL: (id) => `/settings/api/insurance-types/${id}/`,
            CREATE: '/settings/api/insurance-types/create/',
            UPDATE: (id) => `/settings/api/insurance-types/${id}/`,
            DELETE: (id) => `/settings/api/insurance-types/${id}/`,
            FORM: (id) => `/settings/forms/insurance-type/${id || 'new'}/`,
        },
        INSURANCE_PROVIDER: {
            LIST: '/settings/api/insurance-providers/',
            DETAIL: (id) => `/settings/api/insurance-providers/${id}/`,
            CREATE: '/settings/api/insurance-providers/create/',
            UPDATE: (id) => `/settings/api/insurance-providers/${id}/`,
            DELETE: (id) => `/settings/api/insurance-providers/${id}/`,
            FORM: (id, parentId) => {
                if (parentId) {
                    return `/settings/forms/insurance-provider/${id || 'new'}/${parentId}/`;
                } else {
                    return `/settings/forms/insurance-provider/${id || 'new'}/`;
                }
            },
        },
        TREATMENT_TYPE: {
            LIST: '/settings/api/treatment-types/',
            DETAIL: (id) => `/settings/api/treatment-types/${id}/`,
            CREATE: '/settings/api/treatment-types/create/',
            UPDATE: (id) => `/settings/api/treatment-types/${id}/`,
            DELETE: (id) => `/settings/api/treatment-types/${id}/`,
            FORM: (id) => `/settings/forms/treatment-type/${id || 'new'}/`,
        },
        TREATMENT_DETAIL: {
            LIST: '/settings/api/treatment-details/',
            DETAIL: (id) => `/settings/api/treatment-details/${id}/`,
            CREATE: '/settings/api/treatment-details/create/',
            UPDATE: (id) => `/settings/api/treatment-details/${id}/`,
            DELETE: (id) => `/settings/api/treatment-details/${id}/`,
            FORM: (id, parentId) => {
                if (parentId) {
                    return `/settings/forms/treatment-detail/${id || 'new'}/${parentId}/`;
                } else {
                    return `/settings/forms/treatment-detail/${id || 'new'}/`;
                }
            },
        },
    },
    
    // تنظیمات انیمیشن
    ANIMATION: {
        DURATION: 300, // میلی‌ثانیه
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
