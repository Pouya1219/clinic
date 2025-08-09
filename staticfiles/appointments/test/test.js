// static/appointments/js/ui-manager.js
class UIManager {
    static modal = null;
    static form = null;
    static isSubmitting = false; // اضافه کردن فلگ برای جلوگیری از ارسال چندباره
    static initialize() {
        console.log('Initializing UI Manager...');

        // مقداردهی اولیه المان‌ها
        this.modal = document.getElementById('appointment-modal');
        this.form = document.getElementById('visit_appointment_form');
        this.viewContainer = document.getElementById('appointment-details-container');
        this.editForm = document.getElementById('appointment-edit-container');

        console.log('Modal element:', this.modal);
        console.log('Form element:', this.form);

        if (!this.modal || !this.form || !this.viewContainer || !this.editForm) {
            console.error('Required modal elements not found');
            return false;
        }

        // اضافه کردن event listeners
        this.addEventListeners();

        return true;
    }
    
    static async showAppointmentDetails(appointmentId) {
    try {
        // دریافت اطلاعات نوبت
        console.log('Appointment ID before API call:', appointmentId);
        const appointment = await AppointmentAPI.getAppointmentDetails(appointmentId);
        
        // نمایش کانتینر جزئیات و مخفی کردن فرم
        const viewContainer = document.querySelector('#appointment-details-container');
        const editContainer = document.querySelector('#appointment-edit-container');
        const modal = document.getElementById('#appointment-modal');
        
        if (viewContainer && editContainer , modal) {
            viewContainer.style.display = 'block';
            editContainer.style.display = 'none';
            
            // پر کردن اطلاعات در view mode
            this.fillAppointmentDetails(appointment);

            // فعال کردن دکمه‌های عملیات
            this.setupActionButtons(appointment.id);
        }
    } catch (error) {
        console.error('Error loading appointment details:', error);
        UIManager.showNotification('خطا در بارگذاری اطلاعات نوبت', 'error');
    }
}
    static fillAppointmentDetails(appointment) {
        // بررسی وجود جزئیات نوبت
        if (!appointment) {
            console.error('No appointment data provided!');
            return;
        }

        // مقداردهی فیلدهای نمایشی
        const fields = {
            'visit_first_name': appointment.first_name,
            'visit_last_name': appointment.last_name,
            'visit_national_code': appointment.national_code,
            'visit_phone': appointment.phone,
            'visit_file_number': appointment.file_number,
            'visit_time_from': appointment.time_from,
            'visit_time_to': appointment.time_to,
            'visit_status': appointment.status,
            'visit_description': appointment.description,
            'visit_unit': appointment.unit,
            'visit_treatment_type': appointment.treatment_type,
            'visit_treatment_description': appointment.treatment_description,
            'visit_referral': appointment.referral,
            'visit_treating_doctor': appointment.treating_doctor?.id,
            'created_by': appointment.created_by?.full_name, // نام کاربری ایجاد‌کننده
            'created_at': new Date(appointment.created_at).toLocaleString(), // تاریخ ایجاد
            'updated_at': new Date(appointment.updated_at).toLocaleString(), // تاریخ آخرین ویرایش
            'date': appointment.date, // تاریخ نوبت
            'no_file': appointment.no_file ? 'بله' : 'خیر', // پرونده ندارد
            'visited': appointment.visited ? 'بله' : 'خیر' // بیمار ویزیت شده
        };

        // مقداردهی به عناصر داخل `appointment-details-container`
        const detailsContainer = document.getElementById('appointment-details-container');
        if (!detailsContainer) {
            console.error('Appointment details container not found!');
            return;
        }

        Object.entries(fields).forEach(([fieldName, value]) => {
            const element = detailsContainer.querySelector(`[data-field="${fieldName}"]`);
            if (!element) return;

            // تبدیل مقادیر خاص
            switch (fieldName) {
                case 'date':
                    value = new Date(value).toLocaleDateString('fa-IR');
                    break;
                case 'created_at':
                case 'updated_at':
                    value = new Date(value).toLocaleString('fa-IR'); // نمایش تاریخ کامل
                    break;
                case 'time_from':
                case 'time_to':
                    value = value.substring(0, 5); // فقط ساعت و دقیقه
                    break;
                case 'status':
                    element.className = `dtl_status-badge dtl_status-${value}`;
                    value = UIManager.getStatusText(value);
                    break;
                case 'visited':
                case 'no_file':
                    value = value ? 'بله' : 'خیر';
                    break;
                case 'treating_doctor':
                    value = value ? value.name : 'تعیین نشده';
                    break;
                case 'unit':
                    value = appointment.unit_name || 'تعیین نشده';
                    break;
                case 'created_by':
                    value = value ? value.name : 'نامشخص';
                    break;
                case 'treatment_type':
                case 'treatment_description':
                case 'referral':
                    value = value || 'ثبت نشده';
                    break;
            }

            element.textContent = value;
        });

        console.log('Appointment details successfully filled:', appointment);
    }
static setupActionButtons(appointmentId) {
        // دکمه ویرایش
        const editBtn = document.querySelector('.dtl_btn-edit');
        if (editBtn) {
            editBtn.onclick = () => UIManager.editAppointment(appointmentId);
        }

        // دکمه حذف
        const deleteBtn = document.querySelector('.dtl_btn-delete');
        if (deleteBtn) {
            deleteBtn.onclick = () => UIManager.handleDelete(appointmentId);
        }

        // دکمه پرینت
        const printBtn = document.querySelector('.dtl_btn-print');
        if (printBtn) {
            printBtn.onclick = () => UIManager.printAppointment(appointmentId);
        }

        // دکمه ارسال پیامک
        const smsBtn = document.querySelector('.dtl_btn-send-sms');
        if (smsBtn) {
            smsBtn.onclick = () => UIManager.sendSMS(appointmentId);
        }

        // دکمه انصراف
        const cancelBtn = document.querySelector('.dtl_btn-cancel');
        if (cancelBtn) {
            cancelBtn.onclick = () => UIManager.closeModal();
        }
    }


