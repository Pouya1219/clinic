/**
 * کلاس مدیریت رابط کاربری درمان
 */
class TreatmentUI {
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
    static updateSelectedAreas() {
        const activeChart = document.querySelector('.dental-chart[style*="display: block"]');
        if (!activeChart) return;

        let selectedItems = [];
        const chartType = activeChart.dataset.type;
        let areaNames = [];

        if (chartType === 'adult_teeth' || chartType === 'child_teeth') {
            selectedItems = activeChart.querySelectorAll('.dental-tooth.selected');
            areaNames = Array.from(selectedItems).map(tooth => this.getToothDescriptiveName(tooth.dataset.number));
        } else if (chartType === 'face') {
            selectedItems = activeChart.querySelectorAll('.facial-area.selected');
            areaNames = Array.from(selectedItems).map(area => area.dataset.name);
        } else if (chartType === 'body') {
            selectedItems = activeChart.querySelectorAll('.body-area.selected');
            areaNames = Array.from(selectedItems).map(area => area.dataset.name);
        }

        document.getElementById('selected-areas').value = areaNames.join(', ');
        document.getElementById('areas-count').value = selectedItems.length;
    }

    /**
     * [یکپارچه] راه‌اندازی تمام رویدادهای مربوط به انتخاب
     */
    static initializeSelectionEvents() {
        // 1. رویداد کلیک مستقیم روی هر آیتم (دندان، صورت، بدن)
        document.querySelectorAll('.dental-tooth, .facial-area, .body-area').forEach(item => {
            item.addEventListener('click', function() {
                this.classList.toggle('selected');
                TreatmentUI.updateSelectedAreas();
            });
        });

        // 2. رویداد راست‌کلیک فقط برای دندان‌ها
        document.querySelectorAll('.dental-tooth').forEach(tooth => {
            tooth.addEventListener('contextmenu', function(e) {
                e.preventDefault();
                TreatmentUI.openToothModal(this);
            });
        });

        // 3. رویداد کلیک برای دکمه‌های انتخاب سریع
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
                TreatmentUI.updateSelectedAreas();
            });
        });
    }

    /**
     * [یکپارچه] مدیریت انتخاب نوع چارت
     */
    static handleChartTypeChange() {
        const chartTypeButtons = document.querySelectorAll('.chart-type-btn');
        const charts = document.querySelectorAll('.dental-chart');
        const quickSelectContainer = document.querySelector('.dental-quick-select');

        chartTypeButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                event.preventDefault();
                const chartType = button.dataset.chart;

                chartTypeButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                charts.forEach(chart => {
                    chart.style.display = (chart.dataset.type === chartType) ? 'block' : 'none';
                });

                const isDentalChart = (chartType === 'adult_teeth' || chartType === 'child_teeth');
                if (quickSelectContainer) {
                    quickSelectContainer.style.display = isDentalChart ? 'flex' : 'none';
                }
                
                this.updateSelectedAreas(); // پاک کردن انتخاب‌های قبلی و به‌روزرسانی فیلدها
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
     * [اصلاح شده] راه‌اندازی اولیه رابط کاربری
     */
    static initialize() {
        console.log('Initializing TreatmentUI...');
        
        // [مهم] گام اول: ساختن چارت‌ها
        this.createAdultTeethChart();
        this.createChildTeethChart();
        this.createBodyChart();

        // [مهم] گام دوم: اضافه کردن رویدادها به المان‌های ساخته شده
        this.initializeSelectionEvents();
        
        // گام سوم: راه‌اندازی بقیه بخش‌ها
        this.handleChartTypeChange();
        this.handleTreatmentTypeChange();
        this.handleTreatmentDetailChange();
        this.handleInsuranceProviderChange();
        this.handleFinancialInputsChange();
        this.setupModalListeners();

        // فعال‌سازی اولیه دکمه اول و چارت مربوطه
        document.querySelector('.chart-type-btn')?.click();

        console.log('TreatmentUI initialized');
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
     * مدیریت انتخاب نوع درمان
     */
    /**
 * [اصلاح شده] مدیریت انتخاب نوع درمان با دکمه‌ها
 */
static handleTreatmentTypeChange() {
    const treatmentTypeButtons = document.querySelectorAll('.treatment-type-btn');
    const treatmentTypeInput = document.getElementById('treatment-type'); // فیلد مخفی
    const treatmentDetailSelect = document.getElementById('treatment-detail');

    treatmentTypeButtons.forEach(button => {
        button.addEventListener('click', async function() {
            // 1. مدیریت استایل دکمه فعال
            treatmentTypeButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            // 2. ذخیره مقدار در فیلد مخفی
            const selectedTypeId = this.dataset.typeId;
            if (treatmentTypeInput) {
                treatmentTypeInput.value = selectedTypeId;
            }

            // 3. بارگذاری شرح درمان مربوطه
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
                        treatmentDetailSelect.appendChild(option);
                    });
                    // تریگر کردن رویداد change برای به‌روزرسانی قیمت‌ها
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
                    generalFeeInput.value = Number(generalFee).toLocaleString() + ' تومان';
                    generalFeeInput.dataset.value = generalFee;
                }
                if (specialFeeInput) {
                    specialFeeInput.value = Number(specialFee).toLocaleString() + ' تومان';
                    specialFeeInput.dataset.value = specialFee;
                }
                if (internationalCodeInput) {
                    internationalCodeInput.value = code;
                }
                
                // محاسبه مبلغ قابل پرداخت
                TreatmentUI.calculatePayableAmount();
            }
        });
    }
    
    /**
     * مدیریت تغییر بیمه
     */
    static handleInsuranceProviderChange() {
        const insuranceProviderSelect = document.getElementById('insurance-provider');
        if (!insuranceProviderSelect) return;
        
        insuranceProviderSelect.addEventListener('change', async function() {
            const providerId = this.value;
            if (!providerId) {
                // پاک کردن درصد بیمه
                const insurancePercentageInput = document.getElementById('insurance-percentage');
                if (insurancePercentageInput) {
                    insurancePercentageInput.value = '0';
                }
                
                // محاسبه مجدد مبلغ قابل پرداخت
                TreatmentUI.calculatePayableAmount();
                return;
            }
            
            try {
                // دریافت اطلاعات بیمه
                const response = await TreatmentAPI.getInsuranceProvider(providerId);
                
                // تنظیم درصد بیمه
                const insurancePercentageInput = document.getElementById('insurance-percentage');
                if (insurancePercentageInput && response.default_percentage) {
                    insurancePercentageInput.value = response.default_percentage;
                }
                
                // محاسبه مجدد مبلغ قابل پرداخت
                TreatmentUI.calculatePayableAmount();
            } catch (error) {
                console.error('Error fetching insurance data:', error);
                TreatmentUI.showMessage('خطا در دریافت اطلاعات بیمه', 'error');
            }
        });
    }
    
    /**
     * محاسبه مبلغ قابل پرداخت
     */
    static calculatePayableAmount() {
        // دریافت مقادیر از فرم
        const specialFeeInput = document.getElementById('special-fee');
        const discountInput = document.getElementById('discount');
        const insurancePercentageInput = document.getElementById('insurance-percentage');
        const materialCostInput = document.getElementById('material-cost');
        const labCostInput = document.getElementById('lab-cost');
        const payableAmountInput = document.getElementById('payable-amount');
        
        if (!specialFeeInput || !payableAmountInput) return;
        
        // تبدیل مقادیر به عدد
        const specialFee = parseInt(specialFeeInput.dataset.value || 0);
        const discount = parseInt(discountInput?.value || 0);
        const insurancePercentage = parseInt(insurancePercentageInput?.value || 0);
        const materialCost = parseInt(materialCostInput?.value || 0);
        const labCost = parseInt(labCostInput?.value || 0);
        
        // محاسبه مبلغ قابل پرداخت
        let amountAfterDiscount = specialFee - discount;
        let insuranceAmount = 0;
        
        if (insurancePercentage > 0) {
            insuranceAmount = (amountAfterDiscount * insurancePercentage) / 100;
        }
        
        const finalAmount = Math.max(0, amountAfterDiscount - insuranceAmount + materialCost + labCost);
        
        // نمایش مبلغ قابل پرداخت
        payableAmountInput.value = finalAmount;
    }
    
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
 * ایجاد چارت دندان بزرگسال
 */
