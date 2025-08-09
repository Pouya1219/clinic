// patient-websocket.js

/**
 * کلاس مدیریت WebSocket برای صفحه بیمار (ادغام شده)
 */
class PatientWebSocket {
    constructor(patientId) {
        this.patientId = patientId;
        this.socket = null;
        this.reconnectAttempts = 0;
        this.connect();
    }

    connect() {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            console.log('WebSocket is already connected.');
            return;
        }

        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        // برای محیط توسعه محلی از پورت 8001 و در محیط پروداکشن از پورت اصلی استفاده می‌کنیم
        const host = window.location.hostname === '127.0.0.1' ? window.location.hostname + ':8001' : window.location.host;
        const wsUrl = `${wsProtocol}//${host}/ws/patient/${this.patientId}/`;

        console.log('Connecting to WebSocket:', wsUrl);
        this.socket = new WebSocket(wsUrl);

        this.socket.onopen = this.onOpen.bind(this);
        this.socket.onmessage = this.onMessage.bind(this);
        this.socket.onclose = this.onClose.bind(this);
        this.socket.onerror = this.onError.bind(this);
    }

    onOpen(event) {
        console.log('WebSocket connection established successfully.');
        this.reconnectAttempts = 0; // ریست کردن تلاش‌های اتصال مجدد
    }

    onMessage(event) {
        const data = JSON.parse(event.data);
        console.log('WebSocket message received:', data);

        switch (data.type) {
            case 'insurance_update':
                this.handleInsuranceUpdate(data.message);
                break;
            case 'treatment_update':
                this.handleTreatmentUpdate(data.message);
                break;
            // می‌توانید موارد دیگر را اینجا اضافه کنید
            default:
                console.log('Received unknown message type:', data.type);
        }
    }

    onClose(event) {
        console.log(`WebSocket connection closed. Code: ${event.code}. Reason: ${event.reason}`);
        // تلاش برای اتصال مجدد با تاخیر
        this.reconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000); // Exponential backoff
        console.log(`Attempting to reconnect in ${delay / 1000} seconds...`);
        setTimeout(() => this.connect(), delay);
    }

    onError(event) {
        console.error('WebSocket error:', event);
    }

    /**
     * مدیریت به‌روزرسانی بیمه
     * این تابع هم جدول بیمه و هم تب درمان را رفرش می‌کند
     */
   // patient-websocket.js

/**
 * مدیریت به‌روزرسانی بیمه
 * این تابع هر دو تب بیمه و درمان را رفرش می‌کند
 */
handleInsuranceUpdate(message) {
    console.log('✅ Handling insurance update signal:', message);

    if (message.status === 'updated') {
        
        // 1. رفرش کردن تب بیمه برای نمایش تغییرات در جدول
        if (document.getElementById('insurance-info')) {
            console.log('Refreshing insurance tab...');
            if (typeof PatientUI !== 'undefined' && typeof PatientUI.refreshTab === 'function') {
                PatientUI.refreshTab('insurance-tab');
            }
        }
        
        // 2. رفرش کردن تب درمان برای آپدیت شدن لیست بیمه‌ها در فرم
        if (document.getElementById('treatment')) {
            console.log('Refreshing treatment tab due to insurance update...');
            if (typeof TreatmentUI !== 'undefined' && typeof TreatmentUI.refreshTab === 'function') {
                TreatmentUI.refreshTab('treatment-tab');
            }
        }

        // 3. نمایش یک پیام کلی برای کاربر
        if (typeof PatientUI !== 'undefined' && typeof PatientUI.showMessage === 'function') {
            PatientUI.showMessage('اطلاعات بیمه به‌روزرسانی شد، تب‌ها در حال بارگذاری مجدد هستند.', 'info');
        }
    } else {
        console.warn('Received insurance_update but status was not "updated". Message:', message);
    }
}

    /**
     * مدیریت به‌روزرسانی درمان
     */
    handleTreatmentUpdate(message) {
        console.log('Handling treatment update:', message);

        // 1. رفرش کردن تب درمان
        if (document.getElementById('treatment')) {
            console.log('Refreshing treatment tab...');
            if (typeof TreatmentUI !== 'undefined' && typeof TreatmentUI.refreshTab === 'function') {
                TreatmentUI.refreshTab('treatment-tab');
            }
        }
        
        // 2. رفرش کردن تب پرداخت (چون درمان جدید روی وضعیت مالی تاثیر دارد)
        if (document.getElementById('payment')) {
             console.log('Refreshing payment tab due to treatment update...');
             if (typeof PaymentManager !== 'undefined' && typeof PaymentManager.refreshFinancialData === 'function') {
                PaymentManager.refreshFinancialData();
             }
        }
        
        // 3. نمایش پیام
        if (typeof PatientUI !== 'undefined' && typeof PatientUI.showMessage === 'function') {
            PatientUI.showMessage('اطلاعات درمان به‌روزرسانی شد.', 'info');
        }
    }
}

// راه‌اندازی WebSocket در زمان بارگذاری صفحه
document.addEventListener('DOMContentLoaded', function() {
    // شناسه بیمار را از یک المان در صفحه می‌خوانیم
    const patientId = document.querySelector('[data-patient-id]')?.dataset.patientId || document.getElementById('patient-id')?.value;
    if (patientId) {
        console.log('Initializing WebSocket for patient:', patientId);
        // ساخت یک نمونه از کلاس و نگهداری آن در window برای دسترسی عمومی
        window.patientSocket = new PatientWebSocket(patientId);
    } else {
        console.error('Patient ID not found in DOM. WebSocket not initialized.');
    }
});
