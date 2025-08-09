        // Tab Switching Function
        document.addEventListener('DOMContentLoaded', function() {
            const mainNavTabs = document.querySelectorAll('.nav-tab');
            const mainTabContents = document.querySelectorAll('.tab-content');
            const subNav = document.querySelector('.sub-nav');
            const subNavTabs = document.querySelectorAll('.sub-nav-tab');
            const subTabContents = document.querySelectorAll('.sub-tab-content');

            // فعال کردن تب و زیرتب اول به صورت پیش‌فرض
            if (mainNavTabs.length > 0) mainNavTabs[0].classList.add('active');
            if (mainTabContents.length > 0) mainTabContents[0].classList.add('active');
            if (subNavTabs.length > 0) subNavTabs[0].classList.add('active');
            if (subTabContents.length > 0) subTabContents[0].classList.add('active');

            mainNavTabs.forEach(mainTab => {
                mainTab.addEventListener('click', () => {
                    const mainTabId = mainTab.dataset.tab;

                    // غیرفعال کردن همه تب‌ها و زیرتب‌ها
                    mainNavTabs.forEach(tab => tab.classList.remove('active'));
                    mainTabContents.forEach(content => content.classList.remove('active'));
                    subNavTabs.forEach(tab => tab.classList.remove('active'));
                    subTabContents.forEach(content => content.classList.remove('active'));

                    // فعال کردن تب اصلی و محتوای آن
                    mainTab.classList.add('active');
                    const mainTabContent = document.getElementById(mainTabId);
                    if (mainTabContent) {
                        mainTabContent.classList.add('active');
                    }

                    // مدیریت نمایش زیر نوار و فعال کردن اولین زیرتب
                    if (mainTabId === 'patient-info') {
                        subNav.style.display = 'block';
                        const firstSubTab = subNav.querySelector('.sub-nav-tab');
                        if (firstSubTab) {
                            const firstSubContent = document.getElementById(firstSubTab.dataset.subTab);
                            firstSubTab.classList.add('active');
                            if (firstSubContent) {
                                firstSubContent.classList.add('active');
                            }
                        }
                    } else {
                        subNav.style.display = 'none';
                    }
                });
            });

            subNavTabs.forEach(subTab => {
                subTab.addEventListener('click', () => {
                    const subTabId = subTab.dataset.subTab;

                    subNavTabs.forEach(tab => tab.classList.remove('active'));
                    subTabContents.forEach(content => content.classList.remove('active'));

                    subTab.classList.add('active');
                    const subTabContent = document.getElementById(subTabId);
                    if (subTabContent) {
                        subTabContent.classList.add('active');
                    }
                });
            });
        });

document.addEventListener('DOMContentLoaded', function() {
    // Points Filter Functionality
    const filters = document.querySelectorAll('.points-filter');
    
    filters.forEach(filter => {
        filter.addEventListener('click', () => {
            filters.forEach(f => f.classList.remove('active'));
            filter.classList.add('active');
            
            // Here you can add filter logic for the table
        });
    });
});

// Payment Modal Functions
function openPaymentModal(button) {
    const modal = document.querySelector('.payment-modal');
    const amountInput = modal.querySelector('input[readonly]');
    const amount = button.getAttribute('data-amount');
    
    amountInput.value = amount;
    modal.classList.add('active');
}

function closePaymentModal() {
    document.querySelector('.payment-modal').classList.remove('active');
}

// Payment Method Change Handler
document.getElementById('paymentMethod').addEventListener('change', function() {
    const checkFields = document.getElementById('checkFields');
    if (this.value === 'check') {
        checkFields.classList.add('active');
    } else {
        checkFields.classList.remove('active');
    }
});

// Close Modal on Outside Click
document.querySelector('.payment-modal').addEventListener('click', function(e) {
    if (e.target === this) {
        closePaymentModal();
    }
});

// Form Submit Handler
document.querySelector('.payment-form').addEventListener('submit', function(e) {
    e.preventDefault();
    // Handle payment submission
    closePaymentModal();
});


// Attachments Tab JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.querySelector('.attachment-modal');
    const modalImage = modal.querySelector('.attachment-modal-image');
    const modalClose = modal.querySelector('.attachment-modal-close');
    const attachmentImages = document.querySelectorAll('.attachment-image');

    // Open Modal
    attachmentImages.forEach(img => {
        img.addEventListener('click', function() {
            modalImage.src = this.src;
            modal.classList.add('active');
        });
    });

    // Close Modal
    modalClose.addEventListener('click', function() {
        modal.classList.remove('active');
    });

    // Close Modal on Outside Click
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
});

document.addEventListener('DOMContentLoaded', function() {
    const teeth = document.querySelectorAll('.tooth');
    const selectedTeethInput = document.getElementById('selected-teeth');
    let selectedTeeth = [];

    teeth.forEach(tooth => {
        tooth.addEventListener('click', function() {
            const toothNumber = this.dataset.number;
            
            if (this.classList.contains('selected')) {
                this.classList.remove('selected');
                selectedTeeth = selectedTeeth.filter(num => num !== toothNumber);
            } else {
                this.classList.add('selected');
                selectedTeeth.push(toothNumber);
            }

            selectedTeethInput.value = selectedTeeth.join(', ');
        });
    });

    // Add more JavaScript functionality as needed
});