    static async editAppointment(appointmentId) {
        try {
            const appointment = await AppointmentAPI.getAppointmentDetails(appointmentId);
            if(!appointmentId){
                console.log('dar editAppointment nemitone id begire');
                return;
            } 
            // نمایش فرم ویرایش و مخفی کردن view
            const viewContainer = document.querySelector('.dtl_appointment_view-mode');
            const editContainer = document.querySelector('.dtl_appointment_edit-mode');

            if (viewContainer && editContainer) {
                viewContainer.style.display = 'none';
                editContainer.style.display = 'block';

                // پر کردن فرم با اطلاعات
                UIManager.fillEditForm(appointment);

                // راه‌اندازی date picker و time picker
                UIManager.setupDateTimePickers();
            }
        } catch (error) {
            console.error('Error loading appointment for edit:', error);
            UIManager.showNotification('خطا در بارگذاری اطلاعات نوبت', 'error');
        }
    }

     static fillEditForm(appointment) {
        const form = document.getElementById('appointmentEditForm');
        if (!form) return;
        if (appointment.id) {
        form.dataset.appointmentId = appointment.id;
        }

        // پر کردن فیلدهای فرم
        const fields = {
            'first_name': appointment.first_name,
            'last_name': appointment.last_name,
            'national_code': appointment.national_code,
            'phone': appointment.phone,
            'treatment_type': appointment.treatment_type,
            'treatment_description': appointment.treatment_description,
            'referral': appointment.referral,
            'status': appointment.status,
            'unit': appointment.unit,
            'treating_doctor': appointment.treating_doctor?.id,
            'description': appointment.description
        };
        
        console.log('Filling fields with:', fields);
        for (const [key, value] of Object.entries(fields)) {
            const input = form.querySelector(`[name="${key}"]`);
            if (input) {
                if (input.type === 'checkbox') {
                    input.checked = value;
                } else {
                    input.value = value || '';
                }
            }
        }

        // تنظیم چک‌باکس‌ها
        const visitedCheckbox = form.querySelector('[name="visited"]');
        if (visitedCheckbox) visitedCheckbox.checked = appointment.visited;

        const noFileCheckbox = form.querySelector('[name="no_file"]');
        if (noFileCheckbox) noFileCheckbox.checked = appointment.no_file;


        // ذخیره ID نوبت برای استفاده در زمان ذخیره
        form.dataset.appointmentId = appointment.id;
    }

