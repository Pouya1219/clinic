// static/js/notification-api.js

class NotificationAPI {
    /**
     * تابع مرکزی برای ارسال درخواست‌ها به سرور با CSRF Token صحیح
     */
    static async fetchData(url, options = {}) {
        // ۱. توکن CSRF را از متا تگ بخوان
        const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

        // ۲. هدرهای پیش‌فرض را تنظیم کن
        const headers = {
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': csrfToken, // [مهم] استفاده از توکن خوانده شده از متا تگ
            ...options.headers,
        };
        if (options.body) {
            headers['Content-Type'] = 'application/json';
        }

        // ۳. درخواست را ارسال کن
        try {
            const response = await fetch(url, { ...options, headers });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: `خطای ${response.status}` }));
                throw new Error(errorData.message || `خطای ${response.status}`);
            }
            return response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    /**
     * یک یادآوری را به عنوان "دیده شده" علامت می‌زند
     */
    static async markReminderAsSeen(type, id) {
        return this.fetchData('/Patient/reminders/mark_as_seen/', {
            method: 'POST',
            body: JSON.stringify({ type: type, id: id })
        });
    }
}