document.addEventListener('DOMContentLoaded', function() {
    // متغیرهای اصلی
    let selectedToothElement = null;
    let selectedIcon = null;
    
    // المان‌های DOM
    const teethCountInput = document.getElementById('selected-teeth');
    const modal = document.querySelector('.dental-icon-modal');
    const dentalTypeButtons = document.querySelectorAll('.dental-type-button');
    const descriptionInput = document.querySelector('.dental-description-select');
    const descriptionDropdown = document.querySelector('.dental-description-dropdown');
    const descriptionGroups = document.querySelectorAll('.dental-description-group');
    const generalFeeInput = document.getElementById('generalFee');
    const specialFeeInput = document.getElementById('specialFee');

    // تنظیم ساختار مودال
    initializeModal();
    initializeEventListeners();
    initializeTeethHandlers();
    initializeTreatmentHandlers();

    function initializeModal() {
        modal.innerHTML = `
            <div class="dental-modal-content">
                <div class="dental-modal-header">
                    <h3>انتخاب وضعیت دندان</h3>
                    <button class="dental-modal-close">&times;</button>
                </div>
                <div class="dental-modal-body">
                    <div class="dental-icon-grid">
                        ${getToothIconsHTML()}
                    </div>
                    <div class="dental-tooth-notes">
                        <label>یادداشت برای این دندان:</label>
                        <textarea class="dental-tooth-note"></textarea>
                    </div>
                    <div class="dental-modal-actions">
                        <button class="dental-modal-save">ذخیره</button>
                        <button class="dental-modal-cancel">بستن</button>
                    </div>
                </div>
            </div>
        `;
    }

    function getToothIconsHTML() {
        const icons = [
            { icon: 'tooth', text: 'دندان سالم', class: 'fa-tooth' },
            { icon: 'implant', text: 'ایمپلنت', class: 'fa-teeth' },
            { icon: 'missing', text: 'دندان از دست رفته', class: 'fa-times' },
            { icon: 'crown', text: 'روکش', class: 'fa-crown' },
            { icon: 'bridge', text: 'بریج', class: 'fa-grip-lines' },
            { icon: 'decay', text: 'پوسیدگی', class: 'fa-bug' },
            { icon: 'filling', text: 'پر شده', class: 'fa-fill' },
            { icon: 'root-canal', text: 'عصب کشی شده', class: 'fa-wave-square' },
            { icon: 'extraction', text: 'نیاز به کشیدن', class: 'fa-minus-circle' },
            { icon: 'done', text: 'درمان تکمیل', class: 'fa-check-circle' }
        ];

        return icons.map(icon => `
            <div class="dental-icon-option" data-icon="${icon.icon}">
                <i class="fas ${icon.class}"></i>
                <span>${icon.text}</span>
            </div>
        `).join('');
    }
    function initializeEventListeners() {
        // Modal event handlers
        const modalClose = modal.querySelector('.dental-modal-close');
        const modalSave = modal.querySelector('.dental-modal-save');
        const modalCancel = modal.querySelector('.dental-modal-cancel');
        const iconOptions = modal.querySelectorAll('.dental-icon-option');

        modalClose.addEventListener('click', closeToothModal);
        modalCancel.addEventListener('click', closeToothModal);
        modalSave.addEventListener('click', handleModalSave);

        // انتخاب آیکون در مودال
        iconOptions.forEach(option => {
            option.addEventListener('click', function() {
                iconOptions.forEach(opt => opt.classList.remove('selected'));
                this.classList.add('selected');
                selectedIcon = this.dataset.icon;
            });
        });
    }

    function initializeTeethHandlers() {
        document.querySelectorAll('.dental-single-tooth').forEach(tooth => {
            // کلیک چپ برای انتخاب/حذف انتخاب دندان
            tooth.addEventListener('click', function(e) {
                toggleToothSelection(this);
                updateSelectedTeethCount();
            });

            // راست کلیک برای باز کردن مودال تغییر وضعیت
            tooth.addEventListener('contextmenu', function(e) {
                e.preventDefault();
                selectedToothElement = this;
                openToothModal(this);
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
                    selectTeeth(selection);
                } else {
                    deselectTeeth(selection);
                }
            });
        });
    }

    function initializeTreatmentHandlers() {
        // کلیک روی دکمه‌های نوع درمان
        dentalTypeButtons.forEach(button => {
            button.addEventListener('click', () => {
                dentalTypeButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                const selectedType = button.getAttribute('data-type');
                handleTreatmentTypeSelection(selectedType);
            });
        });

        // مدیریت ورودی شرح درمان
        descriptionInput.addEventListener('focus', handleDescriptionFocus);
        descriptionInput.addEventListener('input', handleDescriptionSearch);

        // انتخاب آیتم شرح درمان
        document.querySelectorAll('.dental-description-item').forEach(item => {
            item.addEventListener('click', () => handleDescriptionSelection(item));
        });

        // بستن دراپ‌داون با کلیک بیرون
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.dental-description-wrapper')) {
                descriptionDropdown.classList.remove('active');
            }
        });
    }

    // توابع مدیریت مودال
    function handleModalSave() {
        if (selectedToothElement && selectedIcon) {
            updateToothIcon(selectedToothElement, selectedIcon);
            const note = modal.querySelector('.dental-tooth-note').value;
            selectedToothElement.setAttribute('data-note', note);
            
            // ذخیره وضعیت آیکون
            const iconContainer = selectedToothElement.querySelector('.dental-tooth-icon');
            iconContainer.setAttribute('data-icon', selectedIcon);
            iconContainer.className = `dental-tooth-icon tooth-state-${selectedIcon}`;
        }
        closeToothModal();
    }

    function openToothModal(tooth) {
        modal.classList.add('active');
        
        // بازیابی وضعیت قبلی آیکون
        const currentIcon = tooth.querySelector('.dental-tooth-icon').getAttribute('data-icon');
        if (currentIcon) {
            const iconOption = modal.querySelector(`.dental-icon-option[data-icon="${currentIcon}"]`);
            if (iconOption) {
                modal.querySelectorAll('.dental-icon-option').forEach(opt => 
                    opt.classList.remove('selected'));
                iconOption.classList.add('selected');
                selectedIcon = currentIcon;
            }
        }
        
        // بازیابی یادداشت قبلی
        const note = tooth.getAttribute('data-note') || '';
        modal.querySelector('.dental-tooth-note').value = note;
    }

    function closeToothModal() {
        modal.classList.remove('active');
        selectedToothElement = null;
        selectedIcon = null;
        modal.querySelectorAll('.dental-icon-option').forEach(opt => 
            opt.classList.remove('selected'));
        modal.querySelector('.dental-tooth-note').value = '';
    }
    // توابع مدیریت درمان
    function handleTreatmentTypeSelection(selectedType) {
        descriptionGroups.forEach(group => {
            group.style.display = 'none';
        });
        
        const selectedGroup = document.querySelector(
            `.dental-description-group[data-type="${selectedType}"]`);
        if (selectedGroup) {
            selectedGroup.style.display = 'block';
        }

        // پاک کردن مقادیر قبلی
        descriptionInput.value = '';
        generalFeeInput.value = '';
        specialFeeInput.value = '';
        
        descriptionDropdown.classList.add('active');
    }

    function handleDescriptionFocus() {
        const activeButton = document.querySelector('.dental-type-button.active');
        if (!activeButton) {
            alert('لطفاً ابتدا نوع درمان را انتخاب کنید');
            descriptionInput.blur();
            return;
        }
        descriptionDropdown.classList.add('active');
    }

    function handleDescriptionSearch(e) {
        const searchTerm = e.target.value.toLowerCase();
        const activeGroup = document.querySelector(
            '.dental-description-group[style*="block"]');
        
        if (activeGroup) {
            const items = activeGroup.querySelectorAll('.dental-description-item');
            items.forEach(item => {
                const text = item.textContent.toLowerCase();
                item.style.display = text.includes(searchTerm) ? 'block' : 'none';
            });
        }
    }

    function handleDescriptionSelection(item) {
        descriptionInput.value = item.textContent;
        
        const generalFee = item.getAttribute('data-general');
        const specialFee = item.getAttribute('data-special');
        
        generalFeeInput.value = Number(generalFee).toLocaleString() + ' تومان';
        specialFeeInput.value = Number(specialFee).toLocaleString() + ' تومان';
        
        descriptionDropdown.classList.remove('active');
    }

    // توابع مدیریت دندان‌ها
    function toggleToothSelection(tooth) {
        tooth.classList.toggle('selected');
        updateSelectedTeethCount();
    }

    function updateToothIcon(tooth, iconType) {
        const iconElement = tooth.querySelector('i');
        const iconContainer = tooth.querySelector('.dental-tooth-icon');
        
        // حذف کلاس‌های قبلی
        iconElement.className = '';
        iconContainer.className = 'dental-tooth-icon';
        
        // اضافه کردن کلاس جدید
        const iconClass = getIconClass(iconType);
        iconElement.className = iconClass;
        iconContainer.classList.add(`tooth-state-${iconType}`);
    }

    function getIconClass(iconType) {
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

    function selectTeeth(selection) {
        const allTeeth = document.querySelectorAll('.dental-single-tooth');
        const upperTeeth = document.querySelectorAll('.dental-upper-row .dental-single-tooth');
        const lowerTeeth = document.querySelectorAll('.dental-lower-row .dental-single-tooth');
        
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
        }
        updateSelectedTeethCount();
    }

    function deselectTeeth(selection) {
        const allTeeth = document.querySelectorAll('.dental-single-tooth');
        const upperTeeth = document.querySelectorAll('.dental-upper-row .dental-single-tooth');
        const lowerTeeth = document.querySelectorAll('.dental-lower-row .dental-single-tooth');
        
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
        updateSelectedTeethCount();
    }

    function updateSelectedTeethCount() {
        const selectedTeeth = document.querySelectorAll('.dental-single-tooth.selected').length;
        teethCountInput.value = selectedTeeth;
    }
});

