class PaymentManager {
    static config = {};
    static searchTimeout = null;

    static initialize(config) {
        this.config = config;
        console.log("PaymentManager Initialized");
        this.setupEventListeners();
    }

    static setupEventListeners() {
        // رویدادهای تب‌ها
        document.querySelectorAll('.payment_tab-link').forEach(link => {
            link.addEventListener('click', () => this.activateTab(link));
        });
        // نمایش/مخفی کردن فیلدهای چک
        const paymentMethodSelect = document.getElementById('payment_direct-payment-method');
        if (paymentMethodSelect) {
            paymentMethodSelect.addEventListener('change', (e) => {
                const checkDetails = document.getElementById('payment_check-details-group');
                if (e.target.value === 'check') {
                    checkDetails.style.display = 'block';
                } else {
                    checkDetails.style.display = 'none';
                }
            });
        }
        //جستجوی بیمار
        const recipientSearchInput = document.getElementById('payment_transfer-recipient-search');
        if (recipientSearchInput) {
            recipientSearchInput.addEventListener('input', (e) => this.searchRecipients(e.target.value));
        }
        // رویدادهای بستن مودال
        document.querySelectorAll('.payment_modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', e => { if (e.target === overlay) this.closeModal(overlay.id); });
        });
        document.querySelectorAll('.payment_modal-close, .payment_modal-cancel').forEach(btn => {
            btn.addEventListener('click', e => this.closeModal(e.target.closest('.payment_modal-overlay').id));
        });

        // رویداد محاسبه‌گر اقساط
        const installmentInputs = ['#payment_installment-down-payment', '#payment_installment-count', '#payment_installment-interval'];
        installmentInputs.forEach(selector => {
            const input = document.querySelector(selector);
            if (input) input.addEventListener('input', this.calculateInstallments);
        });
    }

    static activateTab(clickedLink) {
        document.querySelectorAll('.payment_tab-link').forEach(l => l.classList.remove('active'));
        document.querySelectorAll('.payment_tab-content').forEach(c => c.classList.remove('active'));
        clickedLink.classList.add('active');
        document.getElementById(clickedLink.dataset.tab).classList.add('active');
    }

    static showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
            setTimeout(() => modal.classList.add('visible'), 10);
        }
    }

    static closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('visible');
            setTimeout(() => modal.style.display = 'none', 300);
        }
    }

    // --- مدیریت نمایش مودال‌ها ---
   
static showPaymentModal(treatmentId, remainingAmount) {
    // ۱. شناسه درمان را در فیلد مخفی قرار بده
    document.getElementById('payment_direct-treatment-id').value = treatmentId;
    
    // ۲. مبلغ باقیمانده را به عنوان مبلغ پیشنهادی در فیلد مبلغ قرار بده
    // مطمئن می‌شویم که مقدار null یا undefined نباشد
    document.getElementById('payment_direct-amount').value = remainingAmount || '';
    
    // ۳. فرم را ریست کن تا اطلاعات قبلی پاک شود (مخصوصاً فیلدهای چک)
    document.getElementById('payment_direct-payment-form').reset();
    document.getElementById('payment_check-details-group').style.display = 'none';

    // ۴. مودال را نمایش بده
    this.showModal('payment_direct-payment-modal-overlay');
}

    static showWalletDepositModal() {
        document.getElementById('payment_wallet-deposit-form').reset();
        this.showModal('payment_wallet-deposit-modal-overlay');
    }

    static showInstallmentModal(treatmentId, remainingAmount) {
        document.getElementById('payment_installment-treatment-id').value = treatmentId;
        document.getElementById('payment_installment-total-amount').value = remainingAmount.toString().replace(/,/g, '');
        this.calculateInstallments();
        this.showModal('payment_installment-modal-overlay');
    }
    
    static showTransferModal() {
    // [اصلاح شده] خواندن موجودی از data-attribute به جای یک المان خاص
    const container = document.getElementById('payment_dashboard_container');
    const balance = container ? container.dataset.walletBalance : '0';
    const formattedBalance = parseFloat(balance).toLocaleString() + ' ریال';

    document.getElementById('payment_transfer-current-balance').value = formattedBalance;
    this.showModal('payment_transfer-modal-overlay');
}

    // --- مدیریت ارسال فرم‌ها ---
    static async handleApiFormSubmit(event, modalId, apiMethod, successMessage) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        if (data.amount) data.amount = data.amount.replace(/,/g, '');
        if (data.down_payment) data.down_payment = data.down_payment.replace(/,/g, '');

        try {
            const response = await apiMethod(data);
            if (response.success) {
                TreatmentUI.showMessage(successMessage, 'success');
                this.closeModal(modalId);
                await this.refreshFinancialData();
            } else {
                TreatmentUI.showMessage(response.message || 'خطا در عملیات', 'error');
            }
        } catch (error) {
            TreatmentUI.showMessage('خطای سرور: ' + error.message, 'error');
        }
    }

    // تابع handleDirectPayment را با این نسخه جایگزین کنید
