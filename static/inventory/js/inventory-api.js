/**
 * کلاس API برای سیستم انبارداری
 */
class InventoryAPI {


/**
 * متد پایه برای ارسال درخواست‌های API
 * @param {string} url - آدرس API
 * @param {Object} options - تنظیمات درخواست
 * @returns {Promise} نتیجه درخواست
 */
static async fetchData(url, options = {}) {
    try {
        // تنظیم هدرهای پیش‌فرض
        const defaultHeaders = {};
        
        // اگر متد POST یا PUT است و body از نوع FormData نیست، Content-Type را تنظیم کنید
        if ((options.method === 'POST' || options.method === 'PUT') && 
            options.body && !(options.body instanceof FormData) && 
            (!options.headers || !options.headers['Content-Type'])) {
            defaultHeaders['Content-Type'] = 'application/json';
        }
        
        // ترکیب هدرهای پیش‌فرض با هدرهای ورودی
        const headers = {
            ...defaultHeaders,
            ...(options.headers || {})
        };
        
        // ترکیب تنظیمات پیش‌فرض با تنظیمات ورودی
        const fetchOptions = {
            credentials: 'same-origin', // ارسال کوکی‌ها
            ...options,
            headers
        };
        
        console.log('Sending API request to:', url);
        console.log('With options:', fetchOptions);
        
        // ارسال درخواست
        const response = await fetch(url, fetchOptions);
        
        // بررسی وضعیت پاسخ
        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage;
            let errorData = {};
            
            try {
                errorData = JSON.parse(errorText);
                errorMessage = errorData.message || `خطای ${response.status}: ${response.statusText}`;
                console.error('API Error Response:', errorData);
            } catch (e) {
                errorMessage = `خطای ${response.status}: ${response.statusText}`;
                console.error('API Error Response (text):', errorText);
            }
            
            throw new Error(errorMessage);
        }
        
        // تبدیل پاسخ به JSON
        const data = await response.json();
        console.log('API Response:', data);
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}


/**
 * دریافت CSRF توکن از کوکی
 * @returns {string} CSRF توکن
 */
static getCSRFToken() {
    // ابتدا از المان hidden در صفحه
    const tokenElement = document.querySelector('[name=csrfmiddlewaretoken]');
    if (tokenElement) {
        return tokenElement.value;
    }
    
    // اگر المان پیدا نشد، از کوکی استفاده کن
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
    
    console.log('CSRF Token:', cookieValue);
    return cookieValue;
}
 /**
 * دریافت لیست کالاها
 * @param {Object} params - پارامترهای درخواست
 * @returns {Promise} نتیجه درخواست
 */
static async getItems(params = {}) {
    try {
        // بررسی وجود تنظیمات API
        if (!INVENTORY_CONFIG || !INVENTORY_CONFIG.API_URLS) {
            console.error('INVENTORY_CONFIG or API_URLS is not defined');
            throw new Error('تنظیمات API یافت نشد');
        }
        
        const url = INVENTORY_CONFIG.API_URLS.GET_ITEMS;
        
        // تبدیل پارامترها به رشته کوئری
        const queryParams = new URLSearchParams();
        for (const [key, value] of Object.entries(params)) {
            if (value !== undefined && value !== null && value !== '') {
                queryParams.append(key, value);
            }
        }
        
        // ارسال درخواست
        const response = await fetch(`${url}?${queryParams.toString()}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': this.getCSRFToken()
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // افزودن پرچم موفقیت به پاسخ
        return {
            success: true,
            items: data.items,
            pagination: data.pagination
        };
    } catch (error) {
        console.error("Error fetching items:", error);
        return {
            success: false,
            message: error.message || 'خطا در دریافت داده‌ها'
        };
    }
}


    /**
     * دریافت اطلاعات یک کالا
     * @param {string} itemId - شناسه کالا
     * @returns {Promise} نتیجه درخواست
     */
   static async getItem(itemId) {
    try {
        console.log('Fetching item with ID:', itemId);
        const url = INVENTORY_CONFIG.API_URLS.GET_ITEM(itemId);
        const response = await this.fetchData(url);
        
        console.log('API response for getItem:', response);
        
        // بررسی وجود فیلدهای مورد نیاز
        if (response.success && response.item) {
            if (!response.item.category_id) {
                console.error('category_id is missing in API response');
            }
            if (!response.item.primary_unit_id) {
                console.error('primary_unit_id is missing in API response');
            }
        }
        
        return response;
    } catch (error) {
        console.error('Error in getItem API call:', error);
        throw error;
    }
}
/**
 * ایجاد کالای جدید
 * @param {Object|FormData} itemData - اطلاعات کالا
 * @returns {Promise} نتیجه درخواست
 */
static async createItem(itemData) {
    // بررسی وجود تنظیمات API
    if (!INVENTORY_CONFIG || !INVENTORY_CONFIG.API_URLS) {
        console.error('INVENTORY_CONFIG or API_URLS is not defined');
        throw new Error('تنظیمات API یافت نشد');
    }
    
    const url = INVENTORY_CONFIG.API_URLS.CREATE_ITEM;
    
    // نمایش داده‌های فرم برای دیباگ
    console.log('Creating item with data:');
    if (itemData instanceof FormData) {
        // تبدیل فیلدهای عددی خالی به صفر
        const numericFields = [
            'min_stock_level', 'max_stock_level', 'alert_threshold',
            'storage_temperature_min', 'storage_temperature_max'
        ];
        
        numericFields.forEach(field => {
            const value = itemData.get(field);
            if (value === null || value === undefined || value === '') {
                itemData.set(field, '0');
            }
        });
        
        // نمایش داده‌های فرم
        for (let [key, value] of itemData.entries()) {
            console.log(`${key}: ${value}`);
        }
    } else {
        console.log(itemData);
    }
    
    // ارسال درخواست
    return this.fetchData(url, {
        method: 'POST',
        body: itemData instanceof FormData ? itemData : JSON.stringify(itemData),
        headers: itemData instanceof FormData ? {} : {
            'Content-Type': 'application/json'
        }
    });
}
/**
 * بروزرسانی کالا
 * @param {string} itemId - شناسه کالا
 * @param {FormData} formData - داده‌های فرم
 * @returns {Promise<Object>} - پاسخ API
 */
static async updateItem(itemId, formData) {
    try {
        console.log('Updating item with ID:', itemId);
        console.log('Form data:');
        for (let [key, value] of formData.entries()) {
            console.log(`${key}: ${value}`);
            }

// بررسی خاص فیلدهای دسته‌بندی و واحد
        console.log('Category ID:', formData.get('category_id'));
        console.log('Primary Unit ID:', formData.get('primary_unit_id'));
        // استفاده از API REST Framework
        const url = `/inventory/api/v1/items/${itemId}/`;
        
        // نمایش داده‌های فرم برای دیباگ
        console.log('FormData in updateItem:');
        for (let [key, value] of formData.entries()) {
            console.log(`${key}: ${value}`);
        }
        
        // استفاده از متد PATCH برای بروزرسانی جزئی
        return await this.fetchData(url, {
            method: 'PATCH',
            body: formData,
            headers: {
                'X-CSRFToken': this.getCSRFToken()
            }
        });
    } catch (error) {
        console.error('Error in updateItem API call:', error);
        throw error;
    }
}





    /**
     * حذف کالا
     * @param {string} itemId - شناسه کالا
     * @returns {Promise} نتیجه درخواست
     */
    static async deleteItem(itemId) {
        return this.fetchData(INVENTORY_CONFIG.API_URLS.DELETE_ITEM(itemId), {
            method: 'DELETE'
        });
    }

    /**
     * دریافت لیست دسته‌بندی‌ها
     * @returns {Promise} نتیجه درخواست
     */
    static async getCategories() {
        return this.fetchData(INVENTORY_CONFIG.API_URLS.GET_CATEGORIES);
    }

    /**
     * دریافت لیست انبارها
     * @returns {Promise} نتیجه درخواست
     */
    static async getWarehouses() {
        return this.fetchData(INVENTORY_CONFIG.API_URLS.GET_WAREHOUSES);
    }

    /**
     * دریافت لیست واحدها
     * @returns {Promise} نتیجه درخواست
     */
    static async getUnits() {
        return this.fetchData(INVENTORY_CONFIG.API_URLS.GET_UNITS);
    }

    /**
     * دریافت لیست ورودی‌های انبار
     * @param {Object} params - پارامترهای درخواست
     * @returns {Promise} نتیجه درخواست
     */
    static async getEntries(params = {}) {
        const queryParams = new URLSearchParams(params).toString();
        const url = `${INVENTORY_CONFIG.API_URLS.GET_ENTRIES}${queryParams ? '?' + queryParams : ''}`;
        return this.fetchData(url);
    }

    /**
     * ثبت ورودی جدید
     * @param {Object} entryData - اطلاعات ورودی
     * @returns {Promise} نتیجه درخواست
     */
    static async createEntry(entryData) {
        return this.fetchData(INVENTORY_CONFIG.API_URLS.CREATE_ENTRY, {
            method: 'POST',
            body: JSON.stringify(entryData)
        });
    }

    /**
     * دریافت لیست خروجی‌های انبار
     * @param {Object} params - پارامترهای درخواست
     * @returns {Promise} نتیجه درخواست
     */
    static async getExits(params = {}) {
        const queryParams = new URLSearchParams(params).toString();
        const url = `${INVENTORY_CONFIG.API_URLS.GET_EXITS}${queryParams ? '?' + queryParams : ''}`;
        return this.fetchData(url);
    }

    /**
     * ثبت خروجی جدید
     * @param {Object} exitData - اطلاعات خروجی
     * @returns {Promise} نتیجه درخواست
     */
    static async createExit(exitData) {
        return this.fetchData(INVENTORY_CONFIG.API_URLS.CREATE_EXIT, {
            method: 'POST',
            body: JSON.stringify(exitData)
        });
    }

    /**
     * دریافت آمار داشبورد
     * @returns {Promise} نتیجه درخواست
     */
    static async getDashboardStats() {
        return this.fetchData(INVENTORY_CONFIG.API_URLS.GET_DASHBOARD_STATS);
    }

    /**
     * دریافت نمودارهای داشبورد
     * @returns {Promise} نتیجه درخواست
     */
    static async getDashboardCharts() {
        return this.fetchData(INVENTORY_CONFIG.API_URLS.GET_DASHBOARD_CHARTS);
    }

    /**
     * دریافت هشدارهای داشبورد
     * @returns {Promise} نتیجه درخواست
     */
    static async getDashboardAlerts() {
        return this.fetchData(INVENTORY_CONFIG.API_URLS.GET_DASHBOARD_ALERTS);
    }

    /**
     * دریافت گزارش موجودی کم
     * @returns {Promise} نتیجه درخواست
     */
    static async getLowStockReport() {
        return this.fetchData(INVENTORY_CONFIG.API_URLS.GET_LOW_STOCK_REPORT);
    }

    /**
     * دریافت گزارش انقضا
     * @returns {Promise} نتیجه درخواست
     */
    static async getExpiryReport() {
        return this.fetchData(INVENTORY_CONFIG.API_URLS.GET_EXPIRY_REPORT);
    }

    /**
     * دریافت گزارش حرکات انبار
     * @param {Object} params - پارامترهای درخواست
     * @returns {Promise} نتیجه درخواست
     */
    static async getMovementReport(params = {}) {
        const queryParams = new URLSearchParams(params).toString();
        const url = `${INVENTORY_CONFIG.API_URLS.GET_MOVEMENT_REPORT}${queryParams ? '?' + queryParams : ''}`;
        return this.fetchData(url);
    }

    /**
     * دریافت اعلان‌ها
     * @returns {Promise} نتیجه درخواست
     */
    static async getNotifications() {
        return this.fetchData(INVENTORY_CONFIG.API_URLS.GET_NOTIFICATIONS);
    }
}
