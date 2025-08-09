// static/js/dashboard-manager.js

class DashboardManager {
    static async clearCheck(paymentId) {
        if (!confirm('آیا از وصول این چک اطمینان دارید؟')) return;
        
        try {
            // ما از API که قبلاً برای صفحه بیمار ساختیم، دوباره استفاده می‌کنیم
            const response = await TreatmentAPI.clearCheckPayment(paymentId);
            
            if (response.success) {
                // به جای رفرش کل صفحه، فقط آیتم مربوطه را از لیست حذف می‌کنیم
                const notificationItem = document.getElementById(`check-notif-${paymentId}`);
                if (notificationItem) {
                    notificationItem.style.transition = 'opacity 0.5s';
                    notificationItem.style.opacity = '0';
                    setTimeout(() => notificationItem.remove(), 500);
                }
                alert('چک با موفقیت وصول شد.');
            } else {
                alert(`خطا: ${response.message}`);
            }
        } catch (error) {
            alert('خطا در ارتباط با سرور.');
        }
    }

    static async payInstallment(installmentId) {
        if (!confirm('آیا از پرداخت این قسط اطمینان دارید؟')) return;

        try {
            // از API پرداخت قسط که قبلاً ساختیم، دوباره استفاده می‌کنیم
            const response = await TreatmentAPI.payInstallment(installmentId);

            if (response.success) {
                const notificationItem = document.getElementById(`inst-notif-${installmentId}`);
                if (notificationItem) {
                    notificationItem.style.transition = 'opacity 0.5s';
                    notificationItem.style.opacity = '0';
                    setTimeout(() => notificationItem.remove(), 500);
                }
                alert('قسط با موفقیت پرداخت شد.');
            } else {
                alert(`خطا: ${response.message}`);
            }
        } catch (error) {
            alert('خطا در ارتباط با سرور.');
        }
    }
}