    static addEventListeners() {
        // بستن مودال با دکمه بستن
        const closeButton = UIManager.modal.querySelector('.appointment_close-button');
        if (closeButton) {
            closeButton.addEventListener('click', UIManager.closeModal);
        }

        // بستن مودال با کلیک بیرون
        UIManager.modal.addEventListener('click', (e) => {
            if (e.target === UIManager.modal) {
                UIManager.closeModal();
            }
        });

        // حذف نوبت
        const deleteButton = document.getElementById('deleteAppointmentBtn');
        if (deleteButton) {
            deleteButton.addEventListener('click', UIManager.handleDelete);
        }

        // ارسال فرم
        UIManager.form.addEventListener('submit', UIManager.handleFormSubmit);

        // مدت زمان ویزیت
        const durationSelect = document.getElementById('visit_duration');
        if (durationSelect) {
            durationSelect.addEventListener('change', () => {
                const timeFrom = document.getElementById('visit_time_from')?.value;
                if (timeFrom) {
                    UIManager.updateEndTime(timeFrom);
                }
            });
        }

        // اعتبارسنجی فیلدها
        const nationalCodeInput = document.getElementById('visit_national_code');
        if (nationalCodeInput) {
            nationalCodeInput.addEventListener('input', (e) => {
                if (!UIManager.validateNationalCode(e.target.value)) {
                    UIManager.showFieldError('visit_national_code', 'کد ملی نامعتبر است');
                } else {
                    UIManager.clearFieldError('visit_national_code');
                }
            });
        }

        const phoneInput = document.getElementById('visit_phone');
        if (phoneInput) {
            phoneInput.addEventListener('input', (e) => {
                if (!UIManager.validatePhone(e.target.value)) {
                    UIManager.showFieldError('visit_phone', 'شماره تماس نامعتبر است');
                } else {
                    UIManager.clearFieldError('visit_phone');
                }
            });
        }

        // جستجوی بیمار
        const searchInput = document.getElementById('visit_patient_search');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                const query = e.target.value.trim();
                if (query.length >= 3) {
                    searchTimeout = setTimeout(() => UIManager.searchPatient(query), 500);
                }
            });
        }
    }
    static async loadtreating() {
        try {
            console.log('Loading treatings...');
            const treating = await AppointmentAPI.gettreating();
            const treatingSelect = document.getElementById('visit_treating_doctor');
            if (treatingSelect) {
                treatingSelect.innerHTML = '<option value="">انتخاب پزشک...</option>';
                treating.forEach(treat => {
                    const option = document.createElement('option');
                    option.value = treat.id;
                    option.textContent = `${treat.name}`;
                    treatingSelect.appendChild(option);
                });
            }
            console.log('treating loaded:', treating);
        } catch (error) {
            console.error('Error loading treatings:', error);
            UIManager.showNotification(error.message, 'error');
        }
    }
     static async loadUnits() {
        try {
            const units = await AppointmentAPI.getUnits();
            const unitSelect = document.getElementById('visit_unit');
            if (unitSelect) {
                unitSelect.innerHTML = '<option value="">انتخاب یونیت...</option>';
                units.forEach(unit => {
                    const option = document.createElement('option');
                    option.value = unit.id;
                    option.textContent = unit.parent_name ?
                        `${unit.name} (${unit.parent_name})` :
                        unit.name;
                    unitSelect.appendChild(option);
                });
            }
        } catch (error) {
            UIManager.showNotification('خطا در دریافت لیست یونیت‌ها', 'error');
        }
    }

    

  static async handleDelete() {
        try {
            const appointmentId = UIManager.modal.dataset.appointmentId;
            if (!appointmentId) {
                UIManager.showNotification('شناسه نوبت یافت نشد', 'error');
                return;
            }

            if (confirm('آیا از حذف این نوبت اطمینان دارید؟')) {
                // غیرفعال کردن دکمه حذف
                const deleteButton = document.getElementById('deleteAppointmentBtn');
                if (deleteButton) {
                    deleteButton.disabled = true;
                }

                try {
                    await AppointmentAPI.deleteAppointment(appointmentId);
                    UIManager.showNotification('نوبت با موفقیت حذف شد', 'success');
                    UIManager.closeModal();

                    // به‌روزرسانی تقویم
                    if (window.calendarManager) {
                        await window.calendarManager.updateCalendarView();
                    }
                } catch (error) {
                    console.error('Error deleting appointment:', error);
                    UIManager.showNotification('خطا در حذف نوبت: ' + error.message, 'error');
                } finally {
                    // فعال کردن مجدد دکمه حذف
                    if (deleteButton) {
                        deleteButton.disabled = false;
                    }
                }
            }
        } catch (error) {
            console.error('Delete operation error:', error);
            UIManager.showNotification('خطا در عملیات حذف', 'error');
        }
    }


    static setupFieldValidation(fieldId, validationFn, errorMessage) {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('input', (e) => {
                const value = e.target.value.trim();
                if (value && !validationFn(value)) {
                    this.showFieldError(fieldId, errorMessage);
                } else {
                    this.clearFieldError(fieldId);
                }
            });
        }
    }

    static setupDateTimePickers() {
        if (typeof flatpickr === 'undefined') {
            console.warn('Flatpickr is not loaded');
            return;
        }

        flatpickr('.time-picker', {
            enableTime: true,
            noCalendar: true,
            dateFormat: "H:i",
            time_24hr: true,
            minuteIncrement: 5
        });
    }


    static setupFormValidation() {
        // اعتبارسنجی کد ملی
        const nationalCodeInput = document.getElementById('visit_national_code');
    if (nationalCodeInput) {
        nationalCodeInput.addEventListener('input', (e) => {
            const value = e.target.value.replace(/[^0-9]/g, '');
            const errorElement = document.getElementById('national_code_error');
            
            if (value.length > 0) {
                if (value.length !== 10) {
                    errorElement.textContent = 'کد ملی باید 10 رقم باشد';
                    nationalCodeInput.classList.add('invalid');
                } else if (!this.validateNationalCode(value)) {
                    errorElement.textContent = 'کد ملی نامعتبر است';
                    nationalCodeInput.classList.add('invalid');
                } else {
                    errorElement.textContent = '';
                    nationalCodeInput.classList.remove('invalid');
                }
            } else {
                errorElement.textContent = '';
                nationalCodeInput.classList.remove('invalid');
            }
        });
    }

    // انتخاب برنامه کاری
    document.getElementById('visit_schedule')?.addEventListener('change', async (e) => {
        const scheduleId = e.target.value;
        if (scheduleId) {
            this.selectedSchedule = scheduleId;
            await this.loadScheduleDetails(scheduleId);
            this.updateCalendarView();
        }
    });

    // تغییر مدت زمان ویزیت
    document.getElementById('visit_duration')?.addEventListener('change', (e) => {
        const timeFrom = document.getElementById('visit_time_from')?.value;
        if (timeFrom) {
            const duration = parseInt(e.target.value);
            const endTime = this.calculateEndTime(timeFrom, duration);
            document.getElementById('visit_time_to').value = endTime;
        }
        this.generateTimeSlots();
    });

    // دکمه‌های نمای تقویم
    document.querySelectorAll('.calendar-view-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            this.currentView = e.target.dataset.view;
            this.updateCalendarView();
        });
    });

    // دکمه‌های ناوبری
    document.querySelector('.prev-btn')?.addEventListener('click', () => this.navigate('prev'));
    document.querySelector('.next-btn')?.addEventListener('click', () => this.navigate('next'));
}
   static calculateEndTime(startTime, duration) {
        if (!startTime) return '';
        
        const [hours, minutes] = startTime.split(':').map(Number);
        const totalMinutes = hours * 60 + minutes + duration;
        const newHours = Math.floor(totalMinutes / 60);
        const newMinutes = totalMinutes % 60;
        
        return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
    }

    static showNotification(message, type = 'info') {
        if (window.toastr) {
            toastr[type](message);
        } else {
            alert(message);
        }
    }


    // اضافه کردن متد برای به‌روزرسانی زمان پایان
    static updateEndTime(startTime) {
        const duration = parseInt(document.getElementById('visit_duration').value);
        const endTime = this.calculateEndTime(startTime, duration);
        document.getElementById('visit_time_to').value = endTime;
    }



    static setupSearchHandlers() {
        // جستجوی بیمار
        const searchInput = document.getElementById('visit_patient_search');
        let searchTimeout;

        searchInput?.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const query = e.target.value;

            if (query.length < 3) return;

            searchTimeout = setTimeout(async () => {
                try {
                    const results = await AppointmentAPI.searchPatient(query);
                    this.showSearchResults(results);
                } catch (error) {
                    UIManager.showNotification(error.message, 'error');
                }
            }, 500);
        });
    }

    static showSearchResults(results) {
    const container = document.getElementById('search_results');
    if (!container) return;

    container.innerHTML = '';
    results.forEach(patient => {
        const div = document.createElement('div');
        div.className = 'search-result-item';
        div.innerHTML = `
            <div class="patient-info">
                <div class="name">
                    <span class="first-name">${patient.first_name}</span>
                    <span class="last-name">${patient.last_name}</span>
                </div>
                <span class="national-code">${patient.national_code}</span>
            </div>
            <div class="patient-contact">
                <i class="fas fa-phone"></i>
                <span>${patient.phone}</span>
            </div>
            ${patient.file_number ? `
                <div class="file-number">
                    <i class="fas fa-folder"></i>
                    <span>${patient.file_number}</span>
                </div>
            ` : ''}
        `;
        div.addEventListener('click', () => this.fillPatientData(patient));
        container.appendChild(div);
    });

    // اضافه کردن استایل برای نتایج جستجو
    container.style.display = results.length > 0 ? 'block' : 'none';
}

    static fillPatientData(patient) {
    const fields = {
        'visit_first_name': patient.first_name,
        'visit_last_name': patient.last_name,
        'visit_national_code': patient.national_code,
        'visit_phone': patient.phone,
        'visit_file_number': patient.file_number || ''
    };

    for (const [id, value] of Object.entries(fields)) {
        const element = document.getElementById(id);
        if (element) {
            element.value = value;
            // اضافه کردن کلاس filled برای نمایش بصری
            element.classList.add('filled');
        }
    }

    // پاک کردن نتایج جستجو
    const searchContainer = document.getElementById('search_results');
    if (searchContainer) {
        searchContainer.innerHTML = '';
        searchContainer.style.display = 'none';
    }

    // پاک کردن فیلد جستجو
    const searchInput = document.getElementById('visit_patient_search');
    if (searchInput) {
        searchInput.value = '';
    }
}

    // متدهای قبلی شما
 static async openAppointmentModal(cell, appointment) {
    console.log('Opening appointment modal...');
    console.log('Cell:', cell);
    console.log('Appointment:', appointment);
     const modal = document.getElementById('appointment-modal');
    const selectedDate = cell.dataset.date;
    const selectedTime = cell.dataset.time;
    const [gy, gm, gd] = selectedDate.split('-').map(Number);
    const faDate = UIManager.gregorianToJalali(gy, gm, gd);
    const hiddenInput = document.getElementById('visit_date');
    const visibleSpan = document.getElementById('visible_visit_date');
    // این خط رو حتماً داشته باش
    modal.dataset.date = selectedDate;
    modal.dataset.time = selectedTime;

if (hiddenInput && visibleSpan) {
    hiddenInput.value = selectedDate;
    visibleSpan.textContent = faDate;

    console.log("🎯 selectedDate:", selectedDate);
    console.log("📦 visibleDateInput:", faDate);
}

    console.log('Selected date:', selectedDate);
    // Reset modal and load data
    UIManager.resetModal();
    await UIManager.loadTreatingDoctors();
    await UIManager.loadUnits();
    UIManager.setupDateTimePickers();

    if (appointment) {
        // Display appointment details
        await UIManager.displayAppointmentDetails(appointment.id);
        
        // Set modal data for existing appointment
        UIManager.modal.dataset.appointmentId = appointment.id;
        UIManager.modal.dataset.editMode = true;
    } else {
        // Prepare for new appointment
        UIManager.prepareNewAppointment(cell);
    }

    // Show modal
    UIManager.modal.style.display = 'block';
}





    static prepareNewAppointment(cell) {
        // Set date and time
        const date = cell.dataset.date;
        const time = cell.dataset.time;
        document.getElementById('visit_time_from').value = time;
        const duration = parseInt(document.getElementById('visit_duration')?.value || '30');
        const endTime = UIManager.calculateEndTime(time, duration); // استفاده از UIManager.calculateEndTime
        document.getElementById('visit_time_to').value = endTime;

        // Hide delete button
        const deleteBtn = document.getElementById('deleteAppointmentBtn');
        if (deleteBtn) {
            deleteBtn.style.display = 'none';
        }

        // Set modal data
        UIManager.modal.dataset.appointmentId = null; // استفاده از UIManager.modal
        UIManager.modal.dataset.editMode = false; // استفاده از UIManager.modal

        // Show form and hide details
        UIManager.form.style.display = 'block'; // استفاده از UIManager.form
        UIManager.viewContainer.style.display = 'none'; // استفاده از UIManager.viewContainer
        UIManager.editForm.style.display = 'none'; // استفاده از UIManager.editForm
    }