function printTreatmentPlan(singleRow = null) {
    // ایجاد یک div جدید برای محتوای پرینت
    const printWindow = window.open('', '_blank');
    
    // اضافه کردن محتوا به پنجره جدید
    printWindow.document.write(`
        <!DOCTYPE html>
        <html dir="rtl" lang="fa">
        <head>
            <meta charset="UTF-8">
            <title>طرح درمان</title>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
            <style>
                @font-face {
                    font-family: 'IRANSans';
                    src: url('path-to-your-font/IRANSans.ttf');
                }

                body {
                    font-family: 'IRANSans', Tahoma, Arial;
                    padding: 20px;
                    direction: rtl;
                }

                .print-page {
                    max-width: 210mm;
                    margin: 0 auto;
                    background: white;
                }

                .print-header {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    padding-bottom: 20px;
                    border-bottom: 2px solid #4CAF50;
                }

                .clinic-logo {
                    width: 100px;
                    text-align: center;
                }

                .clinic-logo i {
                    font-size: 60px;
                    color: #4CAF50;
                }

                .clinic-info {
                    flex: 1;
                }

                .clinic-info h1 {
                    color: #4CAF50;
                    margin: 0 0 10px 0;
                    font-size: 24px;
                }

                .clinic-details {
                    display: flex;
                    gap: 20px;
                    font-size: 14px;
                }

                .patient-info {
                    margin: 20px 0;
                    padding: 15px;
                    background: #f8f9fa;
                    border-radius: 8px;
                }

                .patient-header {
                    display: flex;
                    gap: 20px;
                    align-items: center;
                }

                .patient-avatar i {
                    font-size: 50px;
                    color: #4CAF50;
                }

                .treatment-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 20px 0;
                }

                .treatment-table th,
                .treatment-table td {
                    border: 1px solid #ddd;
                    padding: 10px;
                    text-align: center;
                }

                .treatment-table th {
                    background: #f8f9fa;
                }

                .treatment-notes {
                    margin: 20px 0;
                    padding: 15px;
                    background: #f8f9fa;
                    border-radius: 8px;
                }

                .signatures {
                    display: flex;
                    justify-content: space-between;
                    margin-top: 50px;
                }

                .signature-box {
                    text-align: center;
                }

                .signature-line {
                    width: 200px;
                    height: 60px;
                    border: 1px solid #ddd;
                    margin-top: 10px;
                }

                .clinic-footer {
                    text-align: center;
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 2px solid #4CAF50;
                }
            </style>
        </head>
        <body>
            <div class="print-page">
                <div class="print-header">
                    <div class="clinic-logo">
                        <i class="fas fa-tooth"></i>
                    </div>
                    <div class="clinic-info">
                        <h1>کلینیک تخصصی دندانپزشکی زیبادنت</h1>
                        <p>دارای مجوز رسمی از وزارت بهداشت</p>
                        <div class="clinic-details">
                            <p>تلفن: 021-12345678</p>
                            <p>آدرس: تهران، خیابان ولیعصر، کوچه مهر، پلاک 12</p>
                        </div>
                    </div>
                </div>

                <div class="patient-info">
                    <div class="patient-header">
                        <div class="patient-avatar">
                            <i class="fas fa-user-circle"></i>
                        </div>
                        <div class="patient-details">
                            <table>
                                <tr>
                                    <th>نام و نام خانوادگی:</th>
                                    <td>علی محمدی</td>
                                    <th>شماره پرونده:</th>
                                    <td>12345</td>
                                </tr>
                                <tr>
                                    <th>تاریخ تولد:</th>
                                    <td>1370/06/15</td>
                                    <th>کد ملی:</th>
                                    <td>0123456789</td>
                                </tr>
                            </table>
                        </div>
                    </div>
                </div>

                <div class="treatment-plan-content">
                    <table class="treatment-table">
                        <thead>
                            <tr>
                                <th>ردیف</th>
                                <th>شماره دندان</th>
                                <th>نوع درمان</th>
                                <th>شرح درمان</th>
                                <th>تعرفه عمومی (تومان)</th>
                                <th>تعرفه تخصصی (تومان)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${getTreatmentRows(singleRow)}
                        </tbody>
                        <tfoot>
                            ${calculateTotals()}
                        </tfoot>
                    </table>
                </div>

                <div class="treatment-notes">
                    <h3>توضیحات تکمیلی:</h3>
                    <p>1. مدت زمان تقریبی انجام کل درمان‌ها: 3 جلسه</p>
                    <p>2. اعتبار این طرح درمان: یک ماه از تاریخ صدور</p>
                    <p>3. هزینه‌های لابراتوار جداگانه محاسبه می‌گردد</p>
                </div>

                <div class="signatures">
                    <div class="signature-box">
                        <p>پزشک معالج: دکتر رضا احمدی</p>
                        <div class="signature-line"></div>
                    </div>
                    <div class="signature-box">
                        <p>تأیید بیمار</p>
                        <div class="signature-line"></div>
                    </div>
                </div>

                <div class="clinic-footer">
                    <p>www.zibadent.com | info@zibadent.com</p>
                </div>
            </div>
        </body>
        </html>
    `);

    // تابع دریافت ردیف‌های جدول
    function getTreatmentRows(singleRow) {
        if (singleRow) {
            return createPrintRow(singleRow, 1);
        } else {
            const rows = document.querySelectorAll('#treatment-plan-list tr');
            return Array.from(rows).map((row, index) => 
                createPrintRow(row, index + 1)).join('');
        }
    }

    // تابع ایجاد ردیف جدول
    function createPrintRow(row, index) {
        const cells = row.querySelectorAll('td');
        return `
            <tr>
                <td>${index}</td>
                <td>${cells[1].textContent}</td>
                <td>${cells[2].textContent}</td>
                <td>${cells[3].textContent}</td>
                <td>${cells[5].textContent}</td>
                <td>${cells[6].textContent}</td>
            </tr>
        `;
    }

    // تابع محاسبه جمع کل
    function calculateTotals() {
        let generalTotal = 0;
        let specialTotal = 0;
        const rows = document.querySelectorAll('#treatment-plan-list tr');
        
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            generalTotal += parseInt(cells[5].textContent.replace(/[^\d]/g, '') || 0);
            specialTotal += parseInt(cells[6].textContent.replace(/[^\d]/g, '') || 0);
        });

        return `
            <tr>
                <th colspan="4">جمع کل:</th>
                <td>${generalTotal.toLocaleString()} تومان</td>
                <td>${specialTotal.toLocaleString()} تومان</td>
            </tr>
        `;
    }

    // بستن document و چاپ
    printWindow.document.close();
    printWindow.focus();
    
    // کمی تأخیر برای اطمینان از لود شدن فونت‌ها و استایل‌ها
    setTimeout(() => {
        printWindow.print();
        // printWindow.close();
    }, 1000);
}

function printSingleTreatmentPlan(row) {
    printTreatmentPlan(row);
}


let currentPaymentPrintType = null;
let selectedPaymentOptions = new Set();

function openPaymentPrintModal(type) {
    currentPaymentPrintType = type;
    document.querySelector('.payment-print-modal').style.display = 'flex';
    
    // تنظیم گزینه‌ها بر اساس نوع پرینت
    document.querySelectorAll('.payment-print-option').forEach(option => {
        if (type === 'thermal') {
            // فقط گزینه‌های مجاز در پرینت حرارتی
            if (['clinic-info', 'doctor-info', 'print-count'].includes(option.value)) {
                option.parentElement.style.display = 'flex';
                option.checked = true;
                selectedPaymentOptions.add(option.value);
            } else {
                option.parentElement.style.display = 'none';
                option.checked = false;
                selectedPaymentOptions.delete(option.value);
            }
        } else {
            // نمایش همه گزینه‌ها برای پرینت معمولی
            option.parentElement.style.display = 'flex';
            option.checked = true;
            selectedPaymentOptions.add(option.value);
        }
    });
}

function generatePaymentPrint() {
    selectedPaymentOptions.clear();
    document.querySelectorAll('.payment-print-option:checked').forEach(option => {
        selectedPaymentOptions.add(option.value);
    });

    const printWindow = window.open('', '_blank');
    
    const template = currentPaymentPrintType === 'thermal' ? 
        generatePaymentThermalTemplate() : generatePaymentNormalTemplate();

    printWindow.document.write(template);
    printWindow.document.close();
    
    setTimeout(() => {
        printWindow.print();
        // printWindow.close();
    }, 1000);

    closePaymentPrintModal();
}

