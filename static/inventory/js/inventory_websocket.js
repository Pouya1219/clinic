/**
 * مدیریت ارتباطات وب‌سوکت برای سیستم انبارداری
 */
class InventoryWebSocket {
    
    /**
     * راه‌اندازی اولیه وب‌سوکت
     */
    constructor() {
        this.socket = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.reconnectInterval = 5000; // 5 seconds
        this.eventHandlers = {};
        
        // اتصال به وب‌سوکت
        this.connect();
        
        console.log('InventoryWebSocket initialized');
    }
    /**
     * اتصال به وب‌سوکت
     */
    connect() {
        try {
            const wsUrl = INVENTORY_CONFIG.WEBSOCKET.URL;
            console.log('Attempting to connect to WebSocket at:', wsUrl);
            this.socket = new WebSocket(wsUrl);
            
            // تنظیم رویدادهای وب‌سوکت
            this.socket.onopen = this.onOpen.bind(this);
            this.socket.onmessage = this.onMessage.bind(this);
            this.socket.onclose = this.onClose.bind(this);
            this.socket.onerror = this.onError.bind(this);
            
            console.log('WebSocket connection attempt...');
        } catch (error) {
            console.error('WebSocket connection error:', error);
            this.scheduleReconnect();
        }
    }
    
    /**
     * رویداد باز شدن اتصال
     */
    onOpen(event) {
        console.log('WebSocket connection established');
        this.reconnectAttempts = 0;
        
        // درخواست اطلاعات اولیه
        this.sendMessage({
            type: 'get_notifications'
        });
    }
    
 
/**
 * رویداد دریافت پیام
 */
onMessage(event) {
    try {
        const message = JSON.parse(event.data);
        console.log('WebSocket message received:', message);
        
        // پردازش پیام بر اساس نوع
        switch (message.type) {
            case 'connection_established':
                console.log('WebSocket connection confirmed by server');
                break;
                
            case 'inventory_update':
                this.handleInventoryUpdate(message.data);
                break;
                
            case 'items_list':
                // پردازش لیست کالاها
                this.handleItemsList(message.items, message.pagination);
                break;
                
            case 'item_created':
            case 'item_updated':
            case 'item_deleted':
            case 'entry_created':
            case 'entry_updated':
            case 'entry_deleted':
            case 'exit_created':
            case 'exit_updated':
            case 'exit_deleted':
                this.triggerEvent(message.type, message.data);
                break;
                
            case 'error':
                console.error('WebSocket error message:', message.message);
                break;
                
            default:
                console.log('Unknown message type:', message.type);
        }
    } catch (error) {
        console.error('Error processing WebSocket message:', error);
    }
}

/**
 * پردازش لیست کالاها
 * @param {Array} items - لیست کالاها
 * @param {Object} pagination - اطلاعات صفحه‌بندی
 */
handleItemsList(items, pagination) {
    // فراخوانی رویداد
    this.triggerEvent('items_list_received', { items, pagination });
    
    // اگر inventoryManager وجود دارد، لیست کالاها را بروزرسانی کنید
    if (window.inventoryManager && typeof window.inventoryManager.updateItemsList === 'function') {
        window.inventoryManager.updateItemsList(items, pagination);
    }
}  
    /**
     * رویداد بسته شدن اتصال
     */
    onClose(event) {
        console.log('WebSocket connection closed:', event.code, event.reason);
        this.scheduleReconnect();
    }
    
    /**
     * رویداد خطا
     */
    onError(error) {
        console.error('WebSocket error:', error);
    }
    
