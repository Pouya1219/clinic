// static/inventory/js/NotificationService.js

class NotificationService {
    constructor(config) {
        this.config = config;
        this.socket = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.reconnectTimeout = null;
        this.heartbeatInterval = null;
        this.messageQueue = [];
        this.eventListeners = new Map(); // تغییر نام از listeners به eventListeners
        
        // اتصال خودکار اگر تنظیم شده باشد
        if (this.config.WEBSOCKET.AUTO_CONNECT !== false) {
            this.connect();
        }
    }

    // متد اتصال به وب‌سوکت - اصلاح شده
    connect() {
        try {
            const wsUrl = this.config.WEBSOCKET.URL;
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
            this._handleReconnect();
        }
    }

    // رویدادهای وب‌سوکت
    onOpen(event) {
        console.log('🔌 WebSocket connection established');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        
        // ارسال پیام‌های صف
        this._flushMessageQueue();
        
        // اطلاع به listeners
        this.emit('connected', event);
        
        // ارسال پیام heartbeat
        this._startHeartbeat();
    }

    onMessage(event) {
        try {
            const data = JSON.parse(event.data);
            console.log('📥 WebSocket message received:', data);
            
            // پردازش بر اساس نوع پیام
            this._handleMessage(data);
            
        } catch (error) {
            console.error('Error processing WebSocket message:', error);
        }
    }

    onClose(event) {
        console.log(`🔌 WebSocket connection closed. Code: ${event.code}`);
        this.isConnected = false;
        
        // توقف heartbeat
        this._stopHeartbeat();
        
        // اطلاع به listeners
        this.emit('disconnected', event);
        
        // تلاش مجدد اتصال اگر اتصال به طور غیرعادی قطع شده باشد
        if (!event.wasClean) {
            this._handleReconnect();
        }
    }

    onError(event) {
        console.error('WebSocket error:', event);
        this.emit('error', event);
    }

    disconnect() {
        // توقف heartbeat
        this._stopHeartbeat();
        
        // پاکسازی timeout بازاتصال
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
        
        // قطع اتصال وب‌سوکت
        if (this.socket) {
            // بستن با کد 1000 (بستن عادی)
            this.socket.close(1000, 'Manual disconnect');
            this.socket = null;
        }
        
        this.isConnected = false;
        console.log('WebSocket disconnected manually');
    }

    _startHeartbeat() {
        // توقف heartbeat قبلی اگر وجود داشته باشد
        this._stopHeartbeat();
        
        // شروع heartbeat جدید
        this.heartbeatInterval = setInterval(() => {
            if (this.isConnected) {
                this.send({
                    type: 'ping',
                    timestamp: Date.now()
                });
            }
        }, this.config.WEBSOCKET.HEARTBEAT_INTERVAL);
    }

    _stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    _handleReconnect() {
        if (this.reconnectAttempts < this.config.WEBSOCKET.MAX_RECONNECT_ATTEMPTS) {
            this.reconnectAttempts++;
            console.log(`Attempting to reconnect (${this.reconnectAttempts})...`);
            
            // استفاده از setTimeout برای تلاش مجدد
            this.reconnectTimeout = setTimeout(() => {
                this.connect();
            }, this.config.WEBSOCKET.RECONNECT_INTERVAL);
        } else {
            console.error("Max reconnect attempts reached.");
            this.emit('max_reconnect_reached');
        }
    }

    send(data) {
        if (this.isConnected && this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(data));
        } else {
            // اضافه کردن به صف اگر اتصال برقرار نیست
            this.messageQueue.push(data);
            console.log('Message queued (WebSocket not connected)');
        }
    }

    _flushMessageQueue() {
        while (this.messageQueue.length > 0) {
            const message = this.messageQueue.shift();
            this.send(message);
        }
    }

    // اصلاح متد _handleMessage
    _handleMessage(data) {
        // اگر پیام دارای نوع است، آن را به عنوان رویداد منتشر کن
        if (data.type) {
            this.emit(data.type, data.payload || data);
        }
    }

    // --- Event Listener Management ---

    on(eventName, callback) {
        if (!this.eventListeners.has(eventName)) {
            this.eventListeners.set(eventName, []);
        }
        this.eventListeners.get(eventName).push(callback);
    }

    emit(eventName, data) {
        if (this.eventListeners.has(eventName)) {
            this.eventListeners.get(eventName).forEach(callback => callback(data));
        }
    }

    // --- API Call Management ---

    _getCsrfToken() {
        return document.querySelector('[name=csrfmiddlewaretoken]')?.value || '';
    }

    async _fetchAPI(url, options = {}) {
        const defaultHeaders = {
            'Content-Type': 'application/json',
            'X-CSRFToken': this._getCsrfToken(),
            'X-Requested-With': 'XMLHttpRequest',
        };

        const config = {
            ...options,
            headers: { ...defaultHeaders, ...options.headers },
        };

        try {
            const response = await fetch(url, config);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(errorData.message || `HTTP error ${response.status}`);
            }
            return response.json();
        } catch (error) {
            console.error(`API call to ${url} failed:`, error);
            this.emit('api_error', { message: error.message });
            throw error;
        }
    }

    // --- Public API Methods ---

    async getNotifications(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this._fetchAPI(`${this.config.API.LIST}?${queryString}`);
    }

    async markAsRead(notificationIds) {
        return this._fetchAPI(this.config.API.ACTIONS, {
            method: 'POST',
            body: JSON.stringify({
                action: 'mark_read',
                notification_ids: notificationIds,
            }),
        });
    }
    
    async markAllAsRead() {
        // این متد باید در بک‌اند پیاده‌سازی شود تا تمام اعلان‌های کاربر را بخواند
        return this._fetchAPI(this.config.API.ACTIONS, {
            method: 'POST',
            body: JSON.stringify({ action: 'mark_all_read' }),
        });
    }

    async deleteNotification(notificationId) {
        return this._fetchAPI(this.config.API.DETAIL(notificationId), {
            method: 'DELETE',
        });
    }
}
