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


    
async handleTreatmentSubmit() {
    console.log("5. handleTreatmentSubmit function called.");
    try {
        if (!this.validateTreatmentForm()) {
            console.log("6. Form validation FAILED.");
            return;
        }
        console.log("6. Form validation PASSED.");

        const treatmentData = this.collectTreatmentFormData();
        console.log("7. Form data collected:", treatmentData);

        // اضافه کردن مقدار استفاده شده از بیمه
        if (treatmentData.insurance_provider_id && treatmentData.insurance_percentage > 0) {
            const amountAfterDiscount = treatmentData.general_fee - treatmentData.discount;
            const insuranceAmount = (amountAfterDiscount * treatmentData.insurance_percentage) / 100;
            treatmentData.insurance_amount = insuranceAmount;
        }

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
        
        if (response.success) {
            // بروزرسانی جدول درمان‌ها
            await this.refreshTreatmentsTable();
            
            // رفرش تب درمان اگر وجود داشته باشد
            if (document.getElementById('treatment-tab-content')) {
                TreatmentUI.refreshTab('treatment-tab');
            }
            
            // رفرش تب بیمه اگر وجود داشته باشد
            if (document.getElementById('insurance-tab-content')) {
                TreatmentUI.refreshTab('insurance-tab');
            }
            
            // رفرش داده‌های مالی
            if (typeof PaymentManager !== 'undefined' && typeof PaymentManager.refreshFinancialData === 'function') {
                await PaymentManager.refreshFinancialData();
            }
        }

        this.resetTreatmentForm();

    } catch (error) {
        console.error('Error submitting treatment:', error);
        const errorMessage = error.message || 'خطا در ذخیره اطلاعات.';
        TreatmentUI.showMessage(errorMessage, 'error');
    }
}





/**
 * بروزرسانی جدول درمان‌ها
 */