static async handleDirectPayment(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    // اگر روش پرداخت چک نیست، فیلدهای چک را از داده‌های ارسالی حذف کن
    if (data.payment_method !== 'check') {
        delete data.check_number;
        delete data.check_issuer;
        delete data.check_bank;
        delete data.check_issue_date;
        delete data.check_due_date;
    }

    try {
        const response = await TreatmentAPI.createDirectPayment(data.treatment_id, data);
        if (response.success) {
            TreatmentUI.showMessage(response.message, 'success');
            this.closeModal('payment_direct-payment-modal-overlay');
            await this.refreshFinancialData();
        } else {
            TreatmentUI.showMessage(response.message, 'error');
        }
    } catch (error) {
        TreatmentUI.showMessage('خطا در ثبت پرداخت.', 'error');
        console.error("Error creating direct payment:", error);
    }
}

    static handleWalletDeposit(event) {
        this.handleApiFormSubmit(event, 'payment_wallet-deposit-modal-overlay', 
            (data) => TreatmentAPI.depositToWallet(this.config.patientId, data), 
            'کیف پول با موفقیت شارژ شد.');
    }
    
    static handleInstallmentPlan(event) {
        const treatmentId = document.getElementById('payment_installment-treatment-id').value;
        this.handleApiFormSubmit(event, 'payment_installment-modal-overlay', 
            (data) => TreatmentAPI.createInstallmentPlan(treatmentId, data), 
            'طرح اقساط با موفقیت ایجاد شد.');
    }
    
    static handleTransfer(event) {
        this.handleApiFormSubmit(event, 'payment_transfer-modal-overlay', 
            (data) => TreatmentAPI.transferFromWallet(this.config.patientId, data), 
            'انتقال وجه با موفقیت انجام شد.');
    }

    static async payFromWallet(treatmentId, amount) {
        const numericAmount = parseInt(amount.toString().replace(/,/g, ''));
        const formattedAmount = numericAmount.toLocaleString();
        if (!confirm(`آیا از پرداخت مبلغ ${formattedAmount} ریال از کیف پول برای این درمان اطمینان دارید؟`)) return;
        
        try {
            const response = await TreatmentAPI.payFromWallet(treatmentId, { amount: numericAmount });
            if (response.success) {
                TreatmentUI.showMessage('پرداخت از کیف پول با موفقیت انجام شد.', 'success');
                await this.refreshFinancialData();
            } else {
                TreatmentUI.showMessage(response.message, 'error');
            }
        } catch (error) {
            TreatmentUI.showMessage('خطا در پرداخت از کیف پول.', 'error');
        }
    }
    
    static calculateInstallments() {
        const totalAmount = parseFloat(document.getElementById('payment_installment-total-amount').value.replace(/,/g, '')) || 0;
        const downPayment = parseFloat(document.getElementById('payment_installment-down-payment').value.replace(/,/g, '')) || 0;
        const count = parseInt(document.getElementById('payment_installment-count').value) || 1;
        const interval = parseInt(document.getElementById('payment_installment-interval').value) || 30;
        const previewContainer = document.getElementById('payment_installment-preview-container');

        if (count <= 0 || downPayment > totalAmount) {
            previewContainer.innerHTML = '<p class="payment_empty-row">مقادیر نامعتبر است.</p>';
            return;
        }

        const remaining = totalAmount - downPayment;
        const perInstallment = Math.ceil(remaining / count);
        
        previewContainer.innerHTML = '';
        let startDate = new Date(); // تاریخ شروع از امروز

        for (let i = 1; i <= count; i++) {
            let dueDate = new Date(startDate.getTime() + (i * interval * 24 * 60 * 60 * 1000));
            const formattedDate = dueDate.toLocaleDateString('fa-IR', { year: 'numeric', month: '2-digit', day: '2-digit' });
            const previewItem = document.createElement('div');
            previewItem.innerHTML = `قسط ${i}: <strong>${perInstallment.toLocaleString()} ریال</strong> - تاریخ سررسید: <strong>${formattedDate}</strong>`;
            previewContainer.appendChild(previewItem);
        }
    }

    static async refreshFinancialData() {
        try {
            const response = await fetch(TREATMENT_CONFIG.API_URLS.REFRESH_PAYMENT_TAB(this.config.patientId));
            const html = await response.text();
            const container = document.getElementById('payment_dashboard_container');
            if (container) {
                container.innerHTML = html;
                // Re-initialize events for the new content
                this.setupEventListeners();
            }
        } catch (error) {
            console.error("Failed to refresh financial data:", error);
            TreatmentUI.showMessage('خطا در بروزرسانی اطلاعات مالی.', 'error');
        }
    }
    // در payment-manager.js