static async displayAppointmentDetails(appointment_id) {
    try {
        console.log('Displaying appointment details for ID:', appointment_id);

        const appointment = await AppointmentAPI.getAppointmentDetails(appointment_id);
        if (!appointment) {
            console.error('No appointment data found!');
            return;
        }

        const detailsContainer = document.getElementById('appointment-details-container');
        if (!detailsContainer) {
            console.error('Appointment details container not found!');
            return;
        }

        UIManager.fillAppointmentDetails(appointment);
        UIManager.setupActionButtons(appointment.id);

        // فقط نمایش حالت نمایشی
        UIManager.viewContainer.style.display = 'block';
        UIManager.editForm.style.display = 'none';
        UIManager.form.style.display = 'none';

    } catch (error) {
        console.error('Error loading appointment details:', error);
        UIManager.showNotification('خطا در بارگذاری اطلاعات نوبت', 'error');
    }
}
   static async enterEditMode(appointment_id) {
    try {
        const appointment = await AppointmentAPI.getAppointmentDetails(appointment_id);
        if (!appointment) return;
        console.log('appointment dar enterEditMode peyda nashod')

        // نمایش فرم ویرایش
        UIManager.viewContainer.style.display = 'none';
        UIManager.editForm.style.display = 'block';

        UIManager.fillEditForm(appointment); // فرض بر اینکه همچین تابعی داری

    } catch (err) {
        console.error('Error entering edit mode:', err);
        UIManager.showNotification('خطا در ورود به حالت ویرایش', 'error');
    }
}




    static closeModal() {
    if (this.modal) {
        this.modal.style.display = 'none';
        this.form?.reset();
        delete this.modal.dataset.appointmentId;
        delete this.modal.dataset.editMode;
        const viewContainer = this.modal.querySelector('.appointment-view-container');
        if (viewContainer) {
        viewContainer.remove();
        UIManager.modal.style.display = 'none';
        UIManager.form.style.display = 'none';
        UIManager.viewContainer.style.display = 'none';
        UIManager.editForm.style.display = 'none';
        }        
        // پاک کردن داده‌های ذخیره شده
        delete this.modal.dataset.appointmentId;
        this.clearAllFieldErrors();
        
    }
    //this.form.style.display = 'block';
    //    document.querySelectorAll('.date-time-fields').forEach(el => el.style.display = '');
    
}



    static fillFormWithAppointment(appointment) {
    // پر کردن فیلدهای فرم با اطلاعات قرار ملاقات
    const fields = {
        'visit_first_name': appointment.first_name,
        'visit_last_name': appointment.last_name,
        'visit_national_code': appointment.national_code,
        'visit_phone': appointment.phone,
        'visit_file_number': appointment.file_number,
        'visit_time_from': appointment.time_from,
        'visit_time_to': appointment.time_to,
        'visit_status': appointment.status,
        'visit_description': appointment.description,
        'visit_unit': appointment.unit_id,
        // فیلدهای جدید
        'visit_treatment_type': appointment.treatment_type,
        'visit_treatment_description': appointment.treatment_description,
        'visit_referral': appointment.referral,
        'visit_treating_doctor': appointment.treating_doctor?.id
    };

    // تنظیم مقادیر فیلدها
    for (const [id, value] of Object.entries(fields)) {
        const element = this.viewContainer.querySelector(`[data-field="${id}"]`);
        if (element) {
            element.textContent = value || 'نامشخص';
        }
    }
    const treatingDoctorSelect = document.getElementById('visit_treating_doctor');
    if (treatingDoctorSelect) {
        treatingDoctorSelect.value = appointment.treating_doctor?.id || "";
    }

    console.log('Treating Doctor after filling form:', treatingDoctorSelect.value);




    // تنظیم چک‌باکس‌ها
    document.getElementById('visit_patient_visited').checked = appointment.visited || false;
    document.getElementById('visit_no_file').checked = appointment.no_file || false;

    // ذخیره ID قرار ملاقات برای ویرایش
    this.viewContainer.dataset.appointmentId = appointment.id;
    // نمایش دکمه حذف
    const deleteBtn = document.getElementById('deleteAppointmentBtn');
    if (deleteBtn) {
        deleteBtn.style.display = 'inline-flex';
    }

    this.viewContainer.style.display = 'block';
    console.log('Appointment details successfully displayed:', appointment);

}
    // متدهای اعتبارسنجی جدید
    static validateNationalCode(code) {
        
        code = code.replace(/[^0-9]/g, '');
    
    // بررسی طول کد ملی
    if (code.length !== 10) return false;

    // بررسی الگوی کد ملی
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(code[i]) * (10 - i);
    }
    
    const remainder = sum % 11;
    const lastDigit = parseInt(code[9]);
    
    return (remainder < 2 && lastDigit === remainder) || 
           (remainder >= 2 && lastDigit === (11 - remainder));
    }

    static validatePhone(phone) {
        return /^0\d{10}$/.test(phone);
    }

    static validateTimeRange(timeFrom, timeTo) {
        const [fromHours, fromMinutes] = timeFrom.split(':').map(Number);
        const [toHours, toMinutes] = timeTo.split(':').map(Number);
        return (toHours * 60 + toMinutes) > (fromHours * 60 + fromMinutes);
    }

    // متدهای مدیریت خطا
    static showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        if (!field) return;

        field.classList.add('invalid');
        this.clearFieldError(fieldId);

        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.dataset.for = fieldId;
        errorDiv.textContent = message;
        field.parentNode.appendChild(errorDiv);
    }


    static clearFieldError(fieldId) {
        const field = document.getElementById(fieldId);
        if (!field) return;

        field.classList.remove('invalid');
        const errorDiv = field.parentNode.querySelector(`.field-error[data-for="${fieldId}"]`);
        if (errorDiv) errorDiv.remove();
    }

    static clearAllFieldErrors() {
        document.querySelectorAll('.field-error').forEach(el => el.remove());
        document.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));
    }

    static updateEndTime(startTime) {
        if (!startTime) return;

        const duration = parseInt(document.getElementById('visit_duration')?.value || 30);
        const [hours, minutes] = startTime.split(':').map(Number);
        const endTime = new Date(2000, 0, 1, hours, minutes + duration);
        
        const endTimeInput = document.getElementById('visit_time_to');
        if (endTimeInput) {
            endTimeInput.value = `${String(endTime.getHours()).padStart(2, '0')}:${String(endTime.getMinutes()).padStart(2, '0')}`;
        }
    }

    static showNotification(message, type = 'info') {
        // اگر از toastr استفاده می‌کنید
        if (window.toastr) {
            toastr[type](message);
        } else {
            alert(message);
        }
    }


    static getFormData() {
    const data = {
        doctor_id: document.getElementById('visit_doctor')?.value,
        schedule_id: window.calendarManager?.selectedSchedule,
        first_name: document.getElementById('visit_first_name')?.value,
        last_name: document.getElementById('visit_last_name')?.value,
        national_code: document.getElementById('visit_national_code')?.value?.replace(/[^0-9]/g, ''),
        phone: document.getElementById('visit_phone')?.value,
        date: this.modal.dataset.date,
        time_from: document.getElementById('visit_time_from')?.value,
        time_to: document.getElementById('visit_time_to')?.value,
        status: document.getElementById('visit_status')?.value,
        description: document.getElementById('visit_description')?.value,
        file_number: document.getElementById('visit_file_number')?.value,
        visited: document.getElementById('visit_patient_visited')?.checked,
        no_file: document.getElementById('visit_no_file')?.checked,
        unit_id: document.getElementById('visit_unit')?.value,

        // فیلدهای جدید
        treatment_type: document.getElementById('visit_treatment_type')?.value,
        treatment_description: document.getElementById('visit_treatment_description')?.value,
        referral: document.getElementById('visit_referral')?.value,
        treating_doctor_id: document.getElementById('visit_treating_doctor')?.value
    };

    const appointmentId = this.modal.dataset.appointmentId;
    if (appointmentId) {
        data.id = appointmentId;
    }

    console.log('Simplified appointment data:', JSON.stringify(data));
    return data;
}