    /**
     * زمان‌بندی اتصال مجدد
     */
    scheduleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Scheduling reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${this.reconnectInterval}ms`);
            
            setTimeout(() => {
                console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
                this.connect();
            }, this.reconnectInterval);
        } else {
            console.error('Maximum reconnect attempts reached. Please refresh the page.');
            
            // نمایش پیام به کاربر
            if (typeof InventoryUI !== 'undefined') {
                InventoryUI.showToast('اتصال به سرور قطع شده است. لطفاً صفحه را بارگذاری مجدد کنید.', 'error');
            } else {
                alert('اتصال به سرور قطع شده است. لطفاً صفحه را بارگذاری مجدد کنید.');
            }
        }
    }
    
    /**
     * ارسال پیام به سرور
     * @param {Object} data - داده‌های پیام
     */
    sendMessage(data) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(data));
        } else {
            console.warn('WebSocket is not connected. Message not sent:', data);
        }
    }
    
 
    
    /**
     * پردازش بروزرسانی موجودی
     * @param {Object} data - داده‌های بروزرسانی
     */
    handleInventoryUpdate(data) {
        // بروزرسانی نمایش موجودی در صفحه
        this.updateInventoryUI(data);
        
        // فراخوانی رویداد
        this.triggerEvent('inventory_updated', data);
    }
    
 
    
    /**
     * بروزرسانی رابط کاربری موجودی
     * @param {Object} data - داده‌های موجودی
     */
    updateInventoryUI(data) {
        // بروزرسانی کارت‌های کالا
        if (data.item_id) {
            const itemCards = document.querySelectorAll(`.item-card[data-item-id="${data.item_id}"]`);
            itemCards.forEach(card => {
                // بروزرسانی موجودی
                const stockElement = card.querySelector('.text-primary');
                if (stockElement && data.new_stock !== undefined) {
                    stockElement.textContent = typeof InventoryUI !== 'undefined' ? 
                        InventoryUI.formatNumber(data.new_stock) : 
                        data.new_stock.toLocaleString('fa-IR');
                }
                
                // بروزرسانی وضعیت موجودی
                if (data.new_stock !== undefined) {
                    const minStock = parseFloat(card.dataset.minStock || 0);
                    
                    // حذف کلاس‌های قبلی
                    card.classList.remove('in-stock', 'low-stock', 'out-of-stock');
                    
                    // اضافه کردن کلاس جدید
                    if (data.new_stock <= 0) {
                        card.classList.add('out-of-stock');
                        
                        const badge = card.querySelector('.badge');
                        if (badge) {
                            badge.className = 'badge bg-danger';
                            badge.textContent = 'ناموجود';
                        }
                    } else if (data.new_stock <= minStock) {
                        card.classList.add('low-stock');
                        
                        const badge = card.querySelector('.badge');
                        if (badge) {
                            badge.className = 'badge bg-warning';
                            badge.textContent = 'کم موجود';
                        }
                    } else {
                        card.classList.add('in-stock');
                        
                        const badge = card.querySelector('.badge');
                        if (badge) {
                            badge.className = 'badge bg-success';
                            badge.textContent = 'موجود';
                        }
                    }
                }
            });
        }
    }
    

    
    /**
     * حذف گوش‌دهنده رویداد
     * @param {string} event - نام رویداد
     * @param {Function} callback - تابع فراخوانی
     */
    removeEventListener(event, callback) {
        if (this.eventHandlers[event]) {
            this.eventHandlers[event] = this.eventHandlers[event].filter(handler => handler !== callback);
        }
    }



/**
 * دریافت CSRF توکن
 * @returns {string} CSRF توکن
 */
static getCSRFToken() {
    const tokenElement = document.querySelector('[name=csrfmiddlewaretoken]');
    if (tokenElement) {
        return tokenElement.value;
    }
    return '';
}

/**
 * فراخوانی رویداد
 * @param {string} event - نام رویداد
 * @param {Object} data - داده‌های رویداد
 */
triggerEvent(event, data) {
    console.log(`Triggering event ${event} in InventoryWebSocket:`, data);
    if (this.eventHandlers[event]) {
        console.log(`Found ${this.eventHandlers[event].length} handlers for event ${event}`);
        this.eventHandlers[event].forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error in event handler for ${event}:`, error);
            }
        });
    } else {
        console.warn(`No handlers registered for event ${event}`);
    }
}

/**
 * افزودن گوش‌دهنده رویداد
 * @param {string} event - نام رویداد
 * @param {Function} callback - تابع گوش‌دهنده
 */
