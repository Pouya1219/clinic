// static/appointments/js/calendar-manager.js
class CalendarManager {
    constructor() {
        this.currentDate = new Date();
        this.currentView = 'week';
        this.selectedSchedule = null;
        this.appointments = [];
        this.workSchedule = null;
        this.doctors = [];
        this.selectedDoctor = null;
    }

    async initialize() {
        this.setupEventListeners();
        await this.loadDoctors();
        this.updateCalendarView();
        
    }

    toJalali(date) {
        try {
            return new Date(date).toLocaleDateString('fa-IR');
        } catch (error) {
            console.error('Error converting to Jalali:', error);
            return date;
        }
    }

    getWorkingHours() {
        if (!this.workSchedule || !this.workSchedule.daily_schedules) {
            return {
                startTime: '00:00',
                endTime: '24:00',
                interval: parseInt(document.getElementById('visit_duration')?.value || 30)
            };
        }

        let earliestStart = '23:59';
        let latestEnd = '00:00';

        this.workSchedule.daily_schedules.forEach(schedule => {
            if (schedule.is_active) {
                if (schedule.morning_start < earliestStart) {
                    earliestStart = schedule.morning_start;
                }
                if (schedule.evening_end && schedule.evening_end > latestEnd) {
                    latestEnd = schedule.evening_end;
                } else if (schedule.morning_end > latestEnd) {
                    latestEnd = schedule.morning_end;
                }
            }
        });

        return {
            startTime: earliestStart,
            endTime: latestEnd,
            interval: parseInt(document.getElementById('visit_duration')?.value || 30)
        };
    }

    getDaysToShow() {
        const days = [];
        const start = new Date(this.currentDate);
        
        switch(this.currentView) {
            case 'day':
                days.push(new Date(start));
                break;
            case 'week':
                for(let i = 0; i < 7; i++) {
                    const day = new Date(start);
                    day.setDate(start.getDate() + i);
                    days.push(day);
                }
                break;
            case 'month':
                start.setDate(1);
                const lastDay = new Date(start.getFullYear(), start.getMonth() + 1, 0);
                for(let i = 0; i < lastDay.getDate(); i++) {
                    const day = new Date(start);
                    day.setDate(start.getDate() + i);
                    days.push(day);
                }
                break;
        }
        return days;
    }

    formatTime(date) {
        return date.toTimeString().slice(0, 5);
    }

    isToday(date) {
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    }

    isCurrentTimeSlot(time, date) {
        if (!this.isToday(date)) return false;
        
        const now = new Date();
        const currentTime = this.formatTime(now);
        const slotTime = this.formatTime(time);
        return slotTime === currentTime;
    }

    updateHeaderCells() {
        const daysHeader = document.getElementById('days-header');
        const datesHeader = document.getElementById('dates-header');
        
        if (!daysHeader || !datesHeader) return;

        while(daysHeader.children.length > 1) {
            daysHeader.removeChild(daysHeader.lastChild);
            datesHeader.removeChild(datesHeader.lastChild);
        }

        const days = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'];
        const daysToShow = this.getDaysToShow();

        daysToShow.forEach(date => {
            const dayTh = document.createElement('th');
            dayTh.className = 'appointment_header-cell';
            const dayIndex = date.getDay();
            dayTh.textContent = days[dayIndex];
            
            if (this.isToday(date)) {
                dayTh.classList.add('current-day');
            }
            daysHeader.appendChild(dayTh);

            const dateTh = document.createElement('th');
            dateTh.className = 'appointment_header-cell';
            dateTh.textContent = this.toJalali(date);
            if (this.isToday(date)) {
                dateTh.classList.add('current-day');
            }
            datesHeader.appendChild(dateTh);
        });
    }

    showToday() {
        this.currentView = 'day';
        this.currentDate = new Date();
        this.updateCalendarView();
    }

