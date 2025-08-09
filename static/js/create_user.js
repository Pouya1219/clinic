document.addEventListener('DOMContentLoaded', function() {
    // Tab Switching
    const tabs = document.querySelectorAll('.tab-button');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));

            // Add active class
            tab.classList.add('active');
            const contentId = tab.dataset.tab;
            document.getElementById(contentId).classList.add('active');
        });
    });
});

    // Form Submit Animation
    // const forms = document.querySelectorAll('form');
    // forms.forEach(form => {
    //     form.addEventListener('submit', (e) => {
    //         e.preventDefault();
    //         const button = form.querySelector('.save-button');
    //         button.innerHTML = 'در حال ذخیره...';
    //         button.disabled = true;

    //         // Simulate API call
    //         setTimeout(() => {
    //             button.innerHTML = 'ذخیره شد ✓';
    //             button.style.background = 'var(--success-color)';
                
    //             setTimeout(() => {
    //                 button.innerHTML = 'ذخیره اطلاعات';
    //                 button.style.background = 'var(--primary-color)';
    //                 button.disabled = false;
    //             }, 2000);
    //         }, 1500);
    //     });
    // });

    // Date Picker Initialization (نیاز به کتابخانه تقویم شمسی دارد)
//     const dateInputs = document.querySelectorAll('.date-input');
//     dateInputs.forEach(input => {
//         const icon = input.parentElement.querySelector('i');
//         icon.addEventListener('click', () => {
//             // اینجا کد مربوط به باز کردن تقویم شمسی اضافه می‌شود
//         });
//     });

//     // Percentage Input Validation
//     const percentageInputs = document.querySelectorAll('.percentage-input');
//     percentageInputs.forEach(input => {
//         input.addEventListener('input', () => {
//             let value = parseFloat(input.value);
//             if (value < 0) input.value = 0;
//             if (value > 100) input.value = 100;
//         });
//     });
// });