function generatePaymentThermalTemplate() {
    return `
        <!DOCTYPE html>
        <html dir="rtl" lang="fa">
        <head>
            <meta charset="UTF-8">
            <title>رسید پرداخت</title>
            <style>
                @media print {
                    @page {
                        size: 80mm auto;
                        margin: 0;
                    }
                    
                    body {
                        width: 80mm;
                        padding: 5mm;
                        margin: 0;
                        font-family: 'IRANSans', Tahoma;
                        font-size: 12px;
                    }

                    .thermal-receipt {
                        text-align: center;
                    }

                    .receipt-header {
                        border-bottom: 1px dashed #000;
                        padding-bottom: 10px;
                        margin-bottom: 10px;
                    }

                    .receipt-body {
                        text-align: right;
                    }

                    .receipt-row {
                        display: flex;
                        justify-content: space-between;
                        margin: 5px 0;
                    }

                    .receipt-footer {
                        border-top: 1px dashed #000;
                        margin-top: 10px;
                        padding-top: 10px;
                        text-align: center;
                        font-size: 10px;
                    }
                }
            </style>
        </head>
        <body>
            <div class="thermal-receipt">
                ${selectedPaymentOptions.has('clinic-info') ? `
                    <div class="receipt-header">
                        <h2>کلینیک دندانپزشکی زیبادنت</h2>
                        <p>تلفن: 021-12345678</p>
                    </div>
                ` : ''}

                <div class="receipt-body">
                    <div class="receipt-row">
                        <span>شماره رسید:</span>
                        <span>12345</span>
                    </div>
                    <div class="receipt-row">
                        <span>تاریخ:</span>
                        <span>${new Date().toLocaleDateString('fa-IR')}</span>
                    </div>
                    ${selectedPaymentOptions.has('doctor-info') ? `
                        <div class="receipt-row">
                            <span>پزشک معالج:</span>
                            <span>دکتر محمدی</span>
                        </div>
                    ` : ''}
                    <div class="receipt-row">
                        <span>مبلغ:</span>
                        <span>${document.querySelector('.payment-amount').textContent}</span>
                    </div>
                </div>

                ${selectedPaymentOptions.has('print-count') ? `
                    <div class="receipt-footer">
                        <p>نسخه: 1/1</p>
                    </div>
                ` : ''}
            </div>
        </body>
        </html>
    `;
}

function generatePaymentNormalTemplate() {
    return `
        <!DOCTYPE html>
        <html dir="rtl" lang="fa">
        <head>
            <meta charset="UTF-8">
            <title>رسید پرداخت</title>
            <style>
                @page {
                    size: A4;
                    margin: 1cm;
                }

                body {
                    font-family: 'IRANSans', Tahoma;
                    padding: 20px;
                }

                .receipt {
                    max-width: 210mm;
                    margin: 0 auto;
                    padding: 20px;
                    border: 1px solid #ddd;
                }

                .receipt-header {
                    display: flex;
                    justify-content: space-between;
                    border-bottom: 2px solid #4CAF50;
                    padding-bottom: 20px;
                    margin-bottom: 20px;
                }

                .receipt-body {
                    margin: 20px 0;
                }

                .payment-details {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 20px 0;
                }

                .payment-details th,
                .payment-details td {
                    border: 1px solid #ddd;
                    padding: 10px;
                    text-align: right;
                }

                .payment-details th {
                    background: #f8f9fa;
                }

                .signatures {
                    display: flex;
                    justify-content: space-between;
                    margin-top: 50px;
                }

                .signature-box {
                    text-align: center;
                }

                .signature-line {
                    width: 200px;
                    height: 60px;
                    border: 1px solid #ddd;
                    margin-top: 10px;
                }
            </style>
        </head>
        <body>
            <div class="receipt">
                ${selectedPaymentOptions.has('clinic-info') ? `
                    <div class="receipt-header">
                        <div>
                            <h1>کلینیک دندانپزشکی زیبادنت</h1>
                            <p>تلفن: 021-12345678</p>
                            <p>آدرس: تهران، خیابان ولیعصر</p>
                        </div>
                        <div>
                            <p>شماره رسید: 12345</p>
                            <p>تاریخ: ${new Date().toLocaleDateString('fa-IR')}</p>
                        </div>
                    </div>
                ` : ''}

                ${selectedPaymentOptions.has('patient-info') ? `
                    <div class="patient-info">
                        <h3>اطلاعات بیمار</h3>
                        <p>نام و نام خانوادگی: علی محمدی</p>
                        <p>شماره پرونده: 12345</p>
                    </div>
                ` : ''}

                ${selectedPaymentOptions.has('payment-details') ? `
                    <div class="receipt-body">
                        <table class="payment-details">
                            <tr>
                                <th>شرح</th>
                                <th>مبلغ (تومان)</th>
                            </tr>
                            <tr>
                                <td>درمان ترمیمی</td>
                                <td>2,500,000</td>
                            </tr>
                            <tr>
                                <td>پرداختی</td>
                                <td>1,000,000</td>
                            </tr>
                            <tr>
                                <td>مانده</td>
                                <td>1,500,000</td>
                            </tr>
                        </table>
                    </div>
                ` : ''}

                ${selectedPaymentOptions.has('signatures') ? `
                    <div class="signatures">
                        <div class="signature-box">
                            <p>امضاء پرداخت کننده</p>
                            <div class="signature-line"></div>
                        </div>
                        <div class="signature-box">
                            <p>امضاء دریافت کننده</p>
                            <div class="signature-line"></div>
                        </div>
                    </div>
                ` : ''}
            </div>
        </body>
        </html>
    `;
}
// اضافه کردن Event Listener برای بستن پنجره پرینت
function addPrintWindowHandlers(printWindow) {
    // بستن با کلیک بیرون
    printWindow.addEventListener('click', function(e) {
        if (e.target === printWindow.document.body) {
            printWindow.close();
        }
    });

    // بستن با کلید ESC
    printWindow.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            printWindow.close();
        }
    });

    // بستن خودکار بعد از پرینت
    printWindow.onafterprint = function() {
        printWindow.close();
    };
}

// اضافه کردن این خط در تابع generatePrint یا generatePaymentPrint
function generatePaymentPrint() {
    // ... کد قبلی ...

    const printWindow = window.open('', '_blank');
    const template = currentPaymentPrintType === 'thermal' ? 
        generatePaymentThermalTemplate() : generatePaymentNormalTemplate();

    printWindow.document.write(template);
    printWindow.document.close();
    
    // اضافه کردن event handlers
    addPrintWindowHandlers(printWindow);
    
    setTimeout(() => {
        printWindow.print();
    }, 1000);

    closePaymentPrintModal();
}


let currentPaymentPrintType = null;
let selectedPaymentOptions = new Set();

function openPaymentPrintModal(type) {
    currentPaymentPrintType = type;
    document.querySelector('.payment-print-modal').style.display = 'flex';
    
    // تنظیم گزینه‌ها بر اساس نوع پرینت
    document.querySelectorAll('.payment-print-option').forEach(option => {
        if (type === 'thermal') {
            // فقط گزینه‌های مجاز در پرینت حرارتی
            if (['clinic-info', 'doctor-info', 'print-count'].includes(option.value)) {
                option.parentElement.style.display = 'flex';
                option.checked = true;
                selectedPaymentOptions.add(option.value);
            } else {
                option.parentElement.style.display = 'none';
                option.checked = false;
                selectedPaymentOptions.delete(option.value);
            }
        } else {
            // نمایش همه گزینه‌ها برای پرینت معمولی
            option.parentElement.style.display = 'flex';
            option.checked = true;
            selectedPaymentOptions.add(option.value);
        }
    });
}

function closePaymentPrintModal() {
    document.querySelector('.payment-print-modal').style.display = 'none';
    selectedPaymentOptions.clear();
    currentPaymentPrintType = null;
}

// اضافه کردن Event Listener برای بستن پنجره پرینت
function addPrintWindowHandlers(printWindow) {
    // بستن با کلیک بیرون
    printWindow.addEventListener('click', function(e) {
        if (e.target === printWindow.document.body) {
            printWindow.close();
        }
    });

    // بستن با کلید ESC
    printWindow.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            printWindow.close();
        }
    });

    // بستن خودکار بعد از پرینت
    printWindow.onafterprint = function() {
        printWindow.close();
    };
}