static async handleFormSubmit(event) {
    event.preventDefault();
    const form = event.target;

    try {
        // غیرفعال کردن دکمه‌ها
        const buttons = form.querySelectorAll('button');
        buttons.forEach(btn => btn.disabled = true);

        // جمع‌آوری داده‌های فرم
        const data = UIManager.getFormData();

        // بررسی آیا ویرایش است یا ثبت جدید
        const appointmentId = form.dataset.appointmentId;
        let response;


        //اینو پاک کردم که بعدا بسازمupdateAppointment
        if (appointmentId) {
            // ویرایش نوبت موجود
            response = await AppointmentAPI.updateAppointment(appointmentId, data);
            UIManager.showNotification('نوبت با موفقیت به‌روزرسانی شد', 'success');
        } else {
            // ثبت نوبت جدید
            response = await AppointmentAPI.saveAppointment(data);
            UIManager.showNotification('نوبت با موفقیت ثبت شد', 'success');
        }

        // بستن مودال
        UIManager.closeModal();
            
        // به‌روزرسانی تقویم
        if (window.calendarManager) {
            await window.calendarManager.updateCalendarView();
        }

    } catch (error) {
        console.error('Error in form submission:', error);
        UIManager.showNotification(error.message || 'خطا در عملیات', 'error');
    } finally {
        // فعال کردن مجدد دکمه‌ها
        const buttons = form.querySelectorAll('button');
        buttons.forEach(btn => btn.disabled = false);
    }
}
constructor() {
    this.editModeTemplate = document.querySelector('.appointment_edit-mode-container');
    this.viewModeTemplate = document.querySelector('.dtl_appointment_view-mode-container');
  }

  static closeEditMode() {
        const viewContainer = document.querySelector('.dtl_appointment_view-mode');
        const editContainer = document.querySelector('.dtl_appointment_edit-mode');
        
        if (viewContainer && editContainer) {
            editContainer.style.display = 'none';
            viewContainer.style.display = 'block';
        }
    }

    static getStatusText(status) {
        const statusMap = {
            'normal': 'عادی',
            'emergency': 'اورژانسی',
            'pending': 'در انتظار',
            'visit': 'در حال ویزیت',
            'completed': 'تکمیل شده',
            'cancelled': 'لغو شده'
        };
        return statusMap[status] || status;
    }

  showEditMode(content) {
    if (this.editModeTemplate) {
      const contentSlot = this.editModeTemplate.querySelector('[name="edit-content"]');
      if (contentSlot) {
        contentSlot.innerHTML = content;
      }
      this.editModeTemplate.classList.add('active');
    }
  }

  hideEditMode() {
    if (this.editModeTemplate) {
      this.editModeTemplate.classList.remove('active');
    }
  }



  // Initialize event listeners
  init() {
    if (this.editModeTemplate) {
      // Close button
      const closeBtn = this.editModeTemplate.querySelector('.appointment_edit-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.hideEditMode());
      }
      
      // Cancel button
      const cancelBtn = this.editModeTemplate.querySelector('.appointment_edit-cancel');
      if (cancelBtn) {
        cancelBtn.addEventListener('click', () => this.hideEditMode());
      }
    }
  }


 static async loadTreatingDoctors() {
        try {
            console.log('Loading treatings...');
            const treating = await AppointmentAPI.gettreating();
            const treatingSelect = document.getElementById('visit_treating_doctor');
            if (treatingSelect) {
                treatingSelect.innerHTML = '<option value="">انتخاب پزشک...</option>';
                treating.forEach(treat => {
                    const option = document.createElement('option');
                    option.value = treat.id;
                    option.textContent = `${treat.name}`;
                    treatingSelect.appendChild(option);
                });
            }
            console.log('treating loaded:', treating);
        } catch (error) {
            console.error('Error loading treatings:', error);
            UIManager.showNotification(error.message, 'error');
        }
    }
 static resetModal() {
        // بستن مودال و پاک کردن اطلاعات
        UIManager.modal.style.display = 'none';
        UIManager.form.reset();
        delete UIManager.modal.dataset.appointmentId;
        delete UIManager.modal.dataset.editMode;
        UIManager.clearAllFieldErrors();
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
        console.log('Appointment params:', params);

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

  static gregorianToJalali(gy, gm, gd) {
    const g_d_m = [0, 31, (gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0) ? 29 : 28,
      31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let jy = (gy <= 1600) ? 0 : 979;
    gy -= (gy <= 1600) ? 621 : 1600;
    const gy2 = (gm > 2) ? (gy + 1) : gy;
    let days = (365 * gy) + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400);
    for (let i = 0; i < gm; ++i) days += g_d_m[i];
    days += gd - 1;

    let j_days = days - 79;
    const j_np = Math.floor(j_days / 12053);
    j_days %= 12053;
    jy += 33 * j_np + 4 * Math.floor(j_days / 1461);
    j_days %= 1461;

    if (j_days >= 366) {
      jy += Math.floor((j_days - 1) / 365);
      j_days = (j_days - 1) % 365;
    }

    const jm_list = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];
    let jm = 0, jd;
    for (; jm < 12 && j_days >= jm_list[jm]; jm++) {
      j_days -= jm_list[jm];
    }
    jd = j_days + 1;

    const weekdays = ['یک‌شنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'];
    const gDate = new Date(gy, gm - 1, gd);
    const weekDayName = weekdays[gDate.getDay()];

    const toFa = (str) => str.toString().replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);

    return `${weekDayName} ${toFa(jy)}/${toFa(String(jm).padStart(2, '0'))}/${toFa(String(jd).padStart(2, '0'))}`;
  }

}


