/**
 * کلاس مدیریت رابط کاربری درمان
 */
class TreatmentUI {
    /**
     * نمایش پیام به کاربر
     * @param {string} message - متن پیام
     * @param {string} type - نوع پیام (success, error, warning, info)
     * @param {number} duration - مدت زمان نمایش به میلی‌ثانیه
     */
    static showMessage(message, type = 'info', duration = 3000) {
        // اگر المان پیام وجود نداشت، آن را ایجاد کن
        let messageContainer = document.getElementById('treatment_message-container');
        if (!messageContainer) {
            messageContainer = document.createElement('div');
            messageContainer.id = 'treatment_message-container';
            messageContainer.className = 'treatment_message-container';
            document.body.appendChild(messageContainer);
            
            // استایل برای کانتینر پیام‌ها
            messageContainer.style.position = 'fixed';
            messageContainer.style.top = '20px';
            messageContainer.style.left = '50%';
            messageContainer.style.transform = 'translateX(-50%)';
            messageContainer.style.zIndex = '9999';
            messageContainer.style.display = 'flex';
            messageContainer.style.flexDirection = 'column';
            messageContainer.style.alignItems = 'center';
        }
        
        // ایجاد المان پیام
        const messageElement = document.createElement('div');
        messageElement.className = `treatment_message treatment_message-${type}`;
        messageElement.textContent = message;
        
        // استایل برای المان پیام
        messageElement.style.padding = '10px 20px';
        messageElement.style.margin = '5px 0';
        messageElement.style.borderRadius = '4px';
        messageElement.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
        messageElement.style.minWidth = '250px';
        messageElement.style.textAlign = 'center';
        messageElement.style.opacity = '0';
        messageElement.style.transition = 'opacity 0.3s ease-in-out';
        
        // تنظیم رنگ بر اساس نوع پیام
        switch (type) {
            case 'success':
                messageElement.style.backgroundColor = '#d4edda';
                messageElement.style.color = '#155724';
                messageElement.style.borderColor = '#c3e6cb';
                break;
            case 'error':
                messageElement.style.backgroundColor = '#f8d7da';
                messageElement.style.color = '#721c24';
                messageElement.style.borderColor = '#f5c6cb';
                break;
            case 'warning':
                messageElement.style.backgroundColor = '#fff3cd';
                messageElement.style.color = '#856404';
                messageElement.style.borderColor = '#ffeeba';
                break;
            default: // info
                messageElement.style.backgroundColor = '#d1ecf1';
                messageElement.style.color = '#0c5460';
                messageElement.style.borderColor = '#bee5eb';
        }
        
        // افزودن پیام به کانتینر
        messageContainer.appendChild(messageElement);
        
        // نمایش پیام با انیمیشن
        setTimeout(() => {
            messageElement.style.opacity = '1';
        }, 10);
        
        // حذف پیام پس از مدت زمان مشخص
        setTimeout(() => {
            messageElement.style.opacity = '0';
            setTimeout(() => {
                messageContainer.removeChild(messageElement);
            }, 300);
        }, duration);
    }