// در فایل payment-manager.js

// در فایل payment-manager.js

static async showInstallmentDetails(planId) {
    this.showModal('payment_installment-details-modal-overlay');
    const contentDiv = document.getElementById('payment_installment-details-content');
    contentDiv.innerHTML = '<p class="text-center p-5">در حال بارگذاری اطلاعات...</p>';
    
    try {
        // به جای fetchData که JSON برمی‌گرداند، از fetch معمولی برای گرفتن HTML استفاده می‌کنیم
        const response = await fetch(TREATMENT_CONFIG.API_URLS.GET_INSTALLMENT_PLAN_DETAILS(planId));
        
        if (response.ok) {
            const html = await response.text();
            contentDiv.innerHTML = html;
        } else {
            const errorHtml = await response.text();
            contentDiv.innerHTML = errorHtml;
        }
    } catch (error) {
        contentDiv.innerHTML = `<p class="text-danger text-center p-5">خطا در ارتباط با سرور.</p>`;
        console.error("Error fetching installment details:", error);
    }
}


static async payInstallment(installmentId, amount) {
    const formattedAmount = parseFloat(amount).toLocaleString();
    if (!confirm(`آیا از پرداخت این قسط به مبلغ ${formattedAmount} ریال اطمینان دارید؟`)) return;
    
    try {
        // فراخوانی API که قبلاً ساخته‌ایم
        const response = await TreatmentAPI.payInstallment(installmentId);
        
        if (response.success) {
            TreatmentUI.showMessage(response.message, 'success');
            
            // مودال جزئیات را ببند
            this.closeModal('payment_installment-details-modal-overlay');
            
            // کل تب پرداخت را رفرش کن تا همه چیز بروز شود
            // (وضعیت طرح اقساط، تاریخچه تراکنش‌ها و ...)
            await this.refreshFinancialData();
            
        } else {
            // نمایش پیام خطا از سرور
            TreatmentUI.showMessage(response.message, 'error');
        }
    } catch (error) {
        // نمایش خطای کلی در صورت عدم ارتباط با سرور
        TreatmentUI.showMessage('خطا در ارتباط با سرور برای پرداخت قسط.', 'error');
        console.error('Error paying installment:', error);
    }
}
// این تابع جدید را به کلاس PaymentManager اضافه کنید

// در فایل static/js/payment-manager.js

static async deletePayment(paymentId) {
    // مرحله ۱: از کاربر تاییدیه بگیرید
    if (!confirm('آیا از حذف کامل این پرداخت اطمینان دارید؟ این عمل غیرقابل بازگشت است.')) {
        return; // اگر کاربر انصراف داد، خارج شو
    }

    try {
        // مرحله ۲: درخواست حذف را به سرور بفرستید
        const response = await TreatmentAPI.deletePayment(paymentId);
        
        // مرحله ۳: نتیجه را بررسی کنید
        if (response.success) {
            // اگر موفق بود، پیام را نمایش دهید
            TreatmentUI.showMessage(response.message, 'success');
            
            // مرحله ۴: تب پرداخت را به صورت داینامیک رفرش کنید
            // این کار باعث می‌شود تمام داده‌ها (بدهی، درمان‌های باز و ...) بروز شوند
            await this.refreshFinancialData();
            
        } else {
            // اگر سرور خطا داد، پیام خطا را نمایش دهید
            TreatmentUI.showMessage(response.message, 'error');
        }
    } catch (error) {
        // اگر در ارتباط با سرور مشکلی پیش آمد، خطای عمومی نمایش دهید
        TreatmentUI.showMessage('خطا در ارتباط با سرور برای حذف پرداخت.', 'error');
        console.error("Error deleting payment:", error);
    }
}

