/**
 * کلاس مدیریت رابط کاربری بیمار
 */
class PatientUI {
    /**
     * راه‌اندازی اولیه
     */
    static init() {
        // فراخوانی تمام متدهای راه‌اندازی
        PatientUI.setupTabNavigation();
        PatientUI.setupSubTabNavigation();
        PatientUI.setupFormHandlers();
        PatientUI.setupCardActions();
        PatientUI.setupPrintFunctions();
        //PatientUI.setupPaymentFunctions();
        //PatientUI.setupToothSelection();
        //PatientUI.setupAttachmentHandlers();
        //PatientUI.setupTreatmentHandlers();
        PatientUI.setupInsuranceHandlers();
        //PatientUI.setupColumnSettings();
        PatientUI.setupTreatmentTypeSelect();
        // بیمه
        PatientUI.loadInsuranceTypes();
        PatientUI.setupPersianDatepicker();
        PatientUI.setupTooltips();
        PatientUI.setupHistoryToggle();
        PatientUI.setupFormValidation();
        PatientUI.setupEditInsuranceButtons();
        PatientUI.setupDeleteInsuranceButtons();
        PatientUI.setupEditInsuranceForm();
        PatientUI.setupAddInsuranceForm();
        PatientUI.setupInsuranceProviderSelect();
        PatientUI.setupRefreshInsuranceButton();
        PatientUI.setupExportInsuranceButton();
        PatientUI.setupAddInsuranceModal();
        // در جاوااسکریپت
        const patientId = document.querySelector('[data-patient-id]').dataset.patientId;
        console.log('patientId:',patientId)
        console.log('PatientUI initialized');
    }
    
