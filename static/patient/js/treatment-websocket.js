/**
 * کلاس مدیریت WebSocket برای درمان
 */
class TreatmentWebSocket {
    constructor(patientId) {
        this.patientId = patientId;
        this.socket = null;
        this.connect();
    }
    
    connect() {
        // اتصال به WebSocket
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname + ':8001';
    const wsUrl = `${wsProtocol}//${host}/ws/patient/${this.patientId}/`;
    //const wsUrl = `${wsProtocol}//${window.location.host}/ws/patient/${this.patientId}/`;
    
    console.log('Connecting to WebSocket:', wsUrl); // اضافه کردن لاگ برای عیب‌یابی
    
    this.socket = new WebSocket(wsUrl);
    
    // تنظیم event handlers
    this.socket.onopen = this.onOpen.bind(this);
    this.socket.onmessage = this.onMessage.bind(this);
    this.socket.onclose = this.onClose.bind(this);
    this.socket.onerror = this.onError.bind(this);
    }
    
    onOpen(event) {
        console.log('WebSocket connection established for treatment');
    }
    
onMessage(event) {
    const data = JSON.parse(event.data);
    console.log('WebSocket message received:', data);
    
    if (data.type === 'treatment_update') {
        this.handleTreatmentUpdate(data.message);
    } else if (data.type === 'insurance_update') {
        this.handleInsuranceUpdate(data.message);
    }
}

handleInsuranceUpdate(message) {
    console.log('Insurance update:', message);
    
    if (message.action === 'add' || message.action === 'update' || message.action === 'delete') {
        // به‌روزرسانی تب بیمه
        if (document.getElementById('insurance-tab-content')) {
            TreatmentUI.refreshTab('insurance-tab');
        }
    }
}
    onClose(event) {
        console.log('WebSocket connection closed');
        // تلاش مجدد برای اتصال بعد از چند ثانیه
        setTimeout(() => this.connect(), 5000);
    }
    
    onError(event) {
        console.error('WebSocket error:', event);
    }
    
    // مدیریت به‌روزرسانی درمان
    // در تابع handleTreatmentUpdate اضافه کنید:
handleTreatmentUpdate(message) {
    console.log('Treatment update:', message);
    
    if (message.action === 'add' || message.action === 'update' || message.action === 'delete') {
        // به‌روزرسانی تب درمان
        if (document.getElementById('treatment-tab-content')) {
            TreatmentUI.refreshTab('treatment-tab');
        }
        
        // به‌روزرسانی تب بیمه
        if (document.getElementById('insurance-tab-content')) {
            TreatmentUI.refreshTab('insurance-tab');
        }
    }
}


    
    // افزودن درمان جدید به جدول
    addTreatmentToTable(treatment) {
        const treatmentTable = document.getElementById('treatment-plan-list');
        if (!treatmentTable) return;
        
        // بررسی اینکه آیا درمان قبلاً در جدول وجود دارد
        const existingRow = document.querySelector(`tr[data-id="${treatment.id}"]`);
        if (existingRow) return;
        
        // اگر این تب فعال نیست، فقط یک اعلان نمایش دهید
        if (!document.getElementById('treatment-tab-content').classList.contains('active')) {
            TreatmentUI.showMessage('درمان جدیدی اضافه شد. برای مشاهده، تب درمان را بارگذاری کنید.', 'info');
            return;
        }
        
        // در غیر این صورت، جدول را به‌روزرسانی کنید
        TreatmentUI.refreshTab('treatment-tab');
    }
    
    // به‌روزرسانی درمان موجود در جدول
    updateTreatmentInTable(treatment) {
        const existingRow = document.querySelector(`tr[data-id="${treatment.id}"]`);
        if (!existingRow) return;
        
        // اگر این تب فعال نیست، فقط یک اعلان نمایش دهید
        if (!document.getElementById('treatment-tab-content').classList.contains('active')) {
            TreatmentUI.showMessage('یک درمان به‌روزرسانی شد. برای مشاهده، تب درمان را بارگذاری کنید.', 'info');
            return;
        }
        
        // در غیر این صورت، جدول را به‌روزرسانی کنید
        TreatmentUI.refreshTab('treatment-tab');
    }
    
    // حذف درمان از جدول
    removeTreatmentFromTable(treatmentId) {
        const existingRow = document.querySelector(`tr[data-id="${treatmentId}"]`);
        if (!existingRow) return;
        
        // اگر این تب فعال نیست، فقط یک اعلان نمایش دهید
        if (!document.getElementById('treatment-tab-content').classList.contains('active')) {
            TreatmentUI.showMessage('یک درمان حذف شد. برای مشاهده، تب درمان را بارگذاری کنید.', 'info');
            return;
        }
        
        // در غیر این صورت، جدول را به‌روزرسانی کنید
        TreatmentUI.refreshTab('treatment-tab');
    }
}

// راه‌اندازی WebSocket در زمان بارگذاری صفحه
document.addEventListener('DOMContentLoaded', function() {
    const patientId = document.querySelector('[data-patient-id]')?.dataset.patientId;
    if (patientId) {
        console.log('Initializing WebSocket for treatment, patient ID:', patientId);
        window.treatmentSocket = new TreatmentWebSocket(patientId);
    }
});
