// function showCustomAlert(message, type = 'error') {
//     // حذف هشدار قبلی اگر وجود داشته باشد
//     const existingAlert = document.querySelector('.custom-alert');
//     if (existingAlert) {
//         existingAlert.remove();
//     }

//     // ایجاد هشدار جدید
//     const alert = document.createElement('div');
//     alert.className = `custom-alert ${type}`;
//     alert.innerHTML = `
//         <i class="fas fa-exclamation-circle icon"></i>
//         <span class="message">${message}</span>
//     `;

//     document.body.appendChild(alert);

//     // نمایش با انیمیشن
//     setTimeout(() => {
//         alert.classList.add('show');
//         alert.classList.add('shake');
//     }, 100);

//     // حذف خودکار بعد از 3 ثانیه
//     setTimeout(() => {
//         alert.classList.remove('show');
//         setTimeout(() => {
//             alert.remove();
//         }, 500);
//     }, 3000);
// }