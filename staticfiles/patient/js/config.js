/**
 * Config Module
 * تنظیمات کلی برنامه
 */

const Config = {
    // تنظیمات API
    api: {
        baseUrl: window.location.origin,
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        }
    },
    
    // تنظیمات UI
    ui: {
        dateFormat: 'YYYY/MM/DD',
        timeFormat: 'HH:mm',
        defaultPageSize: 10,
        animationDuration: 300
    },
    
    // پیام‌های سیستمی
    messages: {
        loadError: 'خطا در بارگذاری اطلاعات',
        saveSuccess: 'اطلاعات با موفقیت ذخیره شد',
        saveError: 'خطا در ذخیره اطلاعات',
        deleteConfirm: 'آیا از حذف این مورد اطمینان دارید؟',
        deleteSuccess: 'حذف با موفقیت انجام شد',
        deleteError: 'خطا در حذف اطلاعات',
        sessionExpired: 'نشست شما منقضی شده است. لطفا دوباره وارد شوید'
    }
};
