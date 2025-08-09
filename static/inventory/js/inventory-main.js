/**
 * کلاس مدیریت انبار
 */
class InventoryManager {
    static currentPage = 1;
    static itemsPerPage = INVENTORY_CONFIG.UI.ITEMS_PER_PAGE;
    static currentFilters = {
        search: '',
        category: '',
        stock_status: '',
        status: ''
    };
    /**
     * راه‌اندازی اولیه
     */
    static initialize() {
        console.log("Initializing InventoryManager...");
        console.log('INVENTORY_CONFIG:', INVENTORY_CONFIG);
        // راه‌اندازی رویدادهای جستجو
        //this.setupSearchEvents();
        // تنظیم متغیرهای وضعیت
        this.currentPage = 1;
        this.itemsPerPage = INVENTORY_CONFIG.UI.ITEMS_PER_PAGE;
        
        this.selectedItems = new Set();
        this.sortBy = 'name';
        this.sortOrder = 'asc';
         // بررسی پارامترهای URL
        const urlParams = new URLSearchParams(window.location.search);
        const searchQuery = urlParams.get('search');
        const categoryId = urlParams.get('category');
        const lowStock = urlParams.get('low_stock');
        const status = urlParams.get('status');

         // تنظیم فیلترها بر اساس پارامترهای URL
         // تنظیم فیلترها بر اساس پارامترهای URL
        if (searchQuery) {
            this.currentFilters.search = searchQuery;
            
            // به‌روزرسانی فیلدهای جستجو
            const globalSearchInput = document.getElementById('globalSearch');
            const itemSearchInput = document.getElementById('itemSearch');
            
            if (globalSearchInput) globalSearchInput.value = searchQuery;
            if (itemSearchInput) itemSearchInput.value = searchQuery;
        }
    
        const savedItemsPerPage = localStorage.getItem('inventoryItemsPerPage');
        if (savedItemsPerPage) {
            this.itemsPerPage = parseInt(savedItemsPerPage);

            // بروزرسانی انتخاب‌گر تعداد آیتم‌ها
            const itemsPerPageSelect = document.getElementById('itemsPerPageSelect');
            if (itemsPerPageSelect) {
                itemsPerPageSelect.value = savedItemsPerPage;
            }
        }
        // ثبت گوش‌دهنده‌های وب‌سوکت
        if (window.inventoryWebSocket) {
            console.log('Registering WebSocket event listeners in InventoryManager.initialize');
        
            window.inventoryWebSocket.addEventListener('items_list_received', (data) => {
            console.log('Items list received in InventoryManager:', data);
            this.updateItemsList(data.items, data.pagination);
        });
        } else {
            console.warn('inventoryWebSocket is not available in InventoryManager.initialize');
        }
        // بارگذاری داده‌های اولیه
        this.loadInitialData();
        this.loadItems(1);
        // تنظیم رویدادها
        this.setupEventListeners();

        console.log("InventoryManager initialized successfully.");
    }

    /**
     * بارگذاری داده‌های اولیه
     */
    static async loadInitialData() {
        try {
            InventoryUI.showLoading();

            // تعیین صفحه فعلی
            const currentPage = document.querySelector('.inventory-page');
            if (!currentPage) return;

            const pageType = currentPage.dataset.pageType;

            // بارگذاری داده‌ها بر اساس نوع صفحه
            if (pageType === 'dashboard') {
                await this.loadDashboardData();
            } else if (pageType === 'items') {
                await Promise.all([
                    this.loadItems(),
                    this.loadCategories(),
                    this.loadUnits()
                ]);
            } else if (pageType === 'entries') {
                await Promise.all([
                    this.loadEntries(),
                    this.loadItems(),
                    this.loadWarehouses(),
                    this.loadUnits()
                ]);
            } else if (pageType === 'exits') {
                await Promise.all([
                    this.loadExits(),
                    this.loadItems(),
                    this.loadWarehouses(),
                    this.loadUnits()
                ]);
            } else if (pageType === 'inventory') {
                await Promise.all([
                    this.loadInventory(),
                    this.loadWarehouses(),
                    this.loadCategories()
                ]);
            } else if (pageType === 'reports') {
                await this.loadReportsData();
            }

        } catch (error) {
            console.error('Error loading initial data:', error);
            InventoryUI.showToast(INVENTORY_CONFIG.ERROR_MESSAGES.FETCH_FAILED, 'error');
        } finally {
            InventoryUI.hideLoading();
        }
    }

    /**
     * تنظیم گوش‌دهنده‌های رویداد
     */
    static setupEventListeners() {
        // رویدادهای مربوط به کالاها
        this.setupItemEvents();

        // رویدادهای مربوط به ورودی‌ها
        this.setupEntryEvents();

        // رویدادهای مربوط به خروجی‌ها
        this.setupExitEvents();

        // رویدادهای مربوط به گزارشات
        this.setupReportEvents();

        // رویدادهای مربوط به داشبورد
        this.setupDashboardEvents();
    }

