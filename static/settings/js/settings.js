// static/settings/js/settings.js
document.addEventListener('DOMContentLoaded', function() {
    const navItems = document.querySelectorAll('.settings_nav_item');
    const tabContents = document.querySelectorAll('.settings_tab_content');

    function switchTab(tabId) {
        // غیرفعال کردن همه تب‌ها
        navItems.forEach(item => item.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));

        // فعال کردن تب انتخاب شده
        const selectedNav = document.querySelector(`[data-tab="${tabId}"]`);
        const selectedContent = document.getElementById(tabId);

        if (selectedNav && selectedContent) {
            selectedNav.classList.add('active');
            selectedContent.classList.add('active');

            // ذخیره تب فعال در localStorage
            localStorage.setItem('activeSettingsTab', tabId);
        }
    }

    // اضافه کردن event listener به آیتم‌های منو
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = item.getAttribute('data-tab');
            switchTab(tabId);
        });
    });

    // بازیابی آخرین تب فعال
    const lastActiveTab = localStorage.getItem('activeSettingsTab') || 'appointments';
    switchTab(lastActiveTab);
});
