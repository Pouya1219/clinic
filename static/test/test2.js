/**
 * کلاس مدیریت رابط کاربری درمان
 * نسخه نهایی و کامل - بازنویسی شده در 11 جولای 2025
 */
class TreatmentUI {
    // ===================================================================
    // بخش 1: راه‌اندازی اصلی
    // ===================================================================

    /**
     * [نهایی] راه‌اندازی اولیه رابط کاربری
     * این تابع دیگر چارت‌ها را نمی‌سازد، فقط به المان‌های موجود رویداد اضافه می‌کند.
     */
    static initialize() {
        console.log('Initializing TreatmentUI with the final, correct logic...');
        
        // گام 1: رویدادها را به المان‌های موجود در HTML اضافه کن
        this.initializeSelectionEvents();
        
        // گام 2: بقیه بخش‌های فرم و مودال‌ها را راه‌اندازی کن
        this.handleChartTypeChange();
        this.handleTreatmentTypeChange();
        this.handleTreatmentDetailChange();
        this.handleInsuranceProviderChange();
        this.handleFinancialInputsChange();
        this.setupModalListeners();

        // فعال‌سازی اولیه دکمه اول و چارت مربوطه
        const firstChartButton = document.querySelector('.chart-type-btn');
        if (firstChartButton) {
            firstChartButton.click();
        }

        console.log('TreatmentUI initialized successfully.');
    }

    // ===================================================================
    // بخش 2: مدیریت رویدادها
    // ===================================================================

    /**
     * [نهایی] راه‌اندازی تمام رویدادهای مربوط به انتخاب
     */
    static initializeSelectionEvents() {
        // 1. رویداد کلیک مستقیم روی هر آیتم (دندان، صورت، بدن)
        document.querySelectorAll('.dental-tooth, .facial-area, .body-area').forEach(item => {
            item.addEventListener('click', function() {
                this.classList.toggle('selected');
                TreatmentUI.updateSelectedAreasDisplay();
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
                    
                    teethToProcess.forEach(t => t.classList.remove('selected'));
                    targetTeeth.forEach(tooth => tooth.classList.add('selected'));
                }
                TreatmentUI.updateSelectedAreasDisplay();
            });
        });
    }

    /**
     * [نهایی] مدیریت انتخاب نوع چارت
     */
    static handleChartTypeChange() {
        const chartTypeButtons = document.querySelectorAll('.chart-type-btn');
        const charts = document.querySelectorAll('.dental-chart');

        chartTypeButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                event.preventDefault();
                const chartType = button.dataset.chart;

                chartTypeButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                charts.forEach(chart => {
                    chart.style.display = (chart.dataset.type === chartType) ? 'block' : 'none';
                });
                
                // پاک کردن فیلدها هنگام تعویض چارت
                this.updateSelectedAreasDisplay();
            });
        });
    }

    /**
     * [نهایی] راه‌اندازی رویدادهای مودال‌ها
     */
    static setupModalListeners() {
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
    }

    // ===================================================================
    // بخش 3: توابع کمکی و ابزارها
    // ===================================================================

    /**
     * [تابع هوشمند و یکپارچه] برای نمایش نواحی انتخاب شده در فیلدها
     */
    static updateSelectedAreasDisplay() {
        const activeChart = document.querySelector('.dental-chart[style*="display: block"]');
        const selectedAreasInput = document.getElementById('selected-areas');
        const areasCountInput = document.getElementById('areas-count');

        if (!activeChart) {
            if(selectedAreasInput) selectedAreasInput.value = '';
            if(areasCountInput) areasCountInput.value = '0';
            return;
        }

        let selectedItems = [];
        const chartType = activeChart.dataset.type;
        let areaNames = [];

        if (chartType === 'adult_teeth' || chartType === 'child_teeth') {
            selectedItems = activeChart.querySelectorAll('.dental-tooth.selected');
            areaNames = Array.from(selectedItems).map(tooth => TreatmentUI.getToothDescriptiveName(tooth.dataset.number));
        } else if (chartType === 'face') {
            selectedItems = activeChart.querySelectorAll('.facial-area.selected');
            areaNames = Array.from(selectedItems).map(area => area.dataset.name);
        } else if (chartType === 'body') {
            selectedItems = activeChart.querySelectorAll('.body-area.selected');
            areaNames = Array.from(selectedItems).map(area => area.dataset.name);
        }

        if (selectedAreasInput) {
            selectedAreasInput.value = areaNames.join(', ');
        }
        if (areasCountInput) {
            areasCountInput.value = selectedItems.length;
        }
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

    // ===================================================================
    // بخش 4: سایر توابع شما (کپی شده از فایل اصلی)
    // ===================================================================

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

    static openToothModal(tooth) {
        const modal = document.querySelector('.dental-icon-modal');
        if (!modal) return;
        this.selectedToothElement = tooth;
        modal.style.display = 'block';
        const currentIcon = tooth.querySelector('.dental-tooth-icon')?.getAttribute('data-icon');
        if (currentIcon) {
            const iconOption = modal.querySelector(`.dental-icon-option[data-icon="${currentIcon}"]`);
            if (iconOption) {
                modal.querySelectorAll('.dental-icon-option').forEach(opt => opt.classList.remove('selected'));
                iconOption.classList.add('selected');
                this.selectedIcon = currentIcon;
            }
        }
        const note = tooth.getAttribute('data-note') || '';
        modal.querySelector('.dental-tooth-note').value = note;
    }

    static closeToothModal() {
        const modal = document.querySelector('.dental-icon-modal');
        if (!modal) return;
        modal.style.display = 'none';
        this.selectedToothElement = null;
        this.selectedIcon = null;
        modal.querySelectorAll('.dental-icon-option').forEach(opt => opt.classList.remove('selected'));
        modal.querySelector('.dental-tooth-note').value = '';
    }

    static handleToothModalSave() {
        if (this.selectedToothElement && this.selectedIcon) {
            this.updateToothIcon(this.selectedToothElement, this.selectedIcon);
            const note = document.querySelector('.dental-tooth-note').value;
            this.selectedToothElement.setAttribute('data-note', note);
            const iconContainer = this.selectedToothElement.querySelector('.dental-tooth-icon');
            iconContainer.setAttribute('data-icon', this.selectedIcon);
            iconContainer.className = `dental-tooth-icon tooth-state-${this.selectedIcon}`;
        }
        this.closeToothModal();
    }

    static updateToothIcon(tooth, iconType) {
        const iconElement = tooth.querySelector('i');
        const iconContainer = tooth.querySelector('.dental-tooth-icon');
        iconElement.className = '';
        iconContainer.className = 'dental-tooth-icon';
        const iconClass = this.getIconClass(iconType);
        iconElement.className = iconClass;
        iconContainer.classList.add(`tooth-state-${iconType}`);
    }

    static getIconClass(iconType) {
        const iconClasses = {
            'implant': 'fas fa-teeth', 'missing': 'fas fa-times', 'crown': 'fas fa-crown',
            'bridge': 'fas fa-grip-lines', 'decay': 'fas fa-bug', 'filling': 'fas fa-fill',
            'root-canal': 'fas fa-wave-square', 'extraction': 'fas fa-minus-circle',
            'done': 'fas fa-check-circle', 'tooth': 'fas fa-tooth'
        };
        return iconClasses[iconType] || 'fas fa-tooth';
    }

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
}

// متغیرهای استاتیک
TreatmentUI.selectedToothElement = null;
TreatmentUI.selectedIcon = null;