    setupEventListeners() {
        const doctorSelect = document.getElementById('visit_doctor');
        if (doctorSelect) {
            doctorSelect.removeEventListener('change', this.onDoctorChange);
            
            doctorSelect.addEventListener('change', async (e) => {
                const doctorId = e.target.value;
                if (doctorId) {
                    const doctor = this.doctors.find(d => d.id === parseInt(doctorId));
                    if (doctor && doctor.schedules.length > 0) {
                        const activeSchedule = doctor.schedules.find(s => s.is_active);
                        if (activeSchedule) {
                            console.log(activeSchedule) 
                            this.selectedSchedule = activeSchedule.id;
                            await this.loadScheduleDetails(activeSchedule.id);
                            this.updateCalendarView();
                        }
                    }
                }
            });
        }

        document.querySelectorAll('.calendar-view-btn').forEach(btn => {
            btn.removeEventListener('click', this.onViewChange);
            btn.addEventListener('click', (e) => {
                this.currentView = e.target.dataset.view;
                this.updateCalendarView();
            });
        });

        const prevBtn = document.querySelector('.prev-btn');
        const nextBtn = document.querySelector('.next-btn');
        
        if (prevBtn) {
            prevBtn.removeEventListener('click', this.onPrevClick);
            prevBtn.addEventListener('click', () => this.navigate('prev'));
        }
        if (nextBtn) {
            nextBtn.removeEventListener('click', this.onNextClick);
            nextBtn.addEventListener('click', () => this.navigate('next'));
        }
    }
    async loadDoctors() {
        try {
            console.log('Loading doctors...');
            this.doctors = await AppointmentAPI.getDoctors();
            const doctorSelect = document.getElementById('visit_doctor');
            if (doctorSelect) {
                doctorSelect.innerHTML = '<option value="">انتخاب پزشک...</option>';
                
                this.doctors.forEach(doctor => {
                    const option = document.createElement('option');
                    option.value = doctor.id;
                    option.textContent = `${doctor.name} (${doctor.personal_number})`;
                    doctorSelect.appendChild(option);
                });

                if (this.doctors.length === 1) {
                    doctorSelect.value = this.doctors[0].id;
                    await this.onDoctorChange(this.doctors[0].id);
                }
            }
            console.log('Doctors loaded:', this.doctors);
        } catch (error) {
            console.error('Error loading doctors:', error);
            UIManager.showNotification(error.message, 'error');
        }
    }

    async onDoctorChange(doctorId) {
        this.selectedDoctor = this.doctors.find(d => d.id === parseInt(doctorId));
        if (!this.selectedDoctor) return;

        const scheduleSelect = document.getElementById('visit_schedule');
        if (this.selectedDoctor.schedules.length === 1) {
            scheduleSelect.value = this.selectedDoctor.schedules[0].id;
            await this.onScheduleChange(this.selectedDoctor.schedules[0].id);
        }
    }

    async loadScheduleDetails(scheduleId) {
        try {
            this.workSchedule = await AppointmentAPI.getDoctorSchedule(scheduleId);
            await this.loadAppointments();
        } catch (error) {
            UIManager.showNotification(error.message, 'error');
        }
    }

    async loadAppointments() {
    if (!this.selectedSchedule) {
        console.log('No schedule selected');
        return;
    }

    try {
        console.log('Loading appointments...');
        const dateRange = this.getDateRange();
        
        // اضافه کردن پارامترهای لازم
        const params = {
            schedule_id: this.selectedSchedule,
            start_date: dateRange.start,
            end_date: dateRange.end
        };
        console.log('params',params)

        this.appointments = await AppointmentAPI.getAppointments(params);
        console.log('Appointments loaded:', this.appointments);
        
        // پاک کردن نوبت‌های قبلی
        this.clearAppointments();
        
        // نمایش نوبت‌های جدید
        this.renderAppointments();
        
    } catch (error) {
        console.error('Error loading appointments:', error);
        UIManager.showNotification('خطا در بارگذاری نوبت‌ها', 'error');
    }
}

clearAppointments() {
    // پاک کردن نوبت‌های قبلی از تقویم
    document.querySelectorAll('.appointment_item').forEach(item => item.remove());
}

renderAppointments() {
    this.appointments.forEach(appointment => {
        const cell = this.findAppointmentCell(appointment);
        if (cell) {
            this.renderAppointmentInCell(cell, appointment);
        }
    });
}

