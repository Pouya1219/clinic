<script>
    // تابع خروج دستی با دکمه
    function logoutUser() {
        fetch('/logout/', {
            method: 'POST',
            headers: {
                "X-CSRFToken": getCookie("csrftoken")
            }
        }).then(() => {
            window.location.href = "/login";
        });
    }

    document.getElementById("logout-btn").addEventListener("click", logoutUser);

    // خروج خودکار هنگام بستن صفحه
    window.addEventListener("beforeunload", function () {
        fetch('/logout/', {
            method: 'POST',
            headers: {
                "X-CSRFToken": getCookie("csrftoken")
            }
        });
    });

    // تابع دریافت توکن CSRF از کوکی
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie) {
            const cookies = document.cookie.split(';');
            cookies.forEach(cookie => {
                const trimmedCookie = cookie.trim();
                if (trimmedCookie.startsWith(name + '=')) {
                    cookieValue = trimmedCookie.split('=')[1];
                }
            });
        }
        return cookieValue;
    }
</script>


// اصلی
<script>
        // تابع خروج دستی با دکمه
        function logoutUser() {
            fetch('/logout/', {
                method: 'POST',
                headers: {
                    "X-CSRFToken": getCookie("csrftoken")
                }
            }).then(() => {
                window.location.href = "/login";
            });
        }
    
        document.getElementById("logout-btn").addEventListener("click", logoutUser);
    
        // خروج خودکار هنگام بستن صفحه
        window.addEventListener("beforeunload", function () {
            fetch('/logout/', {
                method: 'POST',
                headers: {
                    "X-CSRFToken": getCookie("csrftoken")
                }
            });
        });
    
        // تابع دریافت توکن CSRF از کوکی
        function getCookie(name) {
            let cookieValue = null;
            if (document.cookie) {
                const cookies = document.cookie.split(';');
                cookies.forEach(cookie => {
                    const trimmedCookie = cookie.trim();
                    if (trimmedCookie.startsWith(name + '=')) {
                        cookieValue = trimmedCookie.split('=')[1];
                    }
                });
            }
            return cookieValue;
        }
    </script>
---------------------
sidebar
========
<script>
// Sidebar Toggle
const toggleBtn = document.querySelector('.toggle-sidebar');
const sidebar = document.querySelector('.sidebar');

toggleBtn.addEventListener('click', () => {
sidebar.classList.toggle('active');
toggleBtn.classList.toggle('active');
});

// Generate Menu Items with Icons
const menuItems = [
{ title: 'داشبورد', icon: 'fa-solid fa-gauge-high', subItems: ['گزارش روزانه', 'آمار کلی'] },
{ title: 'بیماران', icon: 'fa-solid fa-user-group', subItems: ['لیست بیماران', 'افزودن بیمار', 'سوابق پزشکی'] },
{ title: 'نوبت‌دهی', icon: 'fa-solid fa-calendar-check', subItems: ['رزرو نوبت', 'لیست نوبت‌ها'] },
{ title: 'حسابداری', icon: 'fa-solid fa-money-bill-wave', subItems: ['صورتحساب‌ها', 'پرداخت‌ها'] },
{ title: 'داروخانه', icon: 'fa-solid fa-pills', subItems: ['موجودی دارو', 'سفارش دارو'] },
{ title: 'تجهیزات', icon: 'fa-solid fa-toolbox', subItems: ['لیست تجهیزات', 'سرویس‌ها'] },
{ title: 'مدیریت کاربران', icon: 'fa-solid fa-user-doctor', subItems: ['دسترسی ها', 'لیست کاربرها'] },
{ title: 'گزارشات', icon: 'fa-solid fa-chart-line', subItems: ['گزارش مالی', 'گزارش عملکرد'] },
{ title: 'اسناد', icon: 'fa-solid fa-folder', subItems: ['پرونده‌ها', 'مدارک'] },
{ title: 'پیامک', icon: 'fa-solid fa-envelope', subItems: ['صندوق ورودی', 'ارسال پیام'] },
{ title: 'تنظیمات', icon: 'fa-solid fa-gear', subItems: ['تنظیمات کلی', 'درختواره'] },
{ title: 'پشتیبانی', icon: 'fa-solid fa-headset', subItems: ['تماس با ما', 'آموزش ها','ارسال تیکت'] },
{ 
title: ' کاربران', 
icon: 'fa-solid fa-user-doctor', 
subItems: [
    { name: 'دسترسی‌ها', link: '/users/access/' },
    { name: 'لیست کاربرها', link: '{% url "user_list" %}' } // لینک مسیر Django
]
}

];

const menuContainer = document.querySelector('.menu-container');

menuItems.forEach(item => {
const menuItem = document.createElement('div');
menuItem.className = 'menu-item';
menuItem.innerHTML = `
<div>
    <i class="${item.icon} menu-icon"></i>
    <span>${item.title}</span>
</div>
<i class="fas fa-chevron-down arrow-icon"></i>
`;

const submenu = document.createElement('div');
submenu.className = 'submenu';

item.subItems.forEach(subItem => {
submenu.innerHTML += `
    <div class="submenu-item">
        <i class="fas fa-circle-dot"></i>
        <a href="${subItem.link}" class="submenu-link">${subItem.name}</a> <!-- اضافه شدن لینک -->
    </div>
`;
});

menuItem.appendChild(submenu);
menuContainer.appendChild(menuItem);

menuItem.addEventListener('click', function() {
this.classList.toggle('active');
submenu.classList.toggle('active');
});
});

// اضافه کردن عملکرد جستجو
const searchBars = document.querySelectorAll('.search-bar');

searchBars.forEach(searchBar => {
searchBar.addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase();
    // اینجا می‌توانید منطق جستجوی خود را پیاده‌سازی کنید
    // مثلاً: فیلتر کردن لیست پرونده‌ها بر اساس searchTerm
    console.log('Searching for:', searchTerm);
});
});
// تاریخ شمسی
function updatePersianDate() {
    const date = new Date();
    document.getElementById('persian-date').innerText = date.toLocaleDateString('fa-IR');
}
updatePersianDate();



</script>