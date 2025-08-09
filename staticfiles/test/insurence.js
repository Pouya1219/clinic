    // این اسکریپت به صورت موقت اینجا قرار گرفته و باید به فایل اصلی JavaScript منتقل شود
    document.addEventListener('DOMContentLoaded', function() {
        // بارگذاری انواع بیمه در هنگام بارگذاری صفحه
        function loadInsuranceTypes() {
            PatientAPI.getInsuranceTypes()
                .then(data => {
                    if (data.success) {
                        let options = '<option value="">انتخاب کنید</option>';
                        data.insurance_types.forEach(type => {
                            options += `<option value="${type.id}">${type.name}</option>`;
                        });
                        $('#insuranceType, #edit-insurance-type').html(options);
                    } else {
                        console.error('Error loading insurance types:', data.error);
                    }
                })
                .catch(error => {
                    console.error('Error loading insurance types:', error);
                });
        }

        // فراخوانی تابع بارگذاری انواع بیمه
        loadInsuranceTypes();

        // راه‌اندازی تقویم شمسی برای فیلدهای تاریخ
        $('.datepicker').persianDatepicker({
            format: 'YYYY/MM/DD',
            autoClose: true,
            initialValue: true,
            persianDigit: true,
            observer: true,
            calendar: {
                persian: {
                    locale: 'fa'
                }
            }
        });
        
        // فعال‌سازی tooltip ها
        var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
        var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl)
        })
        
        // نمایش/مخفی کردن تاریخچه تغییرات
        $('#toggle-history').on('click', function() {
            const historyContent = $('#history-content');
            if (historyContent.is(':visible')) {
                historyContent.slideUp();
                $(this).text('نمایش');
            } else {
                historyContent.slideDown();
                $(this).text('مخفی');
            }
        });
        
        // اعتبارسنجی فرم‌ها
        (function() {
            'use strict';
            window.addEventListener('load', function() {
                // اعتبارسنجی همه فرم‌ها
                var forms = document.getElementsByClassName('needs-validation');
                var validation = Array.prototype.filter.call(forms, function(form) {
                    form.addEventListener('submit', function(event) {
                        if (form.checkValidity() === false) {
                            event.preventDefault();
                            event.stopPropagation();
                        }
                        form.classList.add('was-validated');
                    }, false);
                });
            }, false);
        })();
        
        // مدیریت دکمه‌های ویرایش و حذف
        document.querySelectorAll('.edit-insurance').forEach(button => {
            button.addEventListener('click', function() {
                const insuranceId = this.getAttribute('data-id');
                PatientUI.editInsurance(insuranceId);
            });
        });
        
        document.querySelectorAll('.delete-insurance').forEach(button => {
            button.addEventListener('click', function() {
                const insuranceId = this.getAttribute('data-id');
                
                Swal.fire({
                    title: 'آیا مطمئن هستید؟',
                    text: "این عملیات قابل بازگشت نیست!",
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#d33',
                    cancelButtonColor: '#3085d6',
                    confirmButtonText: 'بله، حذف شود',
                    cancelButtonText: 'انصراف'
                }).then((result) => {
                    if (result.isConfirmed) {
                        PatientUI.deleteInsurance(insuranceId);
                    }
                });
            });
        });
        
        // مدیریت فرم ویرایش بیمه
        const editForm = document.getElementById('edit-insurance-form');
        if (editForm) {
            editForm.addEventListener('submit', function(e) {
                e.preventDefault();
                const formData = new FormData(this);
                const insuranceId = this.getAttribute('data-insurance-id');
                
                // نمایش لودینگ
                const submitBtn = this.querySelector('button[type="submit"]');
                const originalText = submitBtn.innerHTML;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> در حال ذخیره...';
                submitBtn.disabled = true;
                
                PatientAPI.updatePatientInsurance(insuranceId, formData)
                    .then(response => {
                        if (response.success) {
                            // نمایش پیام موفقیت با SweetAlert2
                            Swal.fire({
                                icon: 'success',
                                title: 'موفقیت',
                                text: 'بیمه با موفقیت بروزرسانی شد.',
                                confirmButtonText: 'تایید'
                            }).then(() => {
                                $('#edit-insurance-modal').modal('hide');
                                window.location.reload();
                            });
                        } else {
                            // بازگرداندن دکمه به حالت اولیه
                            submitBtn.innerHTML = originalText;
                            submitBtn.disabled = false;
                            
                            // نمایش خطا
                            Swal.fire({
                                icon: 'error',
                                title: 'خطا',
                                text: response.error || 'خطا در بروزرسانی بیمه',
                                confirmButtonText: 'تایید'
                            });
                        }
                    })
                    .catch(error => {
                        // بازگرداندن دکمه به حالت اولیه
                        submitBtn.innerHTML = originalText;
                        submitBtn.disabled = false;
                        
                        // نمایش خطا
                        Swal.fire({
                            icon: 'error',
                            title: 'خطا',
                            text: error.message,
                            confirmButtonText: 'تایید'
                        });
                    });
            });
        }
        
        // مدیریت فرم افزودن بیمه
        const addForm = document.getElementById('add-insurance-form');
        if (addForm) {
            addForm.addEventListener('submit', function(e) {
                e.preventDefault();
                const formData = new FormData(this);
                const patientId = this.getAttribute('data-patient-id');
                
                // نمایش لودینگ
                const submitBtn = this.querySelector('button[type="submit"]');
                const originalText = submitBtn.innerHTML;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> در حال ذخیره...';
                submitBtn.disabled = true;
                
                PatientAPI.addPatientInsurance(patientId, formData)
                    .then(response => {
                        if (response.success) {
                            // نمایش پیام موفقیت با SweetAlert2
                            Swal.fire({
                                icon: 'success',
                                title: 'موفقیت',
                                text: 'بیمه جدید با موفقیت اضافه شد.',
                                confirmButtonText: 'تایید'
                            }).then(() => {
                                $('#add-insurance-modal').modal('hide');
                                window.location.reload();
                            });
                        } else {
                            // بازگرداندن دکمه به حالت اولیه
                            submitBtn.innerHTML = originalText;
                            submitBtn.disabled = false;
                            
                            // نمایش خطا
                            Swal.fire({
                                icon: 'error',
                                title: 'خطا',
                                text: response.error || 'خطا در افزودن بیمه',
                                confirmButtonText: 'تایید'
                            });
                        }
                    })
                    .catch(error => {
                        // بازگرداندن دکمه به حالت اولیه
                        submitBtn.innerHTML = originalText;
                        submitBtn.disabled = false;
                        
                        // نمایش خطا
                        Swal.fire({
                            icon: 'error',
                            title: 'خطا',
                            text: error.message,
                            confirmButtonText: 'تایید'
                        });
                    });
            });
        }
        
        // بروزرسانی لیست بیمه‌گران بر اساس نوع بیمه
        $('#insuranceType, #edit-insurance-type').on('change', function() {
            const typeId = $(this).val();
            const targetSelect = this.id === 'insuranceType' ? '#insuranceProvider' : '#edit-insurance-provider';
            
            $(targetSelect).html('<option value="">در حال بارگذاری...</option>');
            $(targetSelect).prop('disabled', true);
            
            if (!typeId) {
                $(targetSelect).html('<option value="">ابتدا نوع بیمه را انتخاب کنید</option>');
                return;
            }
            
            // دریافت بیمه‌گران
            PatientAPI.getInsuranceProviders(typeId)
                .then(data => {
                    if (data.success) {
                        let options = '<option value="">انتخاب کنید</option>';
                        data.providers.forEach(provider => {
                            options += `<option value="${provider.id}">${provider.name}</option>`;
                        });
                        $(targetSelect).html(options);
                        $(targetSelect).prop('disabled', false);
                    } else {
                        $(targetSelect).html('<option value="">خطا در بارگذاری</option>');
                    }
                })
                .catch(error => {
                    $(targetSelect).html('<option value="">خطا در بارگذاری</option>');
                    console.error('Error loading insurance providers:', error);
                });
        });
        
        // دکمه بروزرسانی لیست بیمه‌ها
        $('#refresh-insurance-btn').on('click', function() {
            const btn = $(this);
            const originalHtml = btn.html();
            
            btn.html('<i class="fas fa-spinner fa-spin"></i> بروزرسانی...');
            btn.prop('disabled', true);
            
            // شبیه‌سازی بروزرسانی
            setTimeout(() => {
                btn.html(originalHtml);
                btn.prop('disabled', false);
                PatientUI.showMessage('لیست بیمه‌ها با موفقیت بروزرسانی شد.', 'success');
            }, 1000);
        });
        
        // دکمه خروجی گرفتن از لیست بیمه‌ها
        $('#export-insurance-btn').on('click', function() {
            const exportOptions = [
                { icon: 'fas fa-file-excel', text: 'خروجی Excel', value: 'excel' },
                { icon: 'fas fa-file-pdf', text: 'خروجی PDF', value: 'pdf' },
                { icon: 'fas fa-print', text: 'چاپ', value: 'print' }
            ];
            
            let optionsHtml = '';
            exportOptions.forEach(option => {
                optionsHtml += `
                    <button class="dropdown-item export-option" data-type="${option.value}">
                        <i class="${option.icon} mr-2"></i> ${option.text}
                    </button>
                `;
            });
            
            // نمایش منوی خروجی
            const exportMenu = $(`
                <div class="dropdown-menu export-menu show" style="position: absolute; transform: translate3d(0px, 38px, 0px); top: 0px; left: 0px; will-change: transform;">
                    ${optionsHtml}
                </div>
            `);
            
            // اضافه کردن به صفحه
            $(this).after(exportMenu);
            
            // مدیریت کلیک روی گزینه‌ها
            $('.export-option').on('click', function() {
                const exportType = $(this).data('type');
                exportMenu.remove();
                
                // شبیه‌سازی خروجی گرفتن
                PatientUI.showMessage(`در حال آماده‌سازی خروجی ${exportType}...`, 'info');
            });
            
            // بستن منو با کلیک بیرون
            $(document).on('click', function(e) {
                if (!$(e.target).closest('.export-menu, #export-insurance-btn').length) {
                    exportMenu.remove();
                }
            });
        });
    });
