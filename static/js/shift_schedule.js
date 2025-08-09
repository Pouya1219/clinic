// static/js/shift_schedule.js

// این تابع هم درسته
function shiftToggleDay(checkbox) {
    const dayCard = checkbox.closest('.shift-day-card');
    const inputs = dayCard.querySelectorAll('.shift-time-input');
    const statusLabel = dayCard.querySelector('.shift-status-label');
    
    inputs.forEach(input => {
        input.disabled = !checkbox.checked;
    });
    
    statusLabel.textContent = checkbox.checked ? 'فعال' : 'غیرفعال';
    dayCard.style.opacity = checkbox.checked ? '1' : '0.6';
    calculateTotalHours(); // اضافه کردن محاسبه مجدد ساعات
}
// Add this function to your shift_schedule.js file
function calculateTimeDifference(startTime, endTime) {
    if (!startTime || !endTime) return 0;
    
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;
    
    return endTotalMinutes - startTotalMinutes;
}

// این تابع هم خوبه
function shiftCopyToAllDays(btn) {
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
    
    calculateTotalHours(); // اضافه کردن محاسبه مجدد ساعات
    showSuccessMessage('برنامه به تمام روزها کپی شد'); // استفاده از تابع نمایش پیام
}

// تابع بهینه شده برای افزودن تعطیلی
function shiftAddHoliday() {
    const date = document.getElementById('shift-holiday-date').value;
    const desc = document.getElementById('shift-holiday-desc').value;
    
    if (!date) {
        showErrorMessage('لطفا تاریخ را وارد کنید');
        return;
    }

    const holidayList = document.getElementById('shift-holiday-list');
    const holidayItem = document.createElement('div');
    holidayItem.className = 'shift-holiday-card';
    holidayItem.innerHTML = `
        <p>تاریخ: ${date}</p>
        <p>توضیحات: ${desc || 'بدون توضیحات'}</p>
        <button class="shift-add-holiday-btn" onclick="shiftRemoveHoliday(this)">حذف</button>
    `;
    
    holidayList.appendChild(holidayItem);
    
    document.getElementById('shift-holiday-date').value = '';
    document.getElementById('shift-holiday-desc').value = '';
}

// تابع جدید برای حذف تعطیلی
function shiftRemoveHoliday(btn) {
    btn.parentElement.remove();
}
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
// تابع بهینه شده برای ذخیره برنامه
function shiftSaveSchedule() {
    // جلوگیری از ارسال چندباره درخواست
    if (window.isSaving) return;
    window.isSaving = true;

    const profileSelect = document.querySelector('.shift-personnel-select');
    const selectedProfileId = profileSelect.value;
    const selectedProfileText = profileSelect.options[profileSelect.selectedIndex].text;

    if (!selectedProfileId) {
        showErrorMessage('لطفا یک پرسنل را انتخاب کنید');
        window.isSaving = false;
        return;
    }
    const holidays = [];
    document.querySelectorAll('.shift-holiday-card').forEach(card => {
        const dateText = card.querySelector('p:first-child').textContent.replace('تاریخ: ', '');
        const descText = card.querySelector('p:nth-child(2)').textContent.replace('توضیحات: ', '');
        
        holidays.push({
            date: dateText,
            description: descText === 'بدون توضیحات' ? '' : descText
        });
    });
    
    formData.append('schedule_data', JSON.stringify({
        regular_days: regularDays,
        holidays: holidays
    }));
    const formData = new FormData();
    formData.append('csrfmiddlewaretoken', document.querySelector('[name=csrfmiddlewaretoken]').value);
    formData.append('profile_id', selectedProfileId);

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

    formData.append('schedule_data', JSON.stringify({
        regular_days: regularDays
    }));

    // غیرفعال کردن دکمه ذخیره
    const saveButton = document.querySelector('.shift-save-button');
    const originalText = saveButton.textContent;
    saveButton.disabled = true;
    saveButton.textContent = 'در حال ذخیره...';

    // ارسال به سرور
    fetch('/schedules/save/', {
        method: 'POST',
        body: formData,
        credentials: 'same-origin'
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'confirm') {
            if (confirm(data.message)) {
                return fetch('/schedules/update/', {
                    method: 'POST',
                    body: formData,
                    credentials: 'same-origin'
                }).then(response => response.json());
            }
            window.isSaving = false;
            saveButton.disabled = false;
            saveButton.textContent = originalText;
            return null;
        }
        return data;
    })
    .then(data => {
        if (data) {
            if (data.status === 'success') {
                showSuccessMessage(data.message);
            } else {
                showErrorMessage(data.message);
            }
        }
    })
    .catch(error => {
        showErrorMessage('خطا در ارتباط با سرور');
        console.error('Error:', error);
    })
    .finally(() => {
        // فعال کردن مجدد دکمه و ریست کردن وضعیت
        window.isSaving = false;
        saveButton.disabled = false;
        saveButton.textContent = originalText;
    });
}

// تابع بهینه شده برای محاسبه ساعات
function calculateTotalHours() {
    let totalMinutes = 0;
    document.querySelectorAll('.shift-day-card').forEach(card => {
        if (card.querySelector('.shift-day-toggle').checked) {
            const inputs = card.querySelectorAll('.shift-time-input');
            totalMinutes += calculateTimeDifference(inputs[0].value, inputs[1].value); // شیفت صبح
            totalMinutes += calculateTimeDifference(inputs[2].value, inputs[3].value); // شیفت عصر
        }
    });
    
    const totalHours = Math.round(totalMinutes / 60 * 10) / 10;
    document.getElementById('shift-total-hours-value').textContent = totalHours;
}

// تابع بهینه شده برای لود اطلاعات پرسنل
function shiftLoadPersonnelData(profileId) {
    if (!profileId) return;

    fetch(`/schedules/load/${profileId}/`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                populateSchedule(data.schedule);
                showSuccessMessage('اطلاعات پرسنل بارگذاری شد');
            } else {
                showErrorMessage(data.message);
            }
        })
        .catch(error => {
            showErrorMessage('خطا در بارگذاری اطلاعات');
            console.error('Error:', error);
        });
}
// Add this function to your shift_schedule.js file
function populateSchedule(scheduleData) {
    // Reset all days to default first
    document.querySelectorAll('.shift-day-card').forEach(card => {
        const inputs = card.querySelectorAll('.shift-time-input');
        const checkbox = card.querySelector('.shift-day-toggle');
        
        checkbox.checked = false;
        inputs.forEach(input => {
            input.value = '00:00';
            input.disabled = true;
        });
        
        card.querySelector('.shift-status-label').textContent = 'غیرفعال';
        card.style.opacity = '0.6';
    });
    
    // Populate with received data
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
    
    // Recalculate total hours
    calculateTotalHours();
}

// توابع کمکی جدید
function showSuccessMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'shift-message shift-message-success';
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);
    setTimeout(() => messageDiv.remove(), 3000);
}

function showErrorMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'shift-message shift-message-error';
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);
    setTimeout(() => messageDiv.remove(), 3000);
}


// اضافه کردن event listener ها در زمان load صفحه
document.addEventListener('DOMContentLoaded', function() {

});
