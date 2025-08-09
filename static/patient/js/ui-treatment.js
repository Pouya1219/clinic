/**
 * کلاس مدیریت رابط کاربری درمان
 */
class TreatmentUI {
      /**
     * [اصلاح شده] راه‌اندازی اولیه رابط کاربری
     */
    static async initialize() {
    console.log('Initializing TreatmentUI...');
    
    // تنظیم رویدادها
    this.setupEventListeners();
    this.handleChartTypeChange();
    this.handleTreatmentTypeChange();
    this.handleTreatmentDetailChange();
    this.handleInsuranceProviderChange();
    this.handleFinancialInputsChange();
    this.setupModalListeners();
    this.handleManualPriceToggle();
     // حذف و تعریف مجدد رویدادهای کلیک
    this.reinitializeClickEvents();
    
    // فعال‌سازی اولین چارت به صورت پیش‌فرض
    const firstChartButton = document.querySelector('.chart-type-btn');
    if (firstChartButton) {
        console.log('[LOG 4] Activating the first chart by default.');
        firstChartButton.click();
    } else {
        console.error('[ERROR] Could not find the first chart button (.chart-type-btn).');
     const firstChartButton = document.querySelector('.chart-type-btn');
        
        // اگر دکمه پیدا نشد، به صورت دستی چارت را فعال کن
        const firstChart = document.querySelector('.dental-chart');
        if (firstChart) {
            console.log('[LOG] Manually activating the first chart.');
            document.querySelectorAll('.dental-chart').forEach(chart => {
                chart.style.display = 'none';
            });
            firstChart.style.display = 'block';
            firstChart.classList.add('active');
            
            // بروزرسانی فیلدها
            setTimeout(() => this.updateSelectedAreasDisplay(), 100);
        }
    }

    console.log('[LOG 5] TreatmentUI.initialize() finished.');
}

/**
 * حذف و تعریف مجدد رویدادهای کلیک
 */
static reinitializeClickEvents() {
    console.log('[LOG] Reinitializing click events...');
    
    // حذف رویدادهای قبلی با استفاده از cloneNode
    document.querySelectorAll('.dental-tooth, .facial-area, .body-area').forEach(item => {
        const clone = item.cloneNode(true);
        item.parentNode.replaceChild(clone, item);
    });
    
    // تعریف مجدد رویدادهای کلیک برای دندان‌ها
    document.querySelectorAll('.dental-tooth').forEach(tooth => {
        tooth.addEventListener('click', function(e) {
            e.stopPropagation(); // جلوگیری از انتشار رویداد
            console.log(`[LOG] Tooth clicked: ${this.dataset.number}`);
            this.classList.toggle('selected');
            console.log(`[LOG] Selected class toggled: ${this.classList.contains('selected')}`);
            TreatmentUI.updateSelectedAreasDisplay();
        });
    });
    
    // تعریف مجدد رویدادهای کلیک برای نواحی صورت
    document.querySelectorAll('.facial-area').forEach(area => {
        area.addEventListener('click', function(e) {
            e.stopPropagation(); // جلوگیری از انتشار رویداد
            console.log(`[LOG] Facial area clicked: ${this.dataset.name}`);
            this.classList.toggle('selected');
            TreatmentUI.updateSelectedAreasDisplay();
        });
    });
    
    // تعریف مجدد رویدادهای کلیک برای نواحی بدن
    document.querySelectorAll('.body-area').forEach(area => {
        area.addEventListener('click', function(e) {
            e.stopPropagation(); // جلوگیری از انتشار رویداد
            console.log(`[LOG] Body area clicked: ${this.dataset.name}`);
            this.classList.toggle('selected');
            TreatmentUI.updateSelectedAreasDisplay();
        });
    });
    
    console.log('[LOG] Click events reinitialized');
}

static setupEventListeners() {
    console.log('[LOG] Setting up all event listeners...');
    
    // 1. رویدادهای کلیک روی دندان‌ها
    document.querySelectorAll('.dental-tooth').forEach(tooth => {
        tooth.addEventListener('click', function(e) {
            e.stopPropagation(); // جلوگیری از انتشار رویداد
            console.log(`[LOG] Tooth clicked: ${this.dataset.number}`);
            this.classList.toggle('selected');
            console.log(`[LOG] Selected class toggled: ${this.classList.contains('selected')}`);
            TreatmentUI.updateSelectedAreasDisplay();
        });
    });
    
    // 2. رویدادهای کلیک روی نواحی صورت و بدن
    document.querySelectorAll('.facial-area, .body-area').forEach(area => {
        area.addEventListener('click', function(e) {
            e.stopPropagation(); // جلوگیری از انتشار رویداد
            console.log(`[LOG] Area clicked: ${this.dataset.name}`);
            this.classList.toggle('selected');
            TreatmentUI.updateSelectedAreasDisplay();
        });
    });
    
    // 3. رویدادهای دکمه‌های انتخاب سریع
    document.querySelectorAll('.dental-select-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const selection = this.dataset.select;
            console.log(`[LOG] Quick select button clicked: ${selection}`);
            
            const activeChart = document.querySelector('.dental-chart[style*="display: block"]');
            if (!activeChart) {
                console.warn('[WARNING] No active chart found for quick selection.');
                return;
            }
            
            if (activeChart.dataset.type !== 'adult_teeth' && activeChart.dataset.type !== 'child_teeth') {
                console.warn('[WARNING] Quick selection only works on teeth charts.');
                return;
            }
            
            const teethToProcess = activeChart.querySelectorAll('.dental-tooth');
            const upperTeeth = activeChart.querySelectorAll('.upper-jaw .dental-tooth');
            const lowerTeeth = activeChart.querySelectorAll('.lower-jaw .dental-tooth');
            
            console.log(`[LOG] Found ${teethToProcess.length} total teeth, ${upperTeeth.length} upper teeth, ${lowerTeeth.length} lower teeth`);
            
            if (selection === 'none') {
                teethToProcess.forEach(tooth => tooth.classList.remove('selected'));
            } else {
                let targetTeeth = [];
                if (selection === 'all') targetTeeth = teethToProcess;
                if (selection === 'upper') targetTeeth = upperTeeth;
                if (selection === 'lower') targetTeeth = lowerTeeth;
                
                targetTeeth.forEach(tooth => tooth.classList.add('selected'));
            }
            
            TreatmentUI.updateSelectedAreasDisplay();
        });
    });
    
    // 4. مدیریت نمایش دکمه‌های انتخاب سریع
    const quickSelectContainer = document.querySelector('.dental-quick-select');
    if (quickSelectContainer) {
        // پنهان کردن اولیه
        quickSelectContainer.style.display = 'none';
        
        // اضافه کردن رویداد به دکمه‌های تغییر چارت
        document.querySelectorAll('.chart-type-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const chartType = this.dataset.chart;
                if (chartType === 'adult_teeth' || chartType === 'child_teeth') {
                    quickSelectContainer.style.display = 'flex'; // یا 'block'
                } else {
                    quickSelectContainer.style.display = 'none';
                }
            });
        });
    }
}
    /**
     * [اصلاح شده] مدیریت انتخاب نواحی بدن و صورت
     */
    static initializeAreaSelection() {
        console.log('[LOG 2-B] initializeAreaSelection() called.');
        const areas = document.querySelectorAll('.facial-area, .body-area');
        console.log(`[LOG] Found ${areas.length} facial/body area elements.`);

        areas.forEach(area => {
            area.addEventListener('click', function() {
                console.log(`[LOG] Area clicked: ${this.dataset.name}`);
                this.classList.toggle('selected');
                TreatmentUI.updateSelectedAreasDisplay();
            });
        });
    }
    /**
     * نمایش پیام به کاربر
     */
    static showMessage(message, type = 'info', duration = 3000) {
        let messageContainer = document.getElementById('treatment_message-container');
        if (!messageContainer) {
            messageContainer = document.createElement('div');
            messageContainer.id = 'treatment_message-container';
            document.body.appendChild(messageContainer);
            Object.assign(messageContainer.style, { position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: '9999', display: 'flex', flexDirection: 'column', alignItems: 'center' });
        }
        const messageElement = document.createElement('div');
        messageElement.className = `treatment_message treatment_message-${type}`;
        messageElement.textContent = message;
        Object.assign(messageElement.style, { padding: '10px 20px', margin: '5px 0', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', minWidth: '250px', textAlign: 'center', opacity: '0', transition: 'opacity 0.3s ease-in-out' });
        const colors = {
            success: { bg: '#d4edda', text: '#155724' }, error: { bg: '#f8d7da', text: '#721c24' },
            warning: { bg: '#fff3cd', text: '#856404' }, info: { bg: '#d1ecf1', text: '#0c5460' }
        };
        const color = colors[type] || colors.info;
        Object.assign(messageElement.style, { backgroundColor: color.bg, color: color.text });
        messageContainer.appendChild(messageElement);
        setTimeout(() => { messageElement.style.opacity = '1'; }, 10);
        setTimeout(() => {
            messageElement.style.opacity = '0';
            setTimeout(() => { messageContainer.removeChild(messageElement); }, 300);
        }, duration);
    }

    /**
     * دریافت نام توصیفی دندان
     */
    static getToothDescriptiveName(toothNumber) {
        const numStr = String(toothNumber);
        if (numStr.length !== 2) return `دندان ${toothNumber}`;
        const quadrant = parseInt(numStr[0]);
        const position = numStr[1];
        let side = '', jaw = '';
        switch (quadrant) {
            case 1: side = 'راست'; jaw = 'بالا'; break;
            case 2: side = 'چپ'; jaw = 'بالا'; break;
            case 3: side = 'چپ'; jaw = 'پایین'; break;
            case 4: side = 'راست'; jaw = 'پایین'; break;
            case 5: side = 'راست'; jaw = 'بالا (شیری)'; break;
            case 6: side = 'چپ'; jaw = 'بالا (شیری)'; break;
            case 7: side = 'چپ'; jaw = 'پایین (شیری)'; break;
            case 8: side = 'راست'; jaw = 'پایین (شیری)'; break;
            default: return `دندان ${toothNumber}`;
        }
        return `${position} ${side} ${jaw}`;
    }

    /**
     * [یکپارچه] بروزرسانی فیلدهای نواحی انتخاب شده برای همه چارت‌ها
     */
    

    /**
     * [یکپارچه] راه‌اندازی تمام رویدادهای مربوط به انتخاب
     */
    static initializeSelectionEvents() {
    console.log('[LOG] initializeSelectionEvents() called.');
    
    // حذف تمام رویدادهای قبلی
    document.querySelectorAll('.dental-tooth, .facial-area, .body-area').forEach(item => {
        const clone = item.cloneNode(true);
        item.parentNode.replaceChild(clone, item);
    });
    
    // تعریف مجدد رویدادها
    document.querySelectorAll('.dental-tooth').forEach(tooth => {
        tooth.addEventListener('click', function() {
            console.log(`[LOG] Tooth clicked: ${this.dataset.number}`);
            this.classList.toggle('selected');
            console.log(`[LOG] Selected class toggled: ${this.classList.contains('selected')}`);
            TreatmentUI.updateSelectedAreasDisplay();
        });
        
        tooth.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            TreatmentUI.openToothModal(this);
        });
    });
    
    document.querySelectorAll('.facial-area, .body-area').forEach(area => {
        area.addEventListener('click', function() {
            console.log(`[LOG] Area clicked: ${this.dataset.name}`);
            this.classList.toggle('selected');
            setTimeout(() => {
                TreatmentUI.updateSelectedAreasDisplay();
            }, 0);
        });
    });

    // 2. رویداد کلیک برای دکمه‌های انتخاب سریع
    document.querySelectorAll('.dental-select-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const selection = this.dataset.select;
            const activeChart = document.querySelector('.dental-chart[style*="display: block"]');
            if (!activeChart || (activeChart.dataset.type !== 'adult_teeth' && activeChart.dataset.type !== 'child_teeth')) return;

            const teethToProcess = activeChart.querySelectorAll('.dental-tooth');
            const upperTeeth = activeChart.querySelectorAll('.upper-jaw .dental-tooth');
            const lowerTeeth = activeChart.querySelectorAll('.lower-jaw .dental-tooth');

            if (selection === 'none') {
                teethToProcess.forEach(tooth => tooth.classList.remove('selected'));
            } else {
                let targetTeeth = [];
                if (selection === 'all') targetTeeth = teethToProcess;
                if (selection === 'upper') targetTeeth = upperTeeth;
                if (selection === 'lower') targetTeeth = lowerTeeth;
                targetTeeth.forEach(tooth => tooth.classList.add('selected'));
            }
            TreatmentUI.updateSelectedAreasDisplay();
        });
    });
}
// اضافه کردن کد عیب‌یابی برای بررسی ساختار HTML
static debugHTMLStructure() {
    console.log('--- Debugging HTML Structure ---');
    
    const charts = document.querySelectorAll('.dental-chart');
    console.log(`Found ${charts.length} charts`);
    
    charts.forEach(chart => {
        console.log(`Chart type: ${chart.dataset.type}`);
        const teeth = chart.querySelectorAll('.dental-tooth');
        console.log(`Found ${teeth.length} teeth in chart ${chart.dataset.type}`);
    });
    
    const selectedAreasInput = document.getElementById('selected-areas');
    console.log(`Selected areas input exists: ${!!selectedAreasInput}`);
    
    const areasCountInput = document.getElementById('areas-count');
    console.log(`Areas count input exists: ${!!areasCountInput}`);
}

    /**
     * [یکپارچه] مدیریت انتخاب نوع چارت
     */
   static handleChartTypeChange() {
    const chartTypeButtons = document.querySelectorAll('.chart-type-btn');
    const charts = document.querySelectorAll('.dental-chart');
    
    chartTypeButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            event.preventDefault();
            const chartType = button.dataset.chart;
            
            // فعال کردن دکمه انتخاب شده
            chartTypeButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // نمایش چارت مربوطه و مخفی کردن بقیه
            charts.forEach(chart => {
                if (chart.dataset.type === chartType) {
                    chart.style.display = 'block';
                    chart.classList.add('active'); // اضافه کردن کلاس active
                } else {
                    chart.style.display = 'none';
                    chart.classList.remove('active'); // حذف کلاس active
                }
            });

            // نمایش یا عدم نمایش دکمه‌های انتخاب سریع
            const quickSelectContainer = document.querySelector('.dental-quick-select');
            if (quickSelectContainer) {
                if (chartType === 'adult_teeth' || chartType === 'child_teeth') {
                    quickSelectContainer.style.display = 'flex'; // یا 'block'
                } else {
                    quickSelectContainer.style.display = 'none';
                }
            }

            // بروزرسانی فیلدهای نمایش
            TreatmentUI.updateSelectedAreasDisplay();
        });
    });
}


    /**
     * مدیریت انتخاب نوع درمان برای فرم
     */
    static handleTreatmentTypeChange() {
    const treatmentTypeButtons = document.querySelectorAll('.treatment-type-btn[data-type-id]');
    const treatmentTypeInput = document.getElementById('treatment-type');
    const treatmentDetailSelect = document.getElementById('treatment-detail');

    treatmentTypeButtons.forEach(button => {
        button.addEventListener('click', async function() {
            treatmentTypeButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            const selectedTypeId = this.dataset.typeId;
            if (treatmentTypeInput) {
                treatmentTypeInput.value = selectedTypeId;
            }
            if (!selectedTypeId) {
                if (treatmentDetailSelect) {
                    treatmentDetailSelect.innerHTML = '<option value="">ابتدا نوع درمان را انتخاب کنید</option>';
                }
                return;
            }
            try {
                const details = await TreatmentAPI.getTreatmentDetails(selectedTypeId);
                if (treatmentDetailSelect) {
                    treatmentDetailSelect.innerHTML = '<option value="">انتخاب شرح درمان</option>';
                    details.forEach(detail => {
                        const option = document.createElement('option');
                        option.value = detail.id;
                        option.textContent = detail.description;
                        option.dataset.general = detail.public_tariff;
                        option.dataset.special = detail.special_tariff;
                        option.dataset.code = detail.international_code;
                        option.dataset.treatmentTypeId = selectedTypeId;  // اضافه کردن treatment_type_id به dataset
                        treatmentDetailSelect.appendChild(option);
                    });
                    treatmentDetailSelect.dispatchEvent(new Event('change'));
                }
            } catch (error) {
                console.error('Error fetching treatment details:', error);
                TreatmentUI.showMessage('خطا در دریافت شرح درمان', 'error');
            }
        });
    });
}

  

    /**
 * نمایش مودال پرداخت
 * @param {string} treatmentId - شناسه درمان
 * @param {string} amount - مبلغ قابل پرداخت
 */
