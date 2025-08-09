// static/inventory/js/notifications_config.js

// بررسی می‌کنیم که آیا قبلاً تعریف شده است یا خیر
if (typeof NOTIFICATIONS_SYSTEM_CONFIG === 'undefined') {
    // تنظیمات مرکزی برای سیستم اعلان‌ها - با قابلیت تنظیم پویا
    const NOTIFICATIONS_SYSTEM_CONFIG = (function() {
        // استفاده از آدرس وب‌سوکت از تنظیمات سرور اگر موجود باشد
        const websocketUrl = "ws://127.0.0.1:8001/ws/notifications/";
        console.log("Notifications WebSocket URL:", websocketUrl);
        
        return {
            // تنظیمات WebSocket
            WEBSOCKET: {
            URL: websocketUrl,
            RECONNECT_INTERVAL: 5000,
            MAX_RECONNECT_ATTEMPTS: 10
        },
            
            // تنظیمات API
            API: {
                LIST: '/api/notifications/',
                DETAIL: (id) => `/api/notifications/${id}/`,
                ACTIONS: '/api/notifications/actions/',
                EXPORT: '/api/notifications/export/',
                MARK_NOTIFICATION_READ: (id) => `/api/notifications/${id}/read/`
            },
            
            // تنظیمات UI
            UI: {
                DROPDOWN_MAX_ITEMS: 10,
                TOAST_DURATION: 5000,
                REFRESH_INTERVAL: 60000
            }
        };
    })();
}