function generatePaymentPrint() {
    // جمع‌آوری گزینه‌های انتخاب شده
    selectedPaymentOptions.clear();
    document.querySelectorAll('.payment-print-option:checked').forEach(option => {
        selectedPaymentOptions.add(option.value);
    });

    const printWindow = window.open('', '_blank');
    
    // انتخاب قالب مناسب بر اساس نوع پرینت
    const template = currentPaymentPrintType === 'thermal' ? 
        generatePaymentThermalTemplate() : generatePaymentNormalTemplate();

    printWindow.document.write(template);
    printWindow.document.close();
    
    // اضافه کردن event handlers
    addPrintWindowHandlers(printWindow);
    
    setTimeout(() => {
        printWindow.print();
    }, 1000);

    closePaymentPrintModal();
}

// اضافه کردن این تابع به هر دو اسکریپت
// این تابع رو در ابتدای فایل JavaScript اضافه کنید
document.addEventListener('DOMContentLoaded', function() {
    // دکمه‌های بستن مودال
    const closeButtons = document.querySelectorAll('.payment-modal-close, .payment-print-btn-cancel');
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const modal = document.querySelector('.payment-print-modal');
            if (modal) {
                modal.style.display = 'none';
            }
        });
    });

    // بستن با کلیک خارج از مودال
    const modal = document.querySelector('.payment-print-modal');
    if (modal) {
        modal.addEventListener('click', function(event) {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    // بستن با کلید ESC
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            const modal = document.querySelector('.payment-print-modal');
            if (modal) {
                modal.style.display = 'none';
            }
        }
    });

    // دکمه پرینت
    const printButton = document.querySelector('.payment-print-btn-print');
    if (printButton) {
        printButton.addEventListener('click', generatePaymentPrint);
    }
});

    // بازشدن فیلد اقساط
    function toggleInstallmentFields() {
    const paymentType = document.getElementById('paymentType').value;
    const installmentFields = document.getElementById('installmentFields');
    
    if (paymentType === 'installment') {
        installmentFields.style.display = 'block';
        // اضافه کردن کلاس برای انیمیشن
        installmentFields.classList.add('fade-in');
    } else {
        installmentFields.style.display = 'none';
        installmentFields.classList.remove('fade-in');
    }
}

    // تنظیمات ستون‌ها
const columnSettings = {
    columns: [
        { id: 'row', title: 'ردیف', visible: true },
        { id: 'date', title: 'تاریخ', visible: true },
        { id: 'teeth', title: 'شماره دندان', visible: true },
        { id: 'treatment-type', title: 'نوع درمان', visible: true },
        { id: 'description', title: 'شرح درمان', visible: true },
        { id: 'doctor', title: 'پزشک معالج', visible: true },
        { id: 'assistant', title: 'دستیار', visible: true },
        { id: 'general-fee', title: 'تعرفه عمومی', visible: true },
        { id: 'special-fee', title: 'تعرفه تخصصی', visible: true },
        { id: 'discount', title: 'تخفیف', visible: true },
        { id: 'material-cost', title: 'هزینه مواد', visible: true },
        { id: 'lab-cost', title: 'هزینه لابراتور', visible: true },
        { id: 'total', title: 'مبلغ قابل پرداخت', visible: true },
        { id: 'insurance', title: 'وضعیت بیمه', visible: true },
        { id: 'status', title: 'وضعیت درمان', visible: true },
        { id: 'next-visit', title: 'تاریخ مراجعه بعدی', visible: true },
        { id: 'actions', title: 'عملیات', visible: true }
    ]
};

function openColumnSettings() {
    const modal = document.getElementById('columnSettingsModal');
    const columnsList = modal.querySelector('.columns-list');
    
    // ساخت چک‌باکس‌ها
    columnsList.innerHTML = columnSettings.columns.map(column => `
        <label class="column-checkbox">
            <input type="checkbox" 
                   data-column="${column.id}" 
                   ${column.visible ? 'checked' : ''}>
            ${column.title}
        </label>
    `).join('');
    
    modal.style.display = 'flex';
}

function closeColumnSettings() {
    document.getElementById('columnSettingsModal').style.display = 'none';
}

function saveColumnSettings() {
    const checkboxes = document.querySelectorAll('.column-checkbox input');
    checkboxes.forEach(checkbox => {
        const columnId = checkbox.dataset.column;
        const column = columnSettings.columns.find(col => col.id === columnId);
        if (column) {
            column.visible = checkbox.checked;
        }
    });
    
    updateTableColumns();
    closeColumnSettings();
}

function updateTableColumns() {
    const table = document.querySelector('.treatment-table');
    const headers = table.querySelectorAll('th');
    const rows = table.querySelectorAll('tbody tr');
    
    columnSettings.columns.forEach((column, index) => {
        if (headers[index]) {
            headers[index].style.display = column.visible ? '' : 'none';
        }
        rows.forEach(row => {
            const cell = row.cells[index];
            if (cell) {
                cell.style.display = column.visible ? '' : 'none';
            }
        });
    });
}

// اضافه کردن عملکرد به دکمه‌های عملیات
function editTreatment(id) {
    // منطق ویرایش
    console.log('Editing treatment:', id);
}

function deleteTreatment(id) {
    // منطق حذف
    if (confirm('آیا از حذف این درمان اطمینان دارید؟')) {
        console.log('Deleting treatment:', id);
    }
}

function printTreatment(id) {
    // منطق پرینت
    console.log('Printing treatment:', id);
}

function createInvoice(id) {
    // منطق صدور فاکتور
    console.log('Creating invoice for treatment:', id);
}


    //tabe bime o moshakhasat
document.addEventListener('DOMContentLoaded', function() {
    // مدیریت تب‌های اصلی
    const mainNavTabs = document.querySelectorAll('.main-nav .nav-tab');
    const mainTabContents = document.querySelectorAll('.content-area .tab-content');

    // فعال کردن تب اول و محتوای آن به صورت پیش‌فرض
    const firstMainTab = mainNavTabs[0];
    const firstMainContent = mainTabContents[0];
    firstMainTab.classList.add('active');
    firstMainContent.classList.add('active');

    // مدیریت زیرتب‌ها
    const patientSubTabs = document.querySelectorAll('.sub-nav-tabs .sub-nav-tab:not(.print-button)');
    const patientSubContents = document.querySelectorAll('.sub-tab-content');

    // فعال کردن اولین زیرتب و محتوای آن به صورت پیش‌فرض
    const firstSubTab = patientSubTabs[0];
    const firstSubContent = patientSubContents[0];
    firstSubTab.classList.add('active');
    firstSubContent.classList.add('active');

    // رویداد کلیک برای تب‌های اصلی
    mainNavTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetId = tab.getAttribute('data-tab');
            
            mainNavTabs.forEach(t => t.classList.remove('active'));
            mainTabContents.forEach(c => c.classList.remove('active'));
            
            tab.classList.add('active');
            document.querySelector(`#${targetId}`).classList.add('active');
        });
    });

    // رویداد کلیک برای زیرتب‌ها
    patientSubTabs.forEach(subTab => {
        subTab.addEventListener('click', () => {
            const targetId = subTab.getAttribute('data-sub-tab');
            
            patientSubTabs.forEach(t => t.classList.remove('active'));
            patientSubContents.forEach(c => c.classList.remove('active'));
            
            subTab.classList.add('active');
            document.querySelector(`#${targetId}`).classList.add('active');
        });
    });
});



    // virayesh - takmil etelaate bime - print
    document.addEventListener('DOMContentLoaded', function() {
    // تعریف لیست بیمه‌ها بر اساس نوع
    const insuranceProviders = {
        percentage: [
            { id: 'dana', name: 'بیمه دانا' },
            { id: 'iran', name: 'بیمه ایران' },
            { id: 'asia', name: 'بیمه آسیا' }
            // سایر بیمه‌های درصدی
        ],
        tariff: [
            { id: 'tamin', name: 'تأمین اجتماعی' },
            { id: 'salamat', name: 'بیمه سلامت' }
            // سایر بیمه‌های تعرفه‌ای
        ],
        total: [
            { id: 'mosalah', name: 'نیروهای مسلح' }
            // سایر بیمه‌های کلی
        ]
    };

    const insuranceTypeSelect = document.getElementById('insuranceType');
    const insuranceProviderSelect = document.getElementById('insuranceProvider');

    // مدیریت تغییر نوع بیمه
    insuranceTypeSelect.addEventListener('change', function() {
        // پاک کردن لیست قبلی
        insuranceProviderSelect.innerHTML = '<option value="">انتخاب کنید</option>';
        
        const selectedType = this.value;
        
        if (!selectedType) {
            insuranceProviderSelect.disabled = true;
            return;
        }

        // اضافه کردن گزینه‌های مربوط به نوع بیمه انتخاب شده
        const providers = insuranceProviders[selectedType] || [];
        providers.forEach(provider => {
            const option = document.createElement('option');
            option.value = provider.id;
            option.textContent = provider.name;
            insuranceProviderSelect.appendChild(option);
        });

        // فعال کردن select نام بیمه‌گر
        insuranceProviderSelect.disabled = false;
    });

    // اضافه کردن کلاس‌های CSS برای نمایش وضعیت غیرفعال
    insuranceProviderSelect.classList.add('disabled-select');
    
    // آپدیت کلاس‌ها بر اساس وضعیت فعال/غیرفعال
    insuranceProviderSelect.addEventListener('change', function() {
        this.classList.toggle('has-value', this.value !== '');
    });
});


