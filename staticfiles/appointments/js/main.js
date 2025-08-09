// static/appointments/js/main.js
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // بررسی وجود المان‌های ضروری
        const requiredElements = [
            'appointment-modal',
            'visit_appointment_form',
            'visit_doctor',
            'visit_schedule'
        ];

        const missingElements = requiredElements.filter(id => !document.getElementById(id));
        if (missingElements.length > 0) {
            throw new Error(`Missing required elements: ${missingElements.join(', ')}`);
        }

        // راه‌اندازی مدیریت رابط کاربری
        UIManager.initialize();

        // راه‌اندازی مدیریت تقویم
        window.calendarManager = new CalendarManager();
        await window.calendarManager.initialize();

        // راه‌اندازی Flatpickr
        if (typeof flatpickr !== 'undefined') {
            flatpickr('.time-picker', {
                enableTime: true,
                noCalendar: true,
                dateFormat: 'H:i',
                time_24hr: true,
                minuteIncrement: 5
            });
        }

        console.log('Calendar system initialized successfully');
    } catch (error) {
        console.error('Error initializing calendar system:', error);
        // نمایش خطا به کاربر
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.textContent = 'خطا در راه‌اندازی سیستم: ' + error.message;
        document.querySelector('.appointment_container')?.prepend(errorMessage);
    }
});
