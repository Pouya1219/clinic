// static/js/notification-manager.js

class NotificationManager {
    /**
     * یک یادآوری را به عنوان "دیده شده" علامت می‌زند
     */
    static async markAsSeen(type, id) {
        if (!confirm('آیا این مورد پیگیری شده است؟')) return;
        
        try {
            const response = await NotificationAPI.markReminderAsSeen(type, id);

            if (response.success) {
                // ۱. ردیف جدول را در صفحه فعلی آپدیت کن
                const row = document.getElementById(`reminder-row-${type}-${id}`);
                if (row) {
                    row.classList.add('reminder-seen');
                    const buttonContainer = row.querySelector('.action-cell');
                    if(buttonContainer) {
                        buttonContainer.innerHTML = '<span class="action-status-seen"><i class="fas fa-check-circle"></i> پیگیری شده</span>';
                    }
                }

                // ۲. تعداد نوتیفیکیشن‌ها را در نوار اعلان آپدیت کن
                this.updateNotificationCount();

            } else {
                alert(`خطا: ${response.message}`);
            }
        } catch (error) {
            alert('خطا در ارتباط با سرور.');
            console.error("Error marking as seen:", error);
        }
    }

    /**
     * [نسخه نهایی] تعداد نوتیفیکیشن‌ها را در نوار اعلان آپدیت می‌کند
     */
    static updateNotificationCount() {
        const counterElement = document.getElementById('notification-counter');
        
        // اگر نوار اعلان در صفحه فعلی وجود نداشت، کاری نکن
        if (!counterElement) return;

        let currentCount = parseInt(counterElement.textContent, 10);
        if (isNaN(currentCount)) return;
        
        currentCount -= 1;

        if (currentCount > 0) {
            // اگر هنوز نوتیفیکیشنی باقی مانده، فقط عدد را آپدیت کن
            counterElement.textContent = currentCount;
        } else {
            // اگر تعداد به صفر رسید، کل نوار اعلان را با انیمیشن محو کن
            const navbar = document.getElementById('notification-navbar');
            if (navbar) {
                navbar.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                navbar.style.opacity = '0';
                navbar.style.transform = 'translateY(-100%)';
                setTimeout(() => navbar.remove(), 500);
            }
        }
    }

    static sendSmsReminder(patientId, type) {
        const type_fa = type === 'چک' ? 'چک' : 'قسط';
        alert(`قابلیت ارسال پیامک یادآوری ${type_fa} برای بیمار ${patientId} در آینده پیاده‌سازی خواهد شد.`);
    }
}