async refreshTreatmentsTable() {
    try {
        const patientId = document.getElementById('patient-id')?.value;
        if (!patientId) {
            console.error('Patient ID not found');
            return;
        }
        
        console.log(`Fetching treatments for patient ID: ${patientId}`);
        const data = await TreatmentAPI.listTreatments(patientId);
        
        if (!data.success) {
            throw new Error(data.message || 'Unknown error');
        }
        
        const treatments = data.treatments || [];
        console.log(`Received ${treatments.length} treatments`);
        
        // لاگ کردن مقادیر payable_amount برای عیب‌یابی
        treatments.forEach(t => {
            console.log(`Treatment ID ${t.id}: payable_amount=${t.payable_amount}, general_fee=${t.general_fee}, special_fee=${t.special_fee}, is_manual_price=${t.is_manual_price}`);
        });
        
        const tableBody = document.querySelector('#treatment-plan-list tbody');
        if (!tableBody) {
            console.error('Treatment table body not found');
            return;
        }
        
        // پاک کردن جدول قبلی
        tableBody.innerHTML = '';
        
        if (treatments.length === 0) {
            const emptyRow = document.createElement('tr');
            // تغییر colspan به 22 برای دو ستون جدید
            emptyRow.innerHTML = `<td colspan="22" class="empty-table">هیچ درمانی ثبت نشده است</td>`;
            tableBody.appendChild(emptyRow);
            return;
        }
        
        // ساخت ردیف‌های جدید
        treatments.forEach((treatment, index) => {
            const row = document.createElement('tr');
            row.dataset.id = treatment.id;
            
            // تبدیل تاریخ‌ها
            const treatmentDate = treatment.treatment_date ? new Date(treatment.treatment_date).toLocaleDateString('fa-IR') : '-';
            const nextVisitDate = treatment.next_visit_date ? new Date(treatment.next_visit_date).toLocaleDateString('fa-IR') : '-';
            
            // وضعیت‌ها
            const insuranceStatus = treatment.insurance_sent 
                ? (treatment.insurance_paid ? '<span class="status-badge success">پرداخت شده</span>' : '<span class="status-badge warning">ارسال شده</span>')
                : '<span class="status-badge danger">ارسال نشده</span>';
                
            const treatmentStatus = treatment.is_completed 
                ? '<span class="status-badge success">انجام شده</span>' 
                : '<span class="status-badge warning">در انتظار</span>';
                
            const visitType = treatment.is_treatment_plan 
                ? '<span class="status-badge info">طرح درمان</span>' 
                : '<span class="status-badge primary">درمان</span>';
            
            // فرمت‌دهی اعداد
            const formatNumber = (num) => {
                if (num === null || num === undefined) return '-';
                return parseFloat(num).toLocaleString() + ' ریال';
            };
            
            // اطلاعات پزشک و دستیار
            const doctorName = treatment.doctor?.full_name || '-';
            const assistantName = treatment.assistant?.full_name || '-';
            const insuranceProviderName = treatment.insurance_provider?.name || '-';
            const insurancePercentage = treatment.insurance_percentage ? `${treatment.insurance_percentage}%` : '-';
            
            // کلاس برای قیمت دستی
            const priceClass = treatment.is_manual_price ? 'manual-price' : '';
            
            // ساخت HTML ردیف - اضافه کردن دو ستون جدید بعد از درصد بیمه
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${treatmentDate}</td>
                <td>${treatment.treatment_areas || '-'}</td>
                <td>${treatment.treatment_type?.title || '-'}</td>
                <td>${treatment.treatment_detail?.description || '-'}</td>
                <td>${doctorName}</td>
                <td>${assistantName}</td>
                <td>${insuranceProviderName}</td>
                <td>${insurancePercentage}</td>
                <td>${formatNumber(treatment.insurance_ceiling)}</td>
                <td>${formatNumber(treatment.insurance_remaining)}</td>
                <td class="${priceClass}">${formatNumber(treatment.general_fee)}</td>
                <td class="${priceClass}">${formatNumber(treatment.special_fee)}</td>
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
                        <button class="action-btn payment" title="پرداخت" onclick="PaymentManager.showPaymentModal('${treatment.id}', '${treatment.payable_amount}')">
                            <i class="fas fa-money-bill"></i>
                        </button>
                        <button class="action-btn installment" title="اقساط" onclick="PaymentManager.showInstallmentModal('${treatment.id}', '${treatment.payable_amount}')">
                            <i class="fas fa-calendar-alt"></i>
                        </button>
                        <button class="action-btn print" title="پرینت" onclick="TreatmentUI.printTreatment('${treatment.id}')">
                            <i class="fas fa-print"></i>
                        </button>
                        <button class="action-btn invoice" title="صدور فاکتور" onclick="TreatmentUI.generateInvoice('${treatment.id}')">
                            <i class="fas fa-file-invoice"></i>
                        </button>
                    </div>
                </td>
            `;
            
            tableBody.appendChild(row);
        });
        
        // اضافه کردن رویدادها به دکمه‌ها
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
// کد نهایی برای treatment-main.js
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
    
    // تبدیل مقادیر عددی به رشته با فرمت صحیح (با نقطه اعشار)
    data.discount = data.discount ? parseFloat(data.discount).toFixed(1) : "0.0";
    data.material_cost = data.material_cost ? parseFloat(data.material_cost).toFixed(1) : "0.0";
    data.lab_cost = data.lab_cost ? parseFloat(data.lab_cost).toFixed(1) : "0.0";
    data.insurance_percentage = data.insurance_percentage ? parseFloat(data.insurance_percentage).toFixed(1) : "0.0";
    
    // بررسی حالت دستی یا خودکار تعرفه
    const manualPriceToggle = document.getElementById('manual-price-toggle');
    if (manualPriceToggle && manualPriceToggle.checked) {
        // استفاده از مقادیر دستی
        const generalFeeManual = document.getElementById('general-fee-manual');
        const specialFeeManual = document.getElementById('special-fee-manual');
        
        if (generalFeeManual) {
            // حذف کاراکترهای غیرعددی و تبدیل به عدد با فرمت صحیح
            const value = parseFloat(generalFeeManual.value.replace(/[^\d]/g, '')) || 0;
            data.general_fee = value.toFixed(1);  // اضافه کردن یک رقم اعشار
        }
        if (specialFeeManual) {
            // حذف کاراکترهای غیرعددی و تبدیل به عدد با فرمت صحیح
            const value = parseFloat(specialFeeManual.value.replace(/[^\d]/g, '')) || 0;
            data.special_fee = value.toFixed(1);  // اضافه کردن یک رقم اعشار
        }
        
        // اضافه کردن فلگ تغییر دستی - به صورت بولین
        data.is_manual_price = true;
        
        console.log('[LOG] Using manual prices:', {
            general_fee: data.general_fee,
            special_fee: data.special_fee,
            is_manual_price: data.is_manual_price
        });
    } else {
        // استفاده از مقادیر خودکار
        const generalFeeInput = document.getElementById('general-fee');
        const specialFeeInput = document.getElementById('special-fee');
        
        if (generalFeeInput && generalFeeInput.dataset.value) {
            // اطمینان از داشتن فرمت صحیح
            const value = parseFloat(generalFeeInput.dataset.value) || 0;
            data.general_fee = value.toFixed(1);  // اضافه کردن یک رقم اعشار
        }
        if (specialFeeInput && specialFeeInput.dataset.value) {
            // اطمینان از داشتن فرمت صحیح
            const value = parseFloat(specialFeeInput.dataset.value) || 0;
            data.special_fee = value.toFixed(1);  // اضافه کردن یک رقم اعشار
        }
        
        data.is_manual_price = false;
        
        console.log('[LOG] Using automatic prices:', {
            general_fee: data.general_fee,
            special_fee: data.special_fee,
            is_manual_price: data.is_manual_price
        });
    }
    
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
    delete data.payable_amount;
    delete data.general_fee_manual;
    delete data.special_fee_manual;
    
    // اضافه کردن نواحی انتخاب شده
    data.treatment_areas = document.getElementById('selected-areas')?.value || '';
    data.area_type = this.determineAreaType();

    console.log('داده‌های نهایی ارسال شده به سرور:', data);
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


