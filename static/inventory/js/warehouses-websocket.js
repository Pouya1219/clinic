class WarehouseWebSocket {
    constructor() {
        this.socket = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.heartbeatInterval = null;
        this.eventListeners = {};
        
        this.connect();
    }
    
    connect() {
        try {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${protocol}//${window.location.host}/ws/warehouses/`;
            
            this.socket = new WebSocket(wsUrl);
            
            this.socket.onopen = (event) => {
                console.log('Warehouse WebSocket connected successfully');
                this.reconnectAttempts = 0;
                this.startHeartbeat();
                this.triggerEvent('connected', event);
            };
            
            this.socket.onmessage = (event) => {
                this.onMessage(event);
            };
            
            this.socket.onclose = (event) => {
                console.log('Warehouse WebSocket connection closed:', event);
                this.stopHeartbeat();
                this.triggerEvent('disconnected', event);
                
                if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
                    this.reconnect();
                }
            };
            
            this.socket.onerror = (error) => {
                console.error('Warehouse WebSocket error:', error);
                this.triggerEvent('error', error);
            };
            
        } catch (error) {
            console.error('Error creating Warehouse WebSocket connection:', error);
        }
    }
    
    onMessage(event) {
        try {
            const message = JSON.parse(event.data);
            console.log('Warehouse WebSocket message received:', message);
            
            switch (message.type) {
                case 'connection_established':
                    console.log('Warehouse WebSocket connection confirmed by server');
                    break;
                    
                case 'pong':
                    console.log('Warehouse heartbeat response received');
                    break;
                    
                case 'warehouses_list':
                    this.handleWarehousesList(message.warehouses, message.pagination);
                    break;
                    
                case 'warehouse_created':
                    this.handleWarehouseCreated(message.data);
                    break;
                    
                case 'warehouse_updated':
                    this.handleWarehouseUpdated(message.data);
                    break;
                    
                case 'warehouse_deleted':
                    this.handleWarehouseDeleted(message.data);
                    break;
                    
                case 'warehouse_details':
                    this.handleWarehouseDetails(message.data);
                    break;
                    
                case 'warehouse_stats':
                    this.handleWarehouseStats(message.data);
                    break;
                    
                case 'warehouse_inventory_update':
                    this.handleWarehouseInventoryUpdate(message.data);
                    break;
                    
                case 'error':
                    console.error('Warehouse WebSocket error message:', message.message);
                    this.triggerEvent('error', message);
                    break;
                    
                default:
                    console.log('Unknown warehouse message type:', message.type);
            }
        } catch (error) {
            console.error('Error processing Warehouse WebSocket message:', error);
        }
    }
    
    // مدیریت لیست انبارها
    handleWarehousesList(warehouses, pagination) {
        this.triggerEvent('warehouses_list', { warehouses, pagination });
    }
    
    // مدیریت ایجاد انبار جدید
    handleWarehouseCreated(data) {
        this.triggerEvent('warehouse_created', data);
        
        // نمایش نوتیفیکیشن
        if (typeof showNotification === 'function') {
            showNotification('success', `انبار "${data.name}" با موفقیت ایجاد شد`);
        }
    }
    
    // مدیریت بروزرسانی انبار
    handleWarehouseUpdated(data) {
        this.triggerEvent('warehouse_updated', data);
        
        // نمایش نوتیفیکیشن
        if (typeof showNotification === 'function') {
            showNotification('info', `انبار "${data.name}" بروزرسانی شد`);
        }
    }
    
    // مدیریت حذف انبار
    handleWarehouseDeleted(data) {
        this.triggerEvent('warehouse_deleted', data);
        
        // نمایش نوتیفیکیشن
        if (typeof showNotification === 'function') {
            showNotification('warning', `انبار "${data.name}" حذف شد`);
        }
    }
    
    // مدیریت جزئیات انبار
    handleWarehouseDetails(data) {
        this.triggerEvent('warehouse_details', data);
    }
    
    // مدیریت آمار انبار
    handleWarehouseStats(data) {
        this.triggerEvent('warehouse_stats', data);
    }
    
    // مدیریت بروزرسانی موجودی انبار
    handleWarehouseInventoryUpdate(data) {
        this.triggerEvent('warehouse_inventory_update', data);
        
        // نمایش نوتیفیکیشن
        if (typeof showNotification === 'function') {
            showNotification('info', `موجودی انبار "${data.warehouse_name}" بروزرسانی شد`);
        }
    }
    
    // ارسال پیام
    send(message) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(message));
        } else {
            console.warn('Warehouse WebSocket is not connected');
        }
    }
    
    // درخواست لیست انبارها
    requestWarehousesList(filters = {}) {
        this.send({
            type: 'get_warehouses_list',
            filters: filters
        });
    }
    
    // درخواست جزئیات انبار
    requestWarehouseDetails(warehouseId) {
        this.send({
            type: 'get_warehouse_details',
            warehouse_id: warehouseId
        });
    }
    
    // درخواست آمار انبار
    requestWarehouseStats(warehouseId) {
        this.send({
            type: 'get_warehouse_stats',
            warehouse_id: warehouseId
        });
    }
    
    // شروع heartbeat
    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                this.send({ type: 'ping' });
            }
        }, 30000); // هر 30 ثانیه
    }
    
    // توقف heartbeat
    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }
    
    // اتصال مجدد
    reconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Attempting to reconnect warehouse WebSocket (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
            
            setTimeout(() => {
                this.connect();
            }, this.reconnectDelay * this.reconnectAttempts);
        } else {
            console.error('Max reconnection attempts reached for warehouse WebSocket');
            this.triggerEvent('max_reconnect_attempts_reached');
        }
    }
    
    // اضافه کردن event listener
    addEventListener(event, callback) {
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = [];
        }
        this.eventListeners[event].push(callback);
    }
    
    // حذف event listener
    removeEventListener(event, callback) {
        if (this.eventListeners[event]) {
            this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
        }
    }
    
    // فعال کردن event
    triggerEvent(event, data = null) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in warehouse WebSocket event listener for ${event}:`, error);
                }
            });
        }
    }
    
    // بستن اتصال
    close() {
        this.stopHeartbeat();
        if (this.socket) {
            this.socket.close();
        }
    }
    
    // وضعیت اتصال
    isConnected() {
        return this.socket && this.socket.readyState === WebSocket.OPEN;
    }
}

// ایجاد instance سراسری
window.warehouseWebSocket = new WarehouseWebSocket();
