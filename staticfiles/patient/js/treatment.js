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
