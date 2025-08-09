document.addEventListener('DOMContentLoaded', function () {
    const messages = document.querySelectorAll('.messages .alert');

    messages.forEach((msg, index) => {
        // ساختار مشابه custom-alert
        msg.classList.add('custom-alert');
        msg.innerHTML = `
            <i class="fas fa-info-circle icon"></i>
            <span class="message">${msg.innerHTML}</span>
        `;

        // نمایش با انیمیشن
        setTimeout(() => {
            msg.classList.add('show', 'shake');
        }, 100 + index * 200);

        // حذف خودکار بعد از 3 ثانیه
        setTimeout(() => {
            msg.classList.remove('show');
            setTimeout(() => {
                msg.remove();
            }, 500);
        }, 3000 + index * 200);
    });
});