    getDateRange() {
        const start = new Date(this.currentDate);
        const end = new Date(this.currentDate);
        
        switch(this.currentView) {
            case 'day':
                end.setDate(start.getDate());
                break;
            case 'week':
                end.setDate(start.getDate() + 6);
                break;
            case 'month':
                start.setDate(1);
                end.setMonth(end.getMonth() + 1);
                end.setDate(0);
                break;
        }

        return {
            start: this.formatDate(start),
            end: this.formatDate(end)
        };
    }

    formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    navigate(direction) {
        switch(this.currentView) {
            case 'day':
                this.currentDate.setDate(
                    this.currentDate.getDate() + (direction === 'next' ? 1 : -1)
                );
                break;
            case 'week':
                this.currentDate.setDate(
                    this.currentDate.getDate() + (direction === 'next' ? 7 : -7)
                );
                break;
            case 'month':
                this.currentDate.setMonth(
                    this.currentDate.getMonth() + (direction === 'next' ? 1 : -1)
                );
                break;
        }
        this.updateCalendarView();
    }

    async updateCalendarView() {
        try {
            console.log('Updating calendar view...');
            this.updateDateDisplay();
            this.updateHeaderCells();
            this.generateTimeSlots();
            
            if (this.selectedSchedule) {
                await this.loadAppointments();
            }
            
            console.log('Calendar view updated successfully');
        } catch (error) {
            console.error('Error updating calendar view:', error);
            UIManager.showNotification('خطا در به‌روزرسانی تقویم', 'error');
        }
    }

    updateDateDisplay() {
        const dateRangeElement = document.getElementById('current-date-range');
        const range = this.getDateRange();
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        
        let displayText = '';
        switch(this.currentView) {
            case 'day':
                displayText = new Date(range.start).toLocaleDateString('fa-IR', options);
                break;
            case 'week':
                displayText = `${new Date(range.start).toLocaleDateString('fa-IR', options)} - 
                             ${new Date(range.end).toLocaleDateString('fa-IR', options)}`;
                break;
            case 'month':
                displayText = new Date(range.start).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long' });
                break;
        }
        
        dateRangeElement.innerHTML = `
            <div class="appointment_date-container">
                <div class="appointment_current-range">${displayText}</div>
                <div class="appointment_today-date">
                    امروز: ${new Date().toLocaleDateString('fa-IR', options)}
                </div>
            </div>
        `;
    }

    generateTimeSlots() {
        const tbody = document.getElementById('appointment-slots');
        tbody.innerHTML = '';

        const workingHours = this.getWorkingHours();
        if (!workingHours) return;

        const { startTime, endTime, interval } = workingHours;
        let currentTime = new Date(`2000-01-01 ${startTime}`);
        const dayEnd = new Date(`2000-01-01 ${endTime}`);

        while (currentTime < dayEnd) {
            const row = this.createTimeSlotRow(currentTime);
            tbody.appendChild(row);
            currentTime.setMinutes(currentTime.getMinutes() + interval);
        }
    }

    createTimeSlotRow(time) {
        const row = document.createElement('tr');
        const timeCell = document.createElement('td');
        timeCell.className = 'appointment_header-cell appointment_time-cell';
        timeCell.textContent = this.formatTime(time);
        row.appendChild(timeCell);

        const days = this.getDaysToShow();
        days.forEach(day => {
            const cell = this.createDayCell(time, day);
            row.appendChild(cell);
        });

        return row;
    }

    createDayCell(time, date) {
        const cell = document.createElement('td');
        cell.className = 'appointment_time-slot';
        cell.dataset.date = this.formatDate(date);
        cell.dataset.time = this.formatTime(time);
        //console.log('Creating cell with date:', cell.dataset.date, 'and time:', cell.dataset.time);
        if (this.isTimeSlotAvailable(date, time)) {
            cell.addEventListener('click', () => {
                if (typeof UIManager !== 'undefined' && UIManager.openAppointmentModal) {
                    UIManager.openAppointmentModal(cell);
                } else {
                    console.error('UIManager not found or openAppointmentModal not available');
                }
            });
            
            const emptySpace = document.createElement('div');
            emptySpace.className = 'appointment_empty_space';
            cell.appendChild(emptySpace);
        } else {
            cell.classList.add('unavailable');
        }

        return cell;
    }