static createAdultTeethChart() {
    const chartContainer = document.querySelector('.dental-chart-container[data-type="adult_teeth"]');
    if (!chartContainer) return;
    
    const upperJaw = document.createElement('div');
    upperJaw.classList.add('dental-upper-jaw', 'dental-row');
    
    const lowerJaw = document.createElement('div');
    lowerJaw.classList.add('dental-lower-jaw', 'dental-row');
    
    // دندان‌های فک بالا - سمت راست
    for (let i = 18; i >= 11; i--) {
        upperJaw.appendChild(this.createToothElement(i, 'adult'));
    }
    
    // دندان‌های فک بالا - سمت چپ
    for (let i = 21; i <= 28; i++) {
        upperJaw.appendChild(this.createToothElement(i, 'adult'));
    }
    
    // دندان‌های فک پایین - سمت راست
    for (let i = 48; i >= 41; i--) {
        lowerJaw.appendChild(this.createToothElement(i, 'adult'));
    }
    
    // دندان‌های فک پایین - سمت چپ
    for (let i = 31; i <= 38; i++) {
        lowerJaw.appendChild(this.createToothElement(i, 'adult'));
    }
    
    chartContainer.innerHTML = '';
    chartContainer.appendChild(upperJaw);
    chartContainer.appendChild(this.createJawSeparator());
    chartContainer.appendChild(lowerJaw);
}

/**
 * ایجاد چارت دندان کودک
 */
static createChildTeethChart() {
    const chartContainer = document.querySelector('.dental-chart-container[data-type="child_teeth"]');
    if (!chartContainer) return;
    
    const upperJaw = document.createElement('div');
    upperJaw.classList.add('dental-upper-jaw', 'dental-row');
    
    const lowerJaw = document.createElement('div');
    lowerJaw.classList.add('dental-lower-jaw', 'dental-row');
    
    // دندان‌های فک بالا - سمت راست
    for (let i = 55; i >= 51; i--) {
        upperJaw.appendChild(this.createToothElement(i, 'child'));
    }
    
    // دندان‌های فک بالا - سمت چپ
    for (let i = 61; i <= 65; i++) {
        upperJaw.appendChild(this.createToothElement(i, 'child'));
    }
    
    // دندان‌های فک پایین - سمت راست
    for (let i = 85; i >= 81; i--) {
        lowerJaw.appendChild(this.createToothElement(i, 'child'));
    }
    
    // دندان‌های فک پایین - سمت چپ
    for (let i = 71; i <= 75; i++) {
        lowerJaw.appendChild(this.createToothElement(i, 'child'));
    }
    
    chartContainer.innerHTML = '';
    chartContainer.appendChild(upperJaw);
    chartContainer.appendChild(this.createJawSeparator());
    chartContainer.appendChild(lowerJaw);
}

/**
 * ایجاد المان دندان
 * @param {number} toothNumber - شماره دندان
 * @param {string} toothType - نوع دندان (adult یا child)
 * @returns {HTMLElement} المان دندان
 */