static showPaymentModal(treatmentId, amount) {
    const modal = document.querySelector('.payment-modal');
    if (!modal) return;
    
    // تنظیم مقادیر در مودال
    const treatmentIdInput = modal.querySelector('#payment-treatment-id');
    const totalAmountInput = modal.querySelector('input[name="total_amount"]');
    const amountInput = modal.querySelector('input[name="amount"]');
    
    if (treatmentIdInput) treatmentIdInput.value = treatmentId;
    
    // تبدیل مبلغ به عدد و فرمت‌دهی
    const numericAmount = parseFloat(amount.replace(/[^\d.-]/g, '')) || 0;
    if (totalAmountInput) totalAmountInput.value = numericAmount.toLocaleString() + ' ریال';
    if (amountInput) amountInput.value = numericAmount;
    
    // نمایش مودال
    modal.style.display = 'block';
}
 /**
     * [اصلاح شده] مدیریت انتخاب دندان‌ها
     */
    static initializeToothSelection() {
        console.log('[LOG 2-A] initializeToothSelection() called.');
        const teeth = document.querySelectorAll('.dental-tooth');
        console.log(`[LOG] Found ${teeth.length} dental-tooth elements to add listeners to.`);
        
        teeth.forEach(tooth => {
            tooth.addEventListener('click', function() {
                console.log(`[LOG] Tooth clicked: ${this.dataset.number}`);
                this.classList.toggle('selected');
                TreatmentUI.updateSelectedAreasDisplay();
            });
            
            tooth.addEventListener('contextmenu', function(e) {
                e.preventDefault();
                // TreatmentUI.openToothModal(this);
            });
        });
    }
/**
 * بستن مودال پرداخت
 */