    /**
     * مدیریت انتخاب دندان‌ها
     */
    static initializeToothSelection() {
        // انتخاب تک دندان
        document.querySelectorAll('.dental-tooth').forEach(tooth => {
            tooth.addEventListener('click', function() {
                this.classList.toggle('selected');
                TreatmentUI.updateSelectedTeeth();
            });
            
            // راست کلیک برای باز کردن مودال تغییر وضعیت
            tooth.addEventListener('contextmenu', function(e) {
                e.preventDefault();
                TreatmentUI.openToothModal(this);
            });
        });
        
        // دکمه‌های انتخاب سریع
        document.querySelectorAll('.dental-select-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const selection = this.dataset.select;
                const isDeselecting = this.classList.contains('active');
                
                document.querySelectorAll('.dental-select-btn').forEach(b => 
                    b.classList.remove('active'));
                
                if (!isDeselecting) {
                    this.classList.add('active');
                    TreatmentUI.selectTeeth(selection);
                } else {
                    TreatmentUI.deselectTeeth(selection);
                }
            });
        });
    }
    
    /**
     * انتخاب دندان‌ها بر اساس نوع انتخاب
     * @param {string} selection - نوع انتخاب (all, upper, lower)
     */
    static selectTeeth(selection) {
        const allTeeth = document.querySelectorAll('.dental-tooth');
        const upperTeeth = document.querySelectorAll('.dental-upper-jaw .dental-tooth');
        const lowerTeeth = document.querySelectorAll('.dental-lower-jaw .dental-tooth');
        
        switch(selection) {
            case 'all':
                allTeeth.forEach(tooth => {
                    tooth.classList.add('selected');
                });
                break;
            case 'upper':
                upperTeeth.forEach(tooth => {
                    tooth.classList.add('selected');
                });
                break;
            case 'lower':
                lowerTeeth.forEach(tooth => {
                    tooth.classList.add('selected');
                });
                break;
            case 'none':
                allTeeth.forEach(tooth => {
                    tooth.classList.remove('selected');
                });
                break;
        }
        this.updateSelectedTeeth();
    }
    
    /**
     * حذف انتخاب دندان‌ها بر اساس نوع انتخاب
     * @param {string} selection - نوع انتخاب (all, upper, lower)
     */
    static deselectTeeth(selection) {
        const allTeeth = document.querySelectorAll('.dental-tooth');
        const upperTeeth = document.querySelectorAll('.dental-upper-jaw .dental-tooth');
        const lowerTeeth = document.querySelectorAll('.dental-lower-jaw .dental-tooth');
        
        switch(selection) {
            case 'all':
                allTeeth.forEach(tooth => {
                    tooth.classList.remove('selected');
                });
                break;
            case 'upper':
                upperTeeth.forEach(tooth => {
                    tooth.classList.remove('selected');
                });
                break;
            case 'lower':
                lowerTeeth.forEach(tooth => {
                    tooth.classList.remove('selected');
                });
                break;
        }
        this.updateSelectedTeeth();
    }
    
    /**
     * بروزرسانی دندان‌های انتخاب شده
     */
    static updateSelectedTeeth() {
        const selectedTeeth = document.querySelectorAll('.dental-tooth.selected');
        const areasCountInput = document.getElementById('areas-count');
        
        if (areasCountInput) {
            areasCountInput.value = selectedTeeth.length;
        }
        
        // جمع‌آوری شماره دندان‌های انتخاب شده
        const teethNumbers = Array.from(selectedTeeth).map(tooth => {
            return tooth.dataset.number || '';
        }).filter(num => num).join(', ');
        
        // نمایش شماره دندان‌ها در فیلد مربوطه
        const selectedAreasInput = document.getElementById('selected-areas');
        if (selectedAreasInput) {
            selectedAreasInput.value = teethNumbers;
        }
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
    static handleTreatmentTypeChange() {
        const treatmentTypeSelect = document.getElementById('treatment-type');
        if (!treatmentTypeSelect) return;
        
        treatmentTypeSelect.addEventListener('change', async function() {
            const selectedTypeId = this.value;
            if (!selectedTypeId) {
                // پاک کردن لیست شرح درمان
                const treatmentDetailSelect = document.getElementById('treatment-detail');
                if (treatmentDetailSelect) {
                    treatmentDetailSelect.innerHTML = '<option value="">ابتدا نوع درمان را انتخاب کنید</option>';
                }
                return;
            }
            
            try {
                // دریافت جزئیات درمان‌های مربوط به این نوع درمان
                const response = await TreatmentAPI.getTreatmentDetails(selectedTypeId);
                
                // پر کردن دراپ‌داون شرح درمان
                const treatmentDetailSelect = document.getElementById('treatment-detail');
                if (treatmentDetailSelect) {
                    treatmentDetailSelect.innerHTML = '<option value="">انتخاب شرح درمان</option>';
                    
                    response.forEach(detail => {
                        const option = document.createElement('option');
                        option.value = detail.id;
                        option.textContent = detail.description;
                        option.dataset.general = detail.public_tariff;
                        option.dataset.special = detail.special_tariff;
                        option.dataset.code = detail.international_code;
                        treatmentDetailSelect.appendChild(option);
                    });
                }
            } catch (error) {
                console.error('Error fetching treatment details:', error);
                TreatmentUI.showMessage(TREATMENT_CONFIG.ERROR_MESSAGES.FETCH_FAILED, 'error');
            }
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
     * مدیریت انتخاب نوع چارت
     */
    static handleChartTypeChange() {
    console.log('Setting up chart type change handlers');
    const chartTypeButtons = document.querySelectorAll('.chart-type-btn');
    
    chartTypeButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            event.preventDefault();
            
            const chartType = button.dataset.chart;
            console.log('Chart button clicked:', chartType);
            
            // حذف کلاس active از دکمه‌های دیگر
            chartTypeButtons.forEach(btn => btn.classList.remove('active'));
            
            // اضافه کردن کلاس active به دکمه فعلی
            button.classList.add('active');
            
            // مخفی کردن تمام چارت‌ها
            const charts = document.querySelectorAll('.dental-chart');
            console.log('Found charts:', charts.length);
            
            charts.forEach(chart => {
                console.log('Chart:', chart.dataset.type, 'Display before:', chart.style.display);
                chart.style.display = 'none';
                console.log('Display after:', chart.style.display);
            });
            
            // نمایش چارت مربوط به دکمه فعلی
            const currentChart = document.querySelector(`.dental-chart[data-type="${chartType}"]`);
            console.log('Current chart found:', currentChart ? 'yes' : 'no');
            
            if (currentChart) {
                currentChart.style.display = 'block';
                console.log('Set current chart display to block');
            } else {
                console.error(`Chart with data-type="${chartType}" not found`);
            }
        });
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
 * ایجاد چارت بدن
 */
static createBodyChart() {
    const chartContainer = document.querySelector('.body-chart-container[data-type="body"]');
    if (!chartContainer) return;
    
    const bodyParts = [
        { name: 'head', label: 'سر', icon: 'fa-head-side-brain' },
        { name: 'neck', label: 'گردن', icon: 'fa-throat' },
        { name: 'right_shoulder', label: 'شانه راست', icon: 'fa-bone' },
        { name: 'left_shoulder', label: 'شانه چپ', icon: 'fa-bone' },
        { name: 'chest', label: 'قفسه سینه', icon: 'fa-lungs' },
        { name: 'right_arm', label: 'بازوی راست', icon: 'fa-hand-holding-medical' },
        { name: 'left_arm', label: 'بازوی چپ', icon: 'fa-hand-holding-medical' },
        { name: 'abdomen', label: 'شکم', icon: 'fa-stomach' },
        { name: 'right_elbow', label: 'آرنج راست', icon: 'fa-bone' },
        { name: 'left_elbow', label: 'آرنج چپ', icon: 'fa-bone' },
        { name: 'waist', label: 'کمر', icon: 'fa-bone' },
        { name: 'right_hand', label: 'دست راست', icon: 'fa-hand-holding' },
        { name: 'left_hand', label: 'دست چپ', icon: 'fa-hand-holding' },
        { name: 'hip', label: 'لگن', icon: 'fa-bone' },
        { name: 'right_thigh', label: 'ران راست', icon: 'fa-bone' },
        { name: 'left_thigh', label: 'ران چپ', icon: 'fa-bone' },
        { name: 'right_knee', label: 'زانوی راست', icon: 'fa-bone' },
        { name: 'left_knee', label: 'زانوی چپ', icon: 'fa-bone' },
        { name: 'right_leg', label: 'ساق راست', icon: 'fa-bone' },
        { name: 'left_leg', label: 'ساق چپ', icon: 'fa-bone' },
        { name: 'right_foot', label: 'پای راست', icon: 'fa-shoe-prints' },
        { name: 'left_foot', label: 'پای چپ', icon: 'fa-shoe-prints' },
    ];
    
    bodyParts.forEach(part => {
        const area = document.createElement('div');
        area.classList.add('body-area', part.name);
        area.dataset.area = part.name;
        area.dataset.name = part.label;
        area.innerHTML = `<i class="fas ${part.icon}"></i><span class="area-label">${part.label}</span>`;
        chartContainer.appendChild(area);
    });
}

/**
 * مدیریت انتخاب نواحی بدن و صورت
 */
static initializeAreaSelection() {
    // انتخاب نواحی صورت
    document.querySelectorAll('.facial-area').forEach(area => {
        area.addEventListener('click', function() {
            this.classList.toggle('selected');
            TreatmentUI.updateSelectedAreas();
        });
    });
    
    // انتخاب نواحی بدن
    document.querySelectorAll('.body-area').forEach(area => {
        area.addEventListener('click', function() {
            this.classList.toggle('selected');
            TreatmentUI.updateSelectedAreas();
        });
    });
}

/**
 * بروزرسانی نواحی انتخاب شده
 */
static updateSelectedAreas() {
    // جمع‌آوری دندان‌های انتخاب شده
    const selectedTeeth = document.querySelectorAll('.dental-tooth.selected');
    const teethNumbers = Array.from(selectedTeeth).map(tooth => {
        return tooth.dataset.number || '';
    }).filter(num => num);
    
    // جمع‌آوری نواحی صورت انتخاب شده
    const selectedFacialAreas = document.querySelectorAll('.facial-area.selected');
    const facialAreaNames = Array.from(selectedFacialAreas).map(area => {
        return area.dataset.name || '';
    }).filter(name => name);
    
    // جمع‌آوری نواحی بدن انتخاب شده
    const selectedBodyAreas = document.querySelectorAll('.body-area.selected');
    const bodyAreaNames = Array.from(selectedBodyAreas).map(area => {
        return area.dataset.name || '';
    }).filter(name => name);
    
    // ترکیب همه نواحی انتخاب شده
    const allSelectedAreas = [...teethNumbers, ...facialAreaNames, ...bodyAreaNames];
    
    // نمایش نواحی انتخاب شده در فیلد مربوطه
    const selectedAreasInput = document.getElementById('selected-areas');
    if (selectedAreasInput) {
        selectedAreasInput.value = allSelectedAreas.join(', ');
    }
    
    // نمایش تعداد نواحی انتخاب شده
    const areasCountInput = document.getElementById('areas-count');
    if (areasCountInput) {
        areasCountInput.value = allSelectedAreas.length;
    }
}

        /**
     * راه‌اندازی اولیه رابط کاربری درمان
     */
    static initialize() {
    console.log('Initializing TreatmentUI...');
    
    // ایجاد چارت‌ها
    this.createAdultTeethChart();
    this.createChildTeethChart();
    this.createBodyChart();
    
    // راه‌اندازی انتخاب دندان‌ها و نواحی
    this.initializeToothSelection();
    this.initializeAreaSelection();
    
    // راه‌اندازی انتخاب نوع درمان
    this.handleTreatmentTypeChange();
    
    // راه‌اندازی انتخاب شرح درمان
    this.handleTreatmentDetailChange();
    
    // راه‌اندازی تغییر بیمه
    this.handleInsuranceProviderChange();
    
    // راه‌اندازی تغییر مقادیر مالی
    this.handleFinancialInputsChange();
    
    // راه‌اندازی انتخاب نوع چارت
    this.handleChartTypeChange();
    console.log('Chart type change handlers initialized');
    
    // مدیریت مودال تغییر وضعیت دندان
    const modalClose = document.querySelector('.dental-modal-close');
    const modalSave = document.querySelector('.dental-modal-save');
    const modalCancel = document.querySelector('.dental-modal-cancel');
    
    if (modalClose) modalClose.addEventListener('click', () => this.closeToothModal());
    if (modalCancel) modalCancel.addEventListener('click', () => this.closeToothModal());
    if (modalSave) modalSave.addEventListener('click', () => this.handleToothModalSave());
    
    // انتخاب آیکون در مودال
    const iconOptions = document.querySelectorAll('.dental-icon-option');
    iconOptions.forEach(option => {
        option.addEventListener('click', function() {
            iconOptions.forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
            TreatmentUI.selectedIcon = this.dataset.icon;
        });
    });
    
    // تنظیم تاریخ امروز برای فیلد تاریخ مراجعه
    const visitDateInput = document.getElementById('Visit-date');
    if (visitDateInput) {
        const today = new Date().toISOString().split('T')[0];
        visitDateInput.value = today;
    }
    
    console.log('TreatmentUI initialized');
}

}

// متغیرهای استاتیک
TreatmentUI.selectedToothElement = null;
TreatmentUI.selectedIcon = null;
