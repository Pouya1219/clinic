// static/js/schedules-manager.js

const SchedulesManager = {
    // محاسبه اختلاف زمانی بین دو زمان
    calculateTimeDifference(startTime, endTime) {
        if (!startTime || !endTime) return 0;
        
        const [startHours, startMinutes] = startTime.split(':').map(Number);
        const [endHours, endMinutes] = endTime.split(':').map(Number);
        
        const startTotalMinutes = startHours * 60 + startMinutes;
        const endTotalMinutes = endHours * 60 + endMinutes;
        
        return endTotalMinutes - startTotalMinutes;
    },
    
    // محاسبه کل ساعات کاری
    calculateTotalHours() {
        let totalMinutes = 0;
        document.querySelectorAll('.shift-day-card').forEach(card => {
            if (card.querySelector('.shift-day-toggle').checked) {
                const inputs = card.querySelectorAll('.shift-time-input');
                totalMinutes += this.calculateTimeDifference(inputs[0].value, inputs[1].value); // شیفت صبح
                totalMinutes += this.calculateTimeDifference(inputs[2].value, inputs[3].value); // شیفت عصر
            }
        });
        
        const totalHours = Math.round(totalMinutes / 60 * 10) / 10;
        document.getElementById('shift-total-hours-value').textContent = totalHours;
        return totalHours;
    },
    
    // جمع‌آوری داده‌های برنامه کاری
    collectScheduleData() {
        // جمع‌آوری داده‌های روزهای عادی
        const regularDays = [];
        document.querySelectorAll('.shift-day-card').forEach(card => {
            const dayIndex = card.dataset.day;
            const inputs = card.querySelectorAll('.shift-time-input');
            const isActive = card.querySelector('.shift-day-toggle').checked;
            
            regularDays.push({
                day_of_week: dayIndex,
                is_active: isActive,
                morning_start: inputs[0].value,
                morning_end: inputs[1].value,
                evening_start: inputs[2].value,
                evening_end: inputs[3].value
            });
        });
        
       const holidays = [];
const holidayCards = document.querySelectorAll('.shift-holiday-card');
if (holidayCards && holidayCards.length > 0) {
    holidayCards.forEach(card => {
        const dateElement = card.querySelector('p:first-child');
        const descElement = card.querySelector('p:nth-child(2)');
        
        if (dateElement && descElement) {
            const dateText = dateElement.textContent.replace('تاریخ: ', '');
            const descText = descElement.textContent.replace('توضیحات: ', '');
            
            holidays.push({
                date: dateText,
                description: descText === 'بدون توضیحات' ? '' : descText
            });
        }
    });
}

return {
    regular_days: regularDays,
    holidays: holidays
};
    },
    
    // اعتبارسنجی ورودی‌های زمان
    validateTimeInputs() {
        let isValid = true;
        const timeInputs = document.querySelectorAll('.shift-time-input');
        
        timeInputs.forEach(input => {
            if (input.disabled) return;
            
            const timePattern = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
            if (!timePattern.test(input.value)) {
                input.classList.add('shift-input-error');
                isValid = false;
            } else {
                input.classList.remove('shift-input-error');
            }
        });
        
        if (!isValid) {
            SchedulesUI.showMessage(SchedulesConfig.messages.invalidTime, 'error');
        }
        
        return isValid;
    },
    
    // پر کردن فرم با داده‌های دریافتی
    populateSchedule(scheduleData) {
        // بازنشانی همه روزها به حالت پیش‌فرض
        document.querySelectorAll('.shift-day-card').forEach(card => {
            const inputs = card.querySelectorAll('.shift-time-input');
            const checkbox = card.querySelector('.shift-day-toggle');
            
            checkbox.checked = false;
            inputs.forEach(input => {
                input.value = SchedulesConfig.timeSettings.defaultTime;
                input.disabled = true;
            });
            
            card.querySelector('.shift-status-label').textContent = 'غیرفعال';
            card.style.opacity = '0.6';
        });
        
        // پر کردن با داده‌های دریافتی
        if (scheduleData && scheduleData.length > 0) {
            scheduleData.forEach(dayData => {
                const card = document.querySelector(`.shift-day-card[data-day="${dayData.day}"]`);
                if (card) {
                    const inputs = card.querySelectorAll('.shift-time-input');
                    const checkbox = card.querySelector('.shift-day-toggle');
                    
                    checkbox.checked = dayData.is_active;
                    inputs[0].value = dayData.morning_start;
                    inputs[1].value = dayData.morning_end;
                    inputs[2].value = dayData.evening_start;
                    inputs[3].value = dayData.evening_end;
                    
                    inputs.forEach(input => {
                        input.disabled = !dayData.is_active;
                    });
                    
                    card.querySelector('.shift-status-label').textContent = dayData.is_active ? 'فعال' : 'غیرفعال';
                    card.style.opacity = dayData.is_active ? '1' : '0.6';
                }
            });
        }
        
        // محاسبه مجدد کل ساعات
        this.calculateTotalHours();
    }
};