static closePaymentModal() {
    const modal = document.querySelector('.payment-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * نمایش مودال پرداخت اقساطی
 * @param {string} treatmentId - شناسه درمان
 * @param {string} amount - مبلغ قابل پرداخت
 */
static showInstallmentModal(treatmentId, amount) {
    const modal = document.querySelector('.installment-modal');
    if (!modal) return;
    
    // تنظیم مقادیر در مودال
    const treatmentIdInput = modal.querySelector('#installment-treatment-id');
    const totalAmountInput = modal.querySelector('#installment-total-amount');
    const downPaymentInput = modal.querySelector('#down-payment');
    const installmentCountInput = modal.querySelector('#installment-count');
    
    if (treatmentIdInput) treatmentIdInput.value = treatmentId;
    
    // تبدیل مبلغ به عدد و فرمت‌دهی
    const numericAmount = parseFloat(amount.replace(/[^\d.-]/g, '')) || 0;
    if (totalAmountInput) totalAmountInput.value = numericAmount.toLocaleString() + ' ریال';
    
    // تنظیم مقادیر پیش‌فرض
    if (downPaymentInput) downPaymentInput.value = Math.round(numericAmount * 0.3); // 30% پیش پرداخت
    if (installmentCountInput) installmentCountInput.value = 3; // 3 قسط پیش‌فرض
    
    // محاسبه مبلغ هر قسط
    this.calculateInstallmentAmount();
    
    // نمایش مودال
    modal.style.display = 'block';
}

/**
 * بستن مودال پرداخت اقساطی
 */
static closeInstallmentModal() {
    const modal = document.querySelector('.installment-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * محاسبه مبلغ هر قسط
 */
static calculateInstallmentAmount() {
    const totalAmountInput = document.getElementById('installment-total-amount');
    const downPaymentInput = document.getElementById('down-payment');
    const installmentCountInput = document.getElementById('installment-count');
    const installmentAmountInput = document.getElementById('installment-amount');
    const previewContainer = document.getElementById('installment-preview-container');
    
    if (!totalAmountInput || !downPaymentInput || !installmentCountInput || !installmentAmountInput) return;
    
    // تبدیل مقادیر به عدد
    const totalAmount = parseFloat(totalAmountInput.value.replace(/[^\d.-]/g, '')) || 0;
    const downPayment = parseFloat(downPaymentInput.value) || 0;
    const installmentCount = parseInt(installmentCountInput.value) || 1;
    
    // محاسبه مبلغ هر قسط
    if (installmentCount <= 0 || downPayment >= totalAmount) {
        installmentAmountInput.value = '0 ریال';
        if (previewContainer) previewContainer.innerHTML = '';
        return;
    }
    
    const remaining = totalAmount - downPayment;
    const perInstallment = Math.ceil(remaining / installmentCount);
    
    // نمایش مبلغ هر قسط
    installmentAmountInput.value = perInstallment.toLocaleString() + ' ریال';
    
    // نمایش پیش‌نمایش اقساط
    if (previewContainer) {
        this.generateInstallmentPreview(previewContainer, installmentCount, perInstallment);
    }
}

/**
 * تولید پیش‌نمایش اقساط
 * @param {HTMLElement} container - المان نمایش پیش‌نمایش
 * @param {number} count - تعداد اقساط
 * @param {number} amount - مبلغ هر قسط
 */
static generateInstallmentPreview(container, count, amount) {
    container.innerHTML = '';
    
    const startDateInput = document.getElementById('installment-start-date');
    const intervalDaysInput = document.getElementById('interval-days');
    
    if (!startDateInput || !intervalDaysInput) return;
    
    const startDate = new Date(startDateInput.value);
    const intervalDays = parseInt(intervalDaysInput.value) || 30;
    
    for (let i = 1; i <= count; i++) {
        const dueDate = new Date(startDate);
        dueDate.setDate(dueDate.getDate() + (i - 1) * intervalDays);
        
        const installmentDiv = document.createElement('div');
        installmentDiv.className = 'preview-installment';
        
        const formattedDate = dueDate.toLocaleDateString('fa-IR');
        const formattedAmount = amount.toLocaleString() + ' ریال';
        
        installmentDiv.innerHTML = `
            <span>قسط ${i}: </span>
            <span>${formattedDate}</span>
            <span>${formattedAmount}</span>
        `;
        
        container.appendChild(installmentDiv);
    }
}

/**
 * ارسال فرم پرداخت
 */
static async submitPayment() {
    try {
        const form = document.getElementById('payment-form');
        if (!form) return;
        
        // جمع‌آوری داده‌های فرم
        const formData = new FormData(form);
        const paymentData = {
            treatment_id: formData.get('treatment_id'),
            amount: parseFloat(formData.get('amount')),
            payment_date: formData.get('payment_date'),
            payment_method: formData.get('payment_method'),
            description: formData.get('description') || ''
        };
        
        // اضافه کردن اطلاعات چک در صورت نیاز
        if (paymentData.payment_method === 'check') {
            paymentData.check_number = formData.get('check_number') || '';
            paymentData.check_date = formData.get('check_date') || '';
            paymentData.check_bank = formData.get('check_bank') || '';
        }
        
        // ارسال به سرور
        const response = await fetch(TREATMENT_CONFIG.API_URLS.CREATE_PAYMENT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': this.getCsrfToken()
            },
            body: JSON.stringify(paymentData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'خطا در ثبت پرداخت');
        }
        
        const result = await response.json();
        
        // نمایش پیام موفقیت
        this.showMessage('پرداخت با موفقیت ثبت شد', 'success');
        
        // بستن مودال و بارگذاری مجدد صفحه
        this.closePaymentModal();
        setTimeout(() => {
            window.location.reload();
        }, 1500);
        
    } catch (error) {
        console.error('Error submitting payment:', error);
        this.showMessage('خطا در ثبت پرداخت: ' + error.message, 'error');
    }
}

/**
 * ارسال فرم پرداخت اقساطی
 */
static async submitInstallmentPlan() {
    try {
        const form = document.getElementById('installment-form');
        if (!form) return;
        
        // جمع‌آوری داده‌های فرم
        const formData = new FormData(form);
        const totalAmount = parseFloat(formData.get('total_amount').replace(/[^\d.-]/g, '')) || 0;
        
        const planData = {
            treatment_id: formData.get('treatment_id'),
            total_amount: totalAmount,
            down_payment: parseFloat(formData.get('down_payment')) || 0,
            installment_count: parseInt(formData.get('installment_count')) || 1,
            start_date: formData.get('start_date'),
            interval_days: parseInt(formData.get('interval_days')) || 30
        };
        
        // ارسال به سرور
        const response = await fetch('/Patient/treatment/installment/create/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': this.getCsrfToken()
            },
            body: JSON.stringify(planData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'خطا در ثبت برنامه اقساط');
        }
        
        const result = await response.json();
        
        // نمایش پیام موفقیت
        this.showMessage('برنامه اقساط با موفقیت ثبت شد', 'success');
        
        // بستن مودال و بارگذاری مجدد صفحه
        this.closeInstallmentModal();
        setTimeout(() => {
            window.location.reload();
        }, 1500);
        
    } catch (error) {
        console.error('Error submitting installment plan:', error);
        this.showMessage('خطا در ثبت برنامه اقساط: ' + error.message, 'error');
    }
}

/**
 * نمایش تاریخچه پرداخت
 * @param {string} treatmentId - شناسه درمان
 */
static async showPaymentHistory(treatmentId) {
    try {
        // دریافت اطلاعات پرداخت‌ها از سرور
        const response = await fetch(`/Patient/treatment/payment-history/${treatmentId}/`);
        if (!response.ok) throw new Error('خطا در دریافت تاریخچه پرداخت');
        
        const data = await response.json();
        
        // نمایش اطلاعات درمان
        document.getElementById('history-treatment-type').textContent = data.treatment.treatment_detail.description;
        document.getElementById('history-treatment-date').textContent = new Date(data.treatment.treatment_date).toLocaleDateString('fa-IR');
        document.getElementById('history-total-amount').textContent = data.treatment.payable_amount.toLocaleString() + ' ریال';
        document.getElementById('history-paid-amount').textContent = data.total_paid.toLocaleString() + ' ریال';
        document.getElementById('history-remaining-amount').textContent = data.remaining.toLocaleString() + ' ریال';
        
        // نمایش جزئیات پرداخت‌ها
        const tableBody = document.getElementById('payment-details-body');
        tableBody.innerHTML = '';
        
        if (data.payments.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="6" class="empty-table">هیچ پرداختی ثبت نشده است</td>`;
            tableBody.appendChild(row);
        } else {
            data.payments.forEach((payment, index) => {
                const row = document.createElement('tr');
                
                // نمایش وضعیت پرداخت
                let statusClass = '';
                switch(payment.payment_status) {
                    case 'paid':
                        statusClass = 'success';
                        break;
                    case 'refunded':
                        statusClass = 'danger';
                        break;
                    case 'pending':
                        statusClass = 'warning';
                        break;
                }
                
                // دکمه‌های عملیات
                let actionButtons = `
                    <button class="action-btn print" title="چاپ رسید" onclick="TreatmentUI.printReceipt('${payment.id}')">
                        <i class="fas fa-print"></i>
                    </button>
                `;
                
                // اگر پرداخت عودت نشده باشد، دکمه‌های عودت و حذف را نمایش بده
                if (payment.payment_status !== 'refunded') {
                    actionButtons += `
                        <button class="action-btn refund" title="عودت پرداخت" onclick="TreatmentUI.refundPayment('${payment.id}')">
                            <i class="fas fa-undo"></i>
                        </button>
                        <button class="action-btn delete" title="حذف پرداخت" onclick="TreatmentUI.deletePayment('${payment.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    `;
                }
                
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${new Date(payment.payment_date).toLocaleDateString('fa-IR')}</td>
                    <td>${payment.amount.toLocaleString()} ریال</td>
                    <td>${payment.payment_method_display}</td>
                    <td><span class="status-badge ${statusClass}">${payment.payment_status_display}</span></td>
                    <td>${payment.description || '-'}</td>
                    <td>
                        <div class="action-buttons">
                            ${actionButtons}
                        </div>
                    </td>
                `;
                
                tableBody.appendChild(row);
            });
        }
        
        // نمایش مودال
        document.getElementById('payment-history-modal').style.display = 'block';
        
    } catch (error) {
        console.error('Error showing payment history:', error);
        this.showMessage('خطا در دریافت تاریخچه پرداخت: ' + error.message, 'error');
    }
}
/**
 * نمایش مودال عودت پرداخت
 * @param {string} paymentId - شناسه پرداخت
 */
static showRefundModal(paymentId) {
    const modal = document.getElementById('refund-modal');
    const paymentIdInput = document.getElementById('refund-payment-id');
    
    if (modal && paymentIdInput) {
        paymentIdInput.value = paymentId;
        modal.style.display = 'block';
    }
}

/**
 * بستن مودال عودت پرداخت
 */
static closeRefundModal() {
    const modal = document.getElementById('refund-modal');
    if (modal) {
        modal.style.display = 'none';
        document.getElementById('refund-reason').value = '';
    }
}

/**
 * ارسال فرم عودت پرداخت
 */
static async submitRefund() {
    try {
        const form = document.getElementById('refund-form');
        if (!form) return;
        
        // جمع‌آوری داده‌های فرم
        const formData = new FormData(form);
        const paymentId = formData.get('payment_id');
        const reason = formData.get('reason');
        
        // ارسال به سرور
        const response = await fetch(`/Patient/treatment/payment/refund/${paymentId}/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': this.getCsrfToken()
            },
            body: JSON.stringify({ reason })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'خطا در عودت پرداخت');
        }
        
        // نمایش پیام موفقیت
        this.showMessage('پرداخت با موفقیت عودت داده شد', 'success');
        
        // بستن مودال و بارگذاری مجدد صفحه
        this.closeRefundModal();
        setTimeout(() => {
            window.location.reload();
        }, 1500);
        
    } catch (error) {
        console.error('Error refunding payment:', error);
        this.showMessage('خطا در عودت پرداخت: ' + error.message, 'error');
    }
}

