// static/inventory/js/notifications-dropdown.js

class NotificationDropdownManager {
    constructor(service, config) {
        this.service = service;
        this.config = config;
        this.dropdownElement = document.getElementById('notificationList');
        this.badgeElement = document.querySelector('.notification-badge');
        this.itemsContainer = document.getElementById('notificationItems');
        this.template = document.getElementById('notificationItemTemplate');
        // بررسی وجود المان‌های ضروری
        if (!this.dropdownButton) console.error("Dropdown button not found!");
        if (!this.dropdownMenu) console.error("Dropdown menu not found!");
        if (!this.itemsContainer) console.error("Items container not found!");
        if (!this.template) console.error("Notification template not found!");
    }

    initialize() {
         if (!this.dropdownButton || !this.dropdownMenu || !this.itemsContainer || !this.template) {
            console.warn('NotificationDropdownManager: Required DOM elements not found');
            return;
        }
        this._bindServiceEvents();
        this._bindUIEvents();
        
        // درخواست داده‌های اولیه از طریق وب‌سوکت
        this.service.on('connected', () => {
            this.service.send({ type: 'get_initial_data' });
        });
    }

    _bindServiceEvents() {
        this.service.on('initial_data', (data) => {
            this.updateBadge(data.stats.unread_count);
            this.renderItems(data.recent_notifications);
        });

        this.service.on('new_notification', (notification) => {
            this.addNewItem(notification);
            this.updateBadge(this.badgeElement.innerText * 1 + 1);
            this.showToast(notification);
        });

        this.service.on('notification_stats_updated', (data) => {
            this.updateBadge(data.stats.unread_count);
        });
    }

     _bindUIEvents() {
        // اضافه کردن event listener برای کلیک روی دکمه
        this.dropdownButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Notification button clicked");
            this.toggleDropdown();
        });
        
        // بستن دراپ‌داون با کلیک خارج از آن
        document.addEventListener('click', (e) => {
            if (this.dropdownMenu.classList.contains('show') && 
                !this.dropdownButton.contains(e.target) && 
                !this.dropdownMenu.contains(e.target)) {
                this.toggleDropdown();
            }
        });
        
        // دکمه خواندن همه
        const markAllReadBtn = document.getElementById('markAllReadBtn');
        if (markAllReadBtn) {
            markAllReadBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                await this.service.markAllAsRead();
                const items = this.itemsContainer.querySelectorAll('.notification-item');
                items.forEach(item => {
                    item.classList.remove('unread');
                });
                this.updateBadge(0);
            });
        }
    }
     toggleDropdown() {
        console.log("Toggling dropdown");
        if (this.dropdownMenu.classList.contains('show')) {
            this.dropdownMenu.classList.remove('show');
        } else {
            this.dropdownMenu.classList.add('show');
        }
    }
    updateBadge(count) {
        if (this.badgeElement) {
            this.badgeElement.innerText = count;
            this.badgeElement.style.display = count > 0 ? 'inline-block' : 'none';
        }
    }

    renderItems(notifications) {
        if (!this.itemsContainer || !this.template) return;
        this.itemsContainer.innerHTML = ''; // Clear previous items
        if (notifications.length === 0) {
            this.itemsContainer.innerHTML = '<div class="text-center p-3 text-muted">هیچ اعلانی وجود ندارد</div>';
            return;
        }
        notifications.forEach(n => this.itemsContainer.appendChild(this._createItemElement(n)));
    }

    addNewItem(notification) {
        const newItem = this._createItemElement(notification);
        this.itemsContainer.prepend(newItem);
        // Remove oldest if more than max
        if (this.itemsContainer.children.length > this.config.UI.DROPDOWN_MAX_ITEMS) {
            this.itemsContainer.lastChild.remove();
        }
    }

    _createItemElement(notification) {
        const templateNode = this.template.content.cloneNode(true);
        const item = templateNode.querySelector('.notification-item');
        item.dataset.notificationId = notification.id;
        if (!notification.is_read) {
            item.classList.add('unread');
        }
        
        templateNode.querySelector('.notification-icon-class').className = `notification-icon-class ${notification.icon}`;
        templateNode.querySelector('.notification-title').innerText = notification.title;
        templateNode.querySelector('.notification-message').innerText = notification.message;
        templateNode.querySelector('.notification-time').innerText = notification.time_ago;
        templateNode.querySelector('.view-btn').href = notification.url;

        return templateNode;
    }

    showToast(notification) {
        // منطق نمایش toast شما می‌تواند اینجا بیاید
        console.log(`TOAST: ${notification.title}`);
    }
}


document.addEventListener('DOMContentLoaded', () => {
    // بررسی وجود متغیر تنظیمات در window
    if (typeof window.NOTIFICATIONS_SYSTEM_CONFIG !== 'undefined') {
        try {
            console.log("Initializing notification system with config:", window.NOTIFICATIONS_SYSTEM_CONFIG);
            
            // ایجاد سرویس اعلان‌ها با استفاده از متغیر window
            const notificationService = new NotificationService(window.NOTIFICATIONS_SYSTEM_CONFIG);
            
            // اتصال به وب‌سوکت
            notificationService.connect();
            
            // ایجاد مدیریت کننده dropdown
            const dropdownManager = new NotificationDropdownManager(notificationService, window.NOTIFICATIONS_SYSTEM_CONFIG);
            dropdownManager.initialize();
            
            // ذخیره سرویس در window برای دسترسی سایر اسکریپت‌ها
            window.notificationService = notificationService;
            
            // فعال‌سازی دستی دراپ‌داون
            const dropdownButton = document.getElementById('notificationDropdown');
            if (dropdownButton) {
                console.log("Notification dropdown button found:", dropdownButton);
                
                // اضافه کردن event listener برای کلیک
                dropdownButton.addEventListener('click', function(e) {
                    e.preventDefault();
                    console.log("Notification dropdown button clicked");
                    
                    // بررسی وجود Bootstrap
                    if (typeof bootstrap !== 'undefined') {
                        const dropdown = new bootstrap.Dropdown(dropdownButton);
                        dropdown.toggle();
                    } else {
                        console.error("Bootstrap is not defined. Make sure Bootstrap JS is loaded.");
                    }
                });
            } else {
                console.error("Notification dropdown button not found with ID 'notificationDropdown'");
                // بررسی تمام دکمه‌های موجود
                const allButtons = document.querySelectorAll('button');
                console.log("All buttons on page:", allButtons.length);
                allButtons.forEach((btn, i) => {
                    console.log(`Button ${i}:`, btn.id, btn.className);
                });
            }
        } catch (error) {
            console.error("Error initializing notification system:", error);
        }
    } else {
        console.error("NOTIFICATIONS_SYSTEM_CONFIG not found. Notification system will not be initialized.");
        console.error("Available global variables:", Object.keys(window).filter(key => key.includes('NOTIFICATION')));
    }
});