static createToothElement(toothNumber, toothType) {
    const tooth = document.createElement('div');
    tooth.classList.add('dental-tooth', `tooth-${toothType}`);
    tooth.dataset.number = toothNumber;
    tooth.dataset.name = this.getToothName(toothNumber, toothType);
    
    const numberDiv = document.createElement('div');
    numberDiv.classList.add('dental-tooth-number');
    numberDiv.textContent = toothNumber;
    
    const iconDiv = document.createElement('div');
    iconDiv.classList.add('dental-tooth-icon');
    iconDiv.dataset.status = 'healthy';
    iconDiv.innerHTML = '<i class="fas fa-tooth"></i>';
    
    tooth.appendChild(numberDiv);
    tooth.appendChild(iconDiv);
    
    return tooth;
}

/**
 * ایجاد جداکننده فک‌ها
 * @returns {HTMLElement} المان جداکننده
 */
static createJawSeparator() {
    const separator = document.createElement('div');
    separator.classList.add('dental-jaw-separator');
    return separator;
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

 

    
}

// متغیرهای استاتیک
TreatmentUI.selectedToothElement = null;
TreatmentUI.selectedIcon = null;



--------------



/**
 * کلاس اصلی مدیریت درمان
 */
class TreatmentManager {
    constructor() {
    console.log("1. TreatmentManager constructor started.");
    
    // بررسی وجود دکمه ثبت درمان
    const saveButton = document.getElementById('save-treatment');
    if (saveButton) {
        console.log("Found save-treatment button:", saveButton);
    } else {
        console.error("CRITICAL: save-treatment button NOT FOUND!");
    }
    
    // مقداردهی اولیه رویدادها
    this.initEventListeners();
    // بارگذاری انواع تخفیف
    this.loadDiscountTypes().catch(error => {
        console.error('Error in loadDiscountTypes:', error);
    });
    
    // اضافه کردن رویداد تغییر نوع تخفیف
    this.handleDiscountTypeChange();
    console.log("2. TreatmentManager initialized successfully.");
}

    
    /**
     * راه‌اندازی گوش‌دهنده‌های رویداد
     */
    initEventListeners() {
    const saveButton = document.getElementById('save-treatment');

    if (saveButton) {
        console.log("3. 'save-treatment' button found. Adding click listener.");
        
        // حذف رویدادهای قبلی برای جلوگیری از تداخل
        saveButton.removeEventListener('click', this.handleTreatmentSubmit);
        
        // اضافه کردن رویداد جدید
        saveButton.addEventListener('click', (e) => {
            console.log("4. Save button CLICKED!");
            e.preventDefault();
            this.handleTreatmentSubmit();
        });
    } else {
        console.error("CRITICAL: 'save-treatment' button NOT FOUND in the DOM.");
    }

    // رویدادهای جدول درمان‌ها (برای ویرایش و حذف)
    const treatmentTable = document.getElementById('treatment-plan-list');
    if (treatmentTable) {
        treatmentTable.addEventListener('click', (e) => {
            const targetButton = e.target.closest('.action-btn');
            if (!targetButton) return;

            const treatmentId = targetButton.dataset.id;

            if (targetButton.classList.contains('edit')) {
                console.log(`Edit button clicked for treatment ID: ${treatmentId}`);
                this.handleEditTreatment(treatmentId);
            }

            if (targetButton.classList.contains('delete')) {
                console.log(`Delete button clicked for treatment ID: ${treatmentId}`);
                this.handleDeleteTreatment(treatmentId);
            }
            // می‌توانید برای دکمه‌های دیگر هم اینجا کد اضافه کنید
        });
    }
    
    console.log("Event listeners initialized successfully.");
}

 /**
 * بارگذاری انواع تخفیف
 */
async loadDiscountTypes() {
    console.log('[LOG] Loading discount types...');
    
    try {
        // بررسی وجود تابع getDiscountTypes
        if (typeof TreatmentAPI === 'undefined' || typeof TreatmentAPI.getDiscountTypes !== 'function') {
            console.error('[ERROR] TreatmentAPI.getDiscountTypes is not a function');
            return;  // اگر تابع وجود نداشت، از تابع خارج می‌شویم
        }
        
        // فراخوانی API با استفاده از async/await
        const response = await TreatmentAPI.getDiscountTypes();
        
        if (response && response.success && response.discount_types) {
            this.populateDiscountTypeSelect(response.discount_types);
        } else {
            console.warn('[WARNING] Invalid response from API');
        }
    } catch (error) {
        console.error('Error loading discount types:', error);
    }
}

    
    /**
     * پر کردن select انواع تخفیف
     */
    populateDiscountTypeSelect(discountTypes) {
        const discountTypeSelect = document.getElementById('discount-type');
        if (!discountTypeSelect) {
            console.warn('[WARNING] Discount type select element not found');
            return;
        }
        
        discountTypeSelect.innerHTML = '<option value="">انتخاب نوع تخفیف</option>';
        
        discountTypes.forEach(type => {
            const option = document.createElement('option');
            option.value = type.id;
            option.textContent = type.name;
            option.dataset.doctorPercentage = type.doctor_percentage;
            option.dataset.clinicPercentage = type.clinic_percentage;
            discountTypeSelect.appendChild(option);
        });
        
        console.log(`[LOG] Loaded ${discountTypes.length} discount types`);
    }
    