static showRefundModal(paymentId) {
    // شناسه پرداخت را در فیلد مخفی مودال قرار می‌دهیم
    document.getElementById('payment_refund-payment-id').value = paymentId;
    // مودال را نمایش می‌دهیم
    this.showModal('payment_refund-modal-overlay');
}

static async handleRefund(event) {
    event.preventDefault(); // از رفرش شدن صفحه جلوگیری کن
    const form = event.target;
    const paymentId = form.querySelector('#payment_refund-payment-id').value;
    const reason = form.querySelector('#payment_refund-reason').value;

    try {
        const response = await TreatmentAPI.refundPayment(paymentId, { reason: reason });

        if (response.success) {
            TreatmentUI.showMessage(response.message, 'success');
            this.closeModal('payment_refund-modal-overlay');
            await this.refreshFinancialData(); // تب پرداخت را رفرش کن
        } else {
            TreatmentUI.showMessage(response.message, 'error');
        }
    } catch (error) {
        TreatmentUI.showMessage('خطا در عملیات عودت وجه.', 'error');
        console.error("Error refunding payment:", error);
    }
}
// در فایل static/js/payment-manager.js
// در فایل static/js/payment-manager.js

static searchRecipients(query) {
    clearTimeout(this.searchTimeout);
    const resultsContainer = document.getElementById('payment_transfer-search-results');
    
    if (query.length < 2) {
        resultsContainer.innerHTML = '';
        resultsContainer.style.display = 'none';
        return;
    }

    this.searchTimeout = setTimeout(async () => {
        try {
            // [اصلاح نهایی] آدرس صحیح API جستجو مطابق با urls.py
            const response = await fetch(`/Patient/sr-search/?query=${query}`, {
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            });

            if (!response.ok) {
                throw new Error(`خطای سرور: ${response.status}`);
            }

            const result = await response.json();

            if (result.status === 'success' && result.data.length > 0) {
                resultsContainer.innerHTML = '';
                result.data.forEach(patient => {
                    const item = document.createElement('div');
                    item.className = 'payment_search-result-item';
                    item.innerHTML = `<strong>${patient.name}</strong> (پرونده: ${patient.file_num})`;
                    item.onclick = () => this.selectRecipient(patient.name, patient.file_num);
                    resultsContainer.appendChild(item);
                });
                resultsContainer.style.display = 'block';
            } else {
                resultsContainer.innerHTML = '<div class="payment_search-no-results">بیماری یافت نشد.</div>';
                resultsContainer.style.display = 'block';
            }
        } catch (error) {
            console.error("Error searching for recipients:", error);
            resultsContainer.innerHTML = '<div class="payment_search-no-results">خطا در جستجو.</div>';
            resultsContainer.style.display = 'block';
        }
    }, 300);
}


    static selectRecipient(name, fileNum) {
        document.getElementById('payment_transfer-recipient-search').value = name;
        document.getElementById('payment_transfer-recipient-filenum').value = fileNum;
        const resultsContainer = document.getElementById('payment_transfer-search-results');
        resultsContainer.innerHTML = '';
        resultsContainer.style.display = 'none';
    }
    
static async clearCheck(paymentId) {
    if (!confirm('آیا از وصول این چک و نهایی کردن پرداخت اطمینان دارید؟')) return;

    try {
        const response = await TreatmentAPI.clearCheckPayment(paymentId);
        if (response.success) {
            TreatmentUI.showMessage(response.message, 'success');
            await this.refreshFinancialData(); // رفرش کردن تب برای نمایش تغییرات
        } else {
            TreatmentUI.showMessage(response.message, 'error');
        }
    } catch (error) {
        TreatmentUI.showMessage('خطا در عملیات وصول چک.', 'error');
        console.error("Error clearing check:", error);
    }
}
}
