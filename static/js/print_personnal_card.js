document.addEventListener('DOMContentLoaded', function() {
    // مدیریت تب‌ها
    const tabs = document.querySelectorAll('.tab-button');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // حذف کلاس active از همه
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));

            // اضافه کردن کلاس active به تب انتخاب شده
            tab.classList.add('active');
            const contentId = tab.dataset.tab;
            document.getElementById(contentId).classList.add('active');
        });
    });

    // پیش‌نمایش تصاویر
    const fileInputs = document.querySelectorAll('.custom-file-input');
    fileInputs.forEach(input => {
        input.addEventListener('change', function() {
            const preview = this.closest('.form-group').querySelector('.preview-image');
            if (this.files && this.files[0]) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    preview.src = e.target.result;
                    preview.style.display = 'block';
                }
                reader.readAsDataURL(this.files[0]);
            }
        });
    });

    // چاپ کارت
    const printButton = document.querySelector('.print-card-btn');
    if (printButton) {
        printButton.addEventListener('click', function() {
            const cardImage = document.querySelector('.card-image');
            if (cardImage) {
                const printWindow = window.open('', '_blank');
                printWindow.document.write(`
                    <html>
                    <head>
                        <style>
                            @page {
                                size: 85.6mm 53.98mm;
                                margin: 0;
                            }
                            body {
                                margin: 0;
                                padding: 0;
                            }
                            img {
                                width: 85.6mm;
                                height: 53.98mm;
                                object-fit: contain;
                            }
                        </style>
                    </head>
                    <body>
                        <img src="${cardImage.src}" alt="Personnel Card">
                    </body>
                    </html>
                `);
                printWindow.document.close();
                printWindow.focus();
                setTimeout(() => {
                    printWindow.print();
                    printWindow.close();
                }, 250);
            }
        });
    }
});