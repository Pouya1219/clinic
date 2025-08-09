/**
 * مدیریت انبارها
 */
class WarehouseManager {
    // متغیرهای استاتیک
    // متغیرهای استاتیک
    static currentPage = 1;
    static itemsPerPage = 12;
    static currentFilters = {
        search: '',
        manager: '',
        status: '',
        sort_by: 'name',
        sort_order: 'asc'
    };
    static isLoading = false;
    static warehouses = [];
    static pagination = {};
    static selectedWarehouses = new Set();
    static warehouseManagers = []; // لیست انبارداران
    
    /**
     * راه‌اندازی مدیریت انبارها
     */
    /**
     * راه‌اندازی مدیریت انبارها
     */
    static async initialize() {
        console.log('Initializing Warehouse Manager');
        
        // دریافت لیست انبارداران
        await this.loadWarehouseManagers();
        
        // تنظیم رویدادها
        this.setupEventListeners();
        
        // بررسی پارامترهای URL
        const urlParams = new URLSearchParams(window.location.search);
        const searchQuery = urlParams.get('search');
        const managerId = urlParams.get('manager');
        const status = urlParams.get('status');
        
        // تنظیم فیلترها بر اساس پارامترهای URL
        if (searchQuery) {
            this.currentFilters.search = searchQuery;
            
            // به‌روزرسانی فیلد جستجو
            const warehouseSearchInput = document.getElementById('warehouseSearch');
            if (warehouseSearchInput) warehouseSearchInput.value = searchQuery;
        }
        
        if (managerId) {
            this.currentFilters.manager = managerId;
            
            // به‌روزرسانی فیلتر مدیر
            const managerFilter = document.getElementById('managerFilter');
            if (managerFilter) managerFilter.value = managerId;
        }
        
        if (status) {
            this.currentFilters.status = status;
            
            // به‌روزرسانی فیلتر وضعیت
            const statusFilter = document.getElementById('statusFilter');
            if (statusFilter) statusFilter.value = status;
        }
        
        // بارگذاری اولیه انبارها
        this.loadWarehouses();
        
        console.log('Warehouse Manager initialized successfully');
    }
    
    /**
     * دریافت لیست انبارداران
     */
    static async loadWarehouseManagers() {
        try {
            const response = await fetch('/inventory/api/warehouse-managers/');
            const data = await response.json();
            
            if (data.success) {
                this.warehouseManagers = data.managers;
                
                // پر کردن لیست انبارداران در فرم‌ها
                this.populateManagerDropdowns();
            } else {
                console.error('Error loading warehouse managers:', data.message);
            }
        } catch (error) {
            console.error('Error loading warehouse managers:', error);
        }
    }
    