    static setupPrintFunctions() {
        // دکمه پرینت مستقیم
        const directPrintButton = document.getElementById('print-direct-btn');
    if (directPrintButton) {
        directPrintButton.addEventListener('click', this.printPatientFile.bind(this));
    }

        // دکمه پیش‌نمایش پرینت
        const previewPrintButton = document.getElementById('print-preview-btn');
    if (previewPrintButton) {
        previewPrintButton.addEventListener('click', this.togglePrintPreview.bind(this));
    }

        // دراپ‌دان ذخیره فایل
        const dropdownToggle = document.querySelector('.med-print-dropdown-toggle');
        const dropdownMenu = document.querySelector('.med-print-dropdown-menu');
        
        if (dropdownToggle && dropdownMenu) {
            dropdownToggle.addEventListener('click', (e) => {
                e.preventDefault();
                dropdownMenu.classList.toggle('show');
            });
            
            // بستن دراپ‌دان با کلیک بیرون
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.med-print-dropdown')) {
                    dropdownMenu.classList.remove('show');
                }
            });
            
            // اتصال توابع به دکمه‌های دراپ‌دان
            const excelButton = dropdownMenu.querySelector('[data-format="excel"]');
            const wordButton = dropdownMenu.querySelector('[data-format="word"]');
            const pdfButton = dropdownMenu.querySelector('[data-format="pdf"]');
            
            if (excelButton) excelButton.addEventListener('click', this.exportToExcel.bind(this));
            if (wordButton) wordButton.addEventListener('click', this.exportToWord.bind(this));
            if (pdfButton) pdfButton.addEventListener('click', this.exportToPDF.bind(this));
        }
    }

    /**
     * پرینت مستقیم پرونده بیمار
     */
    static printPatientFile() {
        const printArea = document.getElementById('printArea');
        if (!printArea) {
            this.showMessage('خطا در چاپ پرونده بیمار', 'error');
            return;
        }

        // ایجاد یک پنجره جدید برای چاپ
        const printWindow = window.open('', '_blank');
        
        // اضافه کردن استایل‌های لازم برای چاپ
        printWindow.document.write(`
            <html>
            <head>
                <title>چاپ پرونده بیمار</title>
                <style>
                    @page { size: A4; margin: 1cm; }
                    body { font-family: Arial, sans-serif; direction: rtl; }
                    .print-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
                    .clinic-logo img { max-width: 100px; }
                    .clinic-info { text-align: center; }
                    .med-print-section { margin-bottom: 20px; }
                    .med-print-info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
                    .med-print-info-item { display: flex; }
                    .med-print-label { font-weight: bold; margin-left: 5px; }
                    .med-print-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                    .med-print-table th, .med-print-table td { border: 1px solid #ddd; padding: 8px; text-align: right; }
                    .med-print-table th { background-color: #f2f2f2; }
                    .med-print-footer { display: flex; justify-content: space-between; margin-top: 20px; font-size: 12px; }
                    .page-break { page-break-after: always; }
                </style>
            </head>
            <body onload="window.print()">
                ${printArea.innerHTML}
            </body>
            </html>
        `);
        
        printWindow.document.close();
    }

    /**
     * نمایش/مخفی کردن پیش‌نمایش پرینت
     */
    static togglePrintPreview() {
        const printPreview = document.querySelector('.med-print-preview');
        if (printPreview) {
            const currentDisplay = window.getComputedStyle(printPreview).display;
            printPreview.style.display = currentDisplay === 'none' ? 'block' : 'none';
        }
    }

    /**
     * خروجی Excel از پرونده بیمار
     */
    static exportToExcel() {
        const patientId = document.querySelector('[data-patient-id]')?.dataset.patientId;
        if (!patientId) {
            this.showMessage('خطا در دریافت شناسه بیمار', 'error');
            return;
        }

        try {
            // دریافت اطلاعات از صفحه
            const patientName = document.querySelector('.med-print-info-grid .med-print-info-item:nth-child(2) .med-print-value')?.textContent || '';
            const fileNum = document.querySelector('.med-print-info-grid .med-print-info-item:nth-child(1) .med-print-value')?.textContent || '';
            
            // ایجاد داده برای Excel
            const workbook = XLSX.utils.book_new();
            
            // اطلاعات بیمار
            const patientData = [
                ['شماره پرونده', fileNum],
                ['نام و نام خانوادگی', patientName]
            ];
            
            // اضافه کردن سایر اطلاعات از صفحه
            document.querySelectorAll('.med-print-info-grid .med-print-info-item').forEach(item => {
                const label = item.querySelector('.med-print-label')?.textContent.replace(':', '') || '';
                const value = item.querySelector('.med-print-value')?.textContent || '';
                if (label && value && label !== 'شماره پرونده' && label !== 'نام و نام خانوادگی') {
                    patientData.push([label, value]);
                }
            });
            
            const patientSheet = XLSX.utils.aoa_to_sheet(patientData);
            XLSX.utils.book_append_sheet(workbook, patientSheet, "اطلاعات بیمار");
            
            // اطلاعات بیمه
            const insuranceTable = document.querySelector('.med-print-section:nth-child(2) .med-print-table');
            if (insuranceTable) {
                const insuranceData = XLSX.utils.table_to_sheet(insuranceTable);
                XLSX.utils.book_append_sheet(workbook, insuranceData, "اطلاعات بیمه");
            }
            
            // سوابق درمانی
            const treatmentTable = document.querySelector('.med-print-section:nth-child(3) .med-print-table');
            if (treatmentTable) {
                const treatmentData = XLSX.utils.table_to_sheet(treatmentTable);
                XLSX.utils.book_append_sheet(workbook, treatmentData, "سوابق درمانی");
            }
            
            // سوابق درمانی قبلی
            const prevTreatmentTable = document.querySelector('.med-print-table:last-of-type');
            if (prevTreatmentTable) {
                const prevTreatmentData = XLSX.utils.table_to_sheet(prevTreatmentTable);
                XLSX.utils.book_append_sheet(workbook, prevTreatmentData, "سوابق درمانی قبلی");
            }
            
            // دانلود فایل Excel
            XLSX.writeFile(workbook, `patient_${patientId}_record.xlsx`);
            this.showMessage('فایل اکسل با موفقیت دانلود شد.', 'success');
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            this.showMessage('خطا در ایجاد فایل اکسل', 'error');
        }
    }

    /**
     * خروجی Word از پرونده بیمار
     */
    static exportToWord() {
        const printArea = document.getElementById('printArea');
        if (!printArea) {
            this.showMessage('خطا در دریافت اطلاعات بیمار', 'error');
            return;
        }
        
        try {
            // ایجاد محتوای HTML برای Word
            const htmlContent = `
                <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'>
                <head>
                    <meta charset="utf-8">
                    <title>پرونده بیمار</title>
                    <style>
                        body { font-family: Arial, sans-serif; direction: rtl; }
                        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
                        th { background-color: #f2f2f2; }
                        h1, h2, h3 { color: #333; }
                        .header { text-align: center; margin-bottom: 20px; }
                        .section { margin-bottom: 20px; }
                    </style>
                </head>
                <body>
                    ${printArea.innerHTML}
                </body>
                </html>
            `;
            
            // تبدیل HTML به Blob و دانلود
            const blob = new Blob([htmlContent], { type: 'application/msword' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'patient_record.doc';
            link.click();
            
            this.showMessage('فایل Word با موفقیت دانلود شد.', 'success');
        } catch (error) {
            console.error('Error exporting to Word:', error);
            this.showMessage('خطا در ایجاد فایل Word', 'error');
        }
    }

    /**
     * خروجی PDF از پرونده بیمار
     */
    static exportToPDF() {
        const printArea = document.getElementById('printArea');
        if (!printArea) {
            this.showMessage('خطا در دریافت اطلاعات بیمار', 'error');
            return;
        }
        
        try {
            // تبدیل HTML به PDF با استفاده از jsPDF و html2canvas
            html2canvas(printArea).then(canvas => {
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('p', 'mm', 'a4');
                const imgProps = pdf.getImageProperties(imgData);
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
                
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                pdf.save('patient_record.pdf');
                
                this.showMessage('فایل PDF با موفقیت دانلود شد.', 'success');
            });
        } catch (error) {
            console.error('Error exporting to PDF:', error);
            this.showMessage('خطا در ایجاد فایل PDF', 'error');
        }
    }
    static showMessage(message, type = 'info', duration = 5000) {
        // اگر قبلا پیامی با همین متن و نوع وجود دارد، آن را حذف کنید
        const existingMessage = document.querySelector(`.alert-${type}[data-message="${message}"]`);
        if (existingMessage) {
            existingMessage.remove();
        }

        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show animated fadeInDown`; // اضافه کردن انیمیشن
        alertDiv.setAttribute('role', 'alert');
        alertDiv.setAttribute('data-message', message); // اضافه کردن اتریبیوت data-message

        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;

        // اضافه کردن دکمه بستن به پیام
        const closeButton = alertDiv.querySelector('.btn-close');
        closeButton.addEventListener('click', () => {
            alertDiv.classList.remove('show');
            alertDiv.classList.add('animated', 'fadeOutUp'); // انیمیشن خروج
            alertDiv.addEventListener('animationend', () => {
                alertDiv.remove();
            });
        });


        let messagesContainer = document.querySelector('.messages');
        if (!messagesContainer) {
            messagesContainer = document.createElement('div');
            messagesContainer.className = 'messages';
            document.body.prepend(messagesContainer); // اضافه کردن به ابتدای body
        }

        messagesContainer.appendChild(alertDiv);

        // حذف پیام بعد از مدت زمان مشخص
        setTimeout(() => {
            if (alertDiv && alertDiv.parentNode) { // بررسی وجود المان و والد آن
                alertDiv.classList.remove('show');
                alertDiv.classList.add('animated', 'fadeOutUp'); // انیمیشن خروج
                alertDiv.addEventListener('animationend', () => {
                    alertDiv.remove();
                });
            }
        }, duration);
    }

    static closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            const bsModal = bootstrap.Modal.getInstance(modal);
            if (bsModal) {
                bsModal.hide();
            } else {
                // Fallback if no instance found (e.g., modal not yet initialized)
                modal.classList.remove('show');
                modal.style.display = 'none';
                document.querySelector('.modal-backdrop')?.remove();
            }
        } else {
            console.error(`Modal with ID "${modalId}" not found.`);
        }
    }

static setupRefreshInsuranceButton() {
        const refreshButton = document.getElementById('refresh-insurance-btn');
        if (refreshButton) {
            refreshButton.addEventListener('click', () => {
                // غیرفعال کردن دکمه و نمایش انیمیشن لودینگ
                refreshButton.disabled = true;
                refreshButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> در حال بارگذاری...';

                // دریافت شناسه بیمار از data attribute
                const patientId = document.querySelector('[data-patient-id]')?.dataset.patientId;

                if (!patientId) {
                    console.error('Patient ID not found');
                    // ... handle error ...
                    return;
                }

                // اگر insuranceData وجود ندارد، درخواست به سرور ارسال شود
                if (!PatientUI.insuranceData) {
                    PatientAPI.getPatientInsurances(patientId)
                        .then(data => {
                            if (data.success) {
                                PatientUI.insuranceData = data.insurances; // ذخیره اطلاعات بیمه‌ها
                                PatientUI.updateInsuranceTable(patientId); // به‌روزرسانی جدول
                                PatientUI.showMessage('لیست بیمه‌ها با موفقیت به‌روزرسانی شد.', 'success');
                            } else {
                                PatientUI.showMessage(data.error || 'خطا در بارگذاری اطلاعات بیمه', 'error');
                            }
                        })
                        .catch(error => {
                            PatientUI.showMessage('خطا در بارگذاری اطلاعات بیمه', 'error');
                            console.error('Error refreshing insurances:', error);
                        })
                        .finally(() => {
                            // فعال کردن دکمه و حذف انیمیشن لودینگ
                            refreshButton.disabled = false;
                            refreshButton.innerHTML = '<i class="fas fa-sync-alt"></i> بروزرسانی';
                        });
                } else {
                    // در غیر این صورت، از insuranceData برای به‌روزرسانی جدول استفاده شود
                    PatientUI.updateInsuranceTable(patientId);
                    refreshButton.disabled = false;
                    refreshButton.innerHTML = '<i class="fas fa-sync-alt"></i> بروزرسانی';
                }
            });
        }
    

    // تابع کمکی برای نمایش آیکون نوع بیمه
    function getInsuranceTypeIcon(typeName) {
        if (typeName === 'درصدی') {
            return '<i class="fas fa-percentage text-primary"></i>';
        } else if (typeName === 'تعرفه‌ای') {
            return '<i class="fas fa-table text-success"></i>';
        } else {
            return '<i class="fas fa-shield-alt text-info"></i>';
        }
    }
}

static setupExportInsuranceButton() {
    const exportButton = document.getElementById('export-insurance-btn');
    if (exportButton) {
        exportButton.addEventListener('click', () => {
            // نمایش منوی خروجی
            const exportMenu = document.createElement('div');
            exportMenu.className = 'dropdown-menu export-menu show';
            exportMenu.style.position = 'absolute';
            exportMenu.style.transform = 'translate3d(0px, 38px, 0px)';
            exportMenu.style.top = '0px';
            exportMenu.style.left = '0px';
            exportMenu.style.willChange = 'transform';
            exportMenu.style.zIndex = '1000';

            const exportOptions = [
                { icon: 'fas fa-file-excel', text: 'خروجی Excel', type: 'excel' },
                { icon: 'fas fa-file-pdf', text: 'خروجی PDF', type: 'pdf' },
                { icon: 'fas fa-print', text: 'چاپ', type: 'print' }
            ];

            let optionsHtml = '';
            exportOptions.forEach(option => {
                optionsHtml += `
                    <button class="dropdown-item export-option" data-type="${option.type}">
                        <i class="${option.icon} mr-2"></i> ${option.text}
                    </button>
                `;
            });

            exportMenu.innerHTML = optionsHtml;

            // اضافه کردن به صفحه
            exportButton.parentNode.appendChild(exportMenu);

            // مدیریت کلیک روی گزینه‌ها
            exportMenu.querySelectorAll('.export-option').forEach(option => {
                option.addEventListener('click', () => {
                    const exportType = option.dataset.type;
                    exportMenu.remove();

                    // دریافت شناسه بیمار
                    const patientId = document.querySelector('[data-patient-id]')?.dataset.patientId;
                    if (!patientId) {
                        PatientUI.showMessage('خطا در دریافت شناسه بیمار', 'error');
                        return;
                    }

                    if (exportType === 'excel') {
                        PatientUI.exportInsurancesToExcel(patientId);
                    } else if (exportType === 'pdf') {
                        PatientUI.exportInsurancesToPDF(patientId);
                    } else if (exportType === 'print') {
                        PatientUI.printInsurances(patientId);
                    }
                });
            });

            // بستن منو با کلیک بیرون
            document.addEventListener('click', function closeMenu(e) {
                if (!e.target.closest('.export-menu, #export-insurance-btn')) {
                    exportMenu.remove();
                    document.removeEventListener('click', closeMenu);
                }
            });
        });
    }
}

static exportInsurancesToExcel(patientId) {
    PatientAPI.getPatientInsurances(patientId)
        .then(data => {
            if (data.success && data.insurances) {
                // تبدیل داده‌ها به فرمت مناسب برای اکسل
                const excelData = data.insurances.map((insurance, index) => ({
                    'ردیف': index + 1,
                    'نوع بیمه': insurance.insurance_provider__insurance_type__name || '',
                    'بیمه‌گر': insurance.insurance_provider__name || '',
                    'شماره بیمه': insurance.insurance_number || '',
                    'تاریخ انقضا': insurance.expiry_date || '',
                    'درصد پوشش': insurance.coverage_percentage || '',
                    'وضعیت': insurance.is_active ? 'فعال' : 'غیرفعال'
                }));

                // ایجاد و دانلود فایل اکسل
                const worksheet = XLSX.utils.json_to_sheet(excelData);
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, "Insurances");
                XLSX.writeFile(workbook, "patient_insurances.xlsx");

                PatientUI.showMessage('فایل اکسل با موفقیت دانلود شد.', 'success');
            } else {
                PatientUI.showMessage(data.error || 'خطا در دریافت اطلاعات بیمه', 'error');
            }
        })
        .catch(error => {
            PatientUI.showMessage('خطا در دریافت اطلاعات بیمه', 'error');
            console.error('Error exporting insurances to Excel:', error);
        });
}

static exportInsurancesToPDF(patientId) {
    PatientAPI.getPatientInsurances(patientId)
        .then(data => {
            if (data.success && data.insurances) {
                // ایجاد محتوای HTML برای تبدیل به PDF
                let htmlContent = `
                    <html>
                    <head>
                        <style>
                            body { font-family: Arial, sans-serif; direction: rtl; }
                            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                            th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
                            th { background-color: #f2f2f2; }
                            .header { text-align: center; margin-bottom: 20px; }
                            .footer { text-align: center; margin-top: 20px; font-size: 12px; }
                        </style>
                    </head>
                    <body>
                        <div class="header">
                            <h2>لیست بیمه‌های بیمار</h2>
                            <p>تاریخ: ${new Date().toLocaleDateString('fa-IR')}</p>
                        </div>
                        <table>
                            <thead>
                                <tr>
                                    <th>ردیف</th>
                                    <th>نوع بیمه</th>
                                    <th>بیمه‌گر</th>
                                    <th>شماره بیمه</th>
                                    <th>تاریخ انقضا</th>
                                    <th>درصد پوشش</th>
                                    <th>وضعیت</th>
                                </tr>
                            </thead>
                            <tbody>
                `;

                data.insurances.forEach((insurance, index) => {
                    htmlContent += `
                        <tr>
                            <td>${index + 1}</td>
                            <td>${insurance.insurance_provider__insurance_type__name || ''}</td>
                            <td>${insurance.insurance_provider__name || ''}</td>
                            <td>${insurance.insurance_number || ''}</td>
                            <td>${insurance.expiry_date || ''}</td>
                            <td>${insurance.coverage_percentage || ''}%</td>
                            <td>${insurance.is_active ? 'فعال' : 'غیرفعال'}</td>
                        </tr>
                    `;
                });

                htmlContent += `
                            </tbody>
                        </table>
                        <div class="footer">
                            <p>این گزارش به صورت خودکار تولید شده است.</p>
                        </div>
                    </body>
                    </html>
                `;

                // تبدیل HTML به PDF و دانلود
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF('p', 'pt', 'a4');
                
                doc.html(htmlContent, {
                    callback: function(doc) {
                        doc.save('patient_insurances.pdf');
                        PatientUI.showMessage('فایل PDF با موفقیت دانلود شد.', 'success');
                    },
                    x: 15,
                    y: 15,
                    width: 170, // mm
                    windowWidth: 650 // px
                });
            } else {
                PatientUI.showMessage(data.error || 'خطا در دریافت اطلاعات بیمه', 'error');
            }
        })
        .catch(error => {
            PatientUI.showMessage('خطا در دریافت اطلاعات بیمه', 'error');
            console.error('Error exporting insurances to PDF:', error);
        });
}

static printInsurances(patientId) {
    PatientAPI.getPatientInsurances(patientId)
        .then(data => {
            if (data.success && data.insurances) {
                // ایجاد پنجره جدید برای چاپ
                const printWindow = window.open('', '_blank');
                
                // ایجاد محتوای HTML برای چاپ
                let htmlContent = `
                    <html>
                    <head>
                        <title>لیست بیمه‌های بیمار</title>
                        <style>
                            body { font-family: Arial, sans-serif; direction: rtl; }
                            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                            th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
                            th { background-color: #f2f2f2; }
                            .header { text-align: center; margin-bottom: 20px; }
                            .footer { text-align: center; margin-top: 20px; font-size: 12px; }
                            @media print {
                                button { display: none; }
                            }
                        </style>
                    </head>
                    <body>
                        <div class="header">
                            <h2>لیست بیمه‌های بیمار</h2>
                            <p>تاریخ: ${new Date().toLocaleDateString('fa-IR')}</p>
                        </div>
                        <table>
                            <thead>
                                <tr>
                                    <th>ردیف</th>
                                    <th>نوع بیمه</th>
                                    <th>بیمه‌گر</th>
                                    <th>شماره بیمه</th>
                                    <th>تاریخ انقضا</th>
                                    <th>درصد پوشش</th>
                                    <th>وضعیت</th>
                                </tr>
                            </thead>
                            <tbody>
                `;

                data.insurances.forEach((insurance, index) => {
                    htmlContent += `
                        <tr>
                            <td>${index + 1}</td>
                            <td>${insurance.insurance_provider__insurance_type__name || ''}</td>
                            <td>${insurance.insurance_provider__name || ''}</td>
                            <td>${insurance.insurance_number || ''}</td>
                            <td>${insurance.expiry_date || ''}</td>
                            <td>${insurance.coverage_percentage || ''}%</td>
                            <td>${insurance.is_active ? 'فعال' : 'غیرفعال'}</td>
                        </tr>
                    `;
                });

                htmlContent += `
                            </tbody>
                        </table>
                        <div class="footer">
                            <p>این گزارش به صورت خودکار تولید شده است.</p>
                        </div>
                        <button onclick="window.print();" style="margin-top: 20px; padding: 10px;">چاپ</button>
                    </body>
                    </html>
                `;

                printWindow.document.write(htmlContent);
                printWindow.document.close();
            } else {
                PatientUI.showMessage(data.error || 'خطا در دریافت اطلاعات بیمه', 'error');
            }
        })
        .catch(error => {
            PatientUI.showMessage('خطا در دریافت اطلاعات بیمه', 'error');
            console.error('Error printing insurances:', error);
        });
}

static setupAddInsuranceModal() {
    const addInsuranceBtn = document.querySelector('.add-insurance-btn');
    if (addInsuranceBtn) {
        addInsuranceBtn.addEventListener('click', () => {
            try {
                // بررسی وجود مودال
                const modal = document.getElementById('add-insurance-modal');
                if (!modal) {
                    console.error('Modal element not found: add-insurance-modal');
                    return;
                }

                // بررسی وجود jQuery
                if (typeof $ === 'undefined') {
                    console.error('jQuery is not defined');
                    modal.style.display = 'block';
                    return;
                }

                // بررسی وجود Bootstrap
                if (typeof bootstrap === 'undefined' || typeof bootstrap.Modal === 'undefined') {
                    console.error('Bootstrap Modal is not defined');
                    // استفاده از روش جایگزین
                    modal.style.display = 'block';
                    return;
                }

                // استفاده از Bootstrap Modal
                const bootstrapModal = new bootstrap.Modal(modal);
                bootstrapModal.show();
            } catch (error) {
                console.error('Error opening modal:', error);
                // استفاده از روش جایگزین در صورت بروز خطا
                try {
                    const modal = document.getElementById('add-insurance-modal');
                    if (modal) {
                        modal.style.display = 'block';
                    }
                } catch (e) {
                    console.error('Failed to open modal using fallback method:', e);
                }
            }
        });
    } else {
        console.error('Add insurance button not found');
    }
}

static setupAddInsuranceForm() {
    const form = document.getElementById('add-insurance-form');
    if (!form) {
        console.error('Add insurance form not found');
        return;
    }

     // حذف event listener قبلی (در صورت وجود)
    form.removeEventListener('submit', this.handleFormSubmit);
    
    // Prevent modal close when clicking on form elements
    form.querySelectorAll('input, select, textarea, .datepicker, .input-group-text').forEach(element => {
        element.addEventListener('click', event => {
            event.stopPropagation();
        });
    });

    // Define the submit handler
    this.handleFormSubmit = async (e) => {
        e.preventDefault();

        // Disable submit button immediately
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn.disabled) return; // Already submitting
        submitBtn.disabled = true;
        
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> در حال ذخیره...';

        try {
            // Validate form
            const patientId = form.dataset.patientId;
            if (!patientId) {
                throw new Error('خطا در دریافت شناسه بیمار');
            }

            const formData = new FormData(form);
            const requiredFields = [
                { name: 'insurance_type', message: 'لطفاً نوع بیمه را انتخاب کنید' },
                { name: 'insurance_provider', message: 'لطفاً بیمه‌گر را انتخاب کنید' },
                { name: 'insurance_number', message: 'لطفاً شماره بیمه را وارد کنید' },
                { name: 'expiry_date', message: 'لطفاً تاریخ انقضا را وارد کنید' }
            ];

            for (const field of requiredFields) {
                if (!formData.get(field.name)) {
                    throw new Error(field.message);
                }
            }

            // Submit the form
            const response = await PatientAPI.addPatientInsurance(patientId, formData);

            if (response.success) {
                PatientUI.updateInsuranceTable(patientId);
                PatientUI.showMessage('بیمه با موفقیت اضافه شد', 'success');
                e.preventDefault();
                PatientUI.closeModal('add-insurance-modal');

                form.reset();
                
                // Enable insurance provider select if exists
                const insuranceProviderSelect = document.getElementById('insuranceProvider');
                if (insuranceProviderSelect) {
                    insuranceProviderSelect.disabled = false;
                }
            } else {
                throw new Error(response.error || 'خطا در افزودن بیمه');
            }
        } catch (error) {
            console.error('Error adding insurance:', error);
            PatientUI.showMessage(error.message, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    };
    // اتصال event listener جدید
    //form.addEventListener('submit', this.handleFormSubmit);
}

static loadInsuranceTypesAndProviders() {
    return new Promise((resolve, reject) => {
        $.ajax({
            url: '/Patient/get-insurance-data/',
            type: 'GET',
            dataType: 'json',
            success: (data) => {  // Use arrow function here
                if (data.error) {
                    PatientUI.showMessage(data.error, 'error');
                    reject(new Error(data.error));
                    return;
                }

                try {
                    // Populate insurance types
                    const insuranceTypeSelect = $('#insuranceType, #edit-insurance-type');
                    insuranceTypeSelect.empty();
                    insuranceTypeSelect.append($('<option>', { value: '', text: 'انتخاب کنید' }));
                    data.insurance_types.forEach(type => {
                        insuranceTypeSelect.append($('<option>', { value: type.id, text: type.name }));
                    });

                    // Store insurance providers
                    PatientUI.insuranceProviders = data.insurance_providers;

                    // Function to populate insurance providers based on type
                    const populateInsuranceProviders = (typeId, targetSelect) => {
                        const providers = PatientUI.insuranceProviders.filter(provider => provider.insurance_type_id == typeId);
                        targetSelect.empty();
                        targetSelect.append($('<option>', { value: '', text: 'انتخاب کنید' }));
                        providers.forEach(provider => {
                            targetSelect.append($('<option>', { value: provider.id, text: provider.name }));
                        });
                        targetSelect.prop('disabled', false);
                    };

                    // Handle insurance type change in add form
                    $('#insuranceType').on('change', function () {
                        populateInsuranceProviders($(this).val(), $('#insuranceProvider'));
                    });

                    // Handle insurance type change in edit form
                    $('#edit-insurance-type').on('change', function () {
                        populateInsuranceProviders($(this).val(), $('#edit-insurance-provider'));
                    });

                    resolve(data); // Resolve the promise after successful data processing
                } catch (error) {
                    console.error("Error populating insurance data:", error);
                    PatientUI.showMessage('خطا در پردازش اطلاعات بیمه', 'error');
                    reject(error); // Reject the promise if an error occurs during processing
                }
            },
            error: (xhr, status, error) => { // Use arrow function here
                PatientUI.showMessage('خطا در دریافت اطلاعات بیمه', 'error');
                console.error('Error loading insurance data:', error);
                reject(error);
            }
        });
    });
}


static setupEditInsuranceForm() {
    const form = document.getElementById('edit-insurance-form');
    if (form) {
        form.addEventListener('submit', e => {
            e.preventDefault();

            const insuranceId = form.dataset.insuranceId;
            if (!insuranceId) {
                PatientUI.showMessage('خطا در دریافت شناسه بیمه', 'error');
                return;
            }
            form.querySelectorAll('input, select, textarea').forEach(element => {
            element.addEventListener('click', event => {
            event.stopPropagation();
            });
            });
            const formData = new FormData(form);

            // اعتبارسنجی فرم
            const insuranceType = formData.get('insurance_type');
            const insuranceProvider = formData.get('insurance_provider');
            const insuranceNumber = formData.get('insurance_number');
            const expiryDate = formData.get('expiry_date');

            if (!insuranceType) {
                PatientUI.showMessage('لطفاً نوع بیمه را انتخاب کنید', 'error');
                return;
            }

            if (!insuranceProvider) {
                PatientUI.showMessage('لطفاً بیمه‌گر را انتخاب کنید', 'error');
                return;
            }

            if (!insuranceNumber) {
                PatientUI.showMessage('لطفاً شماره بیمه را وارد کنید', 'error');
                return;
            }

            if (!expiryDate) {
                PatientUI.showMessage('لطفاً تاریخ انقضا را وارد کنید', 'error');
                return;
            }

            // نمایش لودینگ
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> در حال ذخیره...';

            PatientAPI.updatePatientInsurance(insuranceId, formData)
                .then(response => {
                    if (response.success) {
                        // بستن مودال
                        try {
                            if (typeof $ !== 'undefined') {
                                $('#edit-insurance-modal').modal('hide');
                            } else {
                                document.getElementById('edit-insurance-modal').style.display = 'none';
                            }
                        } catch (error) {
                            console.error('Error closing modal:', error);
                        }

                        // دریافت شناسه بیمار
                        const patientId = document.querySelector('[data-patient-id]')?.dataset.patientId;
                        if (patientId) {
                            // به‌روزرسانی جدول
                            PatientUI.updateInsuranceTable(patientId);
                        }
                        
                        // نمایش پیام موفقیت
                        PatientUI.showMessage('بیمه با موفقیت به‌روزرسانی شد', 'success');
                    } else {
                        PatientUI.showMessage(response.error || 'خطا در به‌روزرسانی بیمه', 'error');
                    }
                })
                .catch(error => {
                    PatientUI.showMessage('خطا در به‌روزرسانی بیمه', 'error');
                    console.error('Error updating insurance:', error);
                })
                .finally(() => {
                    // بازگرداندن دکمه به حالت اولیه
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                });
        });
    } else {
        console.error('Edit insurance form not found');
    }
}

static setupDeleteInsuranceButtons() {
    document.querySelectorAll('.delete-insurance').forEach(button => {
        button.addEventListener('click', () => {
            const insuranceId = button.dataset.id;
            if (!insuranceId) {
                PatientUI.showMessage('خطا در دریافت شناسه بیمه', 'error');
                return;
            }

            // استفاده از SweetAlert2 برای نمایش پیام تأیید
            if (typeof Swal !== 'undefined') {
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
                        deleteInsurance(insuranceId);
                    }
                });
            } else {
                // استفاده از confirm معمولی در صورت عدم وجود SweetAlert2
                if (confirm('آیا از حذف این بیمه اطمینان دارید؟')) {
                    deleteInsurance(insuranceId);
                }
            }
        });
    });

    function deleteInsurance(insuranceId) {
    PatientAPI.deletePatientInsurance(insuranceId)
        .then(response => {
            if (response.success) {
                // دریافت شناسه بیمار
                const patientId = document.querySelector('[data-patient-id]')?.dataset.patientId;

                if (patientId) {
                    // به‌روزرسانی جدول
                    PatientUI.updateInsuranceTable(patientId);
                } else {
                    // حذف ردیف از جدول اگر شناسه بیمار موجود نیست
                    const row = document.querySelector(`.delete-insurance[data-id="${insuranceId}"]`)?.closest('tr');
                    if (row) {
                        row.remove();
                    }
                }

                PatientUI.showMessage('بیمه با موفقیت حذف شد.', 'success');
            } else {
                PatientUI.showMessage(response.error || 'خطا در حذف بیمه', 'error');
            }
        })
        .catch(error => {
            PatientUI.showMessage('خطا در حذف بیمه', 'error');
            console.error('Error deleting insurance:', error);
        });
}
}
static loadInsuranceTypes() {
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

static setupAddInsuranceModal() {
    const modal = $('#add-insurance-modal');
    modal.on('shown.bs.modal', () => {
        PatientUI.setupAddInsuranceForm(); // اتصال Event Listener در اینجا
    });
    const addInsuranceBtn = document.querySelector('.add-insurance-btn');
    if (addInsuranceBtn) {
        addInsuranceBtn.addEventListener('click', () => {
            $('#add-insurance-modal').modal('show');
        });
    }
}
static setupRefreshInsuranceButton() {
    const refreshButton = document.getElementById('refresh-insurance-btn');
    if (refreshButton) {
        refreshButton.addEventListener('click', () => {
            // غیرفعال کردن دکمه و نمایش انیمیشن لودینگ
            refreshButton.disabled = true;
            refreshButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> در حال بارگذاری...';

            // دریافت شناسه بیمار از data attribute
            const patientId = document.querySelector('[data-patient-id]').dataset.patientId;

            // فراخوانی تابع بروزرسانی جدول
            PatientUI.updateInsuranceTable(patientId)
                .finally(() => {
                    // فعال کردن دکمه و حذف انیمیشن لودینگ
                    refreshButton.disabled = false;
                    refreshButton.innerHTML = '<i class="fas fa-sync-alt"></i> بروزرسانی';
                });
        });
    }
}
static setupExportInsuranceButton() {
    const exportButton = document.getElementById('export-insurance-btn');
    if (exportButton) {
        exportButton.addEventListener('click', () => {
            // نمایش منوی خروجی
            const exportMenu = document.createElement('div');
            exportMenu.className = 'dropdown-menu show';
            exportMenu.style.position = 'absolute';
            exportMenu.style.transform = 'translate3d(0px, 38px, 0px)';
            exportMenu.style.top = '0px';
            exportMenu.style.left = '0px';
            exportMenu.style.willChange = 'transform';

            exportMenu.innerHTML = `
                <button class="dropdown-item export-option" data-type="excel">
                    <i class="fas fa-file-excel mr-2"></i> خروجی Excel
                </button>
                <button class="dropdown-item export-option" data-type="pdf">
                    <i class="fas fa-file-pdf mr-2"></i> خروجی PDF
                </button>
                <button class="dropdown-item export-option" data-type="print">
                    <i class="fas fa-print mr-2"></i> چاپ
                </button>
            `;

            // اضافه کردن به صفحه
            exportButton.after(exportMenu);

            // مدیریت کلیک روی گزینه‌ها
            exportMenu.querySelectorAll('.export-option').forEach(option => {
                option.addEventListener('click', () => {
                    const exportType = option.dataset.type;
                    exportMenu.remove();
                    
                    // شبیه‌سازی خروجی گرفتن
                    this.showMessage(`در حال آماده‌سازی خروجی ${exportType}...`, 'info');
                });
            });

            // بستن منو با کلیک بیرون
            document.addEventListener('click', function handler(e) {
                if (!e.target.closest('.dropdown-menu, #export-insurance-btn')) {
                    exportMenu.remove();
                    document.removeEventListener('click', handler);
                }
            });
        });
    }
}
    static setupFormValidation() {
        // اعتبارسنجی فرم با استفاده از کلاس‌های Bootstrap
        const forms = document.querySelectorAll('.needs-validation');
        Array.from(forms).forEach(form => {
            form.addEventListener('submit', event => {
                if (!form.checkValidity()) {
                    event.preventDefault();
                    event.stopPropagation();
                }
                form.classList.add('was-validated');
            }, false);
        });
    }
static setupEditInsuranceButtons() {
    const editButtons = document.querySelectorAll('.edit-insurance');
    editButtons.forEach(button => {
        button.addEventListener('click', () => {
            const insuranceId = button.dataset.id;
            PatientUI.editInsurance(insuranceId);
        });
    });
}
static editInsurance(insuranceId) {
    PatientAPI.getInsuranceDetails(insuranceId)
        .then(data => {
            if (data.success) {
                const insurance = data.insurance;
                const form = document.getElementById('edit-insurance-form');

                if (!form) {
                    console.error('Edit insurance form not found');
                    return;
                }

                // Set insurance ID in the form's dataset
                form.dataset.insuranceId = insuranceId;

                // Populate form fields
                form.querySelector('#edit-insurance-type').value = insurance.type_id;
                form.querySelector('#edit-insurance-provider').value = insurance.provider_id;
                form.querySelector('#edit-insurance-number').value = insurance.number;
                form.querySelector('#edit-insurance-expiry').value = insurance.expiry_date;
                form.querySelector('#edit-insurance-coverage').value = insurance.coverage_percentage;
                form.querySelector('#edit-insurance-primary').checked = insurance.is_primary;
                form.querySelector('#edit-insurance-active').checked = insurance.is_active;
                form.querySelector('#edit-insurance-notes').value = insurance.notes;

                // Ensure modal is initialized before showing
                const editModal = new bootstrap.Modal(document.getElementById('edit-insurance-modal'));
                editModal.show(); // Show the modal using Bootstrap's method
            } else {
                this.showMessage(data.error || 'خطا در دریافت اطلاعات بیمه', 'error');
            }
        })
        .catch(error => {
            this.showMessage('خطا در دریافت اطلاعات بیمه', 'error');
            console.error('Error getting insurance details:', error);
        });
}


    static setupPersianDatepicker() {
        $('.datepicker').persianDatepicker({
            format: 'YYYY/MM/DD',
            autoClose: true,
            initialValue: false, // برای جلوگیری از تنظیم مقدار اولیه
            onSelect: function(unixDate) {
                // تبدیل تاریخ شمسی به میلادی و ذخیره در فیلد مخفی
                const jalaliDate = new Date(unixDate);
                const gregorianDate = new Date(jalaliDate.getFullYear(), jalaliDate.getMonth(), jalaliDate.getDate());
                const formattedDate = gregorianDate.toISOString().slice(0, 10);
                $(this).siblings('input[type="hidden"]').val(formattedDate);
            }
        });
    }
    
    static setupTooltips() {
        var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
        var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl)
        })
    }
    static setupHistoryToggle() {
        $('#toggle-history').on('click', function() {
            $('#history-content').slideToggle();
            $(this).text(function(_, value) { return value == 'نمایش' ? 'مخفی' : 'نمایش' });
        });
    }
    


static setupTreatmentTypeSelect() {
    const treatmentTypeSelect = document.getElementById('treatment-type');
    const treatmentDescriptionSelect = document.getElementById('treatment-description');

    if (treatmentTypeSelect && treatmentDescriptionSelect) {
        treatmentTypeSelect.addEventListener('change', () => {
            const selectedTreatmentTypeId = treatmentTypeSelect.value;

            // غیرفعال کردن select شرح درمان تا زمانی که داده‌ها بارگذاری شوند
            treatmentDescriptionSelect.disabled = true;
            treatmentDescriptionSelect.innerHTML = '<option value="">در حال بارگذاری...</option>';

            PatientAPI.getTreatmentDetails(selectedTreatmentTypeId)
                .then(data => {
                    if (data.treatment_details) {
                        let options = '<option value="">انتخاب کنید</option>';
                        data.treatment_details.forEach(detail => {
                            options += `<option value="${detail.id}">${detail.description}</option>`;
                        });
                        treatmentDescriptionSelect.innerHTML = options;
                        treatmentDescriptionSelect.disabled = false;
                    } else {
                        treatmentDescriptionSelect.innerHTML = '<option value="">خطا در بارگذاری شرح درمان</option>';
                    }
                })
                .catch(error => {
                    treatmentDescriptionSelect.innerHTML = '<option value="">خطا در بارگذاری شرح درمان</option>';
                    console.error('Error loading treatment details:', error);
                });
        });

        // بارگذاری اولیه نوع درمان‌ها
        PatientAPI.getTreatmentTypes()
            .then(data => {
                if (data.treatment_types) {
                    let options = '<option value="">انتخاب کنید</option>';
                    data.treatment_types.forEach(type => {
                        options += `<option value="${type.id}">${type.title}</option>`;
                    });
                    treatmentTypeSelect.innerHTML = options;
                }
            })
            .catch(error => {
                console.error('Error loading treatment types:', error);
            });
    }
}



    static togglePrintPreview() {
        const preview = document.querySelector('.med-print-preview');
        preview.style.display = preview.style.display === 'none' ? 'block' : 'none';
    }

    static exportToFile(format) {
        if (format === 'excel') {
            this.exportToExcel();
        } else if (format === 'word') {
            this.exportToWord();
        } else if (format === 'pdf') {
            this.exportToPDF();
        }
    }


    /**
     * راه‌اندازی مدیریت تب‌های اصلی
     */
    static setupTabNavigation() {
        const mainNavTabs = document.querySelectorAll('.nav-tab');
        const mainTabContents = document.querySelectorAll('.tab-content');
        const subNav = document.querySelector('.sub-nav');

        // فعال کردن تب اول و محتوای آن به صورت پیش‌فرض
        if (mainNavTabs.length > 0) mainNavTabs[0].classList.add('active');
        if (mainTabContents.length > 0) mainTabContents[0].classList.add('active');

        mainNavTabs.forEach(mainTab => {
            mainTab.addEventListener('click', () => {
                const mainTabId = mainTab.dataset.tab;

                // غیرفعال کردن همه تب‌ها
                mainNavTabs.forEach(tab => tab.classList.remove('active'));
                mainTabContents.forEach(content => content.classList.remove('active'));

                // فعال کردن تب انتخاب شده
                mainTab.classList.add('active');
                const mainTabContent = document.getElementById(mainTabId);
                if (mainTabContent) {
                    mainTabContent.classList.add('active');
                }

                // مدیریت نمایش زیر نوار
                if (mainTabId === 'patient-info') {
                    subNav.style.display = 'block';
                    // فعال کردن اولین زیرتب
                    const firstSubTab = subNav.querySelector('.sub-nav-tab');
                    if (firstSubTab) {
                        firstSubTab.click();
                    }
                } else {
                    subNav.style.display = 'none';
                }
            });
        });
    }


    /**
     * راه‌اندازی مدیریت زیرتب‌ها
     */
    static setupSubTabNavigation() {
        const subNavTabs = document.querySelectorAll('.sub-nav-tab');
        const subTabContents = document.querySelectorAll('.sub-tab-content');

        // فعال کردن اولین زیرتب و محتوای آن به صورت پیش‌فرض
        if (subNavTabs.length > 0) subNavTabs[0].classList.add('active');
        if (subTabContents.length > 0) subTabContents[0].classList.add('active');

        subNavTabs.forEach(subTab => {
            subTab.addEventListener('click', () => {
                const subTabId = subTab.dataset.subTab;

                // غیرفعال کردن همه زیرتب‌ها
                subNavTabs.forEach(tab => tab.classList.remove('active'));
                subTabContents.forEach(content => content.classList.remove('active'));

                // فعال کردن زیرتب انتخاب شده
                subTab.classList.add('active');
                const subTabContent = document.getElementById(subTabId);
                if (subTabContent) {
                    subTabContent.classList.add('active');
                }
            });
        });
    }

    /**
     * راه‌اندازی مدیریت فرم‌ها
     */
    static setupFormHandlers() {
        // مدیریت فرم ویرایش بیمار
        const editForm = document.querySelector('.edit-profile-form');
        if (editForm) {
            editForm.addEventListener('submit', function(e) {
                e.preventDefault();
                const formData = new FormData(this);
                const patientId = this.getAttribute('data-patient-id');
                
                
                PatientAPI.updatePatient(patientId, formData)
                    .then(response => {
                        if (response.success) {
                            PatientUI.showMessage('اطلاعات بیمار با موفقیت بروزرسانی شد.', 'success');
                            setTimeout(() => {
                                window.location.reload();
                            }, 1500);
                        } else {
                            PatientUI.showMessage(response.error || 'خطا در بروزرسانی اطلاعات', 'error');
                        }
                    })
                    .catch(error => {
                        PatientUI.showMessage(error.message, 'error');
                    });
                    this.submit();
            });
        }
        
        // مدیریت نوع پرداخت
        const paymentTypeSelect = document.getElementById('paymentType');
        const installmentFields = document.getElementById('installmentFields');
        
        if (paymentTypeSelect && installmentFields) {
            paymentTypeSelect.addEventListener('change', function() {
                if (this.value === 'installment') {
                    installmentFields.style.display = 'block';
                    installmentFields.classList.add('fade-in');
                } else {
                    installmentFields.style.display = 'none';
                    installmentFields.classList.remove('fade-in');
                }
            });
        }
    }

    /**
     * راه‌اندازی مدیریت بیمه
     */
    static setupInsuranceHandlers() {
        // مدیریت فرم بیمه
        const insuranceTypeSelect = document.getElementById('insuranceType');
        const insuranceProviderSelect = document.getElementById('insuranceProvider');
        
        if (insuranceTypeSelect && insuranceProviderSelect) {
            // دریافت انواع بیمه و بیمه‌گران از سرور
            this.loadInsuranceData();
            
            // مدیریت تغییر نوع بیمه
            insuranceTypeSelect.addEventListener('change', function() {
                const selectedTypeId = this.value;
                PatientUI.updateInsuranceProviders(selectedTypeId);
            });
            
            // آپدیت کلاس‌ها بر اساس وضعیت فعال/غیرفعال
            insuranceProviderSelect.addEventListener('change', function() {
                this.classList.toggle('has-value', this.value !== '');
            });
        }
        
        // مدیریت فرم افزودن بیمه جدید
        const addInsuranceForm = document.getElementById('add-insurance-form');
        if (addInsuranceForm) {
            addInsuranceForm.addEventListener('submit', function(e) {
                e.preventDefault();
                const formData = new FormData(this);
                const patientId = this.getAttribute('data-patient-id');
                
                PatientAPI.addPatientInsurance(patientId, formData)
                    .then(response => {
                        if (response.success) {
                            PatientUI.showMessage('بیمه جدید با موفقیت اضافه شد.', 'success');
                            PatientUI.updateInsuranceTable(response.insurance);
                            addInsuranceForm.reset();
                        } else {
                            PatientUI.showMessage(response.error || 'خطا در افزودن بیمه', 'error');
                        }
                    })
                    .catch(error => {
                        PatientUI.showMessage(error.message, 'error');
                    });
            });
        }
    }
    
    /**
     * بارگذاری داده‌های بیمه از سرور
     */
    static loadInsuranceData() {
        PatientAPI.getInsuranceTypes()
            .then(data => {
                if (data.success) {
                    this.insuranceTypes = data.insurance_types;
                    this.populateInsuranceTypes();
                }
            })
            .catch(error => {
                console.error('Error loading insurance data:', error);
            });
    }
    
    /**
     * پر کردن لیست انواع بیمه
     */
    static populateInsuranceTypes() {
        const insuranceTypeSelect = document.getElementById('insuranceType');
        if (!insuranceTypeSelect || !this.insuranceTypes) return;
        
        // پاک کردن گزینه‌های قبلی
        insuranceTypeSelect.innerHTML = '<option value="">انتخاب کنید</option>';
        
        // اضافه کردن انواع بیمه
        this.insuranceTypes.forEach(type => {
            const option = document.createElement('option');
            option.value = type.id;
            option.textContent = type.name;
            insuranceTypeSelect.appendChild(option);
        });
    }
    
    /**
     * بروزرسانی لیست بیمه‌گران بر اساس نوع بیمه انتخاب شده
     * @param {string} typeId - شناسه نوع بیمه
     */
    static updateInsuranceProviders(typeId) {
        const insuranceProviderSelect = document.getElementById('insuranceProvider');
        if (!insuranceProviderSelect) return;
        
        // پاک کردن گزینه‌های قبلی
        insuranceProviderSelect.innerHTML = '<option value="">انتخاب کنید</option>';
        
        if (!typeId) {
            insuranceProviderSelect.disabled = true;
            return;
        }
        
        // دریافت بیمه‌گران مربوط به نوع بیمه انتخاب شده
        PatientAPI.getInsuranceProviders(typeId)
            .then(data => {
                if (data.success) {
                    // اضافه کردن بیمه‌گران به لیست
                    data.providers.forEach(provider => {
                        const option = document.createElement('option');
                        option.value = provider.id;
                        option.textContent = provider.name;
                        insuranceProviderSelect.appendChild(option);
                    });
                    
                    // فعال کردن select
                    insuranceProviderSelect.disabled = false;
                }
            })
            .catch(error => {
                console.error('Error loading insurance providers:', error);
                insuranceProviderSelect.disabled = true;
            });
    }
    
    /**
     * بروزرسانی جدول بیمه‌های بیمار
     * @param {Object} insurance - اطلاعات بیمه جدید
     */
    static updateInsuranceTable(insurance) {
    const insuranceTable = document.querySelector('.insurance-table tbody');
    if (!insuranceTable) return;

    const row = insuranceTable.insertRow(); // insertRow() برای اضافه کردن ردیف جدید

    // اضافه کردن سلول‌ها به ردیف با insertCell() و تنظیم متن آنها
    const cells = [];
    for (let i = 0; i < 7; i++) { // 7 ستون داریم
        cells.push(row.insertCell());
    }

    cells[0].textContent = insurance.type_name || '-'; // نوع بیمه
    cells[1].textContent = insurance.provider_name || '-'; // بیمه‌گر
    cells[2].textContent = insurance.number || '-'; // شماره بیمه
    cells[3].textContent = insurance.expiry_date || '-'; // تاریخ انقضا
    cells[4].textContent = (insurance.coverage_percentage || 0) + '%'; // درصد پوشش
    cells[5].textContent = insurance.is_active ? 'فعال' : 'غیرفعال'; // وضعیت

    // سلول عملیات
    cells[6].innerHTML = `
        <div class="btn-group">
            <button class="btn btn-sm btn-outline-info view-insurance" data-id="${insurance.id}" title="مشاهده جزئیات">
                <i class="fas fa-eye"></i>
            </button>
            <button class="btn btn-sm btn-outline-warning edit-insurance" data-id="${insurance.id}" title="ویرایش">
                <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger delete-insurance" data-id="${insurance.id}" title="حذف">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;

    // اتصال event listenerها با استفاده از event delegation
    insuranceTable.addEventListener('click', (event) => {
        const target = event.target;
        if (target.classList.contains('edit-insurance')) {
            const insuranceId = target.dataset.id;
            PatientUI.editInsurance(insuranceId);
        } else if (target.classList.contains('delete-insurance')) {
            const insuranceId = target.dataset.id;
            // فراخوانی تابع حذف بیمه
            PatientUI.deleteInsurance(insuranceId);
        }
    });
}
    
    /**
     * ویرایش بیمه
     * @param {string} insuranceId - شناسه بیمه
     */
    static editInsurance(insuranceId) {
    PatientAPI.getInsuranceDetails(insuranceId)
        .then(data => {
            if (data.success) {
                const insurance = data.insurance;
                const form = document.getElementById('edit-insurance-form');

                // بررسی وجود فرم
                if (!form) {
                    console.error('Edit insurance form not found');
                    return;
                }

                // تنظیم insuranceId در dataset فرم
                form.dataset.insuranceId = insuranceId;

                // پر کردن فرم ویرایش
                form.querySelector('#edit-insurance-type').value = insurance.type_id;
                // ... (سایر فیلدهای فرم)

                // فراخوانی تابع populateInsuranceProviders برای پر کردن select بیمه‌گر
                PatientUI.loadInsuranceTypesAndProviders().then(() => {
                    const insuranceTypeSelect = $('#edit-insurance-type');
                    const selectedTypeId = insuranceTypeSelect.val();
                    const targetSelect = $('#edit-insurance-provider');

                    const providers = PatientUI.insuranceProviders.filter(provider => provider.insurance_type_id == selectedTypeId);
                    targetSelect.empty();
                    targetSelect.append($('<option>', { value: '', text: 'انتخاب کنید' }));
                    providers.forEach(provider => {
                        targetSelect.append($('<option>', {
                            value: provider.id,
                            text: provider.name,
                            selected: provider.id == insurance.provider_id // انتخاب گزینه صحیح
                        }));
                    });
                    targetSelect.prop('disabled', false);

                    // نمایش مودال
                    $('#edit-insurance-modal').modal('show');
                });
            } else {
                this.showMessage(data.error || 'خطا در دریافت اطلاعات بیمه', 'error');
            }
        })
        .catch(error => {
            this.showMessage('خطا در دریافت اطلاعات بیمه', 'error');
            console.error('Error getting insurance details:', error);
        });
}
    
    /**
     * حذف بیمه
     * @param {string} insuranceId - شناسه بیمه
     */
    static deleteInsurance(insuranceId) {
        if (confirm('آیا از حذف این بیمه اطمینان دارید؟')) {
            PatientAPI.deletePatientInsurance(insuranceId)
                .then(data => {
                    if (data.success) {
                        this.showMessage('بیمه با موفقیت حذف شد.', 'success');
                        // حذف ردیف از جدول
                        const row = document.querySelector(`.delete-insurance[data-id="${insuranceId}"]`).closest('tr');
                        if (row) {
                            row.remove();
                        }
                    } else {
                        this.showMessage(data.error || 'خطا در حذف بیمه', 'error');
                    }
                })
                .catch(error => {
                    this.showMessage(error.message, 'error');
                });
        }
    }

    /**
     * راه‌اندازی مدیریت اقدامات کارت
     */
    static setupCardActions() {
        // دکمه صدور کارت
        const issueCardBtn = document.querySelector('.issue-card-btn');
        if (issueCardBtn) {
            issueCardBtn.addEventListener('click', function() {
                const patientId = this.getAttribute('data-patient-id');
                PatientUI.issueCard(patientId);
            });
        }
        
        // دکمه‌های مدیریت کارت
        const regenerateCardBtn = document.querySelector('.regenerate-card-btn');
        if (regenerateCardBtn) {
            regenerateCardBtn.addEventListener('click', function() {
                const patientId = this.getAttribute('data-patient-id');
                PatientUI.regenerateCard(patientId);
            });
        }
        
        const deactivateCardBtn = document.querySelector('.deactivate-card-btn');
        if (deactivateCardBtn) {
            deactivateCardBtn.addEventListener('click', function() {
                const patientId = this.getAttribute('data-patient-id');
                PatientUI.deactivateCard(patientId);
            });
        }
        
        const activateCardBtn = document.querySelector('.activate-card-btn');
        if (activateCardBtn) {
            activateCardBtn.addEventListener('click', function() {
                const patientId = this.getAttribute('data-patient-id');
                PatientUI.activateCard(patientId);
            });
        }
        
        // دکمه چاپ کارت
        const printCardBtn = document.querySelector('.print-card-btn');
        if (printCardBtn) {
            printCardBtn.addEventListener('click', this.printCard.bind(this));
        }
        
        // پیش‌نمایش تصاویر
        document.querySelectorAll('input[type="file"]').forEach(input => {
            input.addEventListener('change', function() {
                const previewElement = this.dataset.preview;
                if (previewElement) {
                    PatientUI.previewImage(this, previewElement);
                }
            });
        });
    }

    /**
     * صدور کارت بیمار
     * @param {number} patientId - شناسه بیمار
     */
    static issueCard(patientId) {
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
        
        fetch('/Patient/generate-card/', {
            method: 'POST',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': csrfToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ patient_id: patientId })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.showMessage('کارت با موفقیت صادر شد.', 'success');
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                this.showMessage(data.error || 'خطا در صدور کارت', 'error');
            }
        })
        .catch(error => {
            this.showMessage('خطا در صدور کارت', 'error');
        });
    }
    
    /**
     * تولید مجدد کارت
     * @param {number} patientId - شناسه بیمار
     */
    static regenerateCard(patientId) {
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
        
        fetch(`/Patient/regenerate-card/${patientId}/`, {
            method: 'POST',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': csrfToken
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.showMessage('کارت با موفقیت تولید مجدد شد.', 'success');
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                this.showMessage(data.error || 'خطا در تولید مجدد کارت', 'error');
            }
        })
        .catch(error => {
            this.showMessage('خطا در تولید مجدد کارت', 'error');
        });
    }
    
    /**
     * غیرفعال کردن کارت
     * @param {number} patientId - شناسه بیمار
     */
    static deactivateCard(patientId) {
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
        
        fetch(`/Patient/deactivate-card/${patientId}/`, {
            method: 'POST',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': csrfToken
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.showMessage('کارت با موفقیت غیرفعال شد.', 'success');
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                this.showMessage(data.error || 'خطا در غیرفعال کردن کارت', 'error');
            }
        })
        .catch(error => {
            this.showMessage('خطا در غیرفعال کردن کارت', 'error');
        });
    }
    
    /**
     * فعال کردن کارت
     * @param {number} patientId - شناسه بیمار
     */
    static activateCard(patientId) {
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
        
        fetch(`/Patient/activate-card/${patientId}/`, {
            method: 'POST',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': csrfToken
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.showMessage('کارت با موفقیت فعال شد.', 'success');
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                this.showMessage(data.error || 'خطا در فعال کردن کارت', 'error');
            }
        })
        .catch(error => {
            this.showMessage('خطا در فعال کردن کارت', 'error');
        });
    }

    /**
     * چاپ کارت بیمار
     */
    static printCard() {
        const cardImage = document.querySelector('.card-image');
        if (cardImage) {
            const printWindow = window.open('', '_blank');
            
            // خواندن اطلاعات از تمپلیت
            const name = document.getElementById('card-name')?.textContent || '';
            const fileNum = document.getElementById('card-file-num')?.textContent || '';
            const nationalCode = document.getElementById('card-national-code')?.textContent || '';
            const diseases = document.getElementById('card-diseases')?.textContent || '';

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
                        <p>کد ملی: ${nationalCode}</p>
                        <p>بیماری‌های خاص: ${diseases}</p>
                    </div>
                </body>
                </html>
            `);
            printWindow.document.close();
        }
    }

    /**
     * پیش‌نمایش تصویر
     * @param {HTMLElement} input - المان ورودی فایل
     * @param {string} previewElement - سلکتور المان پیش‌نمایش
     */
    static previewImage(input, previewElement) {
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

    // سایر متدها...

    /**
     * نمایش پیام به کاربر
     * @param {string} message - متن پیام
     * @param {string} type - نوع پیام (success, error, warning, info)
     */
    static showMessage(message, type = 'info') {
        let messagesContainer = document.querySelector('.messages');
        if (!messagesContainer) {
            // ایجاد container اگر وجود نداشته باشد
            messagesContainer = document.createElement('div');
            messagesContainer.className = 'messages';
            const mainContent = document.querySelector('.main-content');
            if (mainContent) {
                mainContent.prepend(messagesContainer);
            } else {
                document.body.prepend(messagesContainer);
            }
        }
        
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.textContent = message;
        
        messagesContainer.appendChild(alertDiv);
        
        // حذف پیام بعد از 5 ثانیه
        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }
    static setupInsuranceProviderSelect() {
        $('#insuranceType, #edit-insurance-type').on('change', function () {
            const typeId = $(this).val();
            const targetSelect = this.id === 'insuranceType' ? '#insuranceProvider' : '#edit-insurance-provider';

            $(targetSelect).html('<option value="">در حال بارگذاری...</option>');
            $(targetSelect).prop('disabled', true);

            if (!typeId) {
                $(targetSelect).html('<option value="">ابتدا نوع بیمه را انتخاب کنید</option>');
                return;
            }

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
                        PatientUI.showMessage('خطا در بارگذاری بیمه‌گران', 'error');
                    }
                })
                .catch(error => {
                    $(targetSelect).html('<option value="">خطا در بارگذاری</option>');
                    PatientUI.showMessage('خطا در بارگذاری بیمه‌گران', 'error');
                    console.error('Error loading insurance providers:', error);
                });
        });
    }
    
}

/**
 * کلاس مدیریت درخواست‌های API بیمار
 */
/**
 * کلاس مدیریت درخواست‌های API بیمار
 */
class PatientAPI {
    /**
     * دریافت انواع بیمه
     * @returns {Promise} - پاسخ درخواست
     */
    static getInsuranceTypes() {
        return fetch('/Patient/insurance-types/', {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('خطا در دریافت انواع بیمه');
            }
            return response.json();
        });
    }

    /**
     * دریافت بیمه‌گران بر اساس نوع بیمه
     * @param {number} typeId - شناسه نوع بیمه
     * @returns {Promise} - پاسخ درخواست
     */
    static getInsuranceProviders(typeId) {
        return fetch(`/Patient/insurance-providers/${typeId}/`, {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('خطا در دریافت بیمه‌گران');
            }
            return response.json();
        });
    }

    /**
     * افزودن بیمه جدید برای بیمار
     * @param {number} patientId - شناسه بیمار
     * @param {FormData} formData - داده‌های فرم
     * @returns {Promise} - پاسخ درخواست
     */
    static addPatientInsurance(patientId, formData) {
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
        
        // اضافه کردن شناسه بیمار به فرم
        formData.append('patient_id', patientId);
        
        return fetch('/Patient/add-insurance/', {
            method: 'POST',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': csrfToken
            },
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('خطا در افزودن بیمه');
            }
            return response.json();
        });
    }

    /**
     * دریافت جزئیات بیمه
     * @param {number} insuranceId - شناسه بیمه
     * @returns {Promise} - پاسخ درخواست
     */
    static getInsuranceDetails(insuranceId) {
        return fetch(`/Patient/insurance-details/${insuranceId}/`, {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('خطا در دریافت جزئیات بیمه');
            }
            return response.json();
        });
    }

    /**
     * بروزرسانی بیمه
     * @param {number} insuranceId - شناسه بیمه
     * @param {FormData} formData - داده‌های فرم
     * @returns {Promise} - پاسخ درخواست
     */
    static updatePatientInsurance(insuranceId, formData) {
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
        
        return fetch(`/Patient/update-insurance/${insuranceId}/`, {
            method: 'POST',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': csrfToken
            },
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('خطا در بروزرسانی بیمه');
            }
            return response.json();
        });
    }

    /**
     * حذف بیمه
     * @param {number} insuranceId - شناسه بیمه
     * @returns {Promise} - پاسخ درخواست
     */
    static deletePatientInsurance(insuranceId) {
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
        
        return fetch(`/Patient/delete-insurance/${insuranceId}/`, {
            method: 'POST',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': csrfToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ insurance_id: insuranceId })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('خطا در حذف بیمه');
            }
            return response.json();
        });
    }

    /**
     * دریافت اطلاعات بیمار
     * @param {number} patientId - شناسه بیمار
     * @returns {Promise} - پاسخ درخواست
     */
    static getPatientDetails(patientId) {
        return fetch(`/Patient/detail/${patientId}/`, {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('خطا در دریافت اطلاعات بیمار');
            }
            return response.json();
        });
    }

    /**
     * بروزرسانی اطلاعات بیمار
     * @param {number} patientId - شناسه بیمار
     * @param {FormData} formData - داده‌های فرم
     * @returns {Promise} - پاسخ درخواست
     */
    static updatePatient(patientId, formData) {
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

    return fetch(`/Patient/edit_patient/${patientId}/`, { // مسیر URL صحیح برای به‌روزرسانی اطلاعات بیمار
        method: 'POST',
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': csrfToken
        },
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            // بررسی خطاهای HTTP (مثل 404 یا 500)
            if (response.status === 404) {
                throw new Error('بیمار یافت نشد.');
            } else if (response.status === 400) {
                // خطاهای اعتبارسنجی یا سایر خطاهای سمت سرور
                return response.json().then(data => {
                    throw new Error(data.error || 'خطا در به‌روزرسانی اطلاعات.');
                });
            }
            throw new Error('خطا در به‌روزرسانی اطلاعات.');
        }
        return response.json();
    });
}

    /**
     * دریافت سوابق پزشکی بیمار
     * @param {number} patientId - شناسه بیمار
     * @returns {Promise} - پاسخ درخواست
     */
    static getMedicalHistory(patientId) {
        return fetch(`/Patient/medical-history/${patientId}/`, {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('خطا در دریافت سوابق پزشکی');
            }
            return response.json();
        });
    }

    /**
     * افزودن سابقه پزشکی جدید
     * @param {number} patientId - شناسه بیمار
     * @param {FormData} formData - داده‌های فرم
     * @returns {Promise} - پاسخ درخواست
     */
    static addMedicalHistory(patientId, formData) {
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
        
        // اضافه کردن شناسه بیمار به فرم
        formData.append('patient_id', patientId);
        
        return fetch('/Patient/add-medical-history/', {
            method: 'POST',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': csrfToken
            },
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('خطا در افزودن سابقه پزشکی');
            }
            return response.json();
        });
    }

    /**
     * دریافت درمان‌های دندانپزشکی بیمار
     * @param {number} patientId - شناسه بیمار
     * @returns {Promise} - پاسخ درخواست
     */
    static getDentalProcedures(patientId) {
        return fetch(`/Patient/dental-procedures/${patientId}/`, {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('خطا در دریافت درمان‌های دندانپزشکی');
            }
            return response.json();
        });
    }

    /**
     * افزودن درمان دندانپزشکی جدید
     * @param {number} patientId - شناسه بیمار
     * @param {FormData} formData - داده‌های فرم
     * @returns {Promise} - پاسخ درخواست
     */
    static addDentalProcedure(patientId, formData) {
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
        
        // اضافه کردن شناسه بیمار به فرم
        formData.append('patient_id', patientId);
        
        return fetch('/Patient/add-dental-procedure/', {
            method: 'POST',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': csrfToken
            },
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('خطا در افزودن درمان دندانپزشکی');
            }
            return response.json();
        });
    }

    /**
     * دریافت انواع درمان
     * @returns {Promise} - پاسخ درخواست
     */
   static getTreatmentTypes() {
    return fetch('/Patient/treatment-types/', {  // URL صحیح
        method: 'GET',
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('خطا در دریافت انواع درمان');
        }
        return response.json();
    });
}

static getTreatmentDetails(typeId) {
    return fetch(`/Patient/treatment-details/${typeId}/`, { // URL صحیح
        method: 'GET',
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('خطا در دریافت جزئیات درمان');
        }
        return response.json();
    });
}


    /**
     * جستجوی بیماران
     * @param {string} query - عبارت جستجو
     * @returns {Promise} - پاسخ درخواست
     */
    static searchPatients(query) {
        return fetch(`/Patient/sr-search/?query=${encodeURIComponent(query)}`, {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('خطا در جستجوی بیماران');
            }
            return response.json();
        });
    }

    /**
     * صدور کارت بیمار
     * @param {number} patientId - شناسه بیمار
     * @returns {Promise} - پاسخ درخواست
     */
    static issuePatientCard(patientId) {
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
        
        const formData = new FormData();
        formData.append('patient_id', patientId);
        
        return fetch('/Patient/generate-card/', {
            method: 'POST',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': csrfToken
            },
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('خطا در صدور کارت بیمار');
            }
            return response.json();
        });
    }
}

// راه‌اندازی اولیه بعد از بارگذاری صفحه
document.addEventListener('DOMContentLoaded', () => {
    
    // تابع برای بستن مودال
    const closeModal = (modalId) => {
        PatientUI.closeModal(modalId);
    };

    // انتخاب تمام دکمه‌ها و spanهای بستن مودال
    const closeElements = document.querySelectorAll(
        '#add-insurance-modal .btn-outline-secondary,' +
        '#add-insurance-modal .btn-close,' +
        '#add-insurance-modal .close' 

    );

    // اتصال event listener به همه المان‌ها
    closeElements.forEach(element => {
        element.addEventListener('click', () => closeModal('add-insurance-modal'));
    });
    

    PatientUI.init();
    PatientUI.loadInsuranceTypesAndProviders();
});

