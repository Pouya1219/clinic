// static/inventory/js/notifications-page.js

class NotificationPageManager {
    constructor(service, config) {
        this.service = service;
        this.config = config;
        this.container = document.getElementById('notificationsList');
        this.paginationContainer = document.getElementById('paginationContainer');
        this.filters = {}; // آبجکت برای نگهداری فیلترهای فعلی
    }

    initialize() {
        this._bindUIEvents();
        this.loadNotifications();
    }

    _bindUIEvents() {
        document.getElementById('applyFiltersBtn')?.addEventListener('click', () => {
            this.filters = {
                search: document.getElementById('searchFilter').value,
                type: document.getElementById('typeFilter').value,
                // ... سایر فیلترها
            };
            this.loadNotifications();
        });

        // Event listener برای کلیک روی دکمه‌های "خوانده شد" و "حذف"
        this.container.addEventListener('click', async (e) => {
            const target = e.target;
            const notificationItem = target.closest('.notification-item-page');
            if (!notificationItem) return;

            const notificationId = notificationItem.dataset.notificationId;

            if (target.closest('.mark-read-btn')) {
                await this.service.markAsRead([notificationId]);
                notificationItem.classList.remove('unread');
            }

            if (target.closest('.delete-btn')) {
                if (confirm('آیا از حذف این اعلان مطمئن هستید؟')) {
                    await this.service.deleteNotification(notificationId);
                    notificationItem.remove();
                }
            }
        });
    }

    async loadNotifications() {
        this.showLoading();
        try {
            const data = await this.service.getNotifications(this.filters);
            this.renderNotifications(data.notifications);
            this.renderPagination(data.pagination);
        } catch (error) {
            this.showError();
        } finally {
            this.hideLoading();
        }
    }

    renderNotifications(notifications) {
        this.container.innerHTML = '';
        if (notifications.length === 0) {
            this.container.innerHTML = '<div class="text-center p-5 text-muted">هیچ اعلانی با این مشخصات یافت نشد.</div>';
            return;
        }
        notifications.forEach(n => {
            this.container.innerHTML += this._createNotificationHtml(n);
        });
    }

    _createNotificationHtml(notification) {
        // این متد باید HTML کامل یک آیتم اعلان را برای صفحه اصلی بسازد
        // این کد مشابه کد قبلی شما در notifications-page.js خواهد بود
        const isUnread = !notification.is_read ? 'unread' : '';
        return `
            <div class="notification-item-page ${isUnread}" data-notification-id="${notification.id}">
                <!-- ساختار کامل HTML یک آیتم -->
                <div class="notification-icon-page ${notification.type}"><i class="${notification.icon}"></i></div>
                <div class="notification-content-page">
                    <h6>${notification.title}</h6>
                    <p>${notification.message}</p>
                    <small>${notification.time_ago}</small>
                </div>
                <div class="notification-actions-page">
                    <button class="btn btn-sm btn-outline-primary mark-read-btn">خوانده شد</button>
                    <button class="btn btn-sm btn-outline-danger delete-btn">حذف</button>
                </div>
            </div>
        `;
    }

    renderPagination(pagination) {
        // منطق ساخت HTML برای صفحه‌بندی
        this.paginationContainer.innerHTML = '...';
    }

    showLoading() { this.container.innerHTML = '<div class="text-center p-5"><div class="spinner-border"></div></div>'; }
    hideLoading() { /* ... */ }
    showError() { this.container.innerHTML = '<div class="alert alert-danger">خطا در بارگذاری اعلان‌ها.</div>'; }
}

document.addEventListener('DOMContentLoaded', () => {
    // فقط اگر در صفحه اعلان‌ها هستیم، این مدیر را راه‌اندازی کن
    if (document.getElementById('notificationsList')) {
        // سرویس مرکزی قبلا در dropdown ساخته شده، از همان استفاده می‌کنیم
        if (window.notificationService) {
            const pageManager = new NotificationPageManager(window.notificationService, NOTIFICATION_CONFIG);
            pageManager.initialize();
        } else {
            console.error("NotificationService not found. Make sure notifications-dropdown.js is loaded first.");
        }
    }
});
