document.addEventListener("DOMContentLoaded", function () {
    const toggleBtn = document.querySelector('.toggle-sidebar');
    const sidebar = document.querySelector('.sidebar');
    const menuItems = document.querySelectorAll('.menu-item');
    const mainContent = document.querySelector('.main-content');


    menuItems.forEach(item => {
        item.addEventListener('click', function () {
            const submenu = this.querySelector('.submenu');
            if (submenu) {
                submenu.classList.toggle('active'); // نمایش یا مخفی کردن زیرمنو
                this.classList.toggle('active'); // تغییر وضعیت آیتم اصلی
            }
        });
        const submenuItems = item.querySelectorAll('.submenu-item');
        submenuItems.forEach(subItem => {
            subItem.addEventListener('click', function (event) {
                const nestedSubmenu = this.querySelector('.submenu');
                if (nestedSubmenu) {
                    nestedSubmenu.classList.toggle('active'); // باز و بسته کردن زیرمنوی داخل‌تر
                    this.classList.toggle('active');
                    event.stopPropagation(); // جلوگیری از بسته شدن منوی بالاتر
                }
            });
        });
    });
    if (sidebar) {
        sidebar.classList.add('active'); // اضافه کردن کلاس فعال در شروع
    }

    if (toggleBtn && sidebar && mainContent) {
        toggleBtn.addEventListener('click', function () {
            const isOpen = sidebar.classList.contains('active');
            sidebar.classList.toggle('active');
            
            // تنظیم مقدار `main-content` بر اساس وضعیت سایدبار
            if (isOpen) {
                mainContent.style.marginRight = "0"; // وقتی بسته شد، محتوا به حالت عادی برگردد
            } else {
                mainContent.style.marginRight = "250px"; // وقتی باز شد، محتوا کنار برود
            }
        });
    }


});