addEventListener(event, callback) {
    console.log(`Adding event listener for ${event} in InventoryWebSocket`);
    if (!this.eventHandlers[event]) {
        this.eventHandlers[event] = [];
    }
    this.eventHandlers[event].push(callback);
    console.log(`Now ${this.eventHandlers[event].length} handlers for event ${event}`);
}
    

    
    /**
     * درخواست کالاهای کم موجود
     */
    requestLowStockItems() {
        this.sendMessage({
            type: 'get_low_stock_items'
        });
    }
/**
 * درخواست لیست کالاها
 * @param {number} page - شماره صفحه
 * @param {number} perPage - تعداد آیتم در هر صفحه
 * @param {string} sortBy - فیلد مرتب‌سازی
 * @param {string} sortOrder - ترتیب مرتب‌سازی
 * @param {Object} filters - فیلترها
 */
requestItems(page, perPage, sortBy, sortOrder, filters) {
    console.log('Requesting items via WebSocket:', { page, perPage, sortBy, sortOrder, filters });
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        const message = {
            type: 'get_items',
            page: page,
            per_page: perPage,
            sort_by: sortBy,
            sort_order: sortOrder,
            filters: filters
        };
        this.socket.send(JSON.stringify(message));
        console.log('Items request sent via WebSocket');
    } else {
        console.error('WebSocket is not open, cannot request items');
    }
}



    /**
     * درخواست آمار داشبورد
     */
    requestDashboardStats() {
        this.sendMessage({
            type: 'get_dashboard_stats'
        });
    }
}

// ایجاد نمونه از کلاس وب‌سوکت پس از بارگذاری صفحه
document.addEventListener('DOMContentLoaded', function() {
    // ایجاد نمونه از کلاس وب‌سوکت
    window.inventoryWebSocket = new InventoryWebSocket();
    
    // افزودن گوش‌دهنده برای رویدادهای مختلف
    if (window.inventoryWebSocket) {
        // رویداد بروزرسانی موجودی
        window.inventoryWebSocket.addEventListener('inventory_updated', function(data) {
            console.log('Inventory updated:', data);
            
            // نمایش پیام به کاربر
            if (typeof InventoryUI !== 'undefined') {
                InventoryUI.showToast(`موجودی کالا "${data.item_name}" بروزرسانی شد`, 'info');
            }
            
            // بروزرسانی صفحه در صورت نیاز
            if (window.inventoryManager && typeof window.inventoryManager.refreshItemStock === 'function') {
                window.inventoryManager.refreshItemStock(data.item_id, data.new_stock);
            }
        });
        
        // رویداد ایجاد کالای جدید
        window.inventoryWebSocket.addEventListener('item_created', function(data) {
            console.log('Item created:', data);
            
            // نمایش پیام به کاربر
            if (typeof InventoryUI !== 'undefined') {
                InventoryUI.showToast(`کالای جدید "${data.item_name}" توسط ${data.user} ایجاد شد`, 'success');
            }
            
            // بروزرسانی لیست کالاها در صورت نیاز
            if (window.inventoryManager && typeof window.inventoryManager.loadItems === 'function') {
                window.inventoryManager.loadItems();
            }
        });
        
        // رویداد بروزرسانی کالا
        window.inventoryWebSocket.addEventListener('item_updated', function(data) {
            console.log('Item updated:', data);
            
            // نمایش پیام به کاربر
            if (typeof InventoryUI !== 'undefined') {
                InventoryUI.showToast(`کالای "${data.item_name}" توسط ${data.user} بروزرسانی شد`, 'info');
            }
            
            // بروزرسانی لیست کالاها در صورت نیاز
            if (window.inventoryManager && typeof window.inventoryManager.loadItems === 'function') {
                window.inventoryManager.loadItems();
            }
        });
        
        // رویداد حذف کالا
        window.inventoryWebSocket.addEventListener('item_deleted', function(data) {
            console.log('Item deleted:', data);
            
            // نمایش پیام به کاربر
            if (typeof InventoryUI !== 'undefined') {
                InventoryUI.showToast(`کالای "${data.item_name}" توسط ${data.user} حذف شد`, 'warning');
            }
            
            // بروزرسانی لیست کالاها در صورت نیاز
            if (window.inventoryManager && typeof window.inventoryManager.loadItems === 'function') {
                window.inventoryManager.loadItems();
            }
        });
    }
});