    /**
     * پر کردن لیست‌های کشویی انبارداران
     */
    static populateManagerDropdowns() {
        // پر کردن لیست کشویی در فرم افزودن انبار
        const addManagerSelect = document.getElementById('warehouseManager');
        if (addManagerSelect) {
            let options = '<option value="">انتخاب مدیر...</option>';
            this.warehouseManagers.forEach(manager => {
                options += `<option value="${manager.id}">${manager.full_name}</option>`;
            });
            addManagerSelect.innerHTML = options;
        }
        
        // پر کردن لیست کشویی در فرم ویرایش انبار
        const editManagerSelect = document.getElementById('editWarehouseManager');
        if (editManagerSelect) {
            let options = '<option value="">انتخاب مدیر...</option>';
            this.warehouseManagers.forEach(manager => {
                options += `<option value="${manager.id}">${manager.full_name}</option>`;
            });
            editManagerSelect.innerHTML = options;
        }
        
        // پر کردن لیست کشویی در فیلتر مدیران
        const managerFilter = document.getElementById('managerFilter');
        if (managerFilter) {
            let options = '<option value="">همه مدیران</option>';
            this.warehouseManagers.forEach(manager => {
                options += `<option value="${manager.id}">${manager.full_name}</option>`;
            });
            managerFilter.innerHTML = options;
        }
    }
    
    
    /**
     * تنظیم رویدادهای مربوط به فیلترها و جستجو
     */
    static setupEventListeners() {
        // فیلد جستجوی انبار
        const warehouseSearchInput = document.getElementById('warehouseSearch');
        if (warehouseSearchInput) {
            warehouseSearchInput.addEventListener('input', () => {
                const query = warehouseSearchInput.value.trim();
                if (query.length >= 2 || query.length === 0) {
                    this.searchWarehouses(query);
                }
            });
            
            warehouseSearchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.searchWarehouses(warehouseSearchInput.value.trim());
                }
            });
        }
        
        // فیلتر مدیر
        const managerFilter = document.getElementById('managerFilter');
        if (managerFilter) {
            managerFilter.addEventListener('change', () => {
                this.applyFilters();
            });
        }
        
        // فیلتر وضعیت
        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', () => {
                this.applyFilters();
            });
        }
    }
    
    /**
     * جستجوی انبارها
     * @param {string} query - عبارت جستجو
     */
    static searchWarehouses(query) {
        console.log('Searching warehouses with query:', query);
        
        // به‌روزرسانی فیلد جستجو
        const warehouseSearchInput = document.getElementById('warehouseSearch');
        if (warehouseSearchInput && warehouseSearchInput.value !== query) {
            warehouseSearchInput.value = query;
        }
        
        // ذخیره عبارت جستجو در فیلترها
        this.currentFilters.search = query;
        
        // بازنشانی صفحه به صفحه اول
        this.currentPage = 1;
        
        // اعمال فیلترها و جستجو
        this.applyFilters();
        
        // به‌روزرسانی UI نتایج جستجو
        this.updateSearchResultsUI(query);
    }
    
    /**
     * اعمال فیلترها
     */
    static applyFilters() {
        // دریافت مقادیر فیلترها
        const searchQuery = this.currentFilters.search;
        const managerId = document.getElementById('managerFilter')?.value || '';
        const status = document.getElementById('statusFilter')?.value || '';
        
        // به‌روزرسانی فیلترها
        this.currentFilters.manager = managerId;
        this.currentFilters.status = status;
        
        // ساخت پارامترهای URL
        const params = new URLSearchParams();
        if (searchQuery) params.append('search', searchQuery);
        if (managerId) params.append('manager', managerId);
        if (status) params.append('status', status);
        params.append('page', this.currentPage);
        
        // به‌روزرسانی URL بدون بارگذاری مجدد صفحه
        const newUrl = window.location.pathname + '?' + params.toString();
        window.history.pushState({ path: newUrl }, '', newUrl);
        
        // بارگذاری انبارها با فیلترهای جدید
        this.loadWarehouses();
    }
    
   // بارگذاری انبارها
    static async loadWarehouses() {
        try {
            // جلوگیری از درخواست‌های همزمان
            if (this.isLoading) {
                console.log('Already loading warehouses...');
                return;
            }
            
            this.isLoading = true;
            
            // نمایش لودینگ
            this.showLoading();
            
            // ساخت پارامترهای URL
            const params = new URLSearchParams();
            params.append('page', this.currentPage);
            params.append('per_page', this.itemsPerPage);
            
            // اضافه کردن فیلترها
            if (this.currentFilters.search && this.currentFilters.search.trim()) {
                params.append('search', this.currentFilters.search.trim());
            }
            
            if (this.currentFilters.manager && this.currentFilters.manager.trim()) {
                params.append('manager', this.currentFilters.manager.trim());
            }
            
            if (this.currentFilters.status && this.currentFilters.status.trim()) {
                params.append('status', this.currentFilters.status.trim());
            }
            
            if (this.currentFilters.sort_by && this.currentFilters.sort_by.trim()) {
                params.append('sort_by', this.currentFilters.sort_by.trim());
            }
            
            if (this.currentFilters.sort_order && this.currentFilters.sort_order.trim()) {
                params.append('sort_order', this.currentFilters.sort_order.trim());
            }
            
            // ساخت URL نهایی
            const url = `/inventory/api/warehouses/?${params.toString()}`;
            console.log('Loading warehouses from:', url);
            
            // دریافت انبارها از API
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRFToken': this.getCSRFToken()
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                // ذخیره داده‌ها
                this.warehouses = data.warehouses || [];
                this.pagination = data.pagination || {};
                
                // نمایش انبارها
                this.renderWarehouses(this.warehouses);
                
                // نمایش صفحه‌بندی
                this.renderPagination(this.pagination);
                
                // نمایش تعداد انبارها
                this.updateWarehouseCount(this.pagination.total_items || 0);
                
                // بروزرسانی URL بدون reload
                this.updateURL();
                
                // ارسال event موفقیت
                this.triggerEvent('warehouses_loaded', {
                    warehouses: this.warehouses,
                    pagination: this.pagination
                });
                
            } else {
                const errorMessage = data.message || 'خطای نامشخص در دریافت انبارها';
                console.error('Error loading warehouses:', errorMessage);
                this.showError('خطا در بارگذاری انبارها: ' + errorMessage);
                
                // ارسال event خطا
                this.triggerEvent('warehouses_load_error', { message: errorMessage });
            }
            
        } catch (error) {
            console.error('Error loading warehouses:', error);
            const errorMessage = error.message || 'خطا در ارتباط با سرور';
            this.showError('خطا در بارگذاری انبارها: ' + errorMessage);
            
            // ارسال event خطا
            this.triggerEvent('warehouses_load_error', { error: error });
            
        } finally {
            // مخفی کردن لودینگ
            this.hideLoading();
            this.isLoading = false;
        }
    }
     // فعال کردن event
    static triggerEvent(eventName, data) {
        const event = new CustomEvent(eventName, { 
            detail: data,
            bubbles: true,
            cancelable: true
        });
        document.dispatchEvent(event);
        
        // لاگ برای debugging
        console.log(`Event triggered: ${eventName}`, data);
        
        // ارسال به Google Analytics اگر موجود باشد
        if (typeof gtag === 'function') {
            gtag('event', eventName, {
                event_category: 'warehouse_management',
                event_label: eventName,
                value: data ? JSON.stringify(data) : null
            });
        }
    }
      // تنظیم WebSocket listeners
    static setupWebSocketListeners() {
        if (window.warehouseWebSocket) {
            // گوش دادن به event های WebSocket
            window.warehouseWebSocket.addEventListener('warehouse_created', (data) => {
                console.log('Warehouse created via WebSocket:', data);
                this.triggerEvent('warehouse_created_ws', data);
                
                // بارگذاری مجدد لیست اگر در صفحه اول هستیم
                if (this.currentPage === 1) {
                    this.loadWarehouses();
                } else {
                    // نمایش notification برای صفحات دیگر
                    if (typeof showNotification === 'function') {
                        showNotification('info', 'انبار جدیدی اضافه شد. برای مشاهده به صفحه اول بروید.');
                    }
                }
            });
            
            window.warehouseWebSocket.addEventListener('warehouse_updated', (data) => {
                console.log('Warehouse updated via WebSocket:', data);
                this.triggerEvent('warehouse_updated_ws', data);
                
                // بروزرسانی انبار در لیست فعلی
                this.updateWarehouseInList(data);
            });
            
            window.warehouseWebSocket.addEventListener('warehouse_deleted', (data) => {
                console.log('Warehouse deleted via WebSocket:', data);
                this.triggerEvent('warehouse_deleted_ws', data);
                
                // حذف انبار از لیست فعلی
                this.removeWarehouseFromList(data.id);
            });
            
            window.warehouseWebSocket.addEventListener('warehouse_inventory_update', (data) => {
                console.log('Warehouse inventory updated via WebSocket:', data);
                this.triggerEvent('warehouse_inventory_updated_ws', data);
                
                // بروزرسانی آمار انبار
                this.updateWarehouseStats(data);
            });
            
            window.warehouseWebSocket.addEventListener('connected', () => {
                console.log('Warehouse WebSocket connected');
                this.triggerEvent('websocket_connected');
                
                // نمایش وضعیت اتصال
                this.updateConnectionStatus(true);
            });
            
            window.warehouseWebSocket.addEventListener('disconnected', () => {
                console.log('Warehouse WebSocket disconnected');
                this.triggerEvent('websocket_disconnected');
                
                // نمایش وضعیت قطع اتصال
                this.updateConnectionStatus(false);
            });
            
            window.warehouseWebSocket.addEventListener('error', (error) => {
                console.error('Warehouse WebSocket error:', error);
                this.triggerEvent('websocket_error', error);
                
                // نمایش خطای اتصال
                if (typeof showNotification === 'function') {
                    showNotification('error', 'خطا در اتصال WebSocket انبارها');
                }
            });
            
        } else {
            console.warn('Warehouse WebSocket not available');
            
            // تلاش برای اتصال مجدد بعد از 2 ثانیه
            setTimeout(() => {
                if (window.warehouseWebSocket) {
                    this.setupWebSocketListeners();
                }
            }, 2000);
        }
    }

    
    // بروزرسانی وضعیت اتصال
    static updateConnectionStatus(isConnected) {
        const statusElement = document.querySelector('.websocket-status');
        if (statusElement) {
            statusElement.className = `websocket-status ${isConnected ? 'connected' : 'disconnected'}`;
            statusElement.innerHTML = isConnected 
                ? '<i class="fas fa-wifi text-success"></i> متصل'
                : '<i class="fas fa-wifi text-danger"></i> قطع شده';
        }
    }
    
    // بارگذاری انبارها (متد اصلی که قبلاً نوشته شده)
    static async loadWarehouses() {
        try {
            // جلوگیری از درخواست‌های همزمان
            if (this.isLoading) {
                console.log('Already loading warehouses...');
                return;
            }
            
            this.isLoading = true;
            
            // نمایش لودینگ
            this.showLoading();
            
            // ساخت پارامترهای URL
            const params = new URLSearchParams();
            params.append('page', this.currentPage);
            params.append('per_page', this.itemsPerPage);
            
            // اضافه کردن فیلترها
            if (this.currentFilters.search && this.currentFilters.search.trim()) {
                params.append('search', this.currentFilters.search.trim());
            }
            
            if (this.currentFilters.manager && this.currentFilters.manager.trim()) {
                params.append('manager', this.currentFilters.manager.trim());
            }
            
            if (this.currentFilters.status && this.currentFilters.status.trim()) {
                params.append('status', this.currentFilters.status.trim());
            }
            
            if (this.currentFilters.sort_by && this.currentFilters.sort_by.trim()) {
                params.append('sort_by', this.currentFilters.sort_by.trim());
            }
            
            if (this.currentFilters.sort_order && this.currentFilters.sort_order.trim()) {
                params.append('sort_order', this.currentFilters.sort_order.trim());
            }
            
            // ساخت URL نهایی
            const url = `/inventory/api/warehouses/?${params.toString()}`;
            console.log('Loading warehouses from:', url);
            
            // دریافت انبارها از API
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRFToken': this.getCSRFToken()
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                // ذخیره داده‌ها
                this.warehouses = data.warehouses || [];
                this.pagination = data.pagination || {};
                
                // نمایش انبارها
                this.renderWarehouses(this.warehouses);
                
                // نمایش صفحه‌بندی
                this.renderPagination(this.pagination);
                
                // نمایش تعداد انبارها
                this.updateWarehouseCount(this.pagination.total_items || 0);
                
                // بروزرسانی URL بدون reload
                this.updateURL();
                
                // ارسال event موفقیت
                this.triggerEvent('warehouses_loaded', {
                    warehouses: this.warehouses,
                    pagination: this.pagination
                });
                
            } else {
                const errorMessage = data.message || 'خطای نامشخص در دریافت انبارها';
                console.error('Error loading warehouses:', errorMessage);
                this.showError('خطا در بارگذاری انبارها: ' + errorMessage);
                
                // ارسال event خطا
                this.triggerEvent('warehouses_load_error', { message: errorMessage });
            }
            
        } catch (error) {
            console.error('Error loading warehouses:', error);
            const errorMessage = error.message || 'خطا در ارتباط با سرور';
            this.showError('خطا در بارگذاری انبارها: ' + errorMessage);
            
            // ارسال event خطا
            this.triggerEvent('warehouses_load_error', { error: error });
            
        } finally {
            // مخفی کردن لودینگ
            this.hideLoading();
            this.isLoading = false;
        }
    }
  // بروزرسانی آمار انبار
    static updateWarehouseStats(data) {
        const warehouseElement = document.querySelector(`[data-warehouse-id="${data.warehouse_id}"]`);
        if (warehouseElement) {
            const statsElements = {
                items: warehouseElement.querySelector('.total-items'),
                entries: warehouseElement.querySelector('.total-entries'),
                exits: warehouseElement.querySelector('.total-exits')
            };
            
            if (statsElements.items && data.total_items !== undefined) {
                statsElements.items.textContent = data.total_items.toLocaleString('fa-IR');
            }
            
            if (statsElements.entries && data.total_entries !== undefined) {
                statsElements.entries.textContent = data.total_entries.toLocaleString('fa-IR');
            }
            
            if (statsElements.exits && data.total_exits !== undefined) {
                statsElements.exits.textContent = data.total_exits.toLocaleString('fa-IR');
            }
        }
    }
    
       // حذف انبار از لیست
    static removeWarehouseFromList(warehouseId) {
        const warehouseElement = document.querySelector(`[data-warehouse-id="${warehouseId}"]`);
        if (warehouseElement) {
            // افکت fade out
            warehouseElement.style.transition = 'opacity 0.5s ease';
            warehouseElement.style.opacity = '0';
            
            setTimeout(() => {
                warehouseElement.remove();
                
                // بررسی اینکه آیا صفحه خالی شده یا نه
                const remainingWarehouses = document.querySelectorAll('[data-warehouse-id]');
                if (remainingWarehouses.length === 0) {
                    this.loadWarehouses(); // بارگذاری مجدد
                }
            }, 500);
        }
    }
      // بروزرسانی انبار در لیست
    static updateWarehouseInList(warehouseData) {
        const warehouseElement = document.querySelector(`[data-warehouse-id="${warehouseData.id}"]`);
        if (warehouseElement) {
            // بروزرسانی محتوای کارت انبار
            // این قسمت بستگی به ساختار HTML شما دارد
            const nameElement = warehouseElement.querySelector('.warehouse-name');
            if (nameElement) {
                nameElement.textContent = warehouseData.name;
            }
            
            const statusElement = warehouseElement.querySelector('.warehouse-status');
            if (statusElement) {
                statusElement.className = `badge ${warehouseData.is_active ? 'bg-success' : 'bg-secondary'}`;
                statusElement.textContent = warehouseData.is_active ? 'فعال' : 'غیرفعال';
            }
            
            // افکت بصری برای نشان دادن تغییر
            warehouseElement.style.transition = 'all 0.3s ease';
            warehouseElement.style.backgroundColor = '#e3f2fd';
            setTimeout(() => {
                warehouseElement.style.backgroundColor = '';
            }, 1000);
        }
    }
       // بروزرسانی URL
    static updateURL() {
        const params = new URLSearchParams();
        
        if (this.currentPage > 1) {
            params.append('page', this.currentPage);
        }
        
        if (this.itemsPerPage !== 12) {
            params.append('per_page', this.itemsPerPage);
        }
        
        Object.keys(this.currentFilters).forEach(key => {
            if (this.currentFilters[key] && this.currentFilters[key].trim()) {
                params.append(key, this.currentFilters[key].trim());
            }
        });
        
        const newURL = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
        
        // بروزرسانی URL بدون reload صفحه
        if (window.location.href !== window.location.origin + newURL) {
            window.history.replaceState({
                page: this.currentPage,
                filters: this.currentFilters,
                timestamp: Date.now()
            }, '', newURL);
        }
    }
    
    
 
    /**
     * نمایش انبارها در جدول
     * @param {Array} warehouses - لیست انبارها
     */
    static renderWarehouses(warehouses) {
    const tableBody = document.getElementById('warehousesTableBody');
    if (!tableBody) return;
    
    if (!warehouses || warehouses.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center py-4">
                    <div class="alert alert-info mb-0">
                        <i class="fas fa-info-circle me-2"></i>
                        هیچ انباری یافت نشد
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    // ساخت ردیف‌های جدول
    let html = '';
    warehouses.forEach(warehouse => {
        // اطمینان از وجود مقادیر
        const managerName = warehouse.manager_name || 'تعیین نشده';
        const managerEmail = warehouse.manager_email || '-';
        const managerPhone = warehouse.manager_phone || '-';
        const location = warehouse.location || '-';
        const itemCount = warehouse.item_count || 0;
        
        // اطلاعات تماس مدیر
        let contactInfo = '-';
        if (warehouse.manager_id) {
            contactInfo = `
                <small>
                    <i class="fas fa-envelope me-1"></i> ${managerEmail}<br>
                    <i class="fas fa-phone me-1"></i> ${managerPhone}
                </small>
            `;
        }
        
        html += `
            <tr data-warehouse-id="${warehouse.id}">
                <td>
                    <input type="checkbox" class="warehouse-checkbox" value="${warehouse.id}" 
                        ${this.selectedWarehouses.has(warehouse.id) ? 'checked' : ''}
                        onchange="WarehouseManager.toggleWarehouseSelection(this)">
                </td>
                <td>${warehouse.name}</td>
                <td>${warehouse.code}</td>
                <td>${managerName}</td>
                <td>${contactInfo}</td>
                <td>${location.length > 30 ? location.substring(0, 30) + '...' : location}</td>
                <td>${itemCount}</td>
                <td>
                    <span class="badge ${warehouse.is_active ? 'bg-success' : 'bg-danger'}">
                        ${warehouse.is_active ? 'فعال' : 'غیرفعال'}
                    </span>
                </td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-info" onclick="WarehouseManager.viewWarehouseDetails('${warehouse.id}')" title="مشاهده جزئیات">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-primary" onclick="WarehouseManager.editWarehouse('${warehouse.id}')" title="ویرایش">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-danger" onclick="WarehouseManager.deleteWarehouse('${warehouse.id}')" title="حذف">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    tableBody.innerHTML = html;
    
    // به‌روزرسانی وضعیت چک‌باکس "انتخاب همه"
    this.updateSelectAllCheckbox();
}
    /**
     * نمایش صفحه‌بندی
     * @param {Object} pagination - اطلاعات صفحه‌بندی
     */
    static renderPagination(pagination) {
        const paginationContainer = document.getElementById('warehousePagination');
        if (!paginationContainer) return;
        
        if (!pagination || pagination.total_pages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }
        
        let html = '<ul class="pagination justify-content-center">';
        
        // دکمه قبلی
        html += `
            <li class="page-item ${pagination.has_previous ? '' : 'disabled'}">
                <a class="page-link" href="javascript:void(0)" onclick="WarehouseManager.loadPage(${pagination.current_page - 1})" aria-label="قبلی">
                    <span aria-hidden="true">«</span>
                </a>
            </li>
        `;
        
        // صفحات
        for (let i = 1; i <= pagination.total_pages; i++) {
            html += `
                <li class="page-item ${i === pagination.current_page ? 'active' : ''}">
                    <a class="page-link" href="javascript:void(0)" onclick="WarehouseManager.loadPage(${i})">${i}</a>
                </li>
            `;
        }
        
        // دکمه بعدی
        html += `
            <li class="page-item ${pagination.has_next ? '' : 'disabled'}">
                <a class="page-link" href="javascript:void(0)" onclick="WarehouseManager.loadPage(${pagination.current_page + 1})" aria-label="بعدی">
                    <span aria-hidden="true">»</span>
                </a>
            </li>
        `;
        
        html += '</ul>';
        paginationContainer.innerHTML = html;
    }
    
    /**
     * بارگذاری صفحه مشخص
     * @param {number} page - شماره صفحه
     */
    static loadPage(page) {
        this.currentPage = page;
        this.loadWarehouses();
    }
    
    /**
     * به‌روزرسانی نمایش تعداد انبارها
     * @param {number} count - تعداد کل انبارها
     */
    // بروزرسانی تعداد انبارها
    static updateWarehouseCount(count) {
        const countElements = document.querySelectorAll('.warehouse-count');
        countElements.forEach(element => {
            element.textContent = count.toLocaleString('fa-IR');
        });
        
        // بروزرسانی عنوان صفحه
        const pageTitle = document.querySelector('.page-title');
        if (pageTitle) {
            pageTitle.innerHTML = `
                <i class="fas fa-warehouse me-2"></i>
                مدیریت انبارها
                <span class="badge bg-primary ms-2">${count.toLocaleString('fa-IR')}</span>
            `;
        }
        
        // بروزرسانی آمار در sidebar یا dashboard
        const statsElement = document.querySelector('.warehouse-stats-count');
        if (statsElement) {
            statsElement.textContent = count.toLocaleString('fa-IR');
        }
        
        // بروزرسانی breadcrumb
        const breadcrumbCount = document.querySelector('.breadcrumb-warehouse-count');
        if (breadcrumbCount) {
            breadcrumbCount.textContent = `(${count.toLocaleString('fa-IR')})`;
        }
    }
    
    
    /**
     * به‌روزرسانی UI نتایج جستجو
     * @param {string} searchTerm - عبارت جستجو
     */
    static updateSearchResultsUI(searchTerm) {
        const searchResultsTitle = document.getElementById('searchResultsTitle');
        const clearSearchButton = document.getElementById('clearSearch');
        
        if (searchTerm) {
            // نمایش عنوان نتایج جستجو
            if (searchResultsTitle) {
                searchResultsTitle.textContent = `نتایج جستجو برای: "${searchTerm}"`;
                searchResultsTitle.style.display = 'block';
            }
            
            // نمایش دکمه پاک کردن جستجو
            if (clearSearchButton) {
                clearSearchButton.style.display = 'inline-block';
            }
        } else {
            // مخفی کردن عنوان نتایج جستجو
            if (searchResultsTitle) {
                searchResultsTitle.style.display = 'none';
            }
            
            // مخفی کردن دکمه پاک کردن جستجو
            if (clearSearchButton) {
                clearSearchButton.style.display = 'none';
            }
        }
    }
    
    /**
     * پاک کردن جستجو
     */
    static clearSearch() {
        const warehouseSearchInput = document.getElementById('warehouseSearch');
        if (warehouseSearchInput) {
            warehouseSearchInput.value = '';
        }
        
        // پاک کردن فیلتر جستجو
        this.currentFilters.search = '';
        
        // به‌روزرسانی UI نتایج جستجو
        this.updateSearchResultsUI('');
        
        // بارگذاری مجدد انبارها
        this.applyFilters();
    }
    
    /**
     * بازنشانی فیلترها
     */
    static resetFilters() {
        // بازنشانی فیلترها در UI
        const warehouseSearchInput = document.getElementById('warehouseSearch');
        if (warehouseSearchInput) warehouseSearchInput.value = '';
        
        const managerFilter = document.getElementById('managerFilter');
        if (managerFilter) managerFilter.value = '';
        
        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) statusFilter.value = '';
        
        // بازنشانی فیلترها در متغیر
        this.currentFilters = {
            search: '',
            manager: '',
            status: ''
        };
        
        // به‌روزرسانی UI نتایج جستجو
        this.updateSearchResultsUI('');
        
        // بارگذاری مجدد انبارها
        this.loadWarehouses();
    }
    
    /**
     * انتخاب/عدم انتخاب انبار
     * @param {HTMLElement} checkbox - چک‌باکس انبار
     */
    static toggleWarehouseSelection(checkbox) {
        const warehouseId = checkbox.value;
        
        if (checkbox.checked) {
            this.selectedWarehouses.add(warehouseId);
        } else {
            this.selectedWarehouses.delete(warehouseId);
        }
        
        // به‌روزرسانی وضعیت چک‌باکس "انتخاب همه"
        this.updateSelectAllCheckbox();
    }
    
    /**
     * انتخاب/عدم انتخاب همه انبارها
     * @param {HTMLElement} checkbox - چک‌باکس انتخاب همه
     */
    static toggleAllWarehouses(checkbox) {
        const warehouseCheckboxes = document.querySelectorAll('.warehouse-checkbox');
        
        warehouseCheckboxes.forEach(cb => {
            cb.checked = checkbox.checked;
            this.toggleWarehouseSelection(cb);
        });
    }
    
    /**
     * به‌روزرسانی وضعیت چک‌باکس "انتخاب همه"
     */
    static updateSelectAllCheckbox() {
        const selectAllCheckbox = document.getElementById('selectAllWarehouses');
        const warehouseCheckboxes = document.querySelectorAll('.warehouse-checkbox');
        
        if (selectAllCheckbox && warehouseCheckboxes.length > 0) {
            const allChecked = Array.from(warehouseCheckboxes).every(cb => cb.checked);
            const someChecked = Array.from(warehouseCheckboxes).some(cb => cb.checked);
            
            selectAllCheckbox.checked = allChecked;
            selectAllCheckbox.indeterminate = someChecked && !allChecked;
        }
    }
    
  /**
 * نمایش جزئیات انبار
 * @param {string} warehouseId - شناسه انبار
 */
static async viewWarehouseDetails(warehouseId) {
    window.location.href = `/inventory/warehouses/${warehouseId}/`;
    try {
        // نمایش لودینگ
        this.showLoading();
        
        // استفاده از URL جدید برای دریافت جزئیات کامل
        const response = await fetch(`/inventory/api/warehouses/${warehouseId}/detail/`, {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            const warehouse = data.warehouse;
            
            // پر کردن اطلاعات در مودال
            document.getElementById('detailWarehouseName').textContent = warehouse.name;
            document.getElementById('detailWarehouseCode').textContent = warehouse.code;
            document.getElementById('detailWarehouseManager').textContent = warehouse.manager_name || 'تعیین نشده';
            
            // اطلاعات تماس مدیر
            document.getElementById('detailWarehouseManagerEmail').textContent = warehouse.manager_email || '-';
            document.getElementById('detailWarehouseManagerPhone').textContent = warehouse.manager_phone || '-';
            
            document.getElementById('detailWarehouseLocation').textContent = warehouse.location || '-';
            document.getElementById('detailWarehouseDescription').textContent = warehouse.description || '-';
            
            // وضعیت
            const statusElement = document.getElementById('detailWarehouseStatus');
            statusElement.innerHTML = `
                <span class="badge ${warehouse.is_active ? 'bg-success' : 'bg-danger'}">
                    ${warehouse.is_active ? 'فعال' : 'غیرفعال'}
                </span>
            `;
            
            // تاریخ‌ها
            document.getElementById('detailWarehouseCreatedAt').textContent = this.formatDate(warehouse.created_at);
            document.getElementById('detailWarehouseUpdatedAt').textContent = this.formatDate(warehouse.updated_at || warehouse.created_at);
            
            // آمار
            if (warehouse.stats) {
                document.getElementById('detailWarehouseItemCount').textContent = this.formatNumber(warehouse.stats.total_items || 0);
                document.getElementById('detailWarehouseValue').textContent = this.formatNumber(warehouse.stats.total_stock_value || 0) + ' ریال';
                document.getElementById('detailWarehouseLowStockCount').textContent = this.formatNumber(warehouse.stats.low_stock_items || 0);
            }
            
            // لینک مشاهده موجودی
            const viewInventoryBtn = document.getElementById('viewWarehouseInventoryBtn');
            if (viewInventoryBtn) {
                viewInventoryBtn.href = `/inventory/warehouses/${warehouseId}/`;
            }
            
            // ذخیره شناسه انبار فعلی برای استفاده در دکمه ویرایش
            window.currentWarehouseId = warehouseId;
            
            // نمایش مودال
            const modal = new bootstrap.Modal(document.getElementById('warehouseDetailsModal'));
            modal.show();
        } else {
            this.showError('خطا در دریافت اطلاعات انبار: ' + (data.message || 'خطای نامشخص'));
        }
    } catch (error) {
        console.error('Error fetching warehouse details:', error);
        this.showError('خطا در دریافت اطلاعات انبار: ' + error.message);
    } finally {
        // مخفی کردن لودینگ
        this.hideLoading();
    }
}
/**
 * نمایش جزئیات انبار در صفحه جداگانه
 * @param {string} warehouseId - شناسه انبار
 */
// static viewWarehouseDetails(warehouseId) {
//     // redirect به صفحه جزئیات انبار
//     window.location.href = `/inventory/warehouses/${warehouseId}/`;
// }

    
 /**
 * نمایش مودال ویرایش انبار
 * @param {string} warehouseId - شناسه انبار
 */
static async editWarehouse(warehouseId) {
    try {
        // نمایش لودینگ
        this.showLoading();
        
        // دریافت اطلاعات انبار از API (اطلاعات ساده)
        const response = await fetch(`/inventory/api/warehouses/${warehouseId}/info/`, {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            const warehouse = data.warehouse;
            
            // پر کردن فیلدهای مودال
            this.fillEditWarehouseModal(warehouse);
            
            // نمایش مودال
            const modal = new bootstrap.Modal(document.getElementById('editWarehouseModal'));
            modal.show();
        } else {
            this.showError('خطا در دریافت اطلاعات انبار: ' + (data.message || 'خطای نامشخص'));
        }
    } catch (error) {
        console.error('Error fetching warehouse for edit:', error);
        this.showError('خطا در دریافت اطلاعات انبار: ' + error.message);
    } finally {
        // مخفی کردن لودینگ
        this.hideLoading();
    }
}
/**
 * پر کردن فیلدهای مودال ویرایش انبار
 * @param {Object} warehouse - اطلاعات انبار
 */
static fillEditWarehouseModal(warehouse) {
    try {
        // پر کردن فیلدهای اصلی
        document.getElementById('editWarehouseId').value = warehouse.id;
        document.getElementById('editWarehouseName').value = warehouse.name || '';
        document.getElementById('editWarehouseCode').value = warehouse.code || '';
        document.getElementById('editWarehouseLocation').value = warehouse.location || '';
        document.getElementById('editWarehouseDescription').value = warehouse.description || '';
        
        // تنظیم وضعیت فعال/غیرفعال
        document.getElementById('editWarehouseActive').checked = warehouse.is_active;
        
        // تنظیم مدیر انبار
        const managerSelect = document.getElementById('editWarehouseManager');
        if (managerSelect && warehouse.manager_id) {
            managerSelect.value = warehouse.manager_id;
        } else if (managerSelect) {
            managerSelect.value = '';
        }
        
        // پاک کردن پیام‌های خطای قبلی
        this.clearFormErrors('editWarehouseForm');
        
    } catch (error) {
        console.error('Error filling edit warehouse modal:', error);
        this.showError('خطا در پر کردن فرم ویرایش');
    }
}
    /**
     * به‌روزرسانی انبار
     */

/**
 * به‌روزرسانی انبار
 */
static async updateWarehouse() {
    try {
        const form = document.getElementById('editWarehouseForm');
        const formData = new FormData(form);
        
        // تبدیل FormData به Object
        const data = {};
        for (let [key, value] of formData.entries()) {
            if (key === 'is_active') {
                data[key] = document.getElementById('editWarehouseActive').checked;
            } else {
                data[key] = value;
            }
        }
        
        // اعتبارسنجی سمت کلاینت
        if (!this.validateWarehouseForm(data, 'edit')) {
            return;
        }
        
        this.showLoading();
        
        const warehouseId = document.getElementById('editWarehouseId').value;
        
        const response = await fetch(`/inventory/api/warehouses/${warehouseId}/`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': this.getCSRFToken(),
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            // بستن مودال
            const modal = bootstrap.Modal.getInstance(document.getElementById('editWarehouseModal'));
            modal.hide();
            
            this.showSuccess(result.message || 'انبار با موفقیت به‌روزرسانی شد');
            
            // بارگذاری مجدد لیست انبارها (اگر در صفحه لیست هستیم)
            if (typeof this.loadWarehouses === 'function') {
                this.loadWarehouses();
            }
            
            // یا بارگذاری مجدد صفحه جزئیات (اگر در صفحه جزئیات هستیم)
            if (window.location.pathname.includes('/warehouses/') && !window.location.pathname.includes('/api/')) {
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            }
            
        } else {
            // نمایش خطاهای اعتبارسنجی
            if (result.errors) {
                this.showFormErrors(result.errors, 'editWarehouseForm');
            } else {
                this.showError(result.message || 'خطا در به‌روزرسانی انبار');
            }
        }
        
    } catch (error) {
        console.error('Error updating warehouse:', error);
        this.showError('خطا در به‌روزرسانی انبار: ' + error.message);
    } finally {
        this.hideLoading();
    }
}
/**
 * اعتبارسنجی فرم انبار
 * @param {Object} data - داده‌های فرم
 * @param {string} mode - حالت (create یا edit)
 */
static validateWarehouseForm(data, mode = 'create') {
    const errors = {};
    
    // بررسی نام انبار
    if (!data.name || data.name.trim().length < 2) {
        errors.name = 'نام انبار باید حداقل 2 کاراکتر باشد';
    }
    
    // بررسی کد انبار
    if (!data.code || data.code.trim().length < 2) {
        errors.code = 'کد انبار باید حداقل 2 کاراکتر باشد';
    }
    
    // نمایش خطاها
    if (Object.keys(errors).length > 0) {
        this.showFormErrors(errors, mode === 'create' ? 'createWarehouseForm' : 'editWarehouseForm');
        return false;
    }
    
    return true;
}
/**
 * نمایش خطاهای فرم
 * @param {Object} errors - خطاهای فرم
 * @param {string} formId - شناسه فرم
 */
static showFormErrors(errors, formId) {
    // پاک کردن خطاهای قبلی
    this.clearFormErrors(formId);
    
    // نمایش خطاهای جدید
    for (const [field, message] of Object.entries(errors)) {
        const input = document.querySelector(`#${formId} [name="${field}"]`);
        if (input) {
            input.classList.add('is-invalid');
            
            // اضافه کردن پیام خطا
            const errorDiv = document.createElement('div');
            errorDiv.className = 'invalid-feedback';
            errorDiv.textContent = message;
            input.parentNode.appendChild(errorDiv);
        }
    }
}

/**
 * پاک کردن خطاهای فرم
 * @param {string} formId - شناسه فرم
 */
static clearFormErrors(formId) {
    const form = document.getElementById(formId);
    if (form) {
        // حذف کلاس‌های خطا
        form.querySelectorAll('.is-invalid').forEach(element => {
            element.classList.remove('is-invalid');
        });
        
        // حذف پیام‌های خطا
        form.querySelectorAll('.invalid-feedback').forEach(element => {
            element.remove();
        });
    }
}

static getCSRFToken() {
    // روش 1: از کوکی
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'csrftoken') {
            const token = decodeURIComponent(value);
            console.log('CSRF from cookie:', token, 'Length:', token.length);
            return token;
        }
    }
    
    // روش 2: از متا تگ
    const csrfMeta = document.querySelector('meta[name="csrf-token"]');
    if (csrfMeta) {
        const token = csrfMeta.getAttribute('content');
        console.log('CSRF from meta:', token, 'Length:', token.length);
        return token;
    }
    
    // روش 3: از input مخفی
    const csrfInput = document.querySelector('input[name="csrfmiddlewaretoken"]');
    if (csrfInput) {
        const token = csrfInput.value;
        console.log('CSRF from input:', token, 'Length:', token.length);
        return token;
    }
    
    // روش 4: از window variable
    if (typeof window.csrfToken !== 'undefined') {
        const token = window.csrfToken;
        console.log('CSRF from window:', token, 'Length:', token.length);
        return token;
    }
    
    console.error('CSRF token not found anywhere!');
    return '';
}