/**
 * نمایش جزئیات طرح اقساطی
 * @param {string} planId - شناسه طرح اقساط
 */
static async viewInstallments(planId) {
    try {
        // دریافت اطلاعات طرح اقساط از سرور
        const response = await fetch(`/Patient/treatment/installment-plan/${planId}/`);
        if (!response.ok) throw new Error('خطا در دریافت اطلاعات اقساط');
        
        const data = await response.json();
        
        // نمایش اطلاعات در مودال
        document.getElementById('installment-treatment-type').textContent = data.treatment.treatment_detail.description;
        document.getElementById('installment-info-total').textContent = data.total_amount.toLocaleString() + ' ریال';
        document.getElementById('installment-info-down-payment').textContent = data.down_payment.toLocaleString() + ' ریال';
        document.getElementById('installment-info-count').textContent = data.installment_count;
        
        // نمایش جزئیات اقساط
        const tableBody = document.getElementById('installment-details-body');
        tableBody.innerHTML = '';
        
        data.installments.forEach((installment, index) => {
            const row = document.createElement('tr');
            
            const paymentStatus = installment.is_paid ? 
                `<span class="payment-status paid">پرداخت شده</span>` : 
                `<span class="payment-status unpaid">پرداخت نشده</span>`;
            
            const paymentDate = installment.payment_date ? 
                new Date(installment.payment_date).toLocaleDateString('fa-IR') : 
                '-';
            
            const actions = installment.is_paid ? 
                `<button class="action-btn print" onclick="TreatmentUI.printInstallmentReceipt('${installment.id}')">
                    <i class="fas fa-print"></i>
                </button>` : 
                `<button class="action-btn payment" onclick="TreatmentUI.payInstallment('${installment.id}')">
                    <i class="fas fa-money-bill"></i>
                </button>`;
            
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${installment.amount.toLocaleString()} ریال</td>
                <td>${new Date(installment.due_date).toLocaleDateString('fa-IR')}</td>
                <td>${paymentStatus}</td>
                <td>${paymentDate}</td>
                <td>
                    <div class="action-buttons">
                        ${actions}
                    </div>
                </td>
            `;
            
            tableBody.appendChild(row);
        });
        
        // نمایش مودال
        document.getElementById('view-installments-modal').style.display = 'block';
        
    } catch (error) {
        console.error('Error viewing installments:', error);
        this.showMessage('خطا در دریافت اطلاعات اقساط: ' + error.message, 'error');
    }
}

/**
 * پرداخت قسط
 * @param {string} installmentId - شناسه قسط
 */
static async payInstallment(installmentId) {
    try {
        if (!confirm('آیا از پرداخت این قسط اطمینان دارید؟')) return;
        
        // ارسال به سرور
        const response = await fetch(`/Patient/treatment/installment/pay/${installmentId}/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': this.getCsrfToken()
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'خطا در ثبت پرداخت قسط');
        }
        
        // نمایش پیام موفقیت
        this.showMessage('پرداخت قسط با موفقیت ثبت شد', 'success');
        
        // بستن مودال و بارگذاری مجدد صفحه
        document.getElementById('view-installments-modal').style.display = 'none';
        setTimeout(() => {
            window.location.reload();
        }, 1500);
        
    } catch (error) {
        console.error('Error paying installment:', error);
        this.showMessage('خطا در پرداخت قسط: ' + error.message, 'error');
    }
}

/**
 * حذف پرداخت
 * @param {string} paymentId - شناسه پرداخت
 */