document.addEventListener('DOMContentLoaded', function() {
    // مقداردهی اولیه داده‌ها
    loadPatientData();
    
    // تنظیم دراپ‌دان ذخیره
    setupDropdown();
    
    // تنظیم دکمه‌های پرینت
    setupPrintButtons();
    // مدیریت دکمه‌های خروجی

});

function loadPatientData() {
    // در حالت واقعی، این داده‌ها از سرور دریافت می‌شوند
    const patientData = {
        fileNumber: '12345',
        fullName: 'علی محمدی',
        nationalId: '0123456789',
        fatherName: 'محمد',
        birthDate: '1370/01/01',
        phone: '09123456789',
        emergency: '09187654321',
        address: 'تهران، خیابان ...',
        insurance: [
            {
                type: 'درصدی',
                provider: 'تأمین اجتماعی',
                number: '123456',
                validDate: '1402/12/29',
                coverage: '70%',
                status: 'فعال'
            }
        ],
        treatments: [
            {
                date: '1402/08/15',
                doctor: 'دکتر محمدی',
                description: 'عصب کشی دندان'
            }
        ]
    };

    // پر کردن اطلاعات در صفحه پرینت
    fillPatientInfo(patientData);
    fillInsuranceTable(patientData.insurance);
    fillTreatmentTable(patientData.treatments);
    updatePrintDate();
}

function fillPatientInfo(data) {
    document.getElementById('print-file-number').textContent = data.fileNumber;
    document.getElementById('print-fullname').textContent = data.fullName;
    document.getElementById('print-national-id').textContent = data.nationalId;
    document.getElementById('print-father-name').textContent = data.fatherName;
    document.getElementById('print-birth-date').textContent = data.birthDate;
    document.getElementById('print-phone').textContent = data.phone;
    document.getElementById('print-emergency').textContent = data.emergency;
    document.getElementById('print-address').textContent = data.address;
}

function fillInsuranceTable(insuranceData) {
    const tbody = document.querySelector('#print-insurance-table tbody');
    tbody.innerHTML = '';
    
    insuranceData.forEach(insurance => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${insurance.type}</td>
            <td>${insurance.provider}</td>
            <td>${insurance.number}</td>
            <td>${insurance.validDate}</td>
            <td>${insurance.coverage}</td>
            <td>${insurance.status}</td>
        `;
        tbody.appendChild(row);
    });
}

function fillTreatmentTable(treatmentData) {
    const tbody = document.querySelector('#print-treatment-table tbody');
    tbody.innerHTML = '';
    
    treatmentData.forEach(treatment => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${treatment.date}</td>
            <td>${treatment.doctor}</td>
            <td>${treatment.description}</td>
        `;
        tbody.appendChild(row);
    });
}

function updatePrintDate() {
    const today = new Date();
    const date = `${today.getFullYear()}/${today.getMonth() + 1}/${today.getDate()}`;
    document.getElementById('print-date').textContent = date;
}

function setupPrintButtons() {
    // پرینت مستقیم
    document.querySelector('[onclick="directPrint()"]').addEventListener('click', function() {
        window.print();
    });

    // پیش‌نمایش پرینت
    document.querySelector('[onclick="previewPrint()"]').addEventListener('click', function() {
        const preview = document.querySelector('.med-print-preview');
        preview.style.display = preview.style.display === 'none' ? 'block' : 'none';
    });

    // خروجی Excel
    document.querySelector('[onclick="exportToExcel()"]').addEventListener('click', function() {
        const data = gatherDataForExcel();
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Patient Data");
        XLSX.writeFile(wb, "patient_record.xlsx");
    });

    // خروجی PDF
    document.querySelector('[onclick="exportToPDF()"]').addEventListener('click', function() {
        const element = document.querySelector('.med-print-page');
        html2pdf()
            .set({
                margin: 1,
                filename: 'patient_record.pdf',
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
            })
            .from(element)
            .save();
    });

    // خروجی Word
    document.querySelector('[onclick="exportToWord()"]').addEventListener('click', function() {
        const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Export HTML to Word Document with JavaScript</title></head><body>";
        const footer = "</body></html>";
        const content = document.querySelector('.med-print-page').innerHTML;
        
        const sourceHTML = header + content + footer;
        const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
        const fileDownload = document.createElement("a");
        
        document.body.appendChild(fileDownload);
        fileDownload.href = source;
        fileDownload.download = 'patient_record.doc';
        fileDownload.click();
        document.body.removeChild(fileDownload);
    });
}

function gatherDataForExcel() {
    // جمع‌آوری داده‌ها برای خروجی اکسل
    const patientInfo = {
        'شماره پرونده': document.getElementById('print-file-number').textContent,
        'نام و نام خانوادگی': document.getElementById('print-fullname').textContent,
        'کد ملی': document.getElementById('print-national-id').textContent,
        // ... سایر اطلاعات
    };
    
    return [patientInfo];
}

function setupDropdown() {
    const dropdownToggle = document.querySelector('.med-print-dropdown-toggle');
    const dropdownMenu = document.querySelector('.med-print-dropdown-menu');

    dropdownToggle.addEventListener('click', function(e) {
        e.stopPropagation();
        dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
    });

    // بستن دراپ‌داون با کلیک بیرون
    document.addEventListener('click', function() {
        dropdownMenu.style.display = 'none';
    });
}


function togglePreview() {
    const preview = document.querySelector('.med-print-preview');
    preview.style.display = preview.style.display === 'none' ? 'block' : 'none';
}

function exportToExcel() {
    // تبدیل داده‌های بیمار به فرمت مناسب برای Excel
    const data = [
        {
            'شماره پرونده': document.getElementById('print-file-number').textContent,
            'نام و نام خانوادگی': document.getElementById('print-fullname').textContent,
            'کد ملی': document.getElementById('print-national-id').textContent,
            'نام پدر': document.getElementById('print-father-name').textContent,
            'تاریخ تولد': document.getElementById('print-birth-date').textContent,
            'شماره تماس': document.getElementById('print-phone').textContent,
            'شماره اضطراری': document.getElementById('print-emergency').textContent,
            'آدرس': document.getElementById('print-address').textContent
        }
    ];

    // ایجاد workbook و worksheet
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "اطلاعات بیمار");

    // ذخیره فایل
    XLSX.writeFile(wb, "patient_record.xlsx");
}