static async deleteWarehouse(warehouseId) {
    try {
        this.showLoading();
        
        const response = await fetch(`/inventory/api/warehouses/${warehouseId}/info/`,{
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Response status:', response.status);
        console.log('Response URL:', response.url);
        
        const responseText = await response.text();
        console.log('Response text (first 500 chars):', responseText.substring(0, 500));
        
        // اگر response شامل HTML است
        if (responseText.includes('<!DOCTYPE') || responseText.includes('<html')) {
            console.error('Server returned HTML instead of JSON');
            throw new Error('سرور صفحه HTML برگردانده به جای JSON');
        }
        
        if (!responseText) {
            throw new Error('پاسخ سرور خالی است');
        }
        
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            console.error('JSON parse error:', parseError);
            console.error('Response text:', responseText);
            throw new Error('پاسخ سرور در فرمت JSON نیست');
        }
        
        if (data.success) {
            const warehouse = data.warehouse;
            
            document.getElementById('deleteWarehouseId').value = warehouse.id;
            document.getElementById('deleteWarehouseName').textContent = warehouse.name;
            
            const modal = new bootstrap.Modal(document.getElementById('deleteWarehouseModal'));
            modal.show();
        } else {
            this.showError('خطا در دریافت اطلاعات انبار: ' + (data.message || 'خطای نامشخص'));
        }
    } catch (error) {
        console.error('Error fetching warehouse for delete:', error);
        this.showError('خطا در دریافت اطلاعات انبار: ' + error.message);
    } finally {
        this.hideLoading();
    }
}


    
    /**
     * تأیید حذف انبار
     */
    static async confirmDeleteWarehouse() {
    try {
        const warehouseId = document.getElementById('deleteWarehouseId').value;
        
        if (!warehouseId) {
            this.showError('شناسه انبار نامعتبر است');
            return;
        }
        
        this.showLoading();
        
        const response = await fetch(`/inventory/api/warehouses/${warehouseId}/`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': this.getCSRFToken()
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            // بستن مودال
            const modal = bootstrap.Modal.getInstance(document.getElementById('deleteWarehouseModal'));
            modal.hide();
            
            this.showSuccess(result.message);
            this.loadWarehouses(); // بارگذاری مجدد لیست
        } else {
            // نمایش پیام خطا با فرمت مناسب
            const message = result.message.replace(/\n/g, '<br>');
            this.showError(message);
        }
        
    } catch (error) {
        console.error('Error deleting warehouse:', error);
        this.showError('خطا در حذف انبار');
    } finally {
        this.hideLoading();
    }
}

    
 /**
 * ذخیره انبار جدید
 */
static async saveWarehouse() {
    try {
        // نمایش لودینگ
        this.showLoading();
        
        // دریافت اطلاعات فرم
        const name = document.getElementById('warehouseName')?.value?.trim();
        const code = document.getElementById('warehouseCode')?.value?.trim();
        const managerId = document.getElementById('warehouseManager')?.value;
        const location = document.getElementById('warehouseLocation')?.value?.trim();
        const description = document.getElementById('warehouseDescription')?.value?.trim();
        const isActive = document.getElementById('warehouseActive')?.checked || false;
        
        // اعتبارسنجی
        if (!name || !code) {
            this.showError('لطفاً نام و کد انبار را وارد کنید');
            return;
        }
        
        // بررسی طول کد
        if (code.length < 2) {
            this.showError('کد انبار باید حداقل 2 کاراکتر باشد');
            return;
        }
        
        // بررسی طول نام
        if (name.length < 3) {
            this.showError('نام انبار باید حداقل 3 کاراکتر باشد');
            return;
        }
        
        // آماده‌سازی داده‌ها - دقیقاً مطابق با مدل Django
        const requestData = {
            name: name,
            code: code,
            location: location || '',  // مطابق با فیلد location در مدل
            description: description || '',
            is_active: isActive
        };
        
        // اضافه کردن manager_id فقط اگر انتخاب شده باشد
        if (managerId && managerId !== '' && managerId !== 'null') {
            requestData.manager_id = parseInt(managerId);
        }
        
        console.log('Creating warehouse with data:', requestData);
        
        // ارسال درخواست به API
        const response = await fetch('/inventory/api/warehouses/create/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': this.getCSRFToken(),
                'Referer': window.location.href
            },
            credentials: 'same-origin',
            body: JSON.stringify(requestData)
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Response error text:', errorText);
            
            try {
                const errorData = JSON.parse(errorText);
                throw new Error(errorData.message || 'خطای نامشخص');
            } catch (parseError) {
                if (response.status === 403) {
                    throw new Error('خطای احراز هویت - لطفاً صفحه را رفرش کنید');
                } else if (response.status === 400) {
                    throw new Error('اطلاعات ارسالی نامعتبر است');
                } else if (response.status === 500) {
                    throw new Error('خطای سرور - لطفاً دوباره تلاش کنید');
                } else {
                    throw new Error(`خطای HTTP: ${response.status}`);
                }
            }
        }
        
        const data = await response.json();
        console.log('Response data:', data);
        
        if (data.success) {
            // بستن مودال
            const modal = bootstrap.Modal.getInstance(document.getElementById('addWarehouseModal'));
            if (modal) {
                modal.hide();
            }
            
            // پاک کردن فرم
            const form = document.getElementById('addWarehouseForm');
            if (form) {
                form.reset();
            }
            
            // نمایش پیام موفقیت
            this.showSuccess('انبار جدید با موفقیت ایجاد شد');
            
            // بارگذاری مجدد انبارها
            await this.loadWarehouses();
            
        } else {
            const errorMessage = data.message || data.error || 'خطای نامشخص در ایجاد انبار';
            console.error('API Error:', errorMessage);
            this.showError(errorMessage);
        }
        
    } catch (error) {
        console.error('Error creating warehouse:', error);
        this.showError(error.message || 'خطای ناشناخته در ایجاد انبار');
    } finally {
        // مخفی کردن لودینگ
        this.hideLoading();
    }
}

    
    
    // نمایش لودینگ
    static showLoading() {
        const container = document.getElementById('warehouses-container');
        const loadingOverlay = document.getElementById('loading-overlay');
        
        if (container) {
            container.style.opacity = '0.5';
            container.style.pointerEvents = 'none';
        }
        
        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
        } else {
            // ایجاد loading overlay اگر وجود نداشت
            const overlay = document.createElement('div');
            overlay.id = 'loading-overlay';
            overlay.className = 'loading-overlay';
            overlay.innerHTML = `
                <div class="loading-spinner">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">در حال بارگذاری...</span>
                    </div>
                    <div class="mt-2">در حال بارگذاری انبارها...</div>
                </div>
            `;
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(255, 255, 255, 0.8);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 9999;
                flex-direction: column;
            `;
            document.body.appendChild(overlay);
        }
    }
    
    
     
    // مخفی کردن لودینگ
    static hideLoading() {
        const container = document.getElementById('warehouses-container');
        const loadingOverlay = document.getElementById('loading-overlay');
        
        if (container) {
            container.style.opacity = '1';
            container.style.pointerEvents = 'auto';
        }
        
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
    }
    

    
    /**
     * نمایش پیام خطا
     * @param {string} message - پیام خطا
     */
    static showError(message) {
        const container = document.getElementById('warehouses-container');
        if (container) {
            container.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-danger d-flex align-items-center" role="alert">
                        <i class="fas fa-exclamation-triangle me-3"></i>
                        <div>
                            <strong>خطا!</strong> ${message}
                            <br>
                            <button class="btn btn-outline-danger btn-sm mt-2" onclick="warehouseManager.loadWarehouses()">
                                <i class="fas fa-redo me-1"></i>
                                تلاش مجدد
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // نمایش toast notification اگر موجود باشد
        if (typeof showNotification === 'function') {
            showNotification('error', message);
        }
    }
    
    /**
     * نمایش پیام موفقیت
     * @param {string} message - پیام موفقیت
     */
    static showSuccess(message) {
    console.log('SUCCESS:', message);
    
    // نمایش toast notification
    if (typeof showNotification === 'function') {
        showNotification('success', message);
    } else {
        // ایجاد notification ساده
        const notification = document.createElement('div');
        notification.className = 'alert alert-success alert-dismissible fade show';
        notification.style.cssText = 'position: fixed; top: 70px; right: 20px; z-index: 9999; min-width: 300px;';
        notification.innerHTML = `
            <i class="fas fa-check-circle me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(notification);
        
        // حذف خودکار بعد از 5 ثانیه
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }
}

    


    
    /**
     * فرمت کردن اعداد
     * @param {number|string} value - مقدار عددی
     * @returns {string} - عدد فرمت شده
     */
    static formatNumber(value) {
        if (value === undefined || value === null) return '0';
        
        try {
            return parseFloat(value).toLocaleString();
        } catch (e) {
            console.error('Error formatting number:', e);
            return '0';
        }
    }
    
    /**
     * فرمت کردن تاریخ
     * @param {string} dateString - رشته تاریخ
     * @returns {string} - تاریخ فرمت شده
     */
    static formatDate(dateString) {
        if (!dateString) return '-';
        
        try {
            const date = new Date(dateString);
            return new Intl.DateTimeFormat('fa-IR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }).format(date);
        } catch (e) {
            console.error('Error formatting date:', e);
            return dateString;
        }
    }
    
}

