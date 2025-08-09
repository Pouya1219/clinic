    $(document).ready(function() {
        // تابع تبدیل اعداد به فارسی
        function toPersianNum(num) {
            const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
            return num.toString().replace(/[0-9]/g, x => persianNumbers[x]);
        }
    
        // تابع اعتبارسنجی و تبدیل تاریخ
        function convertDate(dateStr) {
            // حذف فاصله‌های اضافی
            dateStr = dateStr.trim();
            
            // اگر ورودی خالی است
            if (!dateStr) {
                $('#jalali-result').val('');
                return;
            }
            
            // الگوهای مختلف تاریخ
            const patterns = [
                /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // برای 5/7/2025
                /^(\d{1,2})\/(\d{2})\/(\d{4})$/    // برای 5/07/2025
            ];
    
            let match;
            let isValid = false;
    
            // بررسی الگوها
            for(let pattern of patterns) {
                match = dateStr.match(pattern);
                if(match) {
                    isValid = true;
                    break;
                }
            }
    
            if(!isValid) {
                $('#gregorian-input').addClass('error');
                $('#jalali-result').val('');
                return false;
            }
    
            // برداشتن کلاس error
            $('#gregorian-input').removeClass('error');
    
            try {
                const month = parseInt(match[1]);
                const day = parseInt(match[2]);
                const year = parseInt(match[3]);
    
                // بررسی معتبر بودن تاریخ
                const date = new Date(year, month - 1, day);
                if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
                    throw new Error('تاریخ نامعتبر است');
                }
    
                // تبدیل به تاریخ شمسی
                const jalaliDate = new persianDate(date);
                
                // فرمت‌بندی خروجی
                const jalaliStr = `${jalaliDate.year()}/${toPersianNum(jalaliDate.month())}/${toPersianNum(jalaliDate.date())}`;
                $('#jalali-result').val(jalaliStr);
                return true;
    
            } catch(e) {
                $('#gregorian-input').addClass('error');
                $('#jalali-result').val('');
                return false;
            }
        }
    
        // متغیر برای ذخیره تایمر
        let convertTimer;
    
        // تبدیل خودکار هنگام تایپ
        $('#gregorian-input').on('input', function() {
            // پاک کردن تایمر قبلی
            clearTimeout(convertTimer);
            
            // تنظیم تایمر جدید
            convertTimer = setTimeout(() => {
                const gregorianDate = $(this).val();
                convertDate(gregorianDate);
            }, 300); // تاخیر 300 میلی‌ثانیه
        });
    
        // پاک کردن کلاس error هنگام تایپ
        $('#gregorian-input').on('focus', function() {
            $(this).removeClass('error');
        });
    
        // حفظ آیکون برای استفاده اختیاری
        $('.convert-icon').click(function() {
            const gregorianDate = $('#gregorian-input').val();
            convertDate(gregorianDate);
        });
    });
    $(document).ready(function() {
        // تنظیم تقویم برای تمام فیلدهای تاریخ شمسی
        $('.date-input.jalali').each(function() {
            let inputField = $(this);
            let targetId = inputField.data('id');
    
            inputField.persianDatepicker({
                initialValue: false,
                format: 'YYYY/MM/DD',
                autoClose: true,
                calendar: {
                    persian: { locale: 'fa' }
                },
                dayPicker: {
                    onSelect: function(unix) {
                        let gregorianDate = new Date(unix);
                        let formattedGregorian = gregorianDate.toLocaleDateString('en-US');
                        
                        // پیدا کردن فیلد میلادی مرتبط با این `data-id`
                        $('.date-input.gregorian[data-id="' + targetId + '"]').val(formattedGregorian);
                    }
                }
            });
        });
    
        // باز کردن تقویم با کلیک روی آیکون
        $('.calendar-icon').click(function() {
            $(this).siblings('.date-input.jalali').persianDatepicker('show');
        });
    
        // بستن تقویم هنگام کلیک خارج از آن
        $(document).on('click', function(e) {
            if (!$(e.target).closest('.datepicker-plot-area').length &&
                !$(e.target).hasClass('jalali') &&
                !$(e.target).hasClass('calendar-icon')) {
                $('.date-input.jalali').persianDatepicker('hide');
            }
        });
    });