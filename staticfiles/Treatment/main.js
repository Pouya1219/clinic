/**
 * کلاس اصلی مدیریت درمان
 */
class TreatmentManager {
    constructor() {
        // راه‌اندازی رابط کاربری
        TreatmentUI.initialize();
        
        // راه‌اندازی رویدادها
        this.initEventListeners();
        
        console.log('TreatmentManager initialized');
    }
    
    /**
     * راه‌اندازی گوش‌دهنده‌های رویداد
     */
    initEventListeners() {
        // رویداد ارسال فرم درمان
        const treatmentForm = document.getElementById('treatment-form');
        const saveButton = document.getElementById('save-treatment');
        
        if (saveButton && treatmentForm) {
            saveButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleTreatmentSubmit();
            });
        }
        
        // رویدادهای جدول درمان‌ها
        document.addEventListener('click', (e) => {
            // دکمه ویرایش
            if (e.target.closest('.action-btn.edit')) {
                const row = e.target.closest('tr');
                const id = row.dataset.id;
                this.handleEditTreatment(id);
            }
            
            // دکمه حذف
            if (e.target.closest('.action-btn.delete')) {
                const row = e.target.closest('tr');
                const id = row.dataset.id;
                this.handleDeleteTreatment(id);
            }
            
            // دکمه پرینت
            if (e.target.closest('.action-btn.print')) {
                const row = e.target.closest('tr');
                this.handlePrintTreatment(row);
            }
            
            // دکمه پرداخت
            if (e.target.closest('.action-btn.payment')) {
                const row = e.target.closest('tr');
                const id = row.dataset.id;
                const amount = row.dataset.amount;
                this.handlePaymentTreatment(id, amount);
            }
            
            // دکمه صدور فاکتور
            if (e.target.closest('.action-btn.invoice')) {
                const row = e.target.closest('tr');
                const id = row.dataset.id;
                this.handleGenerateInvoice(id);
            }
        });
        
        // رویداد نمایش مودال پرداخت
        const showPaymentButton = document.getElementById('show-payment');
        if (showPaymentButton) {
            showPaymentButton.addEventListener('click', () => {
                this.handleShowPayment();
            });
        }
        
        // رویداد نمایش مودال پرداخت اقساطی
        const showInstallmentButton = document.getElementById('show-installment');
        if (showInstallmentButton) {
            showInstallmentButton.addEventListener('click', () => {
                this.handleShowInstallment();
            });
        }
    }
    
    /**
     * مدیریت ارسال فرم درمان
     */
    async handleTreatmentSubmit() {
        try {
            // اعتبارسنجی فرم
            if (!this.validateTreatmentForm()) {
                TreatmentUI.showMessage(TREATMENT_CONFIG.ERROR_MESSAGES.VALIDATION_FAILED, 'warning');
                return;
            }
            
            // جمع‌آوری داده‌های فرم
            const treatmentData = this.collectTreatmentFormData();
            
            // بررسی حالت ویرایش یا ایجاد
            const treatmentId = document.getElementById('treatment-id').value;
            let response;
            
            if (treatmentId) {
                // ویرایش درمان موجود
                response = await TreatmentAPI.updateTreatment(treatmentId, treatmentData);
                TreatmentUI.showMessage('درمان با موفقیت بروزرسانی شد', 'success');
            } else {
                // ایجاد درمان جدید
                response = await TreatmentAPI.createTreatment(treatmentData);
                TreatmentUI.showMessage('درمان با موفقیت ثبت شد', 'success');
            }
            
            // بارگذاری مجدد صفحه یا بروزرسانی جدول
            setTimeout(() => {
                window.location.reload();
            }, 1000);
            
        } catch (error) {
            TreatmentUI.showMessage(TREATMENT_CONFIG.ERROR_MESSAGES.SAVE_FAILED, 'error');
            console.error('Error submitting treatment:', error);
        }
    }
    
    /**
     * اعتبارسنجی فرم درمان
     * @returns {boolean} نتیجه اعتبارسنجی
     */
    validateTreatmentForm() {
        // بررسی انتخاب نواحی درمان
        const selectedAreas = document.getElementById('selected-areas');
        if (!selectedAreas || !selectedAreas.value) {
            TreatmentUI.showMessage('لطفاً حداقل یک ناحیه درمان انتخاب کنید', 'warning');
            return false;
        }
        
        // بررسی انتخاب نوع درمان
        const treatmentType = document.getElementById('treatment-type');
        if (!treatmentType || !treatmentType.value) {
            TreatmentUI.showMessage('لطفاً نوع درمان را انتخاب کنید', 'warning');
            return false;
        }
        
        // بررسی انتخاب شرح درمان
        const treatmentDetail = document.getElementById('treatment-detail');
        if (!treatmentDetail || !treatmentDetail.value) {
            TreatmentUI.showMessage('لطفاً شرح درمان را انتخاب کنید', 'warning');
            return false;
        }
        
        // بررسی انتخاب پزشک
        const doctorSelect = document.querySelector('select[name="doctor"]');
        if (!doctorSelect || !doctorSelect.value) {
            TreatmentUI.showMessage('لطفاً پزشک معالج را انتخاب کنید', 'warning');
            return false;
        }
        
        // بررسی تاریخ مراجعه
        const visitDateInput = document.getElementById('Visit-date');
        if (!visitDateInput || !visitDateInput.value) {
            TreatmentUI.showMessage('لطفاً تاریخ مراجعه را وارد کنید', 'warning');
            return false;
        }
        
        return true;
    }
    
    /**
     * جمع‌آوری داده‌های فرم درمان
     * @returns {Object} داده‌های فرم
     */
    collectTreatmentFormData() {
        // دریافت شناسه بیمار از فرم
        const patientIdInput = document.querySelector('input[name="patient_id"]');
        const patientId = patientIdInput ? patientIdInput.value : '';
        
        // دریافت نوع درمان و شرح درمان
        const treatmentTypeSelect = document.getElementById('treatment-type');
        const treatmentDetailSelect = document.getElementById('treatment-detail');
        
        // دریافت نواحی درمان
        const selectedAreasInput = document.getElementById('selected-areas');
        const treatmentAreas = selectedAreasInput ? selectedAreasInput.value : '';
        
        // دریافت تعرفه‌ها
        const generalFeeInput = document.getElementById('general-fee');
        const specialFeeInput = document.getElementById('special-fee');
        const generalFee = generalFeeInput ? parseInt(generalFeeInput.dataset.value || 0) : 0;
        const specialFee = specialFeeInput ? parseInt(specialFeeInput.dataset.value || 0) : 0;
        
        // دریافت سایر فیلدها
        const doctorSelect = document.querySelector('select[name="doctor"]');
        const assistantSelect = document.querySelector('select[name="assistant"]');
        const visitDateInput = document.getElementById('Visit-date');
        const nextVisitDateInput = document.getElementById('next-Visit-date');
        const discountInput = document.getElementById('discount');
        const materialCostInput = document.getElementById('material-cost');
        const labCostInput = document.getElementById('lab-cost');
        const payableAmountInput = document.getElementById('payable-amount');
        const insuranceProviderSelect = document.getElementById('insurance-provider');
        const insurancePercentageInput = document.getElementById('insurance-percentage');
        const insuranceSentCheckbox = document.getElementById('insurance-sent');
        const isTreatmentCompletedCheckbox = document.getElementById('is-completed');
        const isInsurancePaidCheckbox = document.getElementById('insurance-paid');
        const isTreatmentPlanCheckbox = document.getElementById('is-treatment-plan');
        const descriptionTextarea = document.getElementById('description');
        
        // ساخت آبجکت داده‌ها
        return {
            patient_id: patientId,
            treatment_date: visitDateInput ? visitDateInput.value : '',
            next_visit_date: nextVisitDateInput ? nextVisitDateInput.value : '',
            treatment_type_id: treatmentTypeSelect ? treatmentTypeSelect.value : '',
            treatment_detail_id: treatmentDetailSelect ? treatmentDetailSelect.value : '',
            treatment_areas: treatmentAreas,
            area_type: 'teeth', // فعلاً فقط دندان پشتیبانی می‌شود
            doctor_id: doctorSelect ? doctorSelect.value : '',
            assistant_id: assistantSelect ? assistantSelect.value : '',
            general_fee: generalFee,
            special_fee: specialFee,
            discount: discountInput ? parseInt(discountInput.value || 0) : 0,
            material_cost: materialCostInput ? parseInt(materialCostInput.value || 0) : 0,
            lab_cost: labCostInput ? parseInt(labCostInput.value || 0) : 0,
            payable_amount: payableAmountInput ? parseInt(payableAmountInput.value || 0) : 0,
            insurance_provider_id: insuranceProviderSelect ? insuranceProviderSelect.value : '',
            insurance_percentage: insurancePercentageInput ? parseInt(insurancePercentageInput.value || 0) : 0,
            insurance_sent: insuranceSentCheckbox ? insuranceSentCheckbox.checked : false,
            is_completed: isTreatmentCompletedCheckbox ? isTreatmentCompletedCheckbox.checked : false,
            insurance_paid: isInsurancePaidCheckbox ? isInsurancePaidCheckbox.checked : false,
            is_treatment_plan: isTreatmentPlanCheckbox ? isTreatmentPlanCheckbox.checked : false,
            description: descriptionTextarea ? descriptionTextarea.value : '',
        };
    }
    
    /**
     * مدیریت ویرایش درمان
     * @param {string} id - شناسه درمان
     */
    async handleEditTreatment(id) {
        try {
            // دریافت اطلاعات درمان از سرور
            const treatment = await TreatmentAPI.getTreatment(id);
            
            // پر کردن فرم با اطلاعات درمان
            this.fillTreatmentForm(treatment);
            
            // اسکرول به بالای صفحه
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            // تغییر متن دکمه ثبت
            const submitButton = document.getElementById('save-treatment');
            if (submitButton) {
                submitButton.textContent = 'بروزرسانی درمان';
            }
            
            // ذخیره شناسه درمان در فرم
            const treatmentIdInput = document.getElementById('treatment-id');
            if (treatmentIdInput) {
                treatmentIdInput.value = id;
            }
            
        } catch (error) {
            TreatmentUI.showMessage(TREATMENT_CONFIG.ERROR_MESSAGES.FETCH_FAILED, 'error');
            console.error('Error fetching treatment:', error);
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
    // گوش دادن به کلیک روی تب درمان
    const treatmentTab = document.querySelector('.nav-tab[data-tab="treatment"]');
    if (treatmentTab) {
        console.log("Treatment tab found, adding click listener");
        treatmentTab.addEventListener('click', function() {
            console.log("Treatment tab clicked");
            loadTreatmentContent();
        });
    }
    else{
        console.error("Treatment tab not found!");
    }
    // بررسی وجود عنصر patient-id
    const patientIdElement = document.querySelector('input#patient-id');
    if (patientIdElement) {
        console.log("Patient ID element found, value:", patientIdElement.value);
    } else {
        console.error("Patient ID element not found!");
    }
    // تابع بارگذاری محتوای تب درمان
function loadTreatmentContent() {
    const patientId = document.querySelector('input#patient-id').value;
    const treatmentContainer = document.getElementById('treatment-content-container');
    
    if (!patientId || !treatmentContainer) return;
    
    console.log("Loading treatment content for patient ID:", patientId); // برای دیباگ
    
    // نمایش لودینگ
    treatmentContainer.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> در حال بارگذاری...</div>';
    
    // ارسال درخواست AJAX - مسیر URL را اصلاح کردم
    fetch(`/treatment/view/${patientId}/`)
        .then(response => {
            console.log("Response status:", response.status); // برای دیباگ
            if (!response.ok) {
                throw new Error(`خطا در دریافت اطلاعات: ${response.status}`);
            }
            return response.text();
        })
        .then(html => {
            console.log("Received HTML response"); // برای دیباگ
            // استخراج محتوای اصلی از پاسخ HTML
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const treatmentContent = doc.querySelector('.treatment-container');
            
            if (treatmentContent) {
                treatmentContainer.innerHTML = '';
                treatmentContainer.appendChild(treatmentContent);
                
                // اجرای اسکریپت‌های مورد نیاز
                loadTreatmentScripts();
            } else {
                console.error("Treatment container not found in response"); // برای دیباگ
                treatmentContainer.innerHTML = '<div class="error-message">محتوای درمان یافت نشد</div>';
            }
        })
        .catch(error => {
            console.error('Error loading treatment content:', error);
            treatmentContainer.innerHTML = `<div class="error-message">خطا در بارگذاری محتوا: ${error.message}</div>`;
        });
}
    
    // بارگذاری اسکریپت‌های مورد نیاز برای تب درمان
    function loadTreatmentScripts() {
        // بررسی اینکه آیا اسکریپت‌ها قبلاً بارگذاری شده‌اند
        if (window.TreatmentUI && window.TreatmentManager) {
            // اگر قبلاً بارگذاری شده‌اند، فقط راه‌اندازی مجدد کنید
            new TreatmentManager();
            return;
        }
        
        // بارگذاری اسکریپت‌های مورد نیاز
        const scripts = [
            '/static/Treatment/config.js',
            '/static/Treatment/api.js',
            '/static/Treatment/ui-treatment.js',
            '/static/Treatment/main.js'
        ];
        
        let loadedScripts = 0;
        scripts.forEach(src => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = () => {
                loadedScripts++;
                if (loadedScripts === scripts.length) {
                    // همه اسکریپت‌ها بارگذاری شدند
                    new TreatmentManager();
                }
            };
            document.body.appendChild(script);
        });
    }
});

