/**
 * کلاس مدیریت توکن CSRF
 */
class CSRFManager {
    /**
     * دریافت توکن CSRF از کوکی
     * @returns {string} توکن CSRF
     */
    static getTokenFromCookie() {
        const name = 'csrftoken';
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    /**
     * دریافت توکن CSRF از فرم
     * @param {HTMLFormElement} form - فرم حاوی توکن CSRF
     * @returns {string} توکن CSRF
     */
    static getTokenFromForm(form) {
        if (!form) {
            form = document.querySelector('form');
        }
        
        if (form) {
            const csrfInput = form.querySelector('[name=csrfmiddlewaretoken]');
            if (csrfInput) {
                return csrfInput.value;
            }
        }
        
        return null;
    }

    /**
     * دریافت توکن CSRF از فرم مخفی
     * @returns {string} توکن CSRF
     */
    static getTokenFromHiddenForm() {
        // بررسی وجود فرم مخفی
        let hiddenForm = document.getElementById('csrf_hidden_form');
        
        // اگر فرم مخفی وجود نداشت، آن را ایجاد کن
        if (!hiddenForm) {
            hiddenForm = document.createElement('form');
            hiddenForm.id = 'csrf_hidden_form';
            hiddenForm.style.display = 'none';
            
            // دریافت توکن از کوکی
            const csrfToken = this.getTokenFromCookie();
            
            if (csrfToken) {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = 'csrfmiddlewaretoken';
                input.value = csrfToken;
                
                hiddenForm.appendChild(input);
                document.body.appendChild(hiddenForm);
            }
        }
        
        return this.getTokenFromForm(hiddenForm);
    }

    /**
     * دریافت توکن CSRF با استفاده از بهترین روش موجود
     * @returns {string} توکن CSRF
     */
    static getToken() {
        // ابتدا از فرم‌های موجود
        const tokenFromForm = this.getTokenFromForm();
        if (tokenFromForm) {
            return tokenFromForm;
        }
        
        // سپس از فرم مخفی
        const tokenFromHiddenForm = this.getTokenFromHiddenForm();
        if (tokenFromHiddenForm) {
            return tokenFromHiddenForm;
        }
        
        // در نهایت از کوکی
        return this.getTokenFromCookie();
    }

    /**
     * اضافه کردن هدر CSRF به هدرهای درخواست
     * @param {Object} headers - هدرهای درخواست
     * @returns {Object} هدرهای به‌روزرسانی شده
     */
    static addTokenToHeaders(headers = {}) {
        const token = this.getToken();
        if (token) {
            return {
                ...headers,
                'X-CSRFToken': token
            };
        }
        return headers;
    }

    /**
     * ایجاد آبجکت تنظیمات fetch با توکن CSRF
     * @param {Object} options - تنظیمات fetch
     * @returns {Object} تنظیمات به‌روزرسانی شده
     */
    static getFetchOptions(options = {}) {
        const headers = this.addTokenToHeaders(options.headers || {});
        return {
            ...options,
            headers,
            credentials: 'same-origin'
        };
    }
}