// راه‌اندازی مدیریت انبارها پس از بارگذاری صفحه
document.addEventListener('DOMContentLoaded', function() {
    WarehouseManager.initialize();
});

// توابع전역 برای استفاده در HTML
function searchWarehouses() {
    const warehouseSearchInput = document.getElementById('warehouseSearch');
    WarehouseManager.searchWarehouses(warehouseSearchInput?.value.trim() || '');
}

function clearSearch() {
    WarehouseManager.clearSearch();
}

function resetFilters() {
    WarehouseManager.resetFilters();
}

function toggleAllWarehouses(checkbox) {
    WarehouseManager.toggleAllWarehouses(checkbox);
}

function toggleWarehouseSelection(checkbox) {
    WarehouseManager.toggleWarehouseSelection(checkbox);
}

function viewWarehouseDetails(warehouseId) {
    WarehouseManager.viewWarehouseDetails(warehouseId);
}

function editWarehouse(warehouseId) {
    WarehouseManager.editWarehouse(warehouseId);
}

function updateWarehouse() {
    WarehouseManager.updateWarehouse();
}

function deleteWarehouse(warehouseId) {
    WarehouseManager.deleteWarehouse(warehouseId);
}

function confirmDeleteWarehouse() {
    WarehouseManager.confirmDeleteWarehouse();
}

function saveWarehouse() {
    WarehouseManager.saveWarehouse();
}
