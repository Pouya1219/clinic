 $(document).ready(function() {
        // تنظیم تاریخ پیش‌فرض
        const today = new persianDate();
        
        // تنظیمات تقویم
        $('#jalali-date').persianDatepicker({
            initialValue: true,
            format: 'YYYY/MM/DD',
            autoClose: true,
            calendar: {
                persian: {
                    locale: 'fa'
                }
            },
            dayPicker: {
                onSelect: function(unix) {
                    // تبدیل به تاریخ میلادی
                    const gregorianDate = new Date(unix);
                    $('#gregorian-date').val(gregorianDate.toLocaleDateString('en-US'));
                }
            },
            toolbox: {
                enabled: true,
                calendarSwitch: {
                    enabled: false
                }
            },
            navigator: {
                scroll: {
                    enabled: false
                }
            },
            onSelect: function(unix) {
                // بستن تقویم بعد از انتخاب تاریخ
                $(this).persianDatepicker('hide');
            }
        });

        // باز کردن تقویم با کلیک روی آیکون
        $('.calendar-icon').click(function() {
            $('#jalali-date').persianDatepicker('show');
        });
        $(document).on('click', function(e) {
            if (!$(e.target).closest('.datepicker-plot-area').length && 
                !$(e.target).is('#jalali-date') && 
                !$(e.target).is('.calendar-icon')) {
                $('#jalali-date').persianDatepicker('hide');
            }
        });
        // تنظیم تاریخ امروز به صورت پیش‌فرض
        $('#jalali-date').persianDatepicker('setDate', today);
        const gregorianToday = new Date();
        $('#gregorian-date').val(gregorianToday.toLocaleDateString('en-US'));
    });