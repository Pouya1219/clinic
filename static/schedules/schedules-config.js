// static/js/schedules-config.js

const SchedulesConfig = {
    // تنظیمات API
    apiEndpoints: {
        save: '/schedules/save/',
        update: '/schedules/update/',
        load: '/schedules/load/'
    },
    
    // تنظیمات زمانی
    timeSettings: {
        defaultTime: '08:00',
        timeFormat: 'HH:MM'
    },
    
    // پیام‌های سیستم
    messages: {
        saveSuccess: 'برنامه کاری با موفقیت ذخیره شد',
        updateSuccess: 'برنامه کاری با موفقیت بروزرسانی شد',
        loadSuccess: 'اطلاعات پرسنل بارگذاری شد',
        selectPersonnel: 'لطفا یک پرسنل را انتخاب کنید',
        invalidTime: 'لطفا زمان‌ها را به فرمت صحیح (HH:MM) وارد کنید',
        serverError: 'خطا در ارتباط با سرور',
        copySuccess: 'برنامه به تمام روزها کپی شد'
    },
    
    // نام روزهای هفته
    daysOfWeek: [
        'شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'
    ]
};