    /**
     * مدیریت تغییر نوع تخفیف
     */
    handleDiscountTypeChange() {
        const discountTypeSelect = document.getElementById('discount-type');
        const discountInput = document.getElementById('discount');
        const doctorShareInput = document.getElementById('doctor-discount-share');
        const clinicShareInput = document.getElementById('clinic-discount-share');
        
        if (!discountTypeSelect || !discountInput) {
            console.warn('[WARNING] Discount type select or discount input not found');
            return;
        }
        
        console.log('[LOG] Setting up discount type change handler');
        
        discountTypeSelect.addEventListener('change', function() {
            const selectedOption = this.options[this.selectedIndex];
            if (!selectedOption || !selectedOption.value) {
                if (doctorShareInput) doctorShareInput.value = '0';
                if (clinicShareInput) clinicShareInput.value = '0';
                return;
            }
            
            const doctorPercentage = parseInt(selectedOption.dataset.doctorPercentage) || 0;
            const clinicPercentage = parseInt(selectedOption.dataset.clinicPercentage) || 0;
            const discountAmount = parseInt(discountInput.value) || 0;
            
            const doctorShare = Math.round((discountAmount * doctorPercentage) / 100);
            const clinicShare = Math.round((discountAmount * clinicPercentage) / 100);
            
            console.log(`[LOG] Discount shares calculated: Doctor: ${doctorShare}, Clinic: ${clinicShare}`);
            
            if (doctorShareInput) doctorShareInput.value = doctorShare;
            if (clinicShareInput) clinicShareInput.value = clinicShare;
            
            // بروزرسانی مبلغ قابل پرداخت
            TreatmentUI.calculatePayableAmount();
        });
        
        // همچنین وقتی مبلغ تخفیف تغییر می‌کند، سهم‌ها را بروزرسانی کنید
        if (discountInput) {
            discountInput.addEventListener('input', function() {
                const event = new Event('change');
                discountTypeSelect.dispatchEvent(event);
            });
        }
    }
/**
 * مدیریت ارسال فرم درمان
 */
async handleTreatmentSubmit() {
    console.log("5. handleTreatmentSubmit function called.");
    try {
        if (!this.validateTreatmentForm()) {
            console.log("6. Form validation FAILED.");
            // پیام خطا توسط خود تابع اعتبارسنجی نمایش داده می‌شود
            return;
        }
        console.log("6. Form validation PASSED.");

        const treatmentData = this.collectTreatmentFormData();
        console.log("7. Form data collected:", treatmentData);

        const treatmentId = document.getElementById('treatment-id')?.value;
        let response;

        if (treatmentId) {
            console.log(`8. Updating treatment with ID: ${treatmentId}`);
            response = await TreatmentAPI.updateTreatment(treatmentId, treatmentData);
            TreatmentUI.showMessage('درمان با موفقیت بروزرسانی شد', 'success');
        } else {
            console.log("8. Creating new treatment.");
            response = await TreatmentAPI.createTreatment(treatmentData);
            TreatmentUI.showMessage('درمان با موفقیت ثبت شد', 'success');
        }

        console.log("9. API call successful. Response:", response);
        
        // به جای رفرش کامل صفحه، فقط جدول درمان‌ها را بروزرسانی کنیم
        await this.refreshTreatmentsTable();
        
        // پاک کردن فرم
        this.resetTreatmentForm();

    } catch (error) {
        console.error('Error submitting treatment:', error);
        // نمایش پیام خطا به کاربر
        const errorMessage = error.message || 'خطا در ذخیره اطلاعات. لطفاً کنسول را بررسی کنید.';
        TreatmentUI.showMessage(errorMessage, 'error');
    }
}


/**
 * بروزرسانی جدول درمان‌ها
 */
async refreshTreatmentsTable() {
    try {
        const patientId = document.getElementById('patient-id')?.value;
        if (!patientId) return;
        
        // دریافت لیست درمان‌های بیمار
        const response = await TreatmentAPI.listTreatments(patientId);
        
        // بروزرسانی جدول
        const tableBody = document.querySelector('#treatment-plan-list tbody');
        if (!tableBody) {
            console.error('Treatment table body not found');
            return;
        }
        
        // پاک کردن جدول فعلی
        tableBody.innerHTML = '';
        
        // اضافه کردن ردیف‌های جدید
        if (response && response.treatments && response.treatments.length > 0) {
            response.treatments.forEach((treatment, index) => {
                const row = document.createElement('tr');
                row.dataset.id = treatment.id;
                row.dataset.amount = treatment.payable_amount;
                
                // تبدیل تاریخ‌ها به فرمت مناسب
                const treatmentDate = treatment.treatment_date ? new Date(treatment.treatment_date).toLocaleDateString('fa-IR') : '-';
                const nextVisitDate = treatment.next_visit_date ? new Date(treatment.next_visit_date).toLocaleDateString('fa-IR') : '-';
                
                // وضعیت بیمه
                let insuranceStatus = '';
                if (treatment.insurance_sent) {
                    if (treatment.insurance_paid) {
                        insuranceStatus = '<span class="status-badge success">پرداخت شده</span>';
                    } else {
                        insuranceStatus = '<span class="status-badge warning">ارسال شده</span>';
                    }
                } else {
                    insuranceStatus = '<span class="status-badge danger">ارسال نشده</span>';
                }
                
                // وضعیت درمان
                const treatmentStatus = treatment.is_completed ? 
                    '<span class="status-badge success">انجام شده</span>' : 
                    '<span class="status-badge warning">در انتظار</span>';
                
                // نوع مراجعه
                const visitType = treatment.is_treatment_plan ? 
                    '<span class="status-badge info">طرح درمان</span>' : 
                    '<span class="status-badge primary">درمان</span>';
                
                // فرمت کردن اعداد
                const formatNumber = (num) => {
                    return parseFloat(num).toLocaleString() + ' ریال';
                };
                
                // نام پزشک و دستیار
                const doctorName = treatment.doctor ? treatment.doctor.full_name : '-';
                const assistantName = treatment.assistant ? treatment.assistant.full_name : '-';
                
                // نام و درصد بیمه
                const insuranceProviderName = treatment.insurance_provider ? treatment.insurance_provider.name : '-';
                const insurancePercentage = treatment.insurance_percentage ? `${treatment.insurance_percentage}%` : '-';
                
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${treatmentDate}</td>
                    <td>${treatment.treatment_areas}</td>
                    <td>${treatment.treatment_type.title}</td>
                    <td>${treatment.treatment_detail.description}</td>
                    <td>${doctorName}</td>
                    <td>${assistantName}</td>
                    <td>${insuranceProviderName}</td>
                    <td>${insurancePercentage}</td>
                    <td>${formatNumber(treatment.general_fee)}</td>
                    <td>${formatNumber(treatment.special_fee)}</td>
                    <td>${formatNumber(treatment.discount)}</td>
                    <td>${formatNumber(treatment.material_cost)}</td>
                    <td>${formatNumber(treatment.lab_cost)}</td>
                    <td>${formatNumber(treatment.payable_amount)}</td>
                    <td>${insuranceStatus}</td>
                    <td>${treatmentStatus}</td>
                    <td>${nextVisitDate}</td>
                    <td>${visitType}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="action-btn edit" title="ویرایش" data-id="${treatment.id}">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="action-btn delete" title="حذف" data-id="${treatment.id}">
                                <i class="fas fa-trash"></i>
                            </button>
                            <button class="action-btn payment" title="پرداخت" onclick="PaymentManager.showPaymentModal('{{ treatment.id }}', '{{ treatment.payable_amount }}')">
                                <i class="fas fa-money-bill"></i>
                            </button>
                            <button class="action-btn installment" title="اقساط" onclick="PaymentManager.showInstallmentModal('{{ treatment.id }}', '{{ treatment.payable_amount }}')">
                                <i class="fas fa-calendar-alt"></i>
                            </button>
                            <button class="action-btn print" title="پرینت" data-id="${treatment.id}">
                                <i class="fas fa-print"></i>
                            </button>
                            <button class="action-btn invoice" title="صدور فاکتور" data-id="${treatment.id}">
                                <i class="fas fa-file-invoice"></i>
                            </button>
                        </div>
                    </td>
                `;
                
                tableBody.appendChild(row);
            });
        } else {
            // اگر درمانی وجود نداشت
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = `<td colspan="20" class="empty-table">هیچ درمانی ثبت نشده است</td>`;
            tableBody.appendChild(emptyRow);
        }
        
        // اضافه کردن رویدادها به دکمه‌های جدید
        this.attachEventListenersToButtons();
        
        console.log('Treatments table refreshed successfully');
        
    } catch (error) {
        console.error('Error refreshing treatments table:', error);
        TreatmentUI.showMessage('خطا در بروزرسانی جدول درمان‌ها', 'error');
    }
}


/**
 * اضافه کردن رویدادها به دکمه‌های جدول
 */
attachEventListenersToButtons() {
    // دکمه‌های ویرایش
    document.querySelectorAll('#treatment-plan-list .action-btn.edit').forEach(button => {
        button.addEventListener('click', () => {
            const id = button.dataset.id;
            this.handleEditTreatment(id);
        });
    });
    
    // دکمه‌های حذف
    document.querySelectorAll('#treatment-plan-list .action-btn.delete').forEach(button => {
        button.addEventListener('click', () => {
            const id = button.dataset.id;
            this.handleDeleteTreatment(id);
        });
    });
    
    // دکمه‌های پرینت
    document.querySelectorAll('#treatment-plan-list .action-btn.print').forEach(button => {
        button.addEventListener('click', () => {
            const row = button.closest('tr');
            this.handlePrintTreatment(row);
        });
    });
    
    // دکمه‌های صدور فاکتور
    document.querySelectorAll('#treatment-plan-list .action-btn.invoice').forEach(button => {
        button.addEventListener('click', () => {
            const id = button.dataset.id;
            this.handleGenerateInvoice(id);
        });
    });
}
/**
 * پاک کردن فرم درمان
 */
resetTreatmentForm() {
    const form = document.getElementById('treatment-form');
    if (!form) return;
    
    // پاک کردن فیلدهای فرم
    form.reset();
    
    // پاک کردن فیلدهای خاص
    document.getElementById('treatment-id').value = '';
    document.getElementById('selected-areas').value = '';
    document.getElementById('areas-count').value = '0';
    
    // پاک کردن انتخاب‌های چارت
    document.querySelectorAll('.dental-tooth.selected, .facial-area.selected, .body-area.selected').forEach(item => {
        item.classList.remove('selected');
    });
    
    // بازگرداندن متن دکمه ثبت
    const submitButton = document.getElementById('save-treatment');
    if (submitButton) {
        submitButton.textContent = 'ثبت درمان';
    }
    
    console.log('Treatment form reset successfully');
}

    /**
     * اعتبارسنجی فرم درمان
     */
    validateTreatmentForm() {
        const requiredFields = [
            { id: 'selected-areas', message: 'لطفاً حداقل یک ناحیه درمان انتخاب کنید' },
            { id: 'treatment-type', message: 'لطفاً نوع درمان را انتخاب کنید' },
            { id: 'treatment-detail', message: 'لطفاً شرح درمان را انتخاب کنید' },
            { selector: 'select[name="doctor"]', message: 'لطفاً پزشک معالج را انتخاب کنید' },
            { id: 'Visit-date', message: 'لطفاً تاریخ مراجعه را وارد کنید' }
        ];

        for (const field of requiredFields) {
            const element = field.id ? document.getElementById(field.id) : document.querySelector(field.selector);
            if (!element || !element.value) {
                TreatmentUI.showMessage(field.message, 'warning');
                return false;
            }
        }
        return true;
    }
    
/**
 * جمع‌آوری داده‌های فرم درمان
 */
collectTreatmentFormData() {
    const form = document.getElementById('treatment-form');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    // تبدیل مقادیر عددی و اصلاح نام‌ها
    data.patient_id = parseInt(data.patient_id) || 0;
    data.treatment_type_id = parseInt(data.treatment_type) || 0;
    data.treatment_detail_id = parseInt(data.treatment_detail) || 0;
    data.doctor_id = parseInt(data.doctor) || 0;
    data.assistant_id = data.assistant ? parseInt(data.assistant) : null;
    data.insurance_provider_id = data.insurance_provider ? parseInt(data.insurance_provider) : null;
    data.discount_type_id = data.discount_type_id ? parseInt(data.discount_type_id) : null;
    
    // تبدیل مقادیر عددی به رشته برای جلوگیری از مشکلات دقت اعشاری
    data.discount = data.discount ? String(parseFloat(data.discount) || 0) : "0";
    data.material_cost = data.material_cost ? String(parseFloat(data.material_cost) || 0) : "0";
    data.lab_cost = data.lab_cost ? String(parseFloat(data.lab_cost) || 0) : "0";
    data.payable_amount = data.payable_amount ? String(parseFloat(data.payable_amount) || 0) : "0";
    data.insurance_percentage = data.insurance_percentage ? String(parseFloat(data.insurance_percentage) || 0) : "0";
    
    // خواندن مقادیر از dataset برای تعرفه‌ها
    const generalFeeInput = document.getElementById('general-fee');
    const specialFeeInput = document.getElementById('special-fee');
    data.general_fee = generalFeeInput && generalFeeInput.dataset.value ? String(parseFloat(generalFeeInput.dataset.value) || 0) : "0";
    data.special_fee = specialFeeInput && specialFeeInput.dataset.value ? String(parseFloat(specialFeeInput.dataset.value) || 0) : "0";

    // مدیریت چک‌باکس‌ها
    data.insurance_sent = form.querySelector('[name="insurance_sent"]')?.checked || false;
    data.is_completed = form.querySelector('[name="is_completed"]')?.checked || false;
    data.insurance_paid = form.querySelector('[name="insurance_paid"]')?.checked || false;
    data.is_treatment_plan = form.querySelector('[name="is_treatment_plan"]')?.checked || false;

    // حذف کلیدهای اضافی
    delete data.treatment_type;
    delete data.treatment_detail;
    delete data.doctor;
    delete data.assistant;
    delete data.insurance_provider;
    
    // اضافه کردن نواحی انتخاب شده
    data.treatment_areas = document.getElementById('selected-areas')?.value || '';
    data.area_type = this.determineAreaType();

    console.log('Collected form data:', data);
    return data;
}


/**
 * تعیین نوع ناحیه (دندان، صورت، بدن)
 */
determineAreaType() {
    const activeChart = document.querySelector('.dental-chart[style*="display: block"]');
    if (!activeChart) return 'teeth';
    
    const chartType = activeChart.dataset.type;
    if (chartType === 'adult_teeth' || chartType === 'child_teeth') {
        return 'teeth';
    } else if (chartType === 'face') {
        return 'face';
    } else if (chartType === 'body') {
        return 'body';
    }
    
    return 'teeth'; // پیش‌فرض
}  
/**
 * مدیریت ویرایش درمان
 * @param {string} id - شناسه درمان
 */
async handleEditTreatment(id) {
    try {
        console.log(`Fetching data for treatment ID: ${id}`);
        // دریافت اطلاعات درمان از سرور
        const treatmentData = await TreatmentAPI.getTreatment(id);
        
        if (treatmentData.success) {
            console.log('Treatment data fetched successfully:', treatmentData.treatment);
            // پر کردن فرم با اطلاعات درمان
            TreatmentUI.fillTreatmentForm(treatmentData.treatment);
            
            // اسکرول به بالای صفحه
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            // تغییر متن دکمه ثبت به "بروزرسانی"
            const submitButton = document.getElementById('save-treatment');
            if (submitButton) {
                submitButton.textContent = 'بروزرسانی درمان';
            }
            
            // ذخیره شناسه درمان در یک فیلد مخفی در فرم
            let treatmentIdInput = document.getElementById('treatment-id');
            if (!treatmentIdInput) {
                treatmentIdInput = document.createElement('input');
                treatmentIdInput.type = 'hidden';
                treatmentIdInput.id = 'treatment-id';
                treatmentIdInput.name = 'treatment_id';
                document.getElementById('treatment-form').appendChild(treatmentIdInput);
            }
            treatmentIdInput.value = id;

        } else {
            TreatmentUI.showMessage(treatmentData.message || 'خطا در دریافت اطلاعات درمان', 'error');
        }
    } catch (error) {
        TreatmentUI.showMessage('خطا در ارتباط با سرور', 'error');
        console.error('Error fetching treatment for edit:', error);
    }
}
    
    /**
     * پر کردن فرم با اطلاعات درمان
     * @param {Object} treatment - اطلاعات درمان
     */
    fillTreatmentForm(treatment) {
        // تنظیم نواحی درمان
        const selectedAreasInput = document.getElementById('selected-areas');
        if (selectedAreasInput) {
            selectedAreasInput.value = treatment.treatment_areas;
        }
        
        // تنظیم تعداد نواحی
        const areasCountInput = document.getElementById('areas-count');
        if (areasCountInput) {
            const areasCount = treatment.treatment_areas.split(',').length;
            areasCountInput.value = areasCount;
        }
        
        // تنظیم نوع درمان
        const treatmentTypeSelect = document.getElementById('treatment-type');
        if (treatmentTypeSelect) {
            treatmentTypeSelect.value = treatment.treatment_type_id;
            
            // رویداد change را فراخوانی می‌کنیم تا لیست شرح درمان‌ها بارگذاری شود
            const event = new Event('change');
            treatmentTypeSelect.dispatchEvent(event);
            
            // با یک تأخیر کوتاه، شرح درمان را تنظیم می‌کنیم
            setTimeout(() => {
                const treatmentDetailSelect = document.getElementById('treatment-detail');
                if (treatmentDetailSelect) {
                    treatmentDetailSelect.value = treatment.treatment_detail_id;
                    
                    // رویداد change را فراخوانی می‌کنیم تا تعرفه‌ها تنظیم شوند
                    const detailEvent = new Event('change');
                    treatmentDetailSelect.dispatchEvent(detailEvent);
                }
            }, 500);
        }
        
        // تنظیم پزشک و دستیار
        const doctorSelect = document.querySelector('select[name="doctor"]');
        const assistantSelect = document.querySelector('select[name="assistant"]');
        if (doctorSelect) doctorSelect.value = treatment.doctor_id;
        if (assistantSelect) assistantSelect.value = treatment.assistant_id || '';
        
        // تنظیم تاریخ‌ها
        const visitDateInput = document.getElementById('Visit-date');
        const nextVisitDateInput = document.getElementById('next-Visit-date');
        if (visitDateInput) visitDateInput.value = treatment.treatment_date;
        if (nextVisitDateInput) nextVisitDateInput.value = treatment.next_visit_date || '';
        
        // تنظیم بیمه
        const insuranceProviderSelect = document.getElementById('insurance-provider');
        const insurancePercentageInput = document.getElementById('insurance-percentage');
        if (insuranceProviderSelect) insuranceProviderSelect.value = treatment.insurance_provider_id || '';
        if (insurancePercentageInput) insurancePercentageInput.value = treatment.insurance_percentage || 0;
        
        // تنظیم مقادیر مالی
        const discountInput = document.getElementById('discount');
        const materialCostInput = document.getElementById('material-cost');
        const labCostInput = document.getElementById('lab-cost');
        const payableAmountInput = document.getElementById('payable-amount');
        if (discountInput) discountInput.value = treatment.discount || 0;
        if (materialCostInput) materialCostInput.value = treatment.material_cost || 0;
        if (labCostInput) labCostInput.value = treatment.lab_cost || 0;
        if (payableAmountInput) payableAmountInput.value = treatment.payable_amount || 0;
        
        // تنظیم چک‌باکس‌ها
        const insuranceSentCheckbox = document.getElementById('insurance-sent');
        const isTreatmentCompletedCheckbox = document.getElementById('is-completed');
        const isInsurancePaidCheckbox = document.getElementById('insurance-paid');
        const isTreatmentPlanCheckbox = document.getElementById('is-treatment-plan');
        if (insuranceSentCheckbox) insuranceSentCheckbox.checked = treatment.insurance_sent;
        if (isTreatmentCompletedCheckbox) isTreatmentCompletedCheckbox.checked = treatment.is_completed;
        if (isInsurancePaidCheckbox) isInsurancePaidCheckbox.checked = treatment.insurance_paid;
        if (isTreatmentPlanCheckbox) isTreatmentPlanCheckbox.checked = treatment.is_treatment_plan;
        
        // تنظیم توضیحات
        const descriptionTextarea = document.getElementById('description');
        if (descriptionTextarea) descriptionTextarea.value = treatment.description || '';
    }
    
    /**
     * مدیریت حذف درمان
     * @param {string} id - شناسه درمان
     */
    async handleDeleteTreatment(id) {
        try {
            // تأیید حذف
            if (!confirm('آیا از حذف این درمان اطمینان دارید؟')) {
                return;
            }
            
            // ارسال درخواست حذف به سرور
            await TreatmentAPI.deleteTreatment(id);
            
            // نمایش پیام موفقیت
            TreatmentUI.showMessage(TREATMENT_CONFIG.SUCCESS_MESSAGES.DELETE_SUCCESS, 'success');
            
            // حذف ردیف از جدول
            const row = document.querySelector(`tr[data-id="${id}"]`);
            if (row) {
                row.remove();
            } else {
                // بارگذاری مجدد صفحه
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            }
            
        } catch (error) {
            TreatmentUI.showMessage(TREATMENT_CONFIG.ERROR_MESSAGES.DELETE_FAILED, 'error');
            console.error('Error deleting treatment:', error);
        }
    }
    
    /**
     * مدیریت پرینت درمان
     * @param {HTMLElement} row - ردیف جدول
     */
    handlePrintTreatment(row) {
        const printWindow = window.open('', '_blank', 'height=600,width=800');
        
        // ایجاد محتوای چاپ
        printWindow.document.write(`
            <html dir="rtl">
            <head>
                <title>طرح درمان</title>
                <style>
                    @font-face {
                        font-family: 'IRANSans';
                        src: url('/static/fonts/IRANSans.ttf') format('truetype');
                    }
                    body {
                        font-family: 'IRANSans', Tahoma, Arial, sans-serif;
                        direction: rtl;
                        text-align: right;
                        padding: 20px;
                    }
                    .print-header {
                        text-align: center;
                        margin-bottom: 20px;
                    }
                    .print-header h2 {
                        margin: 5px 0;
                    }
                    .print-info {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 20px;
                    }
                    .print-info-group {
                        width: 48%;
                    }
                    .print-info-item {
                        margin-bottom: 10px;
                    }
                    .print-info-label {
                        font-weight: bold;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 20px;
                    }
                    th, td {
                        border: 1px solid #ddd;
                        padding: 8px;
                        text-align: right;
                    }
                    th {
                        background-color: #f2f2f2;
                    }
                    .print-footer {
                        margin-top: 30px;
                        text-align: center;
                    }
                </style>
            </head>
            <body>
                <div class="print-header">
                    <h2>طرح درمان</h2>
                    <p>کلینیک دندانپزشکی</p>
                </div>
                
                <div class="print-info">
                    <div class="print-info-group">
                        <div class="print-info-item">
                            <span class="print-info-label">نام بیمار:</span>
                            <span>${document.querySelector('input[type="hidden"]#patient-name')?.value || 'نامشخص'}</span>
                        </div>
                        <div class="print-info-item">
                            <span class="print-info-label">شماره پرونده:</span>
                            <span>${document.querySelector('input[type="hidden"]#patient-id')?.value || 'نامشخص'}</span>
                        </div>
                    </div>
                    <div class="print-info-group">
                        <div class="print-info-item">
                            <span class="print-info-label">تاریخ:</span>
                            <span>${new Date().toLocaleDateString('fa-IR')}</span>
                        </div>
                        <div class="print-info-item">
                            <span class="print-info-label">پزشک معالج:</span>
                            <span>${row.querySelector('td:nth-child(6)')?.textContent || 'نامشخص'}</span>
                        </div>
                    </div>
                </div>
                
                <table>
                    <thead>
                        <tr>
                            <th>ردیف</th>
                            <th>نواحی درمان</th>
                            <th>نوع درمان</th>
                            <th>شرح درمان</th>
                            <th>تعرفه عمومی</th>
                            <th>تعرفه تخصصی</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>1</td>
                            <td>${row.querySelector('td:nth-child(3)')?.textContent || ''}</td>
                            <td>${row.querySelector('td:nth-child(4)')?.textContent || ''}</td>
                            <td>${row.querySelector('td:nth-child(5)')?.textContent || ''}</td>
                            <td>${row.querySelector('td:nth-child(8)')?.textContent || ''}</td>
                            <td>${row.querySelector('td:nth-child(9)')?.textContent || ''}</td>
                        </tr>
                    </tbody>
                    <tfoot>
                        <tr>
                            <th colspan="4">جمع کل:</th>
                            <td>${row.querySelector('td:nth-child(8)')?.textContent || ''}</td>
                            <td>${row.querySelector('td:nth-child(9)')?.textContent || ''}</td>
                        </tr>
                    </tfoot>
                </table>
                
                <div class="print-footer">
                    <p>امضای پزشک: ________________</p>
                    <p>امضای بیمار: ________________</p>
                </div>
            </body>
            </html>
        `);
        
        // بستن document و چاپ
        printWindow.document.close();
        printWindow.focus();
        
        // کمی تأخیر برای اطمینان از لود شدن فونت‌ها و استایل‌ها
        setTimeout(() => {
            printWindow.print();
        }, 1000);
    }
    
    /**
     * مدیریت پرداخت درمان
     * @param {string} id - شناسه درمان
     * @param {string} amount - مبلغ قابل پرداخت
     */
    handlePaymentTreatment(id, amount) {
        // نمایش مودال پرداخت
        const paymentModal = document.querySelector('.payment-modal');
        if (!paymentModal) return;
        
        // تنظیم مقادیر در مودال
        const treatmentIdInput = paymentModal.querySelector('#payment-treatment-id');
        const totalAmountInput = paymentModal.querySelector('input[name="total_amount"]');
        const amountInput = paymentModal.querySelector('input[name="amount"]');
        
        if (treatmentIdInput) treatmentIdInput.value = id;
        if (totalAmountInput) totalAmountInput.value = amount;
        if (amountInput) amountInput.value = amount;
        
        // نمایش مودال
        paymentModal.style.display = 'block';
    }
    
    /**
     * مدیریت نمایش مودال پرداخت
     */
    handleShowPayment() {
        // دریافت مبلغ قابل پرداخت از فرم
        const payableAmountInput = document.getElementById('payable-amount');
        const amount = payableAmountInput ? payableAmountInput.value : 0;
        
        // نمایش مودال پرداخت
        const paymentModal = document.querySelector('.payment-modal');
        if (!paymentModal) return;
        
        // تنظیم مقادیر در مودال
        const totalAmountInput = paymentModal.querySelector('input[name="total_amount"]');
        const amountInput = paymentModal.querySelector('input[name="amount"]');
        
        if (totalAmountInput) totalAmountInput.value = amount;
        if (amountInput) amountInput.value = amount;
        
        // نمایش مودال
        paymentModal.style.display = 'block';
    }
    
    /**
     * مدیریت نمایش مودال پرداخت اقساطی
     */
    handleShowInstallment() {
        // دریافت مبلغ قابل پرداخت از فرم
        const payableAmountInput = document.getElementById('payable-amount');
        const amount = payableAmountInput ? payableAmountInput.value : 0;
        
        // نمایش مودال پرداخت اقساطی
        const installmentModal = document.querySelector('.installment-modal');
        if (!installmentModal) return;
        
        // تنظیم مقادیر در مودال
        const totalAmountInput = installmentModal.querySelector('input[name="total_amount"]');
        
        if (totalAmountInput) totalAmountInput.value = amount;
        
        // نمایش مودال
        installmentModal.style.display = 'block';
    }
    
    /**
     * مدیریت صدور فاکتور
     * @param {string} id - شناسه درمان
     */
    handleGenerateInvoice(id) {
        // اینجا می‌توانید کد مربوط به صدور فاکتور را اضافه کنید
        alert('این قابلیت در حال توسعه است');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('[DEBUG] DOM is fully loaded. Initializing treatment system...');
    
    // ابتدا TreatmentUI را مقداردهی اولیه کن
    TreatmentUI.initialize();
    
    // سپس TreatmentManager را ایجاد کن
    console.log('[DEBUG] Creating TreatmentManager instance...');
    const treatmentManager = new TreatmentManager();
    console.log('[DEBUG] TreatmentManager created successfully.');
});


