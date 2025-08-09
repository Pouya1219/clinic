/**
 * کلاس مدیریت رابط کاربری پرداخت
 */
class PaymentUI {
    /**
     * راه‌اندازی اولیه رابط کاربری پرداخت
     */
    static initialize() {
        console.log('PaymentUI initialized');
        
        // مخفی کردن فیلدهای چک در ابتدا
        document.getElementById('check-fields').style.display = 'none';
        
        // تنظیم رویدادها
        this.setupEventListeners();
        
        // محاسبه مبلغ هر قسط در صورت تغییر پیش پرداخت یا تعداد اقساط
        this.setupInstallmentCalculation();
    }
    
    /**
     * تنظیم گوش‌دهنده‌های رویداد
     */
    static setupEventListeners() {
        // رویداد تغییر روش پرداخت
        const paymentMethod = document.getElementById('payment-method');
        if (paymentMethod) {
            paymentMethod.addEventListener('change', function() {
                const checkFields = document.getElementById('check-fields');
                if (this.value === 'check') {
                    checkFields.style.display = 'block';
                } else {
                    checkFields.style.display = 'none';
                }
            });
        }
        
        // رویداد بستن مودال پرداخت
        const closePaymentModal = document.getElementById('close-payment-modal');
        const cancelPayment = document.getElementById('cancel-payment');
        if (closePaymentModal) closePaymentModal.addEventListener('click', this.closePaymentModal);
        if (cancelPayment) cancelPayment.addEventListener('click', this.closePaymentModal);
        
        // رویداد بستن مودال پرداخت اقساطی
        const closeInstallmentModal = document.getElementById('close-installment-modal');
        const cancelInstallment = document.getElementById('cancel-installment');
        if (closeInstallmentModal) closeInstallmentModal.addEventListener('click', this.closeInstallmentModal);
        if (cancelInstallment) cancelInstallment.addEventListener('click', this.closeInstallmentModal);
        
        // رویداد بستن مودال مشاهده اقساط
        const closeViewInstallmentsModal = document.getElementById('close-view-installments-modal');
        if (closeViewInstallmentsModal) closeViewInstallmentsModal.addEventListener('click', this.closeViewInstallmentsModal);
        
        // رویداد بستن مودال تاریخچه پرداخت
        const closePaymentHistoryModal = document.getElementById('close-payment-history-modal');
        if (closePaymentHistoryModal) closePaymentHistoryModal.addEventListener('click', this.closePaymentHistoryModal);
        
        // رویداد ارسال فرم پرداخت
        const paymentForm = document.getElementById('payment-form');
        if (paymentForm) {
            paymentForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitPayment();
            });
        }
        
        // رویداد ارسال فرم پرداخت اقساطی
        const installmentForm = document.getElementById('installment-form');
        if (installmentForm) {
            installmentForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitInstallmentPlan();
            });
        }
        
                // رویداد جستجو در پرداخت‌ها
        const paymentSearch = document.getElementById('payment-search');
        if (paymentSearch) {
            paymentSearch.addEventListener('input', () => {
                this.filterPayments(paymentSearch.value);
            });
        }
        
        // رویداد فیلتر وضعیت پرداخت
        const paymentStatusFilter = document.getElementById('payment-status-filter');
        if (paymentStatusFilter) {
            paymentStatusFilter.addEventListener('change', () => {
                this.filterByStatus(paymentStatusFilter.value);
            });
        }
        
        // رویداد فیلتر تاریخ پرداخت
        const paymentDateFilter = document.getElementById('payment-date-filter');
        if (paymentDateFilter) {
            paymentDateFilter.addEventListener('change', () => {
                this.filterByDate(paymentDateFilter.value);
            });
        }
    }
    
    /**
     * تنظیم محاسبه خودکار مبلغ هر قسط
     */
    static setupInstallmentCalculation() {
        const downPayment = document.getElementById('down-payment');
        const installmentCount = document.getElementById('installment-count');
        const totalAmount = document.getElementById('installment-total-amount');
        const installmentAmount = document.getElementById('installment-amount');
        const previewContainer = document.getElementById('installment-preview-container');
        const startDate = document.getElementById('installment-start-date');
        const intervalDays = document.getElementById('interval-days');
        
        if (downPayment && installmentCount && totalAmount && installmentAmount) {
            const calculateInstallment = () => {
                const total = parseFloat(totalAmount.value.replace(/[^\d.-]/g, '')) || 0;
                const down = parseFloat(downPayment.value) || 0;
                const count = parseInt(installmentCount.value) || 1;
                
                if (count <= 0 || down >= total) {
                    installmentAmount.value = '0';
                    if (previewContainer) previewContainer.innerHTML = '';
                    return;
                }
                
                const remaining = total - down;
                const perInstallment = Math.ceil(remaining / count);
                
                installmentAmount.value = perInstallment.toLocaleString() + ' ریال';
                
                // نمایش پیش‌نمایش اقساط
                if (previewContainer && startDate && intervalDays) {
                    this.generateInstallmentPreview(
                        previewContainer, 
                        count, 
                        perInstallment, 
                        startDate.value, 
                        parseInt(intervalDays.value) || 30
                    );
                }
            };
            
            downPayment.addEventListener('input', calculateInstallment);
            installmentCount.addEventListener('input', calculateInstallment);
            startDate.addEventListener('change', calculateInstallment);
            intervalDays.addEventListener('input', calculateInstallment);
        }
    }
    
    /**
     * تولید پیش‌نمایش اقساط
     * @param {HTMLElement} container - المان نمایش پیش‌نمایش
     * @param {number} count - تعداد اقساط
     * @param {number} amount - مبلغ هر قسط
     * @param {string} startDate - تاریخ شروع
     * @param {number} intervalDays - فاصله بین اقساط (روز)
     */
    static generateInstallmentPreview(container, count, amount, startDate, intervalDays) {
        container.innerHTML = '';
        
        const start = new Date(startDate);
        
        for (let i = 1; i <= count; i++) {
            const dueDate = new Date(start);
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
     * نمایش مودال پرداخت
     * @param {string} treatmentId - شناسه درمان
     * @param {string} amount - مبلغ قابل پرداخت
     */
    static showPaymentModal(treatmentId, amount) {
        const modal = document.getElementById('payment-modal');
        const treatmentIdInput = document.getElementById('payment-treatment-id');
        const totalAmountInput = document.getElementById('payment-total-amount');
        const paymentAmountInput = document.getElementById('payment-amount');
        
        if (modal && treatmentIdInput && totalAmountInput && paymentAmountInput) {
            treatmentIdInput.value = treatmentId;
            
            // تبدیل مبلغ به عدد و فرمت‌دهی
            const numericAmount = parseFloat(amount.replace(/[^\d.-]/g, '')) || 0;
            totalAmountInput.value = numericAmount.toLocaleString() + ' ریال';
            paymentAmountInput.value = numericAmount;
            
            // نمایش مودال
            modal.style.display = 'block';
        }
    }
    
    /**
     * بستن مودال پرداخت
     */
    static closePaymentModal() {
        const modal = document.getElementById('payment-modal');
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
        const modal = document.getElementById('installment-modal');
        const treatmentIdInput = document.getElementById('installment-treatment-id');
        const totalAmountInput = document.getElementById('installment-total-amount');
        const downPaymentInput = document.getElementById('down-payment');
        const installmentCountInput = document.getElementById('installment-count');
        
        if (modal && treatmentIdInput && totalAmountInput && downPaymentInput && installmentCountInput) {
            treatmentIdInput.value = treatmentId;
            
            // تبدیل مبلغ به عدد و فرمت‌دهی
            const numericAmount = parseFloat(amount.replace(/[^\d.-]/g, '')) || 0;
            totalAmountInput.value = numericAmount.toLocaleString() + ' ریال';
            
            // تنظیم مقادیر پیش‌فرض
            downPaymentInput.value = Math.round(numericAmount * 0.3); // 30% پیش پرداخت
            installmentCountInput.value = 3; // 3 قسط پیش‌فرض
            
            // محاسبه مبلغ هر قسط
            const event = new Event('input');
            downPaymentInput.dispatchEvent(event);
            
            // نمایش مودال
            modal.style.display = 'block';
        }
    }
    
    /**
     * بستن مودال پرداخت اقساطی
     */
    static closeInstallmentModal() {
        const modal = document.getElementById('installment-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
    
    /**
     * نمایش مودال مشاهده اقساط
     * @param {string} planId - شناسه طرح اقساط
     */
    static async viewInstallments(planId) {
        try {
            // دریافت اطلاعات طرح اقساط از سرور
            const response = await fetch(`/patient/treatment/installment-plan/${planId}/`);
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
                    `<button class="action-btn print" onclick="PaymentUI.printInstallmentReceipt('${installment.id}')">
                        <i class="fas fa-print"></i>
                    </button>` : 
                    `<button class="action-btn payment" onclick="PaymentUI.payInstallment('${installment.id}')">
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
            alert('خطا در دریافت اطلاعات اقساط: ' + error.message);
        }
    }
    
    /**
     * بستن مودال مشاهده اقساط
     */
    static closeViewInstallmentsModal() {
        const modal = document.getElementById('view-installments-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
    
    /**
     * نمایش تاریخچه پرداخت
     * @param {string} treatmentId - شناسه درمان
     */
    static async showPaymentHistory(treatmentId) {
        try {
            // دریافت اطلاعات پرداخت‌ها از سرور
            const response = await fetch(`/patient/treatment/payment-history/${treatmentId}/`);
            if (!response.ok) throw new Error('خطا در دریافت تاریخچه پرداخت');
            
            const data = await response.json();
            
            // نمایش اطلاعات درمان
            document.getElementById('history-treatment-type').textContent = data.treatment.treatment_detail.description;
            document.getElementById('history-treatment-date').textContent = new Date(data.treatment.treatment_date).toLocaleDateString('fa-IR');
            document.getElementById('history-total-amount').textContent = data.treatment.payable_amount.toLocaleString() + ' ریال';
            
            // نمایش جزئیات پرداخت‌ها
            const tableBody = document.getElementById('payment-details-body');
            tableBody.innerHTML = '';
            
            if (data.payments.length === 0) {
                const row = document.createElement('tr');
                row.innerHTML = `<td colspan="5" class="empty-table">هیچ پرداختی ثبت نشده است</td>`;
                tableBody.appendChild(row);
            } else {
                data.payments.forEach((payment, index) => {
                    const row = document.createElement('tr');
                    
                    const paymentMethods = {
                        'cash': 'نقدی',
                        'card': 'کارت به کارت',
                        'pos': 'کارتخوان',
                        'check': 'چک'
                    };
                    
                    row.innerHTML = `
                        <td>${index + 1}</td>
                        <td>${new Date(payment.payment_date).toLocaleDateString('fa-IR')}</td>
                        <td>${payment.amount.toLocaleString()} ریال</td>
                        <td>${paymentMethods[payment.payment_method] || payment.payment_method}</td>
                        <td>${payment.description || '-'}</td>
                    `;
                    
                    tableBody.appendChild(row);
                });
            }
            
            // نمایش مودال
            document.getElementById('payment-history-modal').style.display = 'block';
            
        } catch (error) {
            console.error('Error showing payment history:', error);
            alert('خطا در دریافت تاریخچه پرداخت: ' + error.message);
        }
    }
    
    /**
     * بستن مودال تاریخچه پرداخت
     */
    static closePaymentHistoryModal() {
        const modal = document.getElementById('payment-history-modal');
        if (modal) {
            modal.style.display = 'none';
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
            const response = await fetch('/patient/treatment/payment/create/', {
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
            alert('پرداخت با موفقیت ثبت شد');
            
            // بستن مودال و بارگذاری مجدد صفحه
            this.closePaymentModal();
            window.location.reload();
            
        } catch (error) {
            console.error('Error submitting payment:', error);
            alert('خطا در ثبت پرداخت: ' + error.message);
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
            const response = await fetch('/patient/treatment/installment/create/', {
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
            alert('برنامه اقساط با موفقیت ثبت شد');
            
            // بستن مودال و بارگذاری مجدد صفحه
            this.closeInstallmentModal();
            window.location.reload();
            
        } catch (error) {
            console.error('Error submitting installment plan:', error);
            alert('خطا در ثبت برنامه اقساط: ' + error.message);
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
            const response = await fetch(`/patient/treatment/installment/pay/${installmentId}/`, {
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
            alert('پرداخت قسط با موفقیت ثبت شد');
            
            // بستن مودال و بارگذاری مجدد صفحه
            this.closeViewInstallmentsModal();
            window.location.reload();
            
        } catch (error) {
            console.error('Error paying installment:', error);
            alert('خطا در پرداخت قسط: ' + error.message);
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
     * حذف پرداخت
     * @param {string} paymentId - شناسه پرداخت
     */
    static async deletePayment(paymentId) {
        try {
            if (!confirm('آیا از حذف این پرداخت اطمینان دارید؟')) return;
            
            // ارسال به سرور
            const response = await fetch(`/patient/treatment/payment/delete/${paymentId}/`, {
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
            alert('پرداخت با موفقیت حذف شد');
            
            // بارگذاری مجدد صفحه
            window.location.reload();
            
        } catch (error) {
            console.error('Error deleting payment:', error);
            alert('خطا در حذف پرداخت: ' + error.message);
        }
    }
    
    /**
     * فیلتر پرداخت‌ها بر اساس متن جستجو
     * @param {string} query - متن جستجو
     */
    static filterPayments(query) {
        query = query.toLowerCase();
        
        const rows = document.querySelectorAll('#treatments-for-payment tbody tr');
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            if (text.includes(query)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }
    
    /**
     * فیلتر پرداخت‌ها بر اساس وضعیت
     * @param {string} status - وضعیت پرداخت
     */
    static filterByStatus(status) {
        // پیاده‌سازی فیلتر بر اساس وضعیت
        console.log('Filter by status:', status);
    }
    
    /**
     * فیلتر پرداخت‌ها بر اساس تاریخ
     * @param {string} dateRange - بازه زمانی
     */
    static filterByDate(dateRange) {
        // پیاده‌سازی فیلتر بر اساس تاریخ
        console.log('Filter by date range:', dateRange);
    }
    
    /**
     * دریافت توکن CSRF
     * @returns {string} توکن CSRF
     */
    static getCsrfToken() {
        const cookieValue = document.cookie
            .split('; ')
            .find(row => row.startsWith('csrftoken='))
            ?.split('=')[1];
        return cookieValue || '';
    }
}

// راه‌اندازی در زمان بارگذاری صفحه
document.addEventListener('DOMContentLoaded', function() {
    PaymentUI.initialize();
});