function exportToWord() {
    // ایجاد محتوا برای Word
    const header = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' 
              xmlns:w='urn:schemas-microsoft-com:office:word' 
              xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
            <meta charset='utf-8'>
            <title>پرونده بیمار</title>
        </head>
        <body>
    `;
    
    const footer = "</body></html>";
    const content = document.querySelector('.med-print-page').innerHTML;
    
    const sourceHTML = header + content + footer;
    const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
    
    // ایجاد لینک دانلود
    const fileDownload = document.createElement("a");
    document.body.appendChild(fileDownload);
    fileDownload.href = source;
    fileDownload.download = 'patient_record.doc';
    fileDownload.click();
    document.body.removeChild(fileDownload);
}

function exportToPDF() {
    const element = document.querySelector('.med-print-page');
    
    const opt = {
        margin: 1,
        filename: 'patient_record.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
            scale: 2,
            useCORS: true,
            logging: true
        },
        jsPDF: { 
            unit: 'in', 
            format: 'a4', 
            orientation: 'portrait'
        }
    };

    // تبدیل به PDF و دانلود
    html2pdf().set(opt).from(element).save();
}

function loadPatientData() {
    // تنظیم تاریخ چاپ
    const today = new Date();
    const date = `${today.getFullYear()}/${today.getMonth() + 1}/${today.getDate()}`;
    document.getElementById('print-date').textContent = date;

    // اضافه کردن شماره صفحه
    document.querySelectorAll('.page-num').forEach((element, index) => {
        element.textContent = `${index + 1}`;
    });

    // اضافه کردن داده‌های نمونه به جداول
    addSampleDataToTables();
}

function addSampleDataToTables() {
    // داده‌های نمونه بیمه
    const insuranceData = [
        {
            type: 'درصدی',
            provider: 'تأمین اجتماعی',
            number: '123456',
            date: '1402/12/29',
            coverage: '70%',
            status: 'فعال'
        }
    ];

    // داده‌های نمونه درمان
    const treatmentData = [
        {
            date: '1402/08/15',
            doctor: 'دکتر محمدی',
            description: 'عصب کشی دندان'
        }
    ];

    // پر کردن جدول بیمه
    const insuranceTable = document.querySelector('#print-insurance-table tbody');
    insuranceData.forEach(item => {
        const row = insuranceTable.insertRow();
        row.innerHTML = `
            <td>${item.type}</td>
            <td>${item.provider}</td>
            <td>${item.number}</td>
            <td>${item.date}</td>
            <td>${item.coverage}</td>
            <td>${item.status}</td>
        `;
    });

    // پر کردن جدول درمان
    const treatmentTable = document.querySelector('#print-treatment-table tbody');
    treatmentData.forEach(item => {
        const row = treatmentTable.insertRow();
        row.innerHTML = `
            <td>${item.date}</td>
            <td>${item.doctor}</td>
            <td>${item.description}</td>
        `;
    });
}


function openPrintPreview_pation_file() {
    // ذخیره داده‌ها در localStorage
    const printData = {
        insuranceData: document.querySelector('#print-insurance-table tbody')?.innerHTML,
        treatmentData: document.querySelector('#print-treatment-table tbody')?.innerHTML,
        // سایر داده‌های مورد نیاز
    };
    localStorage.setItem('printData', JSON.stringify(printData));

    // باز کردن صفحه جدید
    const printWindow = window.open('print_pation_file.html', 'print_pation_file', 
        'width=1000,height=800,menubar=no,toolbar=no,location=no,status=no');
}


    // مدیریت کلیک خارج از مودال
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        closeInvoiceModal();
    }
}

// بستن مودال
function closeInvoiceModal() {
    document.getElementById('invoice-modal').style.display = 'none';
}

// نمایش مودال فاکتور
function showInvoiceModal() {
    const modal = document.getElementById('invoice-modal');
    modal.style.display = 'block';
    
    // پر کردن اطلاعات فاکتور
    document.getElementById('invoice-number').textContent = generateInvoiceNumber();
    document.getElementById('invoice-date').textContent = getCurrentDate();
    // سایر اطلاعات را هم پر کنید
}

// پرینت صورتحساب ساده
function printBill() {
    const printContent = `
        <div class="bill">
            <h2>صورتحساب</h2>
            <p>تاریخ: ${getCurrentDate()}</p>
            <p>شماره دندان: ${document.getElementById('selected-teeth').value}</p>
            <p>نام دندان: ${document.getElementById('teeth-names').value}</p>
            <table>
                <tr>
                    <th>مبلغ کل</th>
                    <th>پرداخت شده</th>
                    <th>مانده</th>
                </tr>
                <tr>
                    <td>2,500,000</td>
                    <td>1,500,000</td>
                    <td>1,000,000</td>
                </tr>
            </table>
        </div>
    `;
    
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>صورتحساب</title>');
    printWindow.document.write('<style>');
    printWindow.document.write(`
        .bill { font-family: Arial; padding: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
    `);
    printWindow.document.write('</style></head><body>');
    printWindow.document.write(printContent);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
}
function showInvoiceModal() {
    const modal = document.getElementById('invoice-modal');
    modal.style.display = 'block';
    
    // پر کردن اطلاعات فاکتور
    document.getElementById('invoice-number').textContent = generateInvoiceNumber();
    document.getElementById('total-number').textContent = generateTotalNumber();
    document.getElementById('invoice-date').textContent = getCurrentDate();
    
    // محاسبه مبالغ
    updateAmounts();
}

function generateInvoiceNumber() {
    return 'F-' + Math.floor(Math.random() * 10000);
}

function generateTotalNumber() {
    return 'T-' + Math.floor(Math.random() * 100000);
}

function updateAmounts() {
    const debitAmount = 2500000;
    const creditAmount = 1500000;
    const remainingAmount = debitAmount - creditAmount;

    document.getElementById('debit-amount').textContent = formatNumber(debitAmount);
    document.getElementById('credit-amount').textContent = formatNumber(creditAmount);
    document.getElementById('remaining-amount').textContent = formatNumber(remainingAmount);
}

function formatNumber(number) {
    return new Intl.NumberFormat('fa-IR').format(number);
}
// پرینت فاکتور رسمی
function printInvoice() {
    const printContent = document.getElementById('printable-invoice').innerHTML;
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>فاکتور رسمی</title>');
    printWindow.document.write('<style>');
    printWindow.document.write(`
        @media print {
            body { direction: rtl; }
            .invoice-table { width: 100%; border-collapse: collapse; }
            .invoice-table th, .invoice-table td { border: 1px solid #000; padding: 8px; text-align: center; }
            .debit-row { background-color: #fff; }
            .credit-row { background-color: #f9f9f9; }
            .remaining-row { background-color: #f0f0f0; font-weight: bold; }
            .signature-box { margin-top: 50px; text-align: center; }
            .signature-line { width: 200px; height: 1px; background-color: #000; margin: 50px auto 0; }
        }
    `);
    printWindow.document.write('</style></head><body>');
    printWindow.document.write(printContent);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
}

    // تعریف متغیرهای اصلی
const selectedTeeth = new Set();
const jawNames = {
    upper: "فک بالا (Maxilla)",
    lower: "فک پایین (Mandible)",
    all: "کل فک‌ها (Full Mouth)"
};

// اضافه کردن event listener برای کلیک روی دندان‌ها
function initializeToothSelection() {
    document.querySelectorAll('.tooth-lab').forEach(tooth => {
        tooth.addEventListener('click', function(event) {
            event.stopPropagation(); // جلوگیری از تداخل با سایر event ها
            const toothNumber = this.dataset.toothNumber;
            toggleToothSelection(this, toothNumber);
            updateSelectedTeeth();
        });
    });
}

// تابع toggle برای انتخاب/حذف انتخاب دندان
function toggleToothSelection(tooth, toothNumber) {
    if (tooth.classList.contains('selected')) {
        tooth.classList.remove('selected');
        selectedTeeth.delete(toothNumber);
    } else {
        tooth.classList.add('selected');
        selectedTeeth.add(toothNumber);
    }
}

// انتخاب تمام دندان‌ها
function selectAllTeeth() {
    const allTeeth = document.querySelectorAll('.tooth-lab');
    const allSelected = Array.from(allTeeth).every(tooth => tooth.classList.contains('selected'));
    
    allTeeth.forEach(tooth => {
        const toothNumber = tooth.dataset.toothNumber;
        if (allSelected) {
            tooth.classList.remove('selected');
            selectedTeeth.delete(toothNumber);
        } else {
            tooth.classList.add('selected');
            selectedTeeth.add(toothNumber);
        }
    });
    
    updateSelectedTeeth(allSelected ? null : 'all');
}

// انتخاب فک بالا
function selectUpperJaw() {
    const upperTeeth = document.querySelectorAll('.tooth-lab[data-tooth-number^="1"], .tooth-lab[data-tooth-number^="2"]');
    const allUpperSelected = Array.from(upperTeeth).every(tooth => tooth.classList.contains('selected'));
    
    upperTeeth.forEach(tooth => {
        const toothNumber = tooth.dataset.toothNumber;
        if (allUpperSelected) {
            tooth.classList.remove('selected');
            selectedTeeth.delete(toothNumber);
        } else {
            tooth.classList.add('selected');
            selectedTeeth.add(toothNumber);
        }
    });
    
    updateSelectedTeeth(allUpperSelected ? null : 'upper');
}

// انتخاب فک پایین
function selectLowerJaw() {
    const lowerTeeth = document.querySelectorAll('.tooth-lab[data-tooth-number^="3"], .tooth-lab[data-tooth-number^="4"]');
    const allLowerSelected = Array.from(lowerTeeth).every(tooth => tooth.classList.contains('selected'));
    
    lowerTeeth.forEach(tooth => {
        const toothNumber = tooth.dataset.toothNumber;
        if (allLowerSelected) {
            tooth.classList.remove('selected');
            selectedTeeth.delete(toothNumber);
        } else {
            tooth.classList.add('selected');
            selectedTeeth.add(toothNumber);
        }
    });
    
    updateSelectedTeeth(allLowerSelected ? null : 'lower');
}

// بروزرسانی اطلاعات دندان‌های انتخاب شده
function updateSelectedTeeth(jawType = null) {
    const selectedTeethArray = Array.from(selectedTeeth);
    document.getElementById('selected-teeth').value = selectedTeethArray.join(' - ');
    
    let scientificName = '';
    if (jawType && selectedTeethArray.length > 0) {
        scientificName = jawNames[jawType];
    } else {
        scientificName = selectedTeethArray
            .map(number => {
                const tooth = document.querySelector(`.tooth-lab[data-tooth-number="${number}"]`);
                return tooth ? tooth.dataset.toothName : '';
            })
            .filter(name => name) // حذف مقادیر خالی
            .join(' - ');
    }
    
    document.getElementById('teeth-names').value = scientificName;
    document.getElementById('teeth-count').value = selectedTeethArray.length > 0 ? 
        `${selectedTeethArray.length} دندان` : 
        '0 دندان';
}

// پاک کردن انتخاب‌ها
function clearSelection() {
    const allTeeth = document.querySelectorAll('.tooth-lab');
    allTeeth.forEach(tooth => {
        tooth.classList.remove('selected');
    });
    selectedTeeth.clear();
    updateSelectedTeeth();
}

// توابع مربوط به فاکتور
function showPaymentModal() {
    // نمایش مودال پرداخت
}

function printInvoice() {
    const printContent = document.getElementById('printable-invoice').innerHTML;
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>فاکتور</title>');
    printWindow.document.write('<style>/* استایل‌های پرینت */</style></head><body>');
    printWindow.document.write(printContent);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
}

function generateOfficialInvoice() {
    document.getElementById('invoice-modal').style.display = 'block';
    document.getElementById('invoice-number').value = generateInvoiceNumber();
    document.getElementById('invoice-date').value = getCurrentDate();
}

function generateInvoiceNumber() {
    return 'INV-' + Date.now();
}

function getCurrentDate() {
    return new Date().toLocaleDateString('fa-IR');
}

// راه‌اندازی اولیه
document.addEventListener('DOMContentLoaded', initializeToothSelection);


    document.addEventListener('DOMContentLoaded', function() {
    // پیش‌نمایش تصاویر
    function previewImage(input, previewElement) {
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const preview = document.querySelector(previewElement);
                if (preview) {
                    preview.src = e.target.result;
                    preview.style.display = 'block';
                }
            }
            reader.readAsDataURL(input.files[0]);
        }
    }
});

    function printCard(imageUrl) {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`<html><head><title>چاپ کارت</title></head><body><img src="${imageUrl}" style="width: 100%;"></body></html>`);
    printWindow.document.close();
    printWindow.print();
}

function issueCard(patientId) {
    $.ajax({
        url: `/Patient/generate-card/`, // URL مربوط به صدور کارت
        type: 'POST',
        data: {
            patient_id: patientId,
            csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val()
        },
        success: function(response) {
            if (response.success) {
                location.reload();
            } else {
                alert(response.error);
            }
        },
        error: function(xhr, status, error) {
            alert('خطا در صدور کارت');
        }
    });
}


document.addEventListener('DOMContentLoaded', function() {
    // مدیریت تب‌ها (اگر لازم است)
    // ...

    // بررسی وجود تصویر کارت و تولید آن در صورت عدم وجود
    const cardImage = document.querySelector('.card-image');
    if (!cardImage) {
        const patientId = {{ patient.id }};
        const cardId = {{ patient.patient_card.id|default:"null" }};

        if (cardId) {
            generateCardImage(cardId);
        } else {
            issueCard(patientId);
        }
    }

    // پیش‌نمایش تصاویر (اگر لازم است)
    // ...

        function printCard() {
    const cardImage = document.querySelector('.card-image');
    if (cardImage) {
        const printWindow = window.open('', '_blank');
        
        // خواندن اطلاعات از تمپلیت
        const name = document.getElementById('card-name').textContent;
        const fileNum = document.getElementById('card-file-num').textContent;
        const nationalCode = document.getElementById('card-national-code').textContent;
        const diseases = document.getElementById('card-diseases').textContent;

        printWindow.document.write(`
            <html>
            <head>
                <title>چاپ کارت</title>
                <style>
                *{
                background-color:rgb(188, 233, 252);
                }
                    @page { size: 95mm 74mm; margin: 0; }
                    img { width: 100%; height: auto; }
                    .card-data {
                    text-align:center;
                    direction:rtl;
                        position: absolute;
                        top: 23mm;
                        right : 20mm;
                        font-size: 6pt;
                    }
                </style>
            </head>
            <body onload="window.print()">
                <img src="${cardImage.src}" alt="Patient Card">
                <div class="card-data">
                    <p>نام و نام خانوادگی: ${name}</p>
                    <p>شماره پرونده: ${fileNum}</p>
                    <p>کد ملی: ${national_code}</p>
                    <p>بیماری‌های خاص: ${diseases}</p>
                </div>
            </body>
            </html>
        `);
        printWindow.document.close();
    }
}

});

function generateCardImage(cardId) {
    $.ajax({
        url: `/Patient/generate-card-image/${cardId}/`,
        type: 'POST',
        data: {
            csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val()
        },
        success: function(response) {
            if (response.success) {
                // به‌روزرسانی تصویر کارت
                const cardPreview = document.querySelector('.card-preview');
                cardPreview.innerHTML = `<img src="${response.image_url}" alt="Patient Card" class="card-image">`;

                // به‌روزرسانی دکمه‌ها (دانلود و چاپ)
                const cardActions = document.querySelector('.card-actions');
                cardActions.innerHTML = `
                    <a href="${response.image_url}" download class="btn btn-primary download-btn">
                        <i class="fas fa-download"></i>
                        دانلود کارت
                    </a>
                    <button type="button" class="btn btn-info print-btn" onclick="printCard()">
                        <i class="fas fa-print"></i>
                        چاپ کارت
                    </button>
                    <!-- سایر دکمه‌ها -->
                `;
            } else {
                alert('خطا در تولید تصویر کارت');
            }
        },
        error: function(xhr, status, error) {
            alert('خطا در تولید تصویر کارت');
        }
    });
}

function issueCard(patientId) {
    $.ajax({
        url: '/Patient/generate-card/',
        type: 'POST',
        data: {
            patient_id: patientId,
            csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val()
        },
        success: function(response) {
            if (response.success) {
                // به‌روزرسانی HTML تب صدور کارت
                $('.issue-card-tab').html(response.html);

                // فراخوانی تابع generateCardImage برای تولید تصویر کارت
                if (response.card_id) {
                    generateCardImage(response.card_id);
                }
            } else {
                alert(response.error);
            }
        },
        error: function(xhr, status, error) {
            alert('خطا در صدور کارت');
        }
    });
}

