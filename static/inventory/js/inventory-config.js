const INVENTORY_CONFIG = {
    // مسیرهای API
    API_URLS: {
        // کالاها
        
        GET_ITEMS: '/inventory/api/items/',
        CREATE_ITEM: '/inventory/api/items/create/',
        UPDATE_ITEM: (id) => `/inventory/api/items/${id}/update/`,
        DELETE_ITEM: (id) => `/inventory/api/items/${id}/delete/`,
        GET_ITEM: (id) => `/inventory/api/items/${id}/`,
        
        // دسته‌بندی‌ها
        GET_CATEGORIES: '/inventory/api/categories/',
        CREATE_CATEGORY: '/inventory/api/categories/create/',
        UPDATE_CATEGORY: (id) => `/inventory/api/categories/${id}/update/`,
        DELETE_CATEGORY: (id) => `/inventory/api/categories/${id}/delete/`,
        
        // انبارها
        GET_WAREHOUSES: '/inventory/api/warehouses/',
        CREATE_WAREHOUSE: '/inventory/api/warehouses/create/',
        UPDATE_WAREHOUSE: (id) => `/inventory/api/warehouses/${id}/update/`,
        DELETE_WAREHOUSE: (id) => `/inventory/api/warehouses/${id}/delete/`,
        
        // واحدها
        GET_UNITS: '/inventory/api/units/',
        CREATE_UNIT: '/inventory/api/units/create/',
        UPDATE_UNIT: (id) => `/inventory/api/units/${id}/update/`,
        DELETE_UNIT: (id) => `/inventory/api/units/${id}/delete/`,
        
        // ورودی‌ها
        // ورودی‌ها - بروزرسانی شده
        GET_ENTRIES: '/inventory/api/entries/',
        CREATE_ENTRY: '/inventory/api/entries/create/',
        UPDATE_ENTRY: (id) => `/inventory/api/entries/${id}/update/`,
        DELETE_ENTRY: (id) => `/inventory/api/entries/${id}/delete/`,
        GET_ENTRY: (id) => `/inventory/api/entries/${id}/`,
        BULK_ENTRY: '/inventory/api/entries/bulk/',
        EXPORT_ENTRIES: '/inventory/api/entries/export/',
        
        // خروجی‌ها
        GET_EXITS: '/inventory/api/exits/',
        CREATE_EXIT: '/inventory/api/exits/create/',
        UPDATE_EXIT: (id) => `/inventory/api/exits/${id}/update/`,
        DELETE_EXIT: (id) => `/inventory/api/exits/${id}/delete/`,
        GET_EXIT: (id) => `/inventory/api/exits/${id}/`,
        BULK_EXIT: '/inventory/api/exits/bulk/',
        EXPORT_EXITS: '/inventory/api/exits/export/',
        
        
        // موجودی
        GET_INVENTORY: '/inventory/api/inventory/',
        
        // داشبورد
        GET_DASHBOARD_STATS: '/inventory/api/dashboard/stats/',
        GET_DASHBOARD_CHARTS: '/inventory/api/dashboard/charts/',
        GET_DASHBOARD_ALERTS: '/inventory/api/dashboard/alerts/',
        
        // گزارشات
        GET_LOW_STOCK_REPORT: '/inventory/api/reports/low-stock/',
        GET_EXPIRY_REPORT: '/inventory/api/reports/expiry/',
        GET_MOVEMENT_REPORT: '/inventory/api/reports/movements/',
        
        // // اعلان‌ها
        // GET_NOTIFICATIONS: '/inventory/api/notifications/',
        // MARK_NOTIFICATION_READ: (id) => `/inventory/api/notifications/${id}/read/`,
        // MARK_ALL_NOTIFICATIONS_READ: '/inventory/api/notifications/mark-all-read/',
    },
    
    // تنظیمات وب‌سوکت
    WEBSOCKET: {
        URL: "ws://127.0.0.1:8001/ws/inventory/",
        RECONNECT_INTERVAL: 5000,
        MAX_RECONNECT_ATTEMPTS: 10
    },
    
    // تنظیمات UI
    UI: {
        ITEMS_PER_PAGE: 20,
        SEARCH_DELAY: 300, // میلی‌ثانیه
        TOAST_DURATION: 3000, // میلی‌ثانیه
        CURRENCY_SYMBOL: 'تومان',
        DATE_FORMAT: 'YYYY/MM/DD',
    },
    
    // پیام‌های خطا
    ERROR_MESSAGES: {
        FETCH_FAILED: 'خطا در دریافت اطلاعات از سرور',
        SAVE_FAILED: 'خطا در ذخیره اطلاعات',
        DELETE_FAILED: 'خطا در حذف اطلاعات',
        VALIDATION_FAILED: 'لطفاً تمام فیلدهای الزامی را پر کنید',
        CONNECTION_ERROR: 'خطا در ارتباط با سرور',
        SERVER_ERROR: 'خطای سرور رخ داده است',
        UNAUTHORIZED: 'دسترسی غیرمجاز',
        NOT_FOUND: 'اطلاعات مورد نظر یافت نشد',
    },
    
    // پیام‌های موفقیت
    SUCCESS_MESSAGES: {
        SAVE_SUCCESS: 'اطلاعات با موفقیت ذخیره شد',
        DELETE_SUCCESS: 'حذف با موفقیت انجام شد',
        UPDATE_SUCCESS: 'بروزرسانی با موفقیت انجام شد',
    },
};