static async deletePayment(paymentId) {
    try {
        if (!confirm('آیا از حذف این پرداخت اطمینان دارید؟')) return;
        
        // ارسال به سرور
        const response = await fetch(`/Patient/treatment/payment/delete/${paymentId}/`, {
            method: 'DELETE',
            headers: {
                'X-CSRFToken': this.getCsrfToken()
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'خطا در حذف پرداخت');
        }
        
        // نمایش پیام موفقیت
        this.showMessage('پرداخت با موفقیت حذف شد', 'success');
        
        // بستن مودال و بارگذاری مجدد صفحه
        document.getElementById('payment-history-modal').style.display = 'none';
        setTimeout(() => {
            window.location.reload();
        }, 1500);
        
    } catch (error) {
        console.error('Error deleting payment:', error);
        this.showMessage('خطا در حذف پرداخت: ' + error.message, 'error');
    }
}
/**
 * چاپ رسید پرداخت
 * @param {string} paymentId - شناسه پرداخت
 */
static printReceipt(paymentId) {
    // پیاده‌سازی چاپ رسید
    alert('این قابلیت در حال توسعه است');
}
/**
 * چاپ رسید قسط
 * @param {string} installmentId - شناسه قسط
 */
static printInstallmentReceipt(installmentId) {
    // پیاده‌سازی چاپ رسید قسط
    alert('این قابلیت در حال توسعه است');
}

/**
 * چاپ برنامه اقساط
 * @param {string} planId - شناسه طرح اقساط
 */
static printInstallmentPlan(planId) {
    // پیاده‌سازی چاپ برنامه اقساط
    alert('این قابلیت در حال توسعه است');
}

/**
 * عودت پرداخت
 * @param {string} paymentId - شناسه پرداخت
 */
static async refundPayment(paymentId) {
    try {
        if (!confirm('آیا از عودت این پرداخت اطمینان دارید؟')) return;
        
        // ارسال به سرور
        const response = await fetch(`/Patient/treatment/payment/refund/${paymentId}/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': this.getCsrfToken()
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'خطا در عودت پرداخت');
        }
        
        // نمایش پیام موفقیت
        this.showMessage('پرداخت با موفقیت عودت داده شد', 'success');
        
        // بارگذاری مجدد صفحه
        setTimeout(() => {
            window.location.reload();
        }, 1500);
        
    } catch (error) {
        console.error('Error refunding payment:', error);
        this.showMessage('خطا در عودت پرداخت: ' + error.message, 'error');
    }
}
/**
 * عودت پرداخت
 * @param {string} paymentId - شناسه پرداخت
 */
static refundPayment(paymentId) {
    // نمایش مودال عودت پرداخت
    this.showRefundModal(paymentId);
}
/**
 * دریافت توکن CSRF
 * @returns {string} توکن CSRF
 */
static getCsrfToken() {
    const name = 'csrftoken';
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
     /**
     * [اصلاح شده] انتخاب دندان‌ها بر اساس نوع انتخاب فقط در چارت فعال
     * @param {string} selection - نوع انتخاب (all, upper, lower, none)
     */
    static selectTeeth(selection) {
        // ابتدا چارت فعال را پیدا می‌کنیم (چارتی که display آن none نیست)
        const activeChart = document.querySelector('.dental-chart[style*="display: block"]');
        if (!activeChart) return; // اگر چارتی فعال نبود، کاری نکن

        const allTeeth = activeChart.querySelectorAll('.dental-tooth');
        const upperTeeth = activeChart.querySelectorAll('.upper-jaw .dental-tooth');
        const lowerTeeth = activeChart.querySelectorAll('.lower-jaw .dental-tooth');
        
        switch(selection) {
            case 'all':
                allTeeth.forEach(tooth => tooth.classList.add('selected'));
                break;
            case 'upper':
                upperTeeth.forEach(tooth => tooth.classList.add('selected'));
                break;
            case 'lower':
                lowerTeeth.forEach(tooth => tooth.classList.add('selected'));
                break;
            case 'none':
                allTeeth.forEach(tooth => tooth.classList.remove('selected'));
                break;
        }
        this.updateSelectedTeeth();
    }
    
 
    
    /**
     * باز کردن مودال تغییر وضعیت دندان
     * @param {HTMLElement} tooth - المان دندان
     */
    static openToothModal(tooth) {
        const modal = document.querySelector('.dental-icon-modal');
        if (!modal) return;
        
        // ذخیره دندان انتخاب شده
        this.selectedToothElement = tooth;
        
        // نمایش مودال
        modal.style.display = 'block';
        
        // بازیابی وضعیت قبلی آیکون
        const currentIcon = tooth.querySelector('.dental-tooth-icon')?.getAttribute('data-icon');
        if (currentIcon) {
            const iconOption = modal.querySelector(`.dental-icon-option[data-icon="${currentIcon}"]`);
            if (iconOption) {
                modal.querySelectorAll('.dental-icon-option').forEach(opt => 
                    opt.classList.remove('selected'));
                iconOption.classList.add('selected');
                this.selectedIcon = currentIcon;
            }
        }
        
        // بازیابی یادداشت قبلی
        const note = tooth.getAttribute('data-note') || '';
        modal.querySelector('.dental-tooth-note').value = note;
    }
    
    /**
     * بستن مودال تغییر وضعیت دندان
     */
    static closeToothModal() {
        const modal = document.querySelector('.dental-icon-modal');
        if (!modal) return;
        
        modal.style.display = 'none';
        this.selectedToothElement = null;
        this.selectedIcon = null;
        modal.querySelectorAll('.dental-icon-option').forEach(opt => 
            opt.classList.remove('selected'));
        modal.querySelector('.dental-tooth-note').value = '';
    }
    
    /**
     * ذخیره تغییرات وضعیت دندان
     */
    static handleToothModalSave() {
        if (this.selectedToothElement && this.selectedIcon) {
            this.updateToothIcon(this.selectedToothElement, this.selectedIcon);
            const note = document.querySelector('.dental-tooth-note').value;
            this.selectedToothElement.setAttribute('data-note', note);
            
            // ذخیره وضعیت آیکون
            const iconContainer = this.selectedToothElement.querySelector('.dental-tooth-icon');
            iconContainer.setAttribute('data-icon', this.selectedIcon);
            iconContainer.className = `dental-tooth-icon tooth-state-${this.selectedIcon}`;
        }
        this.closeToothModal();
    }
    
    /**
     * بروزرسانی آیکون دندان
     * @param {HTMLElement} tooth - المان دندان
     * @param {string} iconType - نوع آیکون
     */
    static updateToothIcon(tooth, iconType) {
        const iconElement = tooth.querySelector('i');
        const iconContainer = tooth.querySelector('.dental-tooth-icon');
        
        // حذف کلاس‌های قبلی
        iconElement.className = '';
        iconContainer.className = 'dental-tooth-icon';
        
        // اضافه کردن کلاس جدید
        const iconClass = this.getIconClass(iconType);
        iconElement.className = iconClass;
        iconContainer.classList.add(`tooth-state-${iconType}`);
    }
    
    /**
     * دریافت کلاس آیکون بر اساس نوع
     * @param {string} iconType - نوع آیکون
     * @returns {string} کلاس آیکون
     */
    static getIconClass(iconType) {
        const iconClasses = {
            'implant': 'fas fa-teeth',
            'missing': 'fas fa-times',
            'crown': 'fas fa-crown',
            'bridge': 'fas fa-grip-lines',
            'decay': 'fas fa-bug',
            'filling': 'fas fa-fill',
            'root-canal': 'fas fa-wave-square',
            'extraction': 'fas fa-minus-circle',
            'done': 'fas fa-check-circle',
            'tooth': 'fas fa-tooth'
        };
        return iconClasses[iconType] || 'fas fa-tooth';
    }

    /**
 * [اصلاح شده] مدیریت انتخاب نوع درمان با دکمه‌ها
 */
 static updateSelectedAreasDisplay() {
    console.log('--- [LOG] updateSelectedAreasDisplay() running... ---');

    let activeChart = document.querySelector('.dental-chart[style*="display: block"]');

    // اگر با استایل پیدا نشد، با کلاس active امتحان کن
    if (!activeChart) {
        activeChart = document.querySelector('.dental-chart.active');
        console.log('[LOG] No chart with display:block found, trying .active class');
    }

    const selectedAreasInput = document.getElementById('selected-areas');
    const areasCountInput = document.getElementById('areas-count');

    if (!activeChart) {
        console.warn('[WARNING] No active chart found. Clearing fields.');
        if (selectedAreasInput) selectedAreasInput.value = '';
        if (areasCountInput) areasCountInput.value = '0';
        return;
    }

    console.log(`[LOG] Active chart found: [data-type="${activeChart.dataset.type}"]`);

    let selectedItems = [];
    let areaNames = [];
    const chartType = activeChart.dataset.type;

    // بررسی نوع چارت و انتخاب المان‌های مناسب
    if (chartType === 'adult_teeth' || chartType === 'child_teeth') {
        selectedItems = activeChart.querySelectorAll('.dental-tooth.selected');
        console.log(`[LOG] Found ${selectedItems.length} selected teeth`);
        
        // لاگ کردن همه دندان‌های انتخاب شده برای عیب‌یابی
        selectedItems.forEach(tooth => {
            console.log(`[LOG] Selected tooth: ${tooth.dataset.number}`);
        });
        
        // تبدیل NodeList به آرایه و استخراج نام‌ها
        areaNames = Array.from(selectedItems).map(tooth => {
            const toothNumber = tooth.dataset.number;
            const toothName = chartType === 'adult_teeth' ? 
                this.getToothName(toothNumber, 'adult') : 
                this.getToothName(toothNumber, 'child');
            return toothName || `دندان ${toothNumber}`;
        });
    } else if (chartType === 'face') {
        selectedItems = activeChart.querySelectorAll('.facial-area.selected');
        console.log(`[LOG] Found ${selectedItems.length} selected facial areas`);
        areaNames = Array.from(selectedItems).map(area => area.dataset.name || 'ناحیه صورت');
    } else if (chartType === 'body') {
        selectedItems = activeChart.querySelectorAll('.body-area.selected');
        console.log(`[LOG] Found ${selectedItems.length} selected body areas`);
        areaNames = Array.from(selectedItems).map(area => area.dataset.name || 'ناحیه بدن');
    }

    console.log(`[LOG] Selected areas: ${areaNames.join(', ')}`);
    console.log(`[LOG] Areas count: ${selectedItems.length}`);

    // بروزرسانی فیلدها
    if (selectedAreasInput) {
        selectedAreasInput.value = areaNames.join(', ');
        console.log(`[LOG] Updated selected areas input: ${selectedAreasInput.value}`);
    }
    
    if (areasCountInput) {
        areasCountInput.value = selectedItems.length;
        console.log(`[LOG] Updated areas count input: ${areasCountInput.value}`);
    }
}


 static debugSystem() {
    console.log('=== DEBUGGING TREATMENT UI SYSTEM ===');
    
    // بررسی وجود المان‌های اصلی
    const charts = document.querySelectorAll('.dental-chart');
    console.log(`Found ${charts.length} dental charts`);
    
    charts.forEach(chart => {
        const type = chart.dataset.type;
        const display = window.getComputedStyle(chart).display;
        console.log(`Chart type: ${type}, Display: ${display}`);
        
        const teeth = chart.querySelectorAll('.dental-tooth');
        const selectedTeeth = chart.querySelectorAll('.dental-tooth.selected');
        console.log(`Chart ${type}: ${teeth.length} teeth, ${selectedTeeth.length} selected`);
    });
    
    // بررسی فیلدهای خروجی
    const selectedAreasInput = document.getElementById('selected-areas');
    const areasCountInput = document.getElementById('areas-count');
    
    console.log(`Selected areas input: ${selectedAreasInput ? 'Found' : 'Not found'}`);
    console.log(`Areas count input: ${areasCountInput ? 'Found' : 'Not found'}`);
    
    if (selectedAreasInput) console.log(`Current value: "${selectedAreasInput.value}"`);
    if (areasCountInput) console.log(`Current value: "${areasCountInput.value}"`);
    
    // بررسی دکمه‌های انتخاب سریع
    const quickSelectBtns = document.querySelectorAll('.dental-select-btn');
    console.log(`Found ${quickSelectBtns.length} quick select buttons`);
    
    const quickSelectContainer = document.querySelector('.dental-quick-select');
    if (quickSelectContainer) {
        console.log(`Quick select container display: ${window.getComputedStyle(quickSelectContainer).display}`);
    }
    
    console.log('=== END DEBUGGING ===');
}

    /**
     * مدیریت انتخاب شرح درمان
     */
   static handleTreatmentDetailChange() {
    const treatmentDetailSelect = document.getElementById('treatment-detail');
    if (!treatmentDetailSelect) return;
    
    treatmentDetailSelect.addEventListener('change', function() {
        const selectedOption = this.options[this.selectedIndex];
        if (selectedOption && selectedOption.value) {
            const generalFee = selectedOption.dataset.general;
            const specialFee = selectedOption.dataset.special;
            const code = selectedOption.dataset.code;
            
            // نمایش تعرفه‌ها
            const generalFeeInput = document.getElementById('general-fee');
            const specialFeeInput = document.getElementById('special-fee');
            const internationalCodeInput = document.getElementById('international-code');
            
            if (generalFeeInput) {
                generalFeeInput.value = Number(generalFee).toLocaleString() + ' ریال';
                generalFeeInput.dataset.value = generalFee; // ذخیره مقدار عددی
            }
            if (specialFeeInput) {
                specialFeeInput.value = Number(specialFee).toLocaleString() + ' ریال';
                specialFeeInput.dataset.value = specialFee; // ذخیره مقدار عددی
            }
            if (internationalCodeInput) {
                internationalCodeInput.value = code;
            }
            
            // محاسبه مبلغ قابل پرداخت
            try {
                TreatmentUI.calculatePayableAmount();
            } catch (error) {
                console.error("Error calculating payable amount:", error);
            }
        }
    });
}
    
 /**
 * مدیریت تغییر بیمه
 */
static handleInsuranceProviderChange() {
    const insuranceProviderSelect = document.getElementById('insurance-provider');
    if (!insuranceProviderSelect) return;
    
    insuranceProviderSelect.addEventListener('change', function() {
        const selectedOption = this.options[this.selectedIndex];
        if (!selectedOption || !selectedOption.value) {
            // پاک کردن فیلدها در صورت عدم انتخاب بیمه
            document.getElementById('insurance-percentage').value = '0';
            document.getElementById('insurance-ceiling').value = '';
            document.getElementById('insurance-used').value = '';
            document.getElementById('insurance-remaining').value = '';
            
            // محاسبه مجدد مبلغ قابل پرداخت
            TreatmentUI.calculatePayableAmount();
            return;
        }
        
        // دریافت اطلاعات بیمه از data attributes
        const coveragePercentage = selectedOption.dataset.percentage || '0';
        const coverageCeiling = parseInt(selectedOption.dataset.ceiling || '0');
        const usedCoverage = parseInt(selectedOption.dataset.used || '0');
        const remainingCoverage = Math.max(0, coverageCeiling - usedCoverage);
        
        // تنظیم مقادیر در فیلدها
        document.getElementById('insurance-percentage').value = coveragePercentage;
        
        // اگر فیلدهای سقف بیمه و مقدار استفاده شده وجود دارند، آنها را پر کنیم
        const insuranceCeilingInput = document.getElementById('insurance-ceiling');
        const insuranceUsedInput = document.getElementById('insurance-used');
        const insuranceRemainingInput = document.getElementById('insurance-remaining');
        
        if (insuranceCeilingInput) {
            insuranceCeilingInput.value = coverageCeiling.toLocaleString('fa-IR') + ' ریال';
            insuranceCeilingInput.dataset.value = coverageCeiling;
        }
        
        if (insuranceUsedInput) {
            insuranceUsedInput.value = usedCoverage.toLocaleString('fa-IR') + ' ریال';
            insuranceUsedInput.dataset.value = usedCoverage;
        }
        
        if (insuranceRemainingInput) {
            insuranceRemainingInput.value = remainingCoverage.toLocaleString('fa-IR') + ' ریال';
            insuranceRemainingInput.dataset.value = remainingCoverage;
            
            // اضافه کردن کلاس‌های رنگی بر اساس وضعیت
            insuranceRemainingInput.classList.remove('insurance-status-good', 'insurance-status-warning', 'insurance-status-danger');
            
            if (remainingCoverage <= 0) {
                insuranceRemainingInput.classList.add('insurance-status-danger');
            } else if (remainingCoverage < coverageCeiling * 0.2) { // کمتر از 20% باقیمانده
                insuranceRemainingInput.classList.add('insurance-status-warning');
            } else {
                insuranceRemainingInput.classList.add('insurance-status-good');
            }
        }
        
        // محاسبه مجدد مبلغ قابل پرداخت
        TreatmentUI.calculatePayableAmount();
    });
}


    
    /**
     * محاسبه مبلغ قابل پرداخت
     */
  // ui-treatment.js

    
    /**
     * مدیریت تغییر مقادیر مالی
     */
    static handleFinancialInputsChange() {
        const financialInputs = [
            'discount',
            'insurance-percentage',
            'material-cost',
            'lab-cost'
        ];
        
        financialInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                input.addEventListener('input', () => {
                    TreatmentUI.calculatePayableAmount();
                });
            }
        });
    }
    


/**
 * دریافت نام دندان بر اساس شماره
 * @param {number} toothNumber - شماره دندان
 * @param {string} toothType - نوع دندان (adult یا child)
 * @returns {string} نام دندان
 */
static getToothName(toothNumber, toothType) {
    const toothNames = {
        adult: {
            '11': 'پیشین مرکزی بالا سمت راست',
            '12': 'پیشین کناری بالا سمت راست',
            '13': 'نیش بالا سمت راست',
            '14': 'پرمولر اول بالا سمت راست',
            '15': 'پرمولر دوم بالا سمت راست',
            '16': 'آسیاب اول بالا سمت راست',
            '17': 'آسیاب دوم بالا سمت راست',
            '18': 'آسیاب سوم بالا سمت راست',
            '21': 'پیشین مرکزی بالا سمت چپ',
            '22': 'پیشین کناری بالا سمت چپ',
            '23': 'نیش بالا سمت چپ',
            '24': 'پرمولر اول بالا سمت چپ',
            '25': 'پرمولر دوم بالا سمت چپ',
            '26': 'آسیاب اول بالا سمت چپ',
            '27': 'آسیاب دوم بالا سمت چپ',
            '28': 'آسیاب سوم بالا سمت چپ',
            '31': 'پیشین مرکزی پایین سمت چپ',
            '32': 'پیشین کناری پایین سمت چپ',
            '33': 'نیش پایین سمت چپ',
            '34': 'پرمولر اول پایین سمت چپ',
            '35': 'پرمولر دوم پایین سمت چپ',
            '36': 'آسیاب اول پایین سمت چپ',
            '37': 'آسیاب دوم پایین سمت چپ',
            '38': 'آسیاب سوم پایین سمت چپ',
            '41': 'پیشین مرکزی پایین سمت راست',
            '42': 'پیشین کناری پایین سمت راست',
            '43': 'نیش پایین سمت راست',
            '44': 'پرمولر اول پایین سمت راست',
            '45': 'پرمولر دوم پایین سمت راست',
            '46': 'آسیاب اول پایین سمت راست',
            '47': 'آسیاب دوم پایین سمت راست',
            '48': 'آسیاب سوم پایین سمت راست',
        },
        child: {
            '51': 'پیشین مرکزی شیری بالا سمت راست',
            '52': 'پیشین کناری شیری بالا سمت راست',
            '53': 'نیش شیری بالا سمت راست',
            '54': 'آسیاب اول شیری بالا سمت راست',
            '55': 'آسیاب دوم شیری بالا سمت راست',
            '61': 'پیشین مرکزی شیری بالا سمت چپ',
            '62': 'پیشین کناری شیری بالا سمت چپ',
            '63': 'نیش شیری بالا سمت چپ',
            '64': 'آسیاب اول شیری بالا سمت چپ',
            '65': 'آسیاب دوم شیری بالا سمت چپ',
            '71': 'پیشین مرکزی شیری پایین سمت چپ',
            '72': 'پیشین کناری شیری پایین سمت چپ',
            '73': 'نیش شیری پایین سمت چپ',
            '74': 'آسیاب اول شیری پایین سمت چپ',
            '75': 'آسیاب دوم شیری پایین سمت چپ',
            '81': 'پیشین مرکزی شیری پایین سمت راست',
            '82': 'پیشین کناری شیری پایین سمت راست',
            '83': 'نیش شیری پایین سمت راست',
            '84': 'آسیاب اول شیری پایین سمت راست',
            '85': 'آسیاب دوم شیری پایین سمت راست',
        }
    };
    
    return toothNames[toothType][String(toothNumber)] || '';
}




   /**
     * [کامل شده] راه‌اندازی رویدادهای مودال‌ها
     */
    static setupModalListeners() {
        // مودال تغییر وضعیت دندان
        const toothModal = document.querySelector('.dental-icon-modal');
        if (toothModal) {
            toothModal.querySelector('.dental-modal-close')?.addEventListener('click', () => this.closeToothModal());
            toothModal.querySelector('.dental-modal-cancel')?.addEventListener('click', () => this.closeToothModal());
            toothModal.querySelector('.dental-modal-save')?.addEventListener('click', () => this.handleToothModalSave());
            
            toothModal.querySelectorAll('.dental-icon-option').forEach(option => {
                option.addEventListener('click', function() {
                    toothModal.querySelectorAll('.dental-icon-option').forEach(opt => opt.classList.remove('selected'));
                    this.classList.add('selected');
                    TreatmentUI.selectedIcon = this.dataset.icon;
                });
            });
        }

        // مودال پرداخت
        const paymentModal = document.querySelector('.payment-modal');
        if (paymentModal) {
            paymentModal.querySelector('.modal-close')?.addEventListener('click', () => this.closePaymentModal());
        }

        // مودال اقساط
        const installmentModal = document.querySelector('.installment-modal');
        if (installmentModal) {
            installmentModal.querySelector('.modal-close')?.addEventListener('click', () => this.closeInstallmentModal());
        }

        // مودال عودت پرداخت
        const refundModal = document.getElementById('refund-modal');
        if (refundModal) {
            refundModal.querySelector('#close-refund-modal')?.addEventListener('click', () => this.closeRefundModal());
            refundModal.querySelector('#cancel-refund')?.addEventListener('click', () => this.closeRefundModal());
            refundModal.querySelector('#refund-form')?.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitRefund();
            });
        }
    }

 /**
 * پر کردن فرم درمان با اطلاعات موجود
 */
static async fillTreatmentForm(data) {
    console.log('Filling form with data:', data);

    // تبدیل تاریخ میلادی به شمسی
    const convertGregorianToPersian = (gregorianDate) => {
        if (!gregorianDate) return '';
        return new Date(gregorianDate).toLocaleDateString('fa-IR');
    };

    // پر کردن فیلدهای ساده
    document.getElementById('selected-areas').value = data.treatment_areas || '';
    document.getElementById('areas-count').value = data.treatment_areas ? data.treatment_areas.split(',').length : 0;
    document.getElementById('Visit-date').value = convertGregorianToPersian(data.treatment_date);
    document.getElementById('next-Visit-date').value = convertGregorianToPersian(data.next_visit_date);
    document.getElementById('discount').value = data.discount || 0;
    document.getElementById('material-cost').value = data.material_cost || 0;
    document.getElementById('lab-cost').value = data.lab_cost || 0;
    document.getElementById('description').value = data.description || '';

    // پر کردن select ها
    document.querySelector('select[name="doctor"]').value = data.doctor_id || '';
    document.querySelector('select[name="assistant"]').value = data.assistant_id || '';
    document.getElementById('insurance-provider').value = data.insurance_provider_id || '';
    document.getElementById('insurance-percentage').value = data.insurance_percentage || 0;
    document.getElementById('discount-type').value = data.discount_type_id || '';

    // پر کردن چک‌باکس‌ها
    document.querySelector('[name="is_completed"]').checked = data.is_completed;
    document.querySelector('[name="insurance_sent"]').checked = data.insurance_sent;
    document.querySelector('[name="insurance_paid"]').checked = data.insurance_paid;
    document.querySelector('[name="is_treatment_plan"]').checked = data.is_treatment_plan;
    
    // تنظیم حالت دستی یا خودکار تعرفه
    const manualPriceToggle = document.getElementById('manual-price-toggle');
    if (manualPriceToggle) {
        manualPriceToggle.checked = data.is_manual_price === true || data.is_manual_price === "true";
        // فراخوانی رویداد change برای اعمال تغییرات UI
        manualPriceToggle.dispatchEvent(new Event('change'));
    }

    // پر کردن نوع و شرح درمان (بخش پیچیده)
    const treatmentTypeButton = document.querySelector(`.treatment-type-btn[data-type-id="${data.treatment_type_id}"]`);
    if (treatmentTypeButton) {
        treatmentTypeButton.click(); // این کار باعث بارگذاری شرح درمان‌ها می‌شود
    }

    // با یک تاخیر کوتاه، شرح درمان را انتخاب می‌کنیم
    setTimeout(() => {
        const treatmentDetailSelect = document.getElementById('treatment-detail');
        if (treatmentDetailSelect) {
            treatmentDetailSelect.value = data.treatment_detail_id;
            // رویداد change را برای بروزرسانی تعرفه‌ها فراخوانی می‌کنیم
            treatmentDetailSelect.dispatchEvent(new Event('change'));
            
            // اطمینان از تنظیم صحیح مقادیر تعرفه
            setTimeout(() => {
                // اگر حالت دستی فعال است، مقادیر دستی را تنظیم می‌کنیم
                if (data.is_manual_price === true || data.is_manual_price === "true") {
                    const generalFeeManual = document.getElementById('general-fee-manual');
                    const specialFeeManual = document.getElementById('special-fee-manual');
                    
                    if (generalFeeManual && data.general_fee) {
                        generalFeeManual.value = data.general_fee;
                    }
                    
                    if (specialFeeManual && data.special_fee) {
                        specialFeeManual.value = data.special_fee;
                    }
                } else {
                    // در حالت خودکار، مقادیر را از شرح درمان می‌گیریم
                    const generalFeeInput = document.getElementById('general-fee');
                    if (generalFeeInput && data.general_fee) {
                        generalFeeInput.dataset.value = data.general_fee;
                        generalFeeInput.value = Number(data.general_fee).toLocaleString() + ' ریال';
                    }
                }
                
                // بروزرسانی محاسبات مالی
                this.calculatePayableAmount();
            }, 100);
        }
    }, 500);

    // بروزرسانی سهم تخفیف
    document.getElementById('discount-type').dispatchEvent(new Event('change'));
}


/**
 * مدیریت تغییر دستی قیمت
 */
static handleManualPriceToggle() {
    const manualPriceToggle = document.getElementById('manual-price-toggle');
    if (!manualPriceToggle) return;
    
    // اضافه کردن یک برچسب برای نمایش وضعیت دستی
    const manualPriceStatus = document.createElement('span');
    manualPriceStatus.id = 'manual-price-status';
    manualPriceStatus.className = 'manual-price-status';
    manualPriceStatus.style.display = 'none';
    manualPriceStatus.textContent = '(قیمت دستی فعال است)';
    manualPriceStatus.style.color = '#28a745';
    manualPriceStatus.style.fontWeight = 'bold';
    manualPriceStatus.style.marginRight = '10px';
    
    const manualPriceLabel = document.querySelector('label[for="manual-price-toggle"]');
    if (manualPriceLabel) {
        manualPriceLabel.parentNode.insertBefore(manualPriceStatus, manualPriceLabel.nextSibling);
    }
    
    manualPriceToggle.addEventListener('change', function() {
        const isManual = this.checked;
        
        // فیلدهای نمایشی
        const generalFeeDisplay = document.getElementById('general-fee');
        const specialFeeDisplay = document.getElementById('special-fee');
        
        // فیلدهای ورودی دستی
        const generalFeeManual = document.getElementById('general-fee-manual');
        const specialFeeManual = document.getElementById('special-fee-manual');
        
        // نمایش یا مخفی کردن برچسب وضعیت
        if (manualPriceStatus) {
            manualPriceStatus.style.display = isManual ? 'inline' : 'none';
        }
        
        if (isManual) {
            // فعال کردن حالت دستی
            if (generalFeeDisplay && generalFeeManual) {
                // انتقال مقدار از فیلد نمایشی به فیلد دستی (بدون فرمت)
                const generalValue = generalFeeDisplay.dataset.value || '0';
                generalFeeManual.value = generalValue;
                generalFeeDisplay.style.display = 'none';
                generalFeeManual.style.display = 'block';
                
                // اضافه کردن کلاس برای تأکید بیشتر روی فیلد تعرفه عمومی
                generalFeeManual.classList.add('primary-input');
            }
            
            if (specialFeeDisplay && specialFeeManual) {
                // انتقال مقدار از فیلد نمایشی به فیلد دستی (بدون فرمت)
                const specialValue = specialFeeDisplay.dataset.value || '0';
                specialFeeManual.value = specialValue;
                specialFeeDisplay.style.display = 'none';
                specialFeeManual.style.display = 'block';
            }
        } else {
            // غیرفعال کردن حالت دستی
            if (generalFeeDisplay && generalFeeManual) {
                generalFeeDisplay.style.display = 'block';
                generalFeeManual.style.display = 'none';
                generalFeeManual.classList.remove('primary-input');
            }
            
            if (specialFeeDisplay && specialFeeManual) {
                specialFeeDisplay.style.display = 'block';
                specialFeeManual.style.display = 'none';
            }
        }
        
        // محاسبه مجدد مبلغ قابل پرداخت پس از تغییر حالت
        TreatmentUI.calculatePayableAmount();
    });
    
    // اضافه کردن رویداد تغییر به فیلدهای دستی
    const generalFeeManual = document.getElementById('general-fee-manual');
    const specialFeeManual = document.getElementById('special-fee-manual');
    
    if (generalFeeManual) {
        // اضافه کردن راهنمای بصری برای تعرفه عمومی
        const helpText = document.createElement('small');
        helpText.className = 'form-text text-success';
        //helpText.textContent = 'مبلغ قابل پرداخت بر اساس این تعرفه محاسبه می‌شود';
        generalFeeManual.parentNode.appendChild(helpText);
        
        generalFeeManual.addEventListener('input', function() {
            // بروزرسانی مقدار در dataset فیلد نمایشی
            const generalFeeDisplay = document.getElementById('general-fee');
            if (generalFeeDisplay) {
                const numericValue = parseFloat(this.value.replace(/[^\d.-]/g, '')) || 0;
                generalFeeDisplay.dataset.value = numericValue;
                generalFeeDisplay.value = numericValue.toLocaleString() + ' ریال';
                generalFeeDisplay.classList.add('price-modified');
            }
            
            // محاسبه مجدد مبلغ قابل پرداخت
            TreatmentUI.calculatePayableAmount();
        });
    }
    
    if (specialFeeManual) {
        specialFeeManual.addEventListener('input', function() {
            // بروزرسانی مقدار در dataset فیلد نمایشی
            const specialFeeDisplay = document.getElementById('special-fee');
            if (specialFeeDisplay) {
                const numericValue = parseFloat(this.value.replace(/[^\d.-]/g, '')) || 0;
                specialFeeDisplay.dataset.value = numericValue;
                specialFeeDisplay.value = numericValue.toLocaleString() + ' ریال';
                specialFeeDisplay.classList.add('price-modified');
            }
        });
    }
}

// ui-treatment.js

/**
 * محاسبه مبلغ قابل پرداخت با بررسی سقف بیمه
 */
static calculatePayableAmount() {
    const manualPriceToggle = document.getElementById('manual-price-toggle');
    const payableAmountInput = document.getElementById('payable-amount');

    if (!payableAmountInput) return;

    let generalFee = 0;

    // مرحله ۱: تعیین قیمت پایه (generalFee) - همیشه از تعرفه عمومی استفاده می‌کنیم
    if (manualPriceToggle && manualPriceToggle.checked) {
        // اگر حالت دستی فعال است، قیمت پایه از فیلد دستی خوانده می‌شود.
        const generalFeeManual = document.getElementById('general-fee-manual');
        generalFee = parseFloat(generalFeeManual.value.replace(/[^\d.-]/g, '')) || 0;
    } else {
        // اگر حالت خودکار است، قیمت پایه از دیتابیس (dataset) خوانده می‌شود.
        const generalFeeInput = document.getElementById('general-fee');
        generalFee = parseFloat(generalFeeInput.dataset.value || 0);
    }

    // مرحله ۲: دریافت سایر مقادیر مالی
    const discountInput = document.getElementById('discount');
    const insurancePercentageInput = document.getElementById('insurance-percentage');
    const materialCostInput = document.getElementById('material-cost');
    const labCostInput = document.getElementById('lab-cost');
    const insuranceRemainingInput = document.getElementById('insurance-remaining');

    const discount = parseFloat(discountInput?.value || 0);
    const insurancePercentage = parseFloat(insurancePercentageInput?.value || 0);
    const materialCost = parseFloat(materialCostInput?.value || 0);
    const labCost = parseFloat(labCostInput?.value || 0);
    const insuranceRemaining = parseFloat(insuranceRemainingInput?.dataset.value || 0);

    // مرحله ۳: انجام محاسبات کامل بر روی قیمت پایه
    let amountAfterDiscount = generalFee - discount;
    let insuranceAmount = 0;

    if (insurancePercentage > 0) {
        // محاسبه مبلغ بیمه بر اساس درصد
        const calculatedInsuranceAmount = (amountAfterDiscount * insurancePercentage) / 100;
        
        // بررسی سقف بیمه
        if (calculatedInsuranceAmount > insuranceRemaining && insuranceRemaining > 0) {
            // اگر مبلغ بیمه از سقف باقیمانده بیشتر است، هشدار نمایش دهیم
            const confirmUse = confirm(`هشدار: مبلغ بیمه (${calculatedInsuranceAmount.toLocaleString('fa-IR')} ریال) از سقف باقیمانده بیمه (${insuranceRemaining.toLocaleString('fa-IR')} ریال) بیشتر است. آیا مایل به ادامه هستید؟`);
            
            if (confirmUse) {
                // اگر کاربر تایید کرد، از کل مبلغ باقیمانده بیمه استفاده می‌کنیم
                insuranceAmount = insuranceRemaining;
            } else {
                // اگر کاربر تایید نکرد، از بیمه استفاده نمی‌کنیم
                insuranceAmount = 0;
                insurancePercentageInput.value = 0;
            }
        } else {
            // اگر مبلغ بیمه از سقف کمتر است، از همان مبلغ محاسبه شده استفاده می‌کنیم
            insuranceAmount = calculatedInsuranceAmount;
        }
    }

    const finalAmount = Math.max(0, amountAfterDiscount - insuranceAmount + materialCost + labCost);

    // مرحله ۴: نمایش نتیجه نهایی
    payableAmountInput.value = finalAmount;
    
    // نمایش مقدار به صورت فرمت شده
    const formattedAmount = new Intl.NumberFormat('fa-IR').format(finalAmount);
    payableAmountInput.setAttribute('data-formatted', formattedAmount + ' ریال');
    
    console.log(`[محاسبه] مبلغ نهایی قابل پرداخت: ${finalAmount}`);
    console.log(`[محاسبه] جزئیات: قیمت پایه=${generalFee}, تخفیف=${discount}, درصد بیمه=${insurancePercentage}, مبلغ بیمه=${insuranceAmount}, هزینه مواد=${materialCost}, هزینه لابراتوار=${labCost}`);
}

// ui-treatment.js
// در فایل ui-patient.js یا ui-treatment.js

// در فایل ui-treatment.js یا ui-patient.js

static refreshTab(tabId) {
    let apiUrl = '';
    let tabContentElementId = '';

    switch(tabId) {
        case 'treatment-tab':
            apiUrl = `/Patient/treatment/${patientId}/`;
            tabContentElementId = 'treatment';
            break;
        case 'insurance-tab':
            apiUrl = `/Patient/insurance_view/${patientId}/`;
            tabContentElementId = 'insurance-info';
            break;
        default:
            console.error(`[Error] Unknown tabId for refresh: ${tabId}`);
            if (loader) loader.classList.remove('active');
            return;
    }

    console.log(`[2] Fetching new content for #${tabContentElementId} from URL: ${apiUrl}`);

    fetch(apiUrl, { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
    .then(response => {
        console.log(`[3] Received response from server with status: ${response.status}`);
        if (!response.ok) {
            // اگر خطا بود، متن خطا را هم می‌خوانیم
            return response.text().then(text => {
                throw new Error(`Server responded with status ${response.status}. Response: ${text}`);
            });
        }
        return response.text();
    })
    .then(html => {
        console.log('[4] Successfully received HTML content.');
        const tabContent = document.getElementById(tabContentElementId);
        if (tabContent) {
            tabContent.innerHTML = html;
            console.log(`[5] Tab #${tabContentElementId} content has been updated in the DOM.`);

            // اجرای مجدد کدهای جاوااسکریپت برای محتوای جدید
            if (tabId === 'treatment-tab') {
                if (typeof TreatmentUI !== 'undefined') {
                    console.log('[6a] Re-initializing TreatmentUI...');
                    TreatmentUI.initialize();
                }
                if (typeof TreatmentManager !== 'undefined') {
                    console.log('[6b] Re-initializing TreatmentManager...');
                    new TreatmentManager();
                }
            } else if (tabId === 'insurance-tab') {
                if (typeof PatientUI !== 'undefined') {
                    console.log('[6c] Re-initializing PatientUI...');
                    PatientUI.init();
                }
            }
        } else {
            console.error(`[Error] Tab content element with ID "${tabContentElementId}" not found.`);
        }
    })
    .catch(error => {
        console.error('❌❌❌ Error during refreshTab:', error);
        if (typeof PatientUI !== 'undefined') {
            PatientUI.showMessage('خطا در بارگذاری مجدد اطلاعات تب. لطفاً کنسول را بررسی کنید.', 'error');
        }
    })
    .finally(() => {
        console.log('[7] Finally block reached. Hiding loader.');
        if (loader) {
            setTimeout(() => loader.classList.remove('active'), 300);
        }
    });
}





/**
 * مدیریت پرینت درمان
 * @param {string} treatmentId - شناسه درمان
 */
static printTreatment(treatmentId) {
    // نمایش لودر
    const loader = document.getElementById('tab-loader');
    if (loader) {
        loader.classList.add('active');
    }
    
    // دریافت اطلاعات درمان برای پرینت
    TreatmentAPI.printTreatment(treatmentId)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
        })
        .then(html => {
            // ایجاد پنجره جدید برای پرینت
            const printWindow = window.open('', '_blank', 'height=600,width=800');
            printWindow.document.write(html);
            printWindow.document.close();
            
            // کمی تاخیر برای اطمینان از لود شدن محتوا
            setTimeout(() => {
                printWindow.print();
                // بستن پنجره بعد از پرینت (اختیاری)
                // printWindow.close();
            }, 1000);
        })
        .catch(error => {
            console.error('Error printing treatment:', error);
            TreatmentUI.showMessage('خطا در پرینت درمان', 'error');
        })
        .finally(() => {
            // مخفی کردن لودر
            if (loader) {
                loader.classList.remove('active');
            }
        });
}

/**
 * مدیریت صدور فاکتور درمان
 * @param {string} treatmentId - شناسه درمان
 */
static generateInvoice(treatmentId) {
    // نمایش لودر
    const loader = document.getElementById('tab-loader');
    if (loader) {
        loader.classList.add('active');
    }
    
    // دریافت اطلاعات فاکتور
    TreatmentAPI.generateInvoice(treatmentId)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
        })
        .then(html => {
            // ایجاد پنجره جدید برای نمایش فاکتور
            const invoiceWindow = window.open('', '_blank', 'height=600,width=800');
            invoiceWindow.document.write(html);
            invoiceWindow.document.close();
            
            // کمی تاخیر برای اطمینان از لود شدن محتوا
            setTimeout(() => {
                // می‌توانید اینجا کد اضافی برای فاکتور اضافه کنید
                // مثلاً دکمه‌ای برای دانلود PDF
            }, 500);
        })
        .catch(error => {
            console.error('Error generating invoice:', error);
            TreatmentUI.showMessage('خطا در صدور فاکتور', 'error');
        })
        .finally(() => {
            // مخفی کردن لودر
            if (loader) {
                loader.classList.remove('active');
            }
        });
}




    
}

// متغیرهای استاتیک
TreatmentUI.selectedToothElement = null;
TreatmentUI.selectedIcon = null;