    isTimeSlotAvailable(date, time) {
        if (!this.workSchedule) return false;

        const dayOfWeek = date.getDay();
        const timeStr = this.formatTime(time);
        
        const holidayDate = this.formatDate(date);
        const holiday = this.workSchedule.holidays.find(h => h.date === holidayDate);
        if (holiday) return false;

        const daySchedule = this.workSchedule.daily_schedules.find(ds => 
            ds.day_of_week === dayOfWeek && ds.is_active
        );
        
        if (!daySchedule) return false;

        return (
            (timeStr >= daySchedule.morning_start && timeStr < daySchedule.morning_end) ||
            (daySchedule.evening_start && timeStr >= daySchedule.evening_start && 
             timeStr < daySchedule.evening_end)
        );
    }

    renderAppointments() {
        this.appointments.forEach(appointment => {
            const cell = this.findAppointmentCell(appointment);
            if (cell) {
                this.renderAppointmentInCell(cell, appointment);
            }
        });
    }

    renderAppointmentInCell(cell, appointment) {
    const appointmentElement = document.createElement('div');
    appointmentElement.className = 'appointment_item';
    appointmentElement.dataset.appointmentId = appointment.id;
    appointmentElement.style.backgroundColor = CONFIG.STATUS_COLORS[appointment.status];

    appointmentElement.innerHTML = `
        <div class="appointment_item_content">
            <div class="appointment_patient_info">
                <span class="appointment_phone">
                    <i class="fas fa-phone"></i> ${appointment.phone}
                </span>
            </div>
            ${appointment.first_name ? `
                <div class="appointment_doctor_info">
                    <span class="appointment_doctor_name">
                        ${appointment.first_name} ${appointment.last_name}
                    </span>
                </div> 
            ` : ''}
        </div>
    `;

    appointmentElement.title = `
        👤 نام و نام خانوادگی: ${appointment.first_name} ${appointment.last_name}
        📱 تلفن: ${appointment.phone}
        🕒 زمان: ${appointment.time_from} - ${appointment.time_to}
        🆔 کد ملی: ${appointment.national_code}
        📋 وضعیت: ${this.getStatusText(appointment.status)}
        ${appointment.file_number ? `\n📁 شماره پرونده: ${appointment.file_number}` : ''}
        ${appointment.unit ? `\n🏥 یونیت: ${appointment.unit}` : ''}
        ${appointment.description ? `\n📝 توضیحات: ${appointment.description}` : ''}
        ${appointment.created_by ? `\n👨‍💼 ثبت کننده: ${appointment.created_by.name || appointment.created_by.username}` : ''}
        ${appointment.visited ? '\n✅ ویزیت شده' : ''}
    `.trim();

    appointmentElement.addEventListener('click', (e) => {
        e.stopPropagation();
        UIManager.openAppointmentModal(cell, appointment);
    });

    let container = cell.querySelector('.appointment_items_container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'appointment_items_container';
        cell.insertBefore(container, cell.firstChild);
    }
    container.appendChild(appointmentElement);
}


    getStatusText(status) {
        const texts = {
            'normal': 'عادی',
            'emergency': 'اورژانسی',
            'pending': 'در انتظار',
            'visit': 'در حال ویزیت',
            'completed': 'تکمیل شده',
            'cancelled': 'لغو شده'
        };
        return texts[status] || status;
    }

    findAppointmentCell(appointment) {
        return document.querySelector(
            `.appointment_time-slot[data-date="${appointment.date}"][data-time="${appointment.time_from}"]`
        );
    }

    async onScheduleChange(scheduleId) {
        try {
            this.selectedSchedule = scheduleId;
            await this.loadScheduleDetails(scheduleId);
            this.updateCalendarView();
        } catch (error) {
            console.error('Error changing schedule:', error);
            UIManager.showNotification('خطا در تغییر برنامه کاری', 'error');
        }
    }

}
