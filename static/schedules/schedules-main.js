// static/js/schedules-main.js

const SchedulesUI = {
    // نمایش پیام به کاربر
    showMessage(message, type = 'success') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `shift-message shift-message-${type}`;
        messageDiv.textContent = message;
        document.body.appendChild(messageDiv);
        setTimeout(() => messageDiv.remove(), 3000);
    },
    
    // فعال/غیرفعال کردن روز
    toggleDay(checkbox) {
        const dayCard = checkbox.closest('.shift-day-card');
        const inputs = dayCard.querySelectorAll('.shift-time-input');
        const statusLabel = dayCard.querySelector('.shift-status-label');
        
        inputs.forEach(input => {
            input.disabled = !checkbox.checked;
        });
        
        statusLabel.textContent = checkbox.checked ? 'فعال' : 'غیرفعال';
        dayCard.style.opacity = checkbox.checked ? '1' : '0.6';
        SchedulesManager.calculateTotalHours();
    },
    
    // کپی برنامه یک روز به همه روزها
    copyToAllDays(btn) {
        const sourceCard = btn.closest('.shift-day-card');
        const sourceInputs = sourceCard.querySelectorAll('.shift-time-input');
        const allCards = document.querySelectorAll('.shift-day-card');
        
        allCards.forEach(card => {
            if (card !== sourceCard) {
                const targetInputs = card.querySelectorAll('.shift-time-input');
                targetInputs.forEach((input, index) => {
                    input.value = sourceInputs[index].value;
                });
            }
        });
        
        SchedulesManager.calculateTotalHours();
        this.showMessage(SchedulesConfig.messages.copySuccess);
    },
    
    // افزودن تعطیلی جدید
    addHoliday() {
        const date = document.getElementById('shift-holiday-date').value;
        const desc = document.getElementById('shift-holiday-desc').value;
        
        if (!date) {
            this.showMessage('لطفا تاریخ را وارد کنید', 'error');
            return;
        }
        
        const holidayList = document.getElementById('shift-holiday-list');
        const holidayItem = document.createElement('div');
        holidayItem.className = 'shift-holiday-card';
        holidayItem.innerHTML = `
            <p>تاریخ: ${date}</p>
            <p>توضیحات: ${desc || 'بدون توضیحات'}</p>
            <button type="button" class="shift-remove-holiday-btn" onclick="SchedulesUI.removeHoliday(this)">حذف</button>
        `;
        
        holidayList.appendChild(holidayItem);
        
        document.getElementById('shift-holiday-date').value = '';
        document.getElementById('shift-holiday-desc').value = '';
        
        // بروزرسانی جدول تعطیلات
        this.updateHolidaysTable();
    },
    
    // حذف تعطیلی
    removeHoliday(btn) {
        btn.parentElement.remove();
        // بروزرسانی جدول تعطیلات
        this.updateHolidaysTable();
    },
    
    // بروزرسانی جدول تعطیلات
    updateHolidaysTable() {
        const tableBody = document.getElementById('shift-holidays-table-body');
        if (!tableBody) return;
        
        // پاک کردن جدول فعلی
        tableBody.innerHTML = '';
        
        // افزودن ردیف‌های جدید
        document.querySelectorAll('.shift-holiday-card').forEach((card, index) => {
            const dateText = card.querySelector('p:first-child').textContent.replace('تاریخ: ', '');
            const descText = card.querySelector('p:nth-child(2)').textContent.replace('توضیحات: ', '');
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${dateText}</td>
                <td>${descText === 'بدون توضیحات' ? '-' : descText}</td>
            `;
            
            tableBody.appendChild(row);
        });
    },
    
    // بروزرسانی جدول برنامه کاری
    updateScheduleTable() {
        const tableBody = document.getElementById('shift-schedule-table-body');
        if (!tableBody) return;
        
        // پاک کردن جدول فعلی
        tableBody.innerHTML = '';
        
        // افزودن ردیف‌های جدید
        document.querySelectorAll('.shift-day-card').forEach(card => {
            const dayIndex = parseInt(card.dataset.day);
            const dayName = SchedulesConfig.daysOfWeek[dayIndex];
            const isActive = card.querySelector('.shift-day-toggle').checked;
            const inputs = card.querySelectorAll('.shift-time-input');
            
            const row = document.createElement('tr');
            row.className = isActive ? '' : 'shift-inactive-row';
            row.innerHTML = `
                <td>${dayName}</td>
                <td>${isActive ? inputs[0].value : '-'}</td>
                <td>${isActive ? inputs[1].value : '-'}</td>
                <td>${isActive ? inputs[2].value : '-'}</td>
                <td>${isActive ? inputs[3].value : '-'}</td>
                <td>${isActive ? 'فعال' : 'غیرفعال'}</td>
            `;
            
            tableBody.appendChild(row);
        });
    },
    
    // بارگذاری اطلاعات پرسنل
    loadPersonnelData(profileId) {
        if (!profileId) return;
        
        SchedulesAPI.loadPersonnelData(profileId)
            .then(data => {
                SchedulesManager.populateSchedule(data.schedule);
                this.showMessage(SchedulesConfig.messages.loadSuccess);
                this.updateScheduleTable();
            })
            .catch(error => {
                this.showMessage(error.message || SchedulesConfig.messages.serverError, 'error');
            });
    },
    
    // ذخیره برنامه کاری
    saveSchedule() {
        // جلوگیری از ارسال چندباره درخواست
        if (window.isSaving) return;
        window.isSaving = true;
        
        try {
            const profileSelect = document.querySelector('.shift-personnel-select');
            if (!profileSelect) {
                throw new Error('المان انتخاب پرسنل یافت نشد');
            }
            
            const selectedProfileId = profileSelect.value;
            if (!selectedProfileId) {
                this.showMessage(SchedulesConfig.messages.selectPersonnel, 'error');
                window.isSaving = false;
                return;
            }
            
            // اعتبارسنجی ورودی‌ها
            if (!SchedulesManager.validateTimeInputs()) {
                window.isSaving = false;
                return;
            }
            
            // جمع‌آوری داده‌ها
            const scheduleData = SchedulesManager.collectScheduleData();
            
            // غیرفعال کردن دکمه ذخیره
            const saveButton = document.querySelector('.shift-save-button');
            const originalText = saveButton.textContent;
            saveButton.disabled = true;
            saveButton.textContent = 'در حال ذخیره...';
            
            // ارسال به سرور
            SchedulesAPI.saveSchedule(selectedProfileId, scheduleData)
                .then(result => {
                    if (result.needConfirmation) {
                        if (confirm(result.data.message)) {
                            return SchedulesAPI.updateSchedule(selectedProfileId, scheduleData);
                        }
                        return null;
                    }
                    return result.data;
                })
                .then(data => {
                    if (data) {
                        if (data.status === 'success') {
                            this.showMessage(data.message);
                            this.updateScheduleTable();
                            this.updateHolidaysTable();
                        } else {
                            this.showMessage(data.message, 'error');
                        }
                    }
                })
                .catch(error => {
                    this.showMessage(SchedulesConfig.messages.serverError, 'error');
                    console.error('Error:', error);
                })
                .finally(() => {
                    // فعال کردن مجدد دکمه و ریست کردن وضعیت
                    window.isSaving = false;
                    saveButton.disabled = false;
                    saveButton.textContent = originalText;
                });
                
        } catch (error) {
            this.showMessage('خطای سیستمی: ' + error.message, 'error');
            console.error('Error in saveSchedule:', error);
            window.isSaving = false;
        }
    },
    
    // راه‌اندازی رویدادها
    initEventListeners() {
        // افزودن رویداد به دکمه ذخیره
    const saveButton = document.getElementById('shiftSaveButton');
    if (saveButton) {
        saveButton.addEventListener('click', () => this.saveSchedule());
    }
        // افزودن رویداد تغییر به ورودی‌های زمان برای محاسبه مجدد ساعات
        document.querySelectorAll('.shift-time-input').forEach(input => {
            input.addEventListener('change', () => SchedulesManager.calculateTotalHours());
        });
        
        // افزودن رویداد تغییر به انتخاب پرسنل
        const personnelSelect = document.querySelector('.shift-personnel-select');
        if (personnelSelect) {
            personnelSelect.addEventListener('change', function() {
                SchedulesUI.loadPersonnelData(this.value);
            });
            
            // بارگذاری داده‌ها برای پرسنل انتخاب شده اولیه
            if (personnelSelect.value) {
                this.loadPersonnelData(personnelSelect.value);
            }
        }
        
        // افزودن رویداد به فرم برای جلوگیری از ارسال معمولی
        const form = document.getElementById('shiftScheduleForm');
        if (form) {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                SchedulesUI.saveSchedule();
            });
        }
        
        // افزودن رویداد به دکمه افزودن تعطیلی
        const addHolidayBtn = document.getElementById('shift-add-holiday-btn');
        if (addHolidayBtn) {
            addHolidayBtn.addEventListener('click', () => this.addHoliday());
        }
        
        // محاسبه اولیه کل ساعات
        SchedulesManager.calculateTotalHours();
    }
    
};

// راه‌اندازی در زمان بارگذاری صفحه
document.addEventListener('DOMContentLoaded', function() {
    SchedulesUI.initEventListeners();
    SchedulesUI.updateScheduleTable();
    SchedulesUI.updateHolidaysTable();
});

// توابع عمومی برای استفاده در HTML
function shiftToggleDay(checkbox) {
    SchedulesUI.toggleDay(checkbox);
    SchedulesUI.updateScheduleTable();
}

function shiftCopyToAllDays(btn) {
    SchedulesUI.copyToAllDays(btn);
    SchedulesUI.updateScheduleTable();
}

function shiftAddHoliday() {
    SchedulesUI.addHoliday();
}

function shiftRemoveHoliday(btn) {
    SchedulesUI.removeHoliday(btn);
}

function shiftSaveSchedule() {
    SchedulesUI.saveSchedule();
}
// اضافه کردن به فایل schedules-main.js
function shiftSwitchTab(btn, tabId) {
    // غیرفعال کردن همه تب‌ها
    document.querySelectorAll('.shift-tab-button').forEach(tab => {
        tab.classList.remove('shift-tab-active');
    });
    
    // فعال کردن تب انتخاب شده
    btn.classList.add('shift-tab-active');
    
    // مخفی کردن همه محتواهای تب
    document.querySelectorAll('.shift-schedule-wrapper').forEach(content => {
        content.style.display = 'none';
    });
    
    // نمایش محتوای تب انتخاب شده
    document.getElementById(tabId).style.display = 'flex';
}

// تعریف تابع به صورت عمومی
window.shiftSwitchTab = shiftSwitchTab;