    /**
     * تنظیم رویدادهای مربوط به کالاها
     */
    static setupItemEvents() {
        // دکمه ذخیره کالا
        const saveItemBtn = document.getElementById('saveItemBtn');
        if (saveItemBtn) {
            saveItemBtn.addEventListener('click', () => {
                this.saveItem();
            });
        }

        // دکمه حذف کالا
        document.addEventListener('click', e => {
            if (e.target.matches('.delete-item-btn') || e.target.closest('.delete-item-btn')) {
                e.preventDefault();
                const btn = e.target.matches('.delete-item-btn') ? e.target : e.target.closest('.delete-item-btn');
                const itemId = btn.dataset.itemId;
                this.deleteItem(itemId);
            }
        });

        // تغییر دسته‌بندی
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => {
                this.applyItemFilters();
            });
        }
    }

    /**
     * تنظیم رویدادهای مربوط به ورودی‌ها
     */
    static setupEntryEvents() {
        // دکمه ذخیره ورودی
        const saveEntryBtn = document.getElementById('saveEntryBtn');
        if (saveEntryBtn) {
            saveEntryBtn.addEventListener('click', () => {
                this.saveEntry();
            });
        }

        // تغییر کالا در فرم ورودی
        const entryItemSelect = document.getElementById('entryItem');
        if (entryItemSelect) {
            entryItemSelect.addEventListener('change', () => {
                this.handleEntryItemChange();
            });
        }

        // تغییر مقدار در فرم ورودی
        const entryQuantity = document.getElementById('entryQuantity');
        const entryUnitCost = document.getElementById('entryUnitCost');
        if (entryQuantity && entryUnitCost) {
            entryQuantity.addEventListener('input', () => {
                this.calculateEntryTotalCost();
            });
            entryUnitCost.addEventListener('input', () => {
                this.calculateEntryTotalCost();
            });
        }
    }

    /**
     * تنظیم رویدادهای مربوط به خروجی‌ها
     */
    static setupExitEvents() {
        // دکمه ذخیره خروجی
        const saveExitBtn = document.getElementById('saveExitBtn');
        if (saveExitBtn) {
            saveExitBtn.addEventListener('click', () => {
                this.saveExit();
            });
        }

        // تغییر کالا در فرم خروجی
        const exitItemSelect = document.getElementById('exitItem');
        if (exitItemSelect) {
            exitItemSelect.addEventListener('change', () => {
                this.handleExitItemChange();
            });
        }

        // تغییر انبار در فرم خروجی
        const exitWarehouseSelect = document.getElementById('exitWarehouse');
        if (exitWarehouseSelect) {
            exitWarehouseSelect.addEventListener('change', () => {
                this.handleExitWarehouseChange();
            });
        }
    }

    /**
     * تنظیم رویدادهای مربوط به گزارشات
     */
    static setupReportEvents() {
        // دکمه‌های گزارش
        document.addEventListener('click', e => {
            if (e.target.matches('.report-btn') || e.target.closest('.report-btn')) {
                e.preventDefault();
                const btn = e.target.matches('.report-btn') ? e.target : e.target.closest('.report-btn');
                const reportType = btn.dataset.reportType;
                this.loadReport(reportType);
            }
        });

        // دکمه‌های صادرات
        document.addEventListener('click', e => {
            if (e.target.matches('.export-btn') || e.target.closest('.export-btn')) {
                e.preventDefault();
                const btn = e.target.matches('.export-btn') ? e.target : e.target.closest('.export-btn');
                const exportType = btn.dataset.exportType;
                const reportType = btn.dataset.reportType;
                this.exportReport(reportType, exportType);
            }
        });
    }

    /**
     * تنظیم رویدادهای مربوط به داشبورد
     */
    static setupDashboardEvents() {
        // دکمه بروزرسانی داشبورد
        const refreshDashboardBtn = document.getElementById('refreshDashboardBtn');
        if (refreshDashboardBtn) {
            refreshDashboardBtn.addEventListener('click', () => {
                this.loadDashboardData();
            });
        }
    }

    /**
     * بارگذاری داده‌های داشبورد
     */
    static async loadDashboardData() {
        try {
            InventoryUI.showLoading();

            const [statsResponse, chartsResponse, alertsResponse] = await Promise.all([
                InventoryAPI.getDashboardStats(),
                InventoryAPI.getDashboardCharts(),
                InventoryAPI.getDashboardAlerts()
            ]);

            // بروزرسانی آمار
            this.updateDashboardStats(statsResponse);

            // بروزرسانی نمودارها
            this.updateDashboardCharts(chartsResponse);

            // بروزرسانی هشدارها
            this.updateDashboardAlerts(alertsResponse);

        } catch (error) {
            console.error('Error loading dashboard data:', error);
            InventoryUI.showToast(INVENTORY_CONFIG.ERROR_MESSAGES.FETCH_FAILED, 'error');
        } finally {
            InventoryUI.hideLoading();
        }
    }

    /**
     * بروزرسانی آمار داشبورد
     * @param {Object} data - داده‌های آمار
     */
    static updateDashboardStats(data) {
        // بروزرسانی کارت‌های آمار
        const statElements = {
            totalItems: document.getElementById('totalItemsCount'),
            totalValue: document.getElementById('totalInventoryValue'),
            lowStockItems: document.getElementById('lowStockCount'),
            outOfStockItems: document.getElementById('outOfStockCount'),
            todayEntries: document.getElementById('todayEntriesCount'),
            todayExits: document.getElementById('todayExitsCount')
        };

        for (const [key, element] of Object.entries(statElements)) {
            if (element && data[key] !== undefined) {
                if (key === 'totalValue') {
                    element.textContent = InventoryUI.formatCurrency(data[key]);
                } else {
                    element.textContent = InventoryUI.formatNumber(data[key]);
                }
            }
        }
    }

    /**
     * بروزرسانی نمودارهای داشبورد
     * @param {Object} data - داده‌های نمودار
     */
    static updateDashboardCharts(data) {
        // نمودار موجودی
        this.renderStockLevelChart(data.stockLevels);

        // نمودار ورودی و خروجی
        this.renderTransactionChart(data.transactions);

        // نمودار دسته‌بندی
        this.renderCategoryChart(data.categories);
    }

    /**
     * بروزرسانی هشدارهای داشبورد
     * @param {Object} data - داده‌های هشدار
     */
    static updateDashboardAlerts(data) {
        const alertsContainer = document.getElementById('dashboardAlerts');
        if (!alertsContainer) return;

        if (!data.alerts || data.alerts.length === 0) {
            alertsContainer.innerHTML = `
                <div class="alert alert-success">
                    <i class="fas fa-check-circle me-2"></i>
                    هیچ هشداری وجود ندارد
                </div>
            `;
            return;
        }

        let alertsHtml = '';
        data.alerts.forEach(alert => {
            let alertClass = 'alert-info';
            let alertIcon = 'info-circle';

            if (alert.type === 'low_stock') {
                alertClass = 'alert-warning';
                alertIcon = 'exclamation-triangle';
            } else if (alert.type === 'out_of_stock') {
                alertClass = 'alert-danger';
                alertIcon = 'times-circle';
            } else if (alert.type === 'expiry') {
                alertClass = 'alert-danger';
                alertIcon = 'calendar-times';
            }

            alertsHtml += `
                <div class="alert ${alertClass} d-flex align-items-center">
                    <i class="fas fa-${alertIcon} me-2"></i>
                    <div>
                        <strong>${alert.title}</strong>
                        <p class="mb-0">${alert.message}</p>
                    </div>
                </div>
            `;
        });

        alertsContainer.innerHTML = alertsHtml;
    }

    /**
     * رندر نمودار سطح موجودی
     * @param {Object} data - داده‌های نمودار
     */
    static renderStockLevelChart(data) {
        const chartElement = document.getElementById('stockLevelChart');
        if (!chartElement) return;

        // حذف نمودار قبلی اگر وجود دارد
        if (this.stockLevelChart) {
            this.stockLevelChart.destroy();
        }

        // ایجاد نمودار جدید
        this.stockLevelChart = new Chart(chartElement, {
            type: 'doughnut',
            data: {
                labels: ['موجود', 'کم موجود', 'ناموجود'],
                datasets: [{
                    data: [
                        data.in_stock || 0,
                        data.low_stock || 0,
                        data.out_of_stock || 0
                    ],
                    backgroundColor: [
                        '#28a745', // سبز برای موجود
                        '#ffc107', // زرد برای کم موجود
                        '#dc3545'  // قرمز برای ناموجود
                    ],
                    borderWidth: 1,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            font: {
                                family: 'IRANSans'
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = InventoryUI.formatNumber(context.raw);
                                const percentage = Math.round(context.parsed * 100 / context.dataset.data.reduce((a, b) => a + b, 0));
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * رندر نمودار تراکنش‌ها
     * @param {Object} data - داده‌های نمودار
     */
    static renderTransactionChart(data) {
        const chartElement = document.getElementById('transactionChart');
        if (!chartElement) return;

        // حذف نمودار قبلی اگر وجود دارد
        if (this.transactionChart) {
            this.transactionChart.destroy();
        }

        // ایجاد نمودار جدید
        this.transactionChart = new Chart(chartElement, {
            type: 'line',
            data: {
                labels: data.labels || [],
                datasets: [
                    {
                        label: 'ورودی',
                        data: data.entries || [],
                        borderColor: '#28a745',
                        backgroundColor: 'rgba(40, 167, 69, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'خروجی',
                        data: data.exits || [],
                        borderColor: '#dc3545',
                        backgroundColor: 'rgba(220, 53, 69, 0.1)',
                        tension: 0.4,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            font: {
                                family: 'IRANSans'
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return InventoryUI.formatNumber(value);
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * رندر نمودار دسته‌بندی
     * @param {Object} data - داده‌های نمودار
     */
    static renderCategoryChart(data) {
        const chartElement = document.getElementById('categoryChart');
        if (!chartElement) return;

        // حذف نمودار قبلی اگر وجود دارد
        if (this.categoryChart) {
            this.categoryChart.destroy();
        }

        // ایجاد نمودار جدید
        this.categoryChart = new Chart(chartElement, {
            type: 'bar',
            data: {
                labels: data.labels || [],
                datasets: [{
                    label: 'تعداد کالا',
                    data: data.counts || [],
                    backgroundColor: '#4e73df',
                    borderColor: '#4e73df',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1,
                            callback: function(value) {
                                return InventoryUI.formatNumber(value);
                            }
                        }
                    }
                }
            }
        });
    }

/**
 * بارگذاری لیست کالاها
 * @param {number} page - شماره صفحه
 */
static async loadItems(page = 1) {
    try {
        console.log('Loading items for page:', page);
        
        // نمایش لودینگ
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) loadingIndicator.style.display = 'block';
        
        // // اطمینان از تعریف currentFilters
        // if (!this.currentFilters) {
        //     this.currentFilters = {
        //         search: '',
        //         category: '',
        //         stock_status: '',
        //         status: ''
        //     };
        // }
        
        // ذخیره صفحه فعلی
        this.currentPage = page;
        
        // ساخت پارامترهای URL
        const params = new URLSearchParams();
        params.append('page', page);
        params.append('per_page', this.itemsPerPage || 10);
        
        // // اضافه کردن فیلترها
        // if (this.currentFilters.search) {
        //     params.append('search', this.currentFilters.search);
        // }
        
        // if (this.currentFilters.category) {
        //     params.append('category', this.currentFilters.category);
        // }
        
        // if (this.currentFilters.stock_status === 'low_stock') {
        //     params.append('low_stock', '1');
        // }
        
        // دریافت کالاها از API
        const response = await fetch(`/inventory/api/items/?${params.toString()}`);
        const data = await response.json();
        
        if (data.success) {
            // نمایش کالاها
            this.renderItems(data.items);
            
            // نمایش صفحه‌بندی
            this.renderPagination(data.pagination);
            
            // نمایش تعداد کالاها
            this.updateItemCount(data.pagination.total_items);
            
            // به‌روزرسانی UI نتایج جستجو
            this.updateSearchResultsUI(this.currentFilters.search);
        } else {
            console.error('Error loading items:', data.message);
            alert('خطا در بارگذاری کالاها: ' + (data.message || 'خطای نامشخص'));
        }
    } catch (error) {
        console.error('Error loading items:', error);
        alert('خطا در بارگذاری کالاها');
    } finally {
        // مخفی کردن لودینگ
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) loadingIndicator.style.display = 'none';
    }
}


/**
 * به‌روزرسانی نمایش تعداد کالاها
 * @param {number} count - تعداد کل کالاها
 */
static updateItemCount(count) {
    const itemCountElement = document.getElementById('itemCount');
    if (itemCountElement) {
        itemCountElement.textContent = count.toLocaleString();
    }
}

/**
 * نمایش صفحه‌بندی
 * @param {Object} pagination - اطلاعات صفحه‌بندی
 */
static renderPagination(pagination) {
    const paginationContainer = document.getElementById('itemsPagination');
    if (!paginationContainer) return;
    
    if (!pagination || pagination.total_pages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }
    
    let html = '<ul class="pagination justify-content-center">';
    
    // دکمه قبلی
    html += `
        <li class="page-item ${pagination.has_previous ? '' : 'disabled'}">
            <a class="page-link" href="javascript:void(0)" onclick="InventoryManager.loadItems(${pagination.current_page - 1})" aria-label="قبلی">
                <span aria-hidden="true">«</span>
            </a>
        </li>
    `;
    
    // صفحات
    for (let i = 1; i <= pagination.total_pages; i++) {
        html += `
            <li class="page-item ${i === pagination.current_page ? 'active' : ''}">
                <a class="page-link" href="javascript:void(0)" onclick="InventoryManager.loadItems(${i})">${i}</a>
            </li>
        `;
    }
    
    // دکمه بعدی
    html += `
        <li class="page-item ${pagination.has_next ? '' : 'disabled'}">
            <a class="page-link" href="javascript:void(0)" onclick="InventoryManager.loadItems(${pagination.current_page + 1})" aria-label="بعدی">
                <span aria-hidden="true">»</span>
            </a>
        </li>
    `;
    
    html += '</ul>';
    paginationContainer.innerHTML = html;
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
 * بروزرسانی لیست کالاها با داده‌های دریافتی از وب‌سوکت
 * @param {Array} items - لیست کالاها
 * @param {Object} pagination - اطلاعات صفحه‌بندی
 */
static updateItemsList(items, pagination) {
    console.log("Updating items list from WebSocket data", items, pagination);
    
    try {
        // رندر کالاها
        console.log("Before renderItems");
        this.renderItems(items);
        console.log("After renderItems");
        
        // رندر صفحه‌بندی
        console.log("Before renderItemsPagination");
        this.renderItemsPagination(pagination);
        console.log("After renderItemsPagination");
        
        // بروزرسانی تعداد کالاها
        console.log("Before updateItemsCount");
        this.updateItemsCount(pagination.total_items);
        console.log("After updateItemsCount");
    } catch (error) {
        console.error("Error in updateItemsList:", error);
    }
}

/**
 * رندر لیست کالاها
 * @param {Array} items - لیست کالاها
 */
static renderItems(items) {
    // تعیین پیام خالی بودن با توجه به جستجو
    let emptyMessage = 'هیچ کالایی یافت نشد';
    if (this.currentFilters.search) {
        emptyMessage = `هیچ کالایی با عبارت "${this.currentFilters.search}" یافت نشد`;
    }
    
    // بروزرسانی کارت‌های کالا
    const container = document.getElementById('itemsContainer');
    if (container) {
        if (items.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-box-open fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">${emptyMessage}</h5>
                    <p class="text-muted">برای شروع، کالای جدید اضافه کنید</p>
                    <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#addItemModal">
                        <i class="fas fa-plus me-2"></i>افزودن کالا
                    </button>
                </div>
            `;
        } else {
            let itemsHtml = '';
            items.forEach(item => {
                // اگر جستجو انجام شده، متن جستجو را هایلایت کنیم
                let highlightedItem = {...item};
                
                if (this.currentFilters.search) {
                    const searchTerm = this.currentFilters.search;
                    const regex = new RegExp(`(${searchTerm})`, 'gi');
                    
                    if (highlightedItem.name) {
                        highlightedItem.name = highlightedItem.name.replace(regex, '<mark>$1</mark>');
                    }
                    if (highlightedItem.code) {
                        highlightedItem.code = highlightedItem.code.replace(regex, '<mark>$1</mark>');
                    }
                    if (highlightedItem.barcode) {
                        highlightedItem.barcode = highlightedItem.barcode.replace(regex, '<mark>$1</mark>');
                    }
                }
                
                itemsHtml += InventoryUI.createItemCard(highlightedItem);
            });
            container.innerHTML = itemsHtml;
        }
    }

    // بروزرسانی جدول کالاها
    const tableBody = document.getElementById('itemsTableBody');
    if (tableBody) {
        if (items.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center py-4">
                        <div class="alert alert-info mb-0">
                            <i class="fas fa-info-circle me-2"></i>
                            ${emptyMessage}
                        </div>
                    </td>
                </tr>
            `;
        } else {
            let tableHtml = '';
            items.forEach(item => {
                // تعیین وضعیت موجودی
                let stockStatus = 'موجود';
                let statusClass = 'bg-success';

                if (item.current_stock <= 0) {
                    stockStatus = 'ناموجود';
                    statusClass = 'bg-danger';
                } else if (item.current_stock <= item.alert_threshold) {
                    stockStatus = 'کم موجود';
                    statusClass = 'bg-warning';
                }

                // اطمینان از وجود مقادیر
                const category = item.category_name || 'بدون دسته‌بندی';
                const primaryUnit = item.primary_unit_name || '';
                
                // اگر جستجو انجام شده، متن جستجو را هایلایت کنیم
                let itemName = item.name || '';
                let itemCode = item.code || '';
                let itemBarcode = item.barcode || '';
                
                if (this.currentFilters.search) {
                    const searchTerm = this.currentFilters.search;
                    const regex = new RegExp(`(${searchTerm})`, 'gi');
                    
                    itemName = itemName.replace(regex, '<mark>$1</mark>');
                    itemCode = itemCode.replace(regex, '<mark>$1</mark>');
                    if (itemBarcode) {
                        itemBarcode = itemBarcode.replace(regex, '<mark>$1</mark>');
                    }
                }

                tableHtml += `
                    <tr data-item-id="${item.id}">
                        <td>
                            <input type="checkbox" class="item-checkbox" value="${item.id}" onchange="toggleItemSelection(this)">
                        </td>
                        <td>
                            <img src="${item.image_url || '/static/inventory/img/no-image.png'}" alt="${itemName}" class="item-thumbnail" width="40">
                        </td>
                        <td>${itemName}</td>
                        <td>${itemCode}</td>
                        <td>${category}</td>
                        <td class="stock-quantity">${InventoryUI.formatNumber(item.current_stock || 0)}</td>
                        <td>${primaryUnit}</td>
                        <td><span class="badge ${statusClass}">${stockStatus}</span></td>
                        <td>
                            <div class="btn-group btn-group-sm">
                                <button class="btn btn-info" onclick="viewItemDetails('${item.id}')" title="مشاهده جزئیات">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="btn btn-primary" onclick="editItem('${item.id}')" title="ویرایش">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-danger delete-item-btn" data-item-id="${item.id}" title="حذف">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            });
            tableBody.innerHTML = tableHtml;
            
            // اضافه کردن رویدادهای حذف
            document.querySelectorAll('.delete-item-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const itemId = this.getAttribute('data-item-id');
                    InventoryManager.deleteItem(itemId);
                });
            });
        }
    }
    
    // به‌روزرسانی UI نتایج جستجو
    this.updateSearchResultsUI(this.currentFilters.search, items.length);
}

      /**
     * رندر صفحه‌بندی کالاها
     * @param {Object} pagination - اطلاعات صفحه‌بندی
     */
    static renderItemsPagination(pagination) {
        const paginationContainer = document.getElementById('pagination');
        if (!paginationContainer) return;

        const totalPages = pagination.total_pages;
        const currentPage = pagination.current_page;
        const totalItems = pagination.total_items;

        // محاسبه محدوده آیتم‌های نمایش داده شده
        const startItem = (currentPage - 1) * this.itemsPerPage + 1;
        const endItem = Math.min(currentPage * this.itemsPerPage, totalItems);

        // بروزرسانی متن نمایش محدوده
        const rangeInfo = document.querySelector('.d-flex.justify-content-between.align-items-center.mt-3 div:first-child');
        if (rangeInfo) {
            rangeInfo.innerHTML = `<span>نمایش ${startItem} تا ${endItem} از ${totalItems} مورد</span>`;
        }

        // بروزرسانی متن شماره صفحه
        const pageInfo = document.querySelector('.d-flex.justify-content-between.align-items-center.mt-3 div:last-child');
        if (pageInfo) {
            pageInfo.innerHTML = `<span>صفحه ${currentPage} از ${totalPages}</span>`;
        }

        // ساخت دکمه‌های صفحه‌بندی
        let paginationHtml = '';

        // دکمه قبلی
        paginationHtml += `
            <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="${currentPage > 1 ? 'InventoryManager.loadItemsPage(' + (currentPage - 1) + '); return false;' : 'return false;'}" tabindex="${currentPage === 1 ? '-1' : '0'}" aria-disabled="${currentPage === 1 ? 'true' : 'false'}">قبلی</a>
            </li>
        `;

        // محاسبه محدوده صفحات نمایش داده شده
        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, startPage + 4);

        if (endPage - startPage < 4 && startPage > 1) {
            startPage = Math.max(1, endPage - 4);
        }

        // دکمه صفحه اول
        if (startPage > 1) {
            paginationHtml += `
                <li class="page-item">
                    <a class="page-link" href="#" onclick="InventoryManager.loadItemsPage(1); return false;">1</a>
                </li>
            `;

            if (startPage > 2) {
                paginationHtml += `
                    <li class="page-item disabled">
                        <a class="page-link" href="#" tabindex="-1" aria-disabled="true">...</a>
                    </li>
                `;
            }
        }

        // دکمه‌های صفحات میانی
        for (let i = startPage; i <= endPage; i++) {
            paginationHtml += `
                <li class="page-item ${i === currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="InventoryManager.loadItemsPage(${i}); return false;">${i}</a>
                </li>
            `;
        }

        // دکمه صفحه آخر
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                paginationHtml += `
                    <li class="page-item disabled">
                        <a class="page-link" href="#" tabindex="-1" aria-disabled="true">...</a>
                    </li>
                `;
            }

            paginationHtml += `
                <li class="page-item">
                    <a class="page-link" href="#" onclick="InventoryManager.loadItemsPage(${totalPages}); return false;">${totalPages}</a>
                </li>
            `;
        }

        // دکمه بعدی
        paginationHtml += `
            <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="${currentPage < totalPages ? 'InventoryManager.loadItemsPage(' + (currentPage + 1) + '); return false;' : 'return false;'}" tabindex="${currentPage === totalPages ? '-1' : '0'}" aria-disabled="${currentPage === totalPages ? 'true' : 'false'}">بعدی</a>
            </li>
        `;

        paginationContainer.innerHTML = paginationHtml;
    }
/**
 * نمایش جزئیات کالا
 * @param {string} itemId - شناسه کالا
 */
static async viewItemDetails(itemId) {
    try {
        console.log('Viewing item details for ID:', itemId);
        
        // نمایش مودال
        const modal = new bootstrap.Modal(document.getElementById('itemDetailsModal'));
        modal.show();
        
        // نمایش لودینگ
        document.getElementById('itemDetailsLoading').style.display = 'block';
        document.getElementById('itemDetailsContent').style.display = 'none';
        
        // ذخیره ID کالا
        document.getElementById('itemDetailsId').value = itemId;
        
        // دریافت اطلاعات کالا
        const response = await InventoryAPI.getItem(itemId);
        
        if (response.success) {
            const item = response.item;
            console.log('Item details received:', item);
            
            // پر کردن اطلاعات اصلی
            document.getElementById('itemDetailsName').textContent = item.name || '-';
            document.getElementById('itemDetailsCode').textContent = item.code || '-';
            document.getElementById('itemDetailsBarcode').textContent = item.barcode || '-';
            document.getElementById('itemDetailsCategory').textContent = item.category_name || '-';
            document.getElementById('itemDetailsPrimaryUnit').textContent = item.primary_unit_name || '-';
            document.getElementById('itemDetailsBrand').textContent = item.brand || '-';
            document.getElementById('itemDetailsModel').textContent = item.model || '-';
            document.getElementById('itemDetailsDescription').textContent = item.description || '-';
            
            // موجودی - با بررسی وجود مقادیر
            const currentStock = item.current_stock !== undefined ? item.current_stock : 0;
            const minStock = item.min_stock_level !== undefined ? item.min_stock_level : 0;
            const maxStock = item.max_stock_level !== undefined ? item.max_stock_level : 0;
            const alertThreshold = item.alert_threshold !== undefined ? item.alert_threshold : 0;
            
            document.getElementById('itemDetailsTotalStock').textContent = this.formatNumber(currentStock);
            document.getElementById('itemDetailsMinStock').textContent = this.formatNumber(minStock);
            document.getElementById('itemDetailsMaxStock').textContent = this.formatNumber(maxStock);
            document.getElementById('itemDetailsAlertThreshold').textContent = this.formatNumber(alertThreshold);
            
            // وضعیت موجودی (رنگ‌بندی)
            const totalStockElement = document.getElementById('itemDetailsTotalStock');
            if (currentStock <= alertThreshold) {
                totalStockElement.classList.add('text-danger');
            } else if (currentStock <= minStock) {
                totalStockElement.classList.add('text-warning');
            } else {
                totalStockElement.classList.add('text-success');
            }
            
            // ویژگی‌ها
            document.getElementById('itemDetailsCostMethod').textContent = this.getCostMethodText(item.cost_method);
            document.getElementById('itemDetailsHasExpiry').innerHTML = item.has_expiry ? 
                '<i class="fas fa-check-circle text-success"></i>' : 
                '<i class="fas fa-times-circle text-danger"></i>';
            document.getElementById('itemDetailsHasSerial').innerHTML = item.has_serial ? 
                '<i class="fas fa-check-circle text-success"></i>' : 
                '<i class="fas fa-times-circle text-danger"></i>';
            document.getElementById('itemDetailsHasBatch').innerHTML = item.has_batch ? 
                '<i class="fas fa-check-circle text-success"></i>' : 
                '<i class="fas fa-times-circle text-danger"></i>';
            document.getElementById('itemDetailsLowStockAlert').innerHTML = item.enable_low_stock_alert ? 
                '<i class="fas fa-check-circle text-success"></i>' : 
                '<i class="fas fa-times-circle text-danger"></i>';
            
            // شرایط نگهداری
            const tempMin = item.storage_temperature_min !== undefined ? item.storage_temperature_min : null;
            const tempMax = item.storage_temperature_max !== undefined ? item.storage_temperature_max : null;
            
            document.getElementById('itemDetailsTempMin').textContent = tempMin !== null ? `${tempMin} °C` : '-';
            document.getElementById('itemDetailsTempMax').textContent = tempMax !== null ? `${tempMax} °C` : '-';
            document.getElementById('itemDetailsStorageConditions').textContent = item.storage_conditions || '-';
            document.getElementById('itemDetailsUsageInstructions').textContent = item.usage_instructions || '-';
            
            // موجودی در انبارها
            const inventoriesTable = document.getElementById('itemInventoriesTable');
            if (item.inventories && item.inventories.length > 0) {
                inventoriesTable.innerHTML = item.inventories.map(inv => `
                    <tr>
                        <td>${inv.warehouse || '-'}</td>
                        <td>${inv.batch || '-'}</td>
                        <td>${this.formatNumber(inv.quantity)}</td>
                        <td>${this.formatNumber(inv.value)} ریال</td>
                        <td>${this.formatNumber(inv.average_cost)} ریال</td>
                    </tr>
                `).join('');
            } else {
                inventoriesTable.innerHTML = '<tr><td colspan="5" class="text-center">موجودی یافت نشد</td></tr>';
            }
            
            // ورودی‌ها
            const entriesTable = document.getElementById('itemEntriesTable');
            if (item.recent_entries && item.recent_entries.length > 0) {
                entriesTable.innerHTML = item.recent_entries.map(entry => `
                    <tr>
                        <td>${entry.entry_number || '-'}</td>
                        <td>${this.formatDate(entry.entry_date)}</td>
                        <td>${entry.warehouse || '-'}</td>
                        <td>${this.formatNumber(entry.quantity)}</td>
                        <td>${entry.unit || '-'}</td>
                        <td>${this.formatNumber(entry.unit_cost)} ریال</td>
                    </tr>
                `).join('');
            } else {
                entriesTable.innerHTML = '<tr><td colspan="6" class="text-center">ورودی یافت نشد</td></tr>';
            }
            
            // خروجی‌ها
            const exitsTable = document.getElementById('itemExitsTable');
            if (item.recent_exits && item.recent_exits.length > 0) {
                exitsTable.innerHTML = item.recent_exits.map(exit => `
                    <tr>
                        <td>${exit.exit_number || '-'}</td>
                        <td>${this.formatDate(exit.exit_date)}</td>
                        <td>${exit.warehouse || '-'}</td>
                        <td>${this.formatNumber(exit.quantity)}</td>
                        <td>${exit.unit || '-'}</td>
                        <td>${exit.recipient_name || '-'}</td>
                    </tr>
                `).join('');
            } else {
                exitsTable.innerHTML = '<tr><td colspan="6" class="text-center">خروجی یافت نشد</td></tr>';
            }
            
            // نمایش محتوا
            document.getElementById('itemDetailsLoading').style.display = 'none';
            document.getElementById('itemDetailsContent').style.display = 'block';
            
        } else {
            console.error('Error fetching item details:', response.message);
            InventoryUI.showToast(response.message || INVENTORY_CONFIG.ERROR_MESSAGES.FETCH_FAILED, 'error');
            modal.hide();
        }
        
    } catch (error) {
        console.error('Error viewing item details:', error);
        InventoryUI.showToast(INVENTORY_CONFIG.ERROR_MESSAGES.FETCH_FAILED, 'error');
        
        // بستن مودال در صورت خطا
        const modal = bootstrap.Modal.getInstance(document.getElementById('itemDetailsModal'));
        if (modal) modal.hide();
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
 * تبدیل روش قیمت‌گذاری به متن فارسی
 * @param {string} method - روش قیمت‌گذاری
 * @returns {string} - متن فارسی
 */
static getCostMethodText(method) {
    switch (method) {
        case 'FIFO':
            return 'اول وارد، اول خارج (FIFO)';
        case 'LIFO':
            return 'آخر وارد، اول خارج (LIFO)';
        case 'AVERAGE':
            return 'میانگین موزون';
        default:
            return method || '-';
    }
}

/**
 * فرمت تاریخ
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

    /**
     * بروزرسانی نشانگرهای مرتب‌سازی
     */
    static updateSortIndicators() {
        document.querySelectorAll('.sortable-header').forEach(header => {
            const icon = header.querySelector('.sort-icon');
            if (!icon) return;

            if (header.dataset.sort === this.sortBy) {
                icon.className = `fas fa-sort-${this.sortOrder === 'asc' ? 'up' : 'down'} sort-icon`;
                icon.style.opacity = '1';
            } else {
                icon.className = 'fas fa-sort sort-icon';
                icon.style.opacity = '0.3';
            }
        });
    }

    /**
     * انتخاب همه کالاها
     * @param {boolean} checked - وضعیت انتخاب
     */
    static selectAllItems(checked) {
        const checkboxes = document.querySelectorAll('.item-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = checked;

            if (checked) {
                this.selectedItems.add(checkbox.value);
            } else {
                this.selectedItems.delete(checkbox.value);
            }
        });

        this.updateBulkActionsVisibility();
    }

    /**
     * بروزرسانی نمایش عملیات گروهی
     */
    static updateBulkActionsVisibility() {
        const bulkActions = document.getElementById('bulkActions');
        const selectedCount = document.getElementById('selectedCount');

        if (bulkActions) {
            bulkActions.style.display = this.selectedItems.size > 0 ? 'flex' : 'none';
        }

        if (selectedCount) {
            selectedCount.textContent = InventoryUI.formatNumber(this.selectedItems.size);
        }
    }
/**
 * ذخیره کالا
 */
static async saveItem() {
    try {
        console.log('saveItem called');

        const form = document.getElementById('itemForm');
        if (!form) {
            console.error('Item form not found');
            return;
        }

        // اعتبارسنجی فرم
        if (!InventoryUI.validateItemForm()) {
            return;
        }

        InventoryUI.showLoading();

        // جمع‌آوری داده‌های فرم
        const formData = new FormData(form);
        const itemId = formData.get('item_id');

        // تبدیل فیلدهای عددی خالی به صفر
        const numericFields = [
            'min_stock_level', 'max_stock_level', 'alert_threshold',
            'storage_temperature_min', 'storage_temperature_max'
        ];

        numericFields.forEach(field => {
            const value = formData.get(field);
            if (value === null || value === undefined || value === '') {
                formData.set(field, '0');
            }
        });

        // تبدیل چک‌باکس‌ها به مقادیر بولی
        const checkboxes = ['enable_low_stock_alert', 'has_expiry', 'has_serial', 'has_batch'];
        checkboxes.forEach(checkbox => {
            if (!formData.has(checkbox)) {
                formData.append(checkbox, 'false');
            } else {
                formData.set(checkbox, 'true');
            }
        });

        // اطمینان از وجود فیلدهای الزامی
        const requiredFields = ['name', 'code', 'category_id', 'primary_unit_id'];
        let missingFields = [];
        for (const field of requiredFields) {
            if (!formData.get(field)) {
                missingFields.push(field);
            }
        }
        
        if (missingFields.length > 0) {
            console.error(`Missing required fields: ${missingFields.join(', ')}`);
            InventoryUI.showToast(`فیلدهای ${missingFields.join(', ')} الزامی هستند`, 'error');
            return;
        }

        // اگر بارکد خالی است، یک مقدار تصادفی برای آن تولید کنید
        const barcode = formData.get('barcode');
        if (!barcode || barcode.trim() === '') {
            const randomBarcode = 'BAR-' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
            formData.set('barcode', randomBarcode);
        }

        // نمایش داده‌های فرم برای دیباگ
        console.log('Form data:');
        for (let [key, value] of formData.entries()) {
            console.log(`${key}: ${value}`);
        }

        try {
            let response;
            if (itemId) {
                // ویرایش کالا
                response = await InventoryAPI.updateItem(itemId, formData);
                console.log('itemId:',itemId)
            } else {
                // ایجاد کالای جدید
                response = await InventoryAPI.createItem(formData);
            }
            
            InventoryUI.showToast(itemId ? INVENTORY_CONFIG.SUCCESS_MESSAGES.UPDATE_SUCCESS : INVENTORY_CONFIG.SUCCESS_MESSAGES.SAVE_SUCCESS, 'success');

            // بستن مودال و حذف backdrop
            const modalElement = document.getElementById('addItemModal');
            const modal = bootstrap.Modal.getInstance(modalElement);
            if (modal) {
                modal.hide();
                
                // حذف backdrop
                setTimeout(() => {
                    const backdrop = document.querySelector('.modal-backdrop');
                    if (backdrop) {
                        backdrop.classList.remove('show');
                        setTimeout(() => {
                            backdrop.remove();
                        }, 150);
                    }
                    
                    // بازگرداندن اسکرول به بدنه
                    document.body.classList.remove('modal-open');
                    document.body.style.overflow = '';
                    document.body.style.paddingRight = '';
                }, 300);
            }

            // بروزرسانی لیست کالاها
            this.loadItems(this.currentPage);
        } catch (error) {
            console.error('Error in API call:', error);
            InventoryUI.showToast(error.message || INVENTORY_CONFIG.ERROR_MESSAGES.SAVE_FAILED, 'error');
        }

    } catch (error) {
        console.error('Error saving item:', error);
        InventoryUI.showToast(INVENTORY_CONFIG.ERROR_MESSAGES.SAVE_FAILED, 'error');
    } finally {
        InventoryUI.hideLoading();
    }
}



 /**
 * ویرایش کالا
 * @param {string} itemId - شناسه کالا
 */
static async editItem(itemId) {
    try {
        console.log('Edit item called with ID:', itemId);
        InventoryUI.showLoading();
        
        const response = await InventoryAPI.getItem(itemId);
        
        if (response.success) {
            console.log('Item data received:', response.item);
            
            // باز کردن مودال
            const modal = new bootstrap.Modal(document.getElementById('addItemModal'));
            modal.show();
            
            // پر کردن فرم
            this.fillItemForm(response.item);
        } else {
            console.error('Error fetching item:', response.message);
            InventoryUI.showToast(response.message || INVENTORY_CONFIG.ERROR_MESSAGES.FETCH_FAILED, 'error');
        }
        
    } catch (error) {
        console.error('Error loading item for edit:', error);
        InventoryUI.showToast(INVENTORY_CONFIG.ERROR_MESSAGES.FETCH_FAILED, 'error');
    } finally {
        InventoryUI.hideLoading();
    }
}
/**
 * پر کردن فرم کالا برای ویرایش
 * @param {Object} item - اطلاعات کالا
 */
static fillItemForm(item) {
    console.log('Filling form with item data:', item);
    const form = document.getElementById('itemForm');
    if (!form) {
        console.error('Item form not found!');
        return;
    }
    
    // پاک کردن فرم
    form.reset();
    
    // پر کردن فیلدها
    form.querySelector('#item_id').value = item.id;
    form.querySelector('#itemName').value = item.name;
    form.querySelector('#itemCode').value = item.code;
    form.querySelector('#itemBarcode').value = item.barcode || '';
    
    // تنظیم دسته‌بندی
    const categorySelect = form.querySelector('#itemCategory');
    if (categorySelect) {
        console.log('Setting category to:', item.category_id);
        categorySelect.value = item.category_id;
        
        // در حالت ویرایش، فیلد را readonly کنیم
        if (item.id) {
            // ایجاد یک فیلد مخفی برای ارسال مقدار
            const hiddenInput = document.createElement('input');
            hiddenInput.type = 'hidden';
            hiddenInput.name = 'category_id';
            hiddenInput.value = item.category_id;
            categorySelect.parentNode.appendChild(hiddenInput);
            
            // نمایش متن به جای select
            const readonlyText = document.createElement('div');
            readonlyText.className = 'form-control';
            readonlyText.style.backgroundColor = '#e9ecef';
            readonlyText.style.cursor = 'not-allowed';
            readonlyText.textContent = item.category_name || categorySelect.options[categorySelect.selectedIndex]?.text || '';
            
            // جایگزینی select با متن
            categorySelect.style.display = 'none';
            categorySelect.parentNode.insertBefore(readonlyText, categorySelect);
            
            // اضافه کردن نشانگر readonly
            const badge = document.createElement('span');
            badge.className = 'badge bg-warning text-dark ms-2';
            badge.textContent = 'غیرقابل تغییر';
            readonlyText.appendChild(badge);
        }
    }
    
    // تنظیم واحد اصلی
    const unitSelect = form.querySelector('#itemPrimaryUnit');
    if (unitSelect) {
        console.log('Setting primary unit to:', item.primary_unit_id);
        unitSelect.value = item.primary_unit_id;
        
        // در حالت ویرایش، فیلد را readonly کنیم
        if (item.id) {
            // ایجاد یک فیلد مخفی برای ارسال مقدار
            const hiddenInput = document.createElement('input');
            hiddenInput.type = 'hidden';
            hiddenInput.name = 'primary_unit_id';
            hiddenInput.value = item.primary_unit_id;
            unitSelect.parentNode.appendChild(hiddenInput);
            
            // نمایش متن به جای select
            const readonlyText = document.createElement('div');
            readonlyText.className = 'form-control';
            readonlyText.style.backgroundColor = '#e9ecef';
            readonlyText.style.cursor = 'not-allowed';
            readonlyText.textContent = item.primary_unit_name || unitSelect.options[unitSelect.selectedIndex]?.text || '';
            
            // جایگزینی select با متن
            unitSelect.style.display = 'none';
            unitSelect.parentNode.insertBefore(readonlyText, unitSelect);
            
            // اضافه کردن نشانگر readonly
            const badge = document.createElement('span');
            badge.className = 'badge bg-warning text-dark ms-2';
            badge.textContent = 'غیرقابل تغییر';
            readonlyText.appendChild(badge);
        }
    }
    
    // ادامه پر کردن سایر فیلدها
    form.querySelector('#itemBrand').value = item.brand || '';
    form.querySelector('#itemModel').value = item.model || '';
    form.querySelector('#itemCostMethod').value = item.cost_method || 'FIFO';
    form.querySelector('#itemDescription').value = item.description || '';
    form.querySelector('#itemMinStock').value = item.min_stock_level || 0;
    form.querySelector('#itemMaxStock').value = item.max_stock_level || 0;
    form.querySelector('#itemAlertThreshold').value = item.alert_threshold || 5;
    form.querySelector('#enableLowStockAlert').checked = item.enable_low_stock_alert;
    form.querySelector('#itemTempMin').value = item.storage_temperature_min || '';
    form.querySelector('#itemTempMax').value = item.storage_temperature_max || '';
    form.querySelector('#itemStorageConditions').value = item.storage_conditions || '';
    form.querySelector('#itemUsageInstructions').value = item.usage_instructions || '';
    form.querySelector('#hasExpiry').checked = item.has_expiry;
    form.querySelector('#hasSerial').checked = item.has_serial;
    form.querySelector('#hasBatch').checked = item.has_batch;
    
    // نمایش هشدار برای دسته‌بندی و واحد در حالت ویرایش
    if (item.id) {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-warning mt-3';
        alertDiv.innerHTML = `
            <i class="fas fa-exclamation-triangle me-2"></i>
            <strong>توجه:</strong> دسته‌بندی و واحد اصلی کالا پس از ایجاد قابل تغییر نیستند.
        `;
        
        // افزودن هشدار به بالای فرم
        const formContent = form.querySelector('.tab-content');
        if (formContent) {
            formContent.parentNode.insertBefore(alertDiv, formContent);
        } else {
            form.insertBefore(alertDiv, form.firstChild);
        }
    }
    
    // تغییر عنوان مودال
    const modalTitle = document.querySelector('#addItemModalLabel');
    if (modalTitle) {
        modalTitle.innerHTML = `<i class="fas fa-edit me-2"></i>ویرایش کالا`;
    }
    
    // تغییر رنگ هدر مودال
    const modalHeader = document.querySelector('#addItemModal .modal-header');
    if (modalHeader) {
        modalHeader.className = 'modal-header bg-primary text-white';
    }
    
    // تغییر متن دکمه ذخیره
    const saveButton = document.querySelector('#addItemModal .modal-footer .btn-success');
    if (saveButton) {
        saveButton.innerHTML = `<i class="fas fa-save me-1"></i>ذخیره تغییرات`;
    }
    
    console.log('Form filled successfully');
}

/**
 * پاک کردن فرم کالا برای افزودن کالای جدید
 */
static resetItemForm() {
    console.log('Resetting item form for new item');
    const form = document.getElementById('itemForm');
    if (!form) {
        console.error('Item form not found!');
        return;
    }
    
    // پاک کردن فرم
    form.reset();
    
    // پاک کردن شناسه کالا
    const itemIdInput = form.querySelector('#item_id');
    if (itemIdInput) itemIdInput.value = '';
    
    // تولید کد خودکار برای کالا
    const itemCodeInput = form.querySelector('#itemCode');
    if (itemCodeInput) {
        const timestamp = new Date().getTime().toString().slice(-6);
        const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const itemCode = `ITM-${timestamp}-${randomNum}`;
        itemCodeInput.value = itemCode;
    }
    
    // تولید بارکد خودکار برای کالا
    const itemBarcodeInput = form.querySelector('#itemBarcode');
    if (itemBarcodeInput) {
        const timestamp = new Date().getTime().toString().slice(-6);
        const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const barcode = `BAR-${timestamp}-${randomNum}`;
        itemBarcodeInput.value = barcode;
    }
    
    // تغییر عنوان مودال
    const modalTitle = document.querySelector('#addItemModalLabel');
    if (modalTitle) {
        modalTitle.innerHTML = `<i class="fas fa-plus me-2"></i>افزودن کالای جدید`;
    }
    
    // تغییر رنگ هدر مودال
    const modalHeader = document.querySelector('#addItemModal .modal-header');
    if (modalHeader) {
        modalHeader.className = 'modal-header bg-success text-white';
    }
    
    // تغییر متن دکمه ذخیره
    const saveButton = document.querySelector('#addItemModal .modal-footer .btn-success');
    if (saveButton) {
        saveButton.innerHTML = `<i class="fas fa-save me-1"></i>ذخیره کالا`;
    }
    
    console.log('Form reset successfully');
}


    /**
     * حذف کالا
     * @param {string} itemId - شناسه کالا
     */
    static async deleteItem(itemId) {
        try {
            // تأیید حذف
            const confirmed = await InventoryUI.confirm(
                'حذف کالا',
                'آیا از حذف این کالا اطمینان دارید؟',
                'بله، حذف شود',
                'خیر'
            );

            if (!confirmed) return;

            InventoryUI.showLoading();

            const response = await InventoryAPI.deleteItem(itemId);

            if (response.success) {
                InventoryUI.showToast(INVENTORY_CONFIG.SUCCESS_MESSAGES.DELETE_SUCCESS, 'success');

                // بروزرسانی لیست کالاها
                this.loadItems(this.currentPage);
            } else {
                InventoryUI.showToast(response.message || INVENTORY_CONFIG.ERROR_MESSAGES.DELETE_FAILED, 'error');
            }

        } catch (error) {
            console.error('Error deleting item:', error);
            InventoryUI.showToast(INVENTORY_CONFIG.ERROR_MESSAGES.DELETE_FAILED, 'error');
        } finally {
            InventoryUI.hideLoading();
        }
    }

    /**
     * باز کردن مودال ورودی سریع
     * @param {string} itemId - شناسه کالا
     */
    static async openQuickEntry(itemId) {
        try {
            InventoryUI.showLoading();

            const response = await InventoryAPI.getItem(itemId);

            if (response.success) {
                // باز کردن مودال
                const modal = new bootstrap.Modal(document.getElementById('entryModal'));
                modal.show();

                // پر کردن فیلدهای مربوط به کالا
                const form = document.getElementById('entryForm');
                if (form) {
                    form.querySelector('#entryItem').value = itemId;

                    // تنظیم واحد بر اساس واحد اصلی کالا
                    if (response.item.primary_unit_id) {
                        form.querySelector('#entryUnit').value = response.item.primary_unit_id;
                    }
                }
            } else {
                InventoryUI.showToast(response.message || INVENTORY_CONFIG.ERROR_MESSAGES.FETCH_FAILED, 'error');
            }

        } catch (error) {
            console.error('Error opening quick entry:', error);
            InventoryUI.showToast(INVENTORY_CONFIG.ERROR_MESSAGES.FETCH_FAILED, 'error');
        } finally {
            InventoryUI.hideLoading();
        }
    }

    /**
     * باز کردن مودال خروجی سریع
     * @param {string} itemId - شناسه کالا
     */
    static async openQuickExit(itemId) {
        try {
            InventoryUI.showLoading();

            const response = await InventoryAPI.getItem(itemId);

            if (response.success) {
                // باز کردن مودال
                const modal = new bootstrap.Modal(document.getElementById('exitModal'));
                modal.show();

                // پر کردن فیلدهای مربوط به کالا
                const form = document.getElementById('exitForm');
                if (form) {
                    form.querySelector('#exitItem').value = itemId;

                    // تنظیم واحد بر اساس واحد اصلی کالا
                    if (response.item.primary_unit_id) {
                        form.querySelector('#exitUnit').value = response.item.primary_unit_id;
                    }
                }
            } else {
                InventoryUI.showToast(response.message || INVENTORY_CONFIG.ERROR_MESSAGES.FETCH_FAILED, 'error');
            }

        } catch (error) {
            console.error('Error opening quick exit:', error);
            InventoryUI.showToast(INVENTORY_CONFIG.ERROR_MESSAGES.FETCH_FAILED, 'error');
        } finally {
            InventoryUI.hideLoading();
        }
    }

    /**
     * بروزرسانی موجودی کالا
     * @param {string} itemId - شناسه کالا
     * @param {number} newStock - موجودی جدید
     */
    static refreshItemStock(itemId, newStock) {
        console.log(`Refreshing stock for item ${itemId} to ${newStock}`);

        // بروزرسانی کارت‌های کالا
        const itemCards = document.querySelectorAll(`.item-card[data-item-id="${itemId}"]`);
        itemCards.forEach(card => {
            // بروزرسانی موجودی
            const stockElement = card.querySelector('.text-primary');
            if (stockElement) {
                stockElement.textContent = InventoryUI.formatNumber(newStock);
            }

            // بروزرسانی وضعیت موجودی
            const minStock = parseFloat(card.dataset.minStock || 0);

            // حذف کلاس‌های قبلی
            card.classList.remove('in-stock', 'low-stock', 'out-of-stock');

            // اضافه کردن کلاس جدید
            if (newStock <= 0) {
                card.classList.add('out-of-stock');

                const badge = card.querySelector('.badge');
                if (badge) {
                    badge.className = 'badge bg-danger';
                    badge.textContent = 'ناموجود';
                }
            } else if (newStock <= minStock) {
                card.classList.add('low-stock');

                const badge = card.querySelector('.badge');
                if (badge) {
                    badge.className = 'badge bg-warning';
                    badge.textContent = 'کم موجود';
                }
            } else {
                card.classList.add('in-stock');

                const badge = card.querySelector('.badge');
                if (badge) {
                    badge.className = 'badge bg-success';
                    badge.textContent = 'موجود';
                }
            }
        });

        // بروزرسانی جدول موجودی (اگر وجود داشته باشد)
        const inventoryRow = document.querySelector(`tr[data-item-id="${itemId}"]`);
        if (inventoryRow) {
            const stockCell = inventoryRow.querySelector('.stock-quantity');
            if (stockCell) {
                stockCell.textContent = InventoryUI.formatNumber(newStock);

                // اضافه کردن کلاس انیمیشن برای نمایش تغییر
                stockCell.classList.add('stock-updated');
                setTimeout(() => {
                    stockCell.classList.remove('stock-updated');
                }, 2000);
            }
        }

        // بروزرسانی صفحه جزئیات کالا (اگر باز باشد)
        const itemDetailStock = document.querySelector(`#itemDetailStock[data-item-id="${itemId}"]`);
        if (itemDetailStock) {
            itemDetailStock.textContent = InventoryUI.formatNumber(newStock);
            itemDetailStock.classList.add('stock-updated');
            setTimeout(() => {
                itemDetailStock.classList.remove('stock-updated');
            }, 2000);
        }
    }

    /**
     * بروزرسانی تعداد کالاها
     * @param {number} count - تعداد کل کالاها
     */
    static updateItemsCount(count) {
        const countElement = document.getElementById('itemsCount');
        if (countElement) {
            countElement.textContent = InventoryUI.formatNumber(count);
        }
    }

    /**
     * تغییر تعداد آیتم‌های نمایش داده شده در هر صفحه
     * @param {number} perPage - تعداد آیتم‌ها در هر صفحه
     */
    static changeItemsPerPage(perPage) {
        this.itemsPerPage = parseInt(perPage);
        this.currentPage = 1;
        this.loadItems(1);

        // ذخیره تنظیمات در localStorage
        localStorage.setItem('inventoryItemsPerPage', perPage);
    }

    /**
     * بارگذاری لیست دسته‌بندی‌ها
     */
    static async loadCategories() {
        try {
            const response = await InventoryAPI.getCategories();

            if (response.success) {
                this.renderCategoryOptions(response.categories);
            } else {
                console.error('Error loading categories:', response.message);
            }

        } catch (error) {
            console.error('Error loading categories:', error);
        }
    }

    /**
     * رندر گزینه‌های دسته‌بندی
     * @param {Array} categories - لیست دسته‌بندی‌ها
     */
    static renderCategoryOptions(categories) {
        const selects = document.querySelectorAll('.category-select');
        selects.forEach(select => {
            const currentValue = select.value;
            select.innerHTML = '<option value="">همه دسته‌ها</option>';

            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                if (category.id == currentValue) option.selected = true;
                select.appendChild(option);
            });
        });
    }

    /**
     * بارگذاری لیست انبارها
     */
    static async loadWarehouses() {
        try {
            const response = await InventoryAPI.getWarehouses();

            if (response.success) {
                this.renderWarehouseOptions(response.warehouses);
            } else {
                console.error('Error loading warehouses:', response.message);
            }

        } catch (error) {
            console.error('Error loading warehouses:', error);
        }
    }

    /**
     * رندر گزینه‌های انبار
     * @param {Array} warehouses - لیست انبارها
     */
    static renderWarehouseOptions(warehouses) {
        const selects = document.querySelectorAll('.warehouse-select');
        selects.forEach(select => {
            const currentValue = select.value;
            select.innerHTML = '<option value="">انتخاب انبار...</option>';

            warehouses.forEach(warehouse => {
                const option = document.createElement('option');
                option.value = warehouse.id;
                option.textContent = warehouse.name;
                if (warehouse.id == currentValue) option.selected = true;
                select.appendChild(option);
            });
        });
    }

    /**
     * بارگذاری لیست واحدها
     */
    static async loadUnits() {
        try {
            const response = await InventoryAPI.getUnits();

            if (response.success) {
                this.renderUnitOptions(response.units);
            } else {
                console.error('Error loading units:', response.message);
            }

        } catch (error) {
            console.error('Error loading units:', error);
        }
    }

    /**
     * رندر گزینه‌های واحد
     * @param {Array} units - لیست واحدها
     */
    static renderUnitOptions(units) {
        const selects = document.querySelectorAll('.unit-select');
        selects.forEach(select => {
            const currentValue = select.value;
            select.innerHTML = '<option value="">انتخاب واحد...</option>';

            units.forEach(unit => {
                const option = document.createElement('option');
                option.value = unit.id;
                option.textContent = unit.name;
                if (unit.id == currentValue) option.selected = true;
                select.appendChild(option);
            });
        });
    }

/**
 * جستجوی کالاها در صفحه مدیریت کالا
 * @param {string} query - عبارت جستجو
 */
static searchItems(query) {
    console.log('Searching items with query:', query);
    
    // اطمینان از تعریف currentFilters
    if (!this.currentFilters) {
        this.currentFilters = {
            search: '',
            category: '',
            stock_status: '',
            status: ''
        };
    }
    
    // ذخیره عبارت جستجو در فیلترها
    this.currentFilters.search = query;
    
    // بازنشانی صفحه به صفحه اول
    this.currentPage = 1;
    
    // بارگذاری کالاها با فیلتر جدید
    this.loadItems(1);
    
    // به‌روزرسانی عنوان نتایج جستجو
    this.updateSearchResultsUI(query);
}


/**
 * پاک کردن جستجو
 */
static clearSearch() {
    // پاک کردن فیلدهای جستجو
    const itemSearchInput = document.getElementById('itemSearch');
    if (itemSearchInput) {
        itemSearchInput.value = '';
    }
    
    // پاک کردن فیلتر جستجو
    this.currentFilters.search = '';
    
    // بارگذاری مجدد کالاها
    this.loadItems(1);
    
    // به‌روزرسانی UI
    this.updateSearchResultsUI('');
}
/**
 * راه‌اندازی رویدادهای فیلتر
 */
static setupFilterEvents() {
    try {
        // // فیلتر دسته‌بندی
        // const categoryFilter = document.getElementById('categoryFilter');
        // if (categoryFilter) {
        //     categoryFilter.addEventListener('change', () => {
        //         this.currentFilters.category = categoryFilter.value;
        //         this.loadItems(1);
        //     });
        // }
        
        // // فیلتر موجودی
        // const stockFilter = document.getElementById('stockFilter');
        // if (stockFilter) {
        //     stockFilter.addEventListener('change', () => {
        //         this.currentFilters.stock_status = stockFilter.value;
        //         this.loadItems(1);
        //     });
        // }
        
        // // فیلتر وضعیت
        // const statusFilter = document.getElementById('statusFilter');
        // if (statusFilter) {
        //     statusFilter.addEventListener('change', () => {
        //         this.currentFilters.status = statusFilter.value;
        //         this.loadItems(1);
        //     });
        // }
        
        // // فیلد جستجوی کالا
        // const itemSearchInput = document.getElementById('itemSearch');
        // if (itemSearchInput) {
        //     // رویداد input برای جستجوی خودکار
        //     itemSearchInput.addEventListener('input', () => {
        //         const query = itemSearchInput.value.trim();
        //         if (query.length >= 2 || query.length === 0) {
        //             this.searchItems(query);
        //         }
        //     });
        // }
    } catch (error) {
        console.error('Error setting up filter events:', error);
    }
}


// /**
//  * بازنشانی فیلترها
//  */
// static resetFilters() {
//     // بازنشانی فیلترها در UI
//     const categoryFilter = document.getElementById('categoryFilter');
//     if (categoryFilter) categoryFilter.value = '';
    
//     const stockFilter = document.getElementById('stockFilter');
//     if (stockFilter) stockFilter.value = '';
    
//     const statusFilter = document.getElementById('statusFilter');
//     if (statusFilter) statusFilter.value = '';
    
//     const itemSearchInput = document.getElementById('itemSearch');
//     if (itemSearchInput) itemSearchInput.value = '';
    
//     // بازنشانی فیلترها در متغیر
//     this.currentFilters = {
//         search: '',
//         category: '',
//         stock_status: '',
//         status: ''
//     };
    
//     // بارگذاری مجدد کالاها
//     this.loadItems(1);
    
//     // به‌روزرسانی UI
//     this.updateSearchResultsUI('');
// }

/**
 * پاک کردن جستجو
 */
static clearSearch() {
    // پاک کردن فیلدهای جستجو
    const globalSearchInput = document.getElementById('globalSearch');
    if (globalSearchInput) {
        globalSearchInput.value = '';
    }
    
    const itemSearchInput = document.getElementById('itemSearch');
    if (itemSearchInput) {
        itemSearchInput.value = '';
    }
    
    // پاک کردن فیلتر جستجو
    this.currentFilters.search = '';
    
    // بارگذاری مجدد کالاها
    this.loadItems(1);
    
    // نمایش پیام
    InventoryUI.showToast('جستجو پاک شد', 'info', 2000);
}


    // /**
    //  * اعمال فیلترهای کالا
    //  */
    static applyItemFilters() {
        const filters = {};

        // فیلتر دسته‌بندی
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter && categoryFilter.value) {
            filters.category = categoryFilter.value;
        }

        // فیلتر انبار
        const warehouseFilter = document.getElementById('warehouseFilter');
        if (warehouseFilter && warehouseFilter.value) {
            filters.warehouse = warehouseFilter.value;
        }

        // فیلتر وضعیت موجودی
        const stockFilter = document.getElementById('stockFilter');
        if (stockFilter && stockFilter.value) {
            filters.stock_status = stockFilter.value;
        }

        this.currentFilters = { ...this.currentFilters, ...filters };
        this.currentPage = 1;
        this.loadItems(1);
    }

    /**
     * بارگذاری صفحه کالاها
     * @param {number} page - شماره صفحه
     */
    static loadItemsPage(page) {
        this.currentPage = page;
        this.loadItems(page);
    }
}

// توابع عمومی برای دسترسی از HTML
function saveItem() {
    InventoryManager.saveItem();
}

function editItem(itemId) {
    InventoryManager.editItem(itemId);
}

function deleteItem(itemId) {
    InventoryManager.deleteItem(itemId);
}

function viewItemDetails(itemId) {
    InventoryManager.viewItemDetails(itemId);
}

function openQuickEntry(itemId) {
    InventoryManager.openQuickEntry(itemId);
}

function openQuickExit(itemId) {
    InventoryManager.openQuickExit(itemId);
}
// تابع جستجوی کالا (برای دکمه جستجو در صفحه مدیریت انبار)
function searchItems() {
    const itemSearchInput = document.getElementById('itemSearch');
    if (itemSearchInput) {
        InventoryManager.searchItems(itemSearchInput.value.trim(), false, true);
    }
}

// تابع جستجوی سریع (برای جستجوی سراسری)
function quickSearch() {
    const globalSearchInput = document.getElementById('globalSearch');
    if (globalSearchInput) {
        InventoryManager.searchItems(globalSearchInput.value.trim(), true, false);
    }
}


// تابع پاک کردن جستجو
function clearSearch() {
    InventoryManager.clearSearch();
}

/**
 * تابع전역 برای بازنشانی فیلترها
 */
// function resetFilters() {
//     InventoryManager.resetFilters();
// }
/**
 * تابع전역 برای نمایش جزئیات کالا
 * @param {string} itemId - شناسه کالا
 */
function viewItemDetails(itemId) {
    // بستن پنجره نتایج جستجو
    closeGlobalSearchResults();
    
    // نمایش جزئیات کالا
    InventoryManager.viewItemDetails(itemId);
}
// راه‌اندازی مدیریت انبار پس از بارگذاری صفحه
document.addEventListener('DOMContentLoaded', function() {
    InventoryManager.initialize();
});

/**
 * تغییر وضعیت انتخاب همه کالاها
 */
function toggleSelectAll() {
    const selectAllCheckbox = document.getElementById('selectAll');
    if (selectAllCheckbox) {
        InventoryManager.selectAllItems(selectAllCheckbox.checked);
    }
}
function updateItemCount(){
    InventoryManager.updateItemCount();
}
// توابع عمومی برای دسترسی از HTML
function changeItemsPerPage(perPage) {
    InventoryManager.changeItemsPerPage(perPage);
}

/**
 * تغییر وضعیت انتخاب یک کالا
 * @param {HTMLElement} checkbox - چک‌باکس کالا
 */
function toggleItemSelection(checkbox) {
    if (checkbox.checked) {
        InventoryManager.selectedItems.add(checkbox.value);
    } else {
        InventoryManager.selectedItems.delete(checkbox.value);
    }

    // بررسی وضعیت چک‌باکس انتخاب همه
    const selectAllCheckbox = document.getElementById('selectAll');
    if (selectAllCheckbox) {
        const allCheckboxes = document.querySelectorAll('.item-checkbox');
        const allChecked = Array.from(allCheckboxes).every(cb => cb.checked);
        selectAllCheckbox.checked = allChecked;
    }

    InventoryManager.updateBulkActionsVisibility();
}
// افزودن گوش‌دهنده برای رویداد دریافت لیست کالاها
if (window.inventoryWebSocket) {
    window.inventoryWebSocket.addEventListener('items_list_received', function(data) {
        console.log('Items list received:', data);
        
        // بروزرسانی لیست کالاها
        if (InventoryManager && typeof InventoryManager.updateItemsList === 'function') {
            InventoryManager.updateItemsList(data.items, data.pagination);
        } else {
            console.error('InventoryManager.updateItemsList is not available', InventoryManager);
        }
    });
}

/**
 * جستجوی سراسری
 */
function globalSearch() {
    const globalSearchInput = document.getElementById('globalSearch');
    if (!globalSearchInput) return;
    
    const query = globalSearchInput.value.trim();
    const globalSearchResults = document.getElementById('globalSearchResults');
    const globalSearchResultsContent = document.getElementById('globalSearchResultsContent');
    
    if (!globalSearchResults || !globalSearchResultsContent) return;
    
    if (query.length < 2) {
        globalSearchResults.style.display = 'none';
        return;
    }
    
    // نمایش لودینگ
    globalSearchResults.style.display = 'block';
    globalSearchResultsContent.innerHTML = `
        <div class="text-center py-3">
            <div class="spinner-border spinner-border-sm text-primary" role="status">
                <span class="visually-hidden">در حال جستجو...</span>
            </div>
            <p class="mt-2 mb-0">در حال جستجو...</p>
        </div>
    `;
    
    // ارسال درخواست جستجو
    const params = new URLSearchParams();
    params.append('search', query);
    params.append('per_page', 5); // فقط 5 نتیجه اول
    
    fetch(`/inventory/api/items/?${params.toString()}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayGlobalSearchResults(data.items, query, data.pagination.total_items);
            } else {
                globalSearchResultsContent.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-circle me-2"></i>
                        خطا در جستجو: ${data.message || 'خطای نامشخص'}
                    </div>
                `;
            }
        })
        .catch(error => {
            globalSearchResultsContent.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-circle me-2"></i>
                    خطا در جستجو
                </div>
            `;
            console.error('Error in global search:', error);
        });
}


/**
 * نمایش نتایج جستجوی سراسری
 * @param {Array} items - لیست کالاها
 * @param {string} query - عبارت جستجو
 * @param {number} totalItems - تعداد کل نتایج
 */
function displayGlobalSearchResults(items, query, totalItems) {
    const globalSearchResultsContent = document.getElementById('globalSearchResultsContent');
    if (!globalSearchResultsContent) return;
    
    if (!items || items.length === 0) {
        globalSearchResultsContent.innerHTML = `
            <div class="alert alert-info">
                <i class="fas fa-info-circle me-2"></i>
                هیچ نتیجه‌ای برای "${query}" یافت نشد
            </div>
        `;
        return;
    }
    
    // ساخت لیست نتایج
    let html = '<div class="list-group">';
    
    items.forEach(item => {
        html += `
            <a href="javascript:void(0)" onclick="viewItemDetails('${item.id}')" class="list-group-item list-group-item-action">
                <div class="d-flex w-100 justify-content-between">
                    <h6 class="mb-1">${item.name}</h6>
                    <small>${item.category_name || 'بدون دسته‌بندی'}</small>
                </div>
                <p class="mb-1">کد: ${item.code}</p>
                <div class="d-flex justify-content-between align-items-center">
                    <small>موجودی: ${formatNumber(item.current_stock)} ${item.primary_unit_name || ''}</small>
                    <span class="badge ${item.current_stock <= 0 ? 'bg-danger' : (item.current_stock <= item.alert_threshold ? 'bg-warning' : 'bg-success')}">
                        ${item.current_stock <= 0 ? 'ناموجود' : (item.current_stock <= item.alert_threshold ? 'کم موجود' : 'موجود')}
                    </span>
                </div>
            </a>
        `;
    });
    
    // اضافه کردن لینک "مشاهده همه نتایج"
    if (totalItems > items.length) {
        html += `
            <a href="/inventory/items/?search=${encodeURIComponent(query)}" class="list-group-item list-group-item-action text-center text-primary">
                <i class="fas fa-search me-1"></i>
                مشاهده همه ${totalItems} نتیجه
            </a>
        `;
    }
    
    html += '</div>';
    
    globalSearchResultsContent.innerHTML = html;
}

/**
 * بستن پنجره نتایج جستجوی سراسری
 */
function closeGlobalSearchResults() {
    const globalSearchResults = document.getElementById('globalSearchResults');
    if (globalSearchResults) {
        globalSearchResults.style.display = 'none';
    }
}

/**
 * فرمت کردن اعداد
 * @param {number|string} value - مقدار عددی
 * @returns {string} - عدد فرمت شده
 */
function formatNumber(value) {
    if (value === undefined || value === null) return '0';
    
    try {
        return parseFloat(value).toLocaleString();
    } catch (e) {
        console.error('Error formatting number:', e);
        return '0';
    }
}

// اضافه کردن رویداد کلیک به document برای بستن نتایج جستجو
document.addEventListener('click', function(event) {
    const globalSearchInput = document.getElementById('globalSearch');
    const globalSearchResults = document.getElementById('globalSearchResults');
    
    if (globalSearchInput && globalSearchResults) {
        if (!globalSearchInput.contains(event.target) && !globalSearchResults.contains(event.target)) {
            closeGlobalSearchResults();
        }
    }
});