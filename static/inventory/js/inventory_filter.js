/**
 * کلاس مدیریت فیلتر و جستجوی کالاها
 */
class InventoryFilter {
    /**
     * مقداردهی اولیه
     */
    static initialize() {
        // تنظیم رویدادها
        this.setupEventListeners();
        
        // بارگذاری اولیه کالاها
        this.loadItems(1);
        
        console.log('InventoryFilter initialized');
    }
    
    /**
     * تنظیم رویدادهای مربوط به فیلترها و جستجو
     */
    static setupEventListeners() {
        // فیلد جستجوی کالا
        const itemSearchInput = document.getElementById('itemSearch');
        if (itemSearchInput) {
            // رویداد input برای جستجوی خودکار
            itemSearchInput.addEventListener('input', () => {
                const query = itemSearchInput.value.trim();
                if (query.length >= 2 || query.length === 0) {
                    this.searchItems(query);
                }
            });
            
            // رویداد کلید Enter
            itemSearchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.searchItems(itemSearchInput.value.trim());
                }
            });
        }
        
        // دکمه جستجو
        const searchButton = document.querySelector('button[onclick="searchItems()"]');
        if (searchButton) {
            searchButton.onclick = (e) => {
                e.preventDefault();
                this.searchItems(itemSearchInput?.value.trim() || '');
            };
        }
        
        // دکمه پاک کردن جستجو
        const clearSearchButton = document.getElementById('clearSearch');
        if (clearSearchButton) {
            clearSearchButton.onclick = (e) => {
                e.preventDefault();
                this.clearSearch();
            };
        }
        
        // فیلتر دسته‌بندی
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => {
                this.applyFilters();
            });
        }
        
        // فیلتر موجودی
        const stockFilter = document.getElementById('stockFilter');
        if (stockFilter) {
            stockFilter.addEventListener('change', () => {
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
        
        // دکمه پاک کردن فیلترها
        const resetFiltersButton = document.querySelector('button[onclick="resetFilters()"]');
        if (resetFiltersButton) {
            resetFiltersButton.onclick = (e) => {
                e.preventDefault();
                this.resetFilters();
            };
        }
    }
    
    /**
     * جستجوی کالاها
     * @param {string} query - عبارت جستجو
     */
    static searchItems(query) {
        console.log('Searching items with query:', query);
        
        // به‌روزرسانی فیلد جستجو
        const itemSearchInput = document.getElementById('itemSearch');
        if (itemSearchInput && itemSearchInput.value !== query) {
            itemSearchInput.value = query;
        }
        
        // اعمال فیلترها و جستجو
        this.applyFilters();
    }
    
    /**
     * اعمال فیلترها و بارگذاری کالاها
     */
    static applyFilters() {
        // دریافت مقادیر فیلترها
        const searchQuery = document.getElementById('itemSearch')?.value.trim() || '';
        const categoryId = document.getElementById('categoryFilter')?.value || '';
        const stockStatus = document.getElementById('stockFilter')?.value || '';
        const status = document.getElementById('statusFilter')?.value || '';
        
        // به‌روزرسانی UI نتایج جستجو
        this.updateSearchResultsUI(searchQuery);
        
        // بارگذاری کالاها با فیلترهای جدید
        this.loadItems(1, searchQuery, categoryId, stockStatus, status);
    }
    
    /**
     * بارگذاری کالاها
     * @param {number} page - شماره صفحه
     * @param {string} searchQuery - عبارت جستجو
     * @param {string} categoryId - شناسه دسته‌بندی
     * @param {string} stockStatus - وضعیت موجودی
     * @param {string} status - وضعیت کالا
     */
    static async loadItems(page = 1, searchQuery = '', categoryId = '', stockStatus = '', status = '') {
        try {
            console.log('Loading items with filters:', { page, searchQuery, categoryId, stockStatus, status });
            
            // نمایش لودینگ
            this.showLoading();
            
            // ساخت پارامترهای URL
            const params = new URLSearchParams();
            params.append('page', page);
            params.append('per_page', 10); // تعداد آیتم در هر صفحه
            
            // اضافه کردن فیلترها
            if (searchQuery) {
                params.append('search', searchQuery);
            }
            
            if (categoryId) {
                params.append('category', categoryId);
            }
            
            if (stockStatus) {
                params.append(stockStatus, '1');
            }
            
            if (status) {
                params.append('status', status);
            }
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
            } else {
                console.error('Error loading items:', data.message);
                this.showError('خطا در بارگذاری کالاها: ' + (data.message || 'خطای نامشخص'));
            }
        } catch (error) {
            console.error('Error loading items:', error);
            this.showError('خطا در بارگذاری کالاها');
        } finally {
            // مخفی کردن لودینگ
            this.hideLoading();
        }
    }
    
    /**
     * نمایش کالاها در جدول
     * @param {Array} items - لیست کالاها
     */
    static renderItems(items) {
        const tableBody = document.getElementById('itemsTableBody');
        if (!tableBody) return;
        
        if (!items || items.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center py-4">
                        <div class="alert alert-info mb-0">
                            <i class="fas fa-info-circle me-2"></i>
                            هیچ کالایی یافت نشد
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        // ساخت ردیف‌های جدول
        let html = '';
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

            html += `
                <tr data-item-id="${item.id}">
                    <td>
                        <input type="checkbox" class="item-checkbox" value="${item.id}" onchange="toggleItemSelection(this)">
                    </td>
                    <td>
                        <img src="${item.image_url || '/static/inventory/img/no-image.png'}" alt="${item.name}" class="item-thumbnail" width="40">
                    </td>
                    <td>${item.name || ''}</td>
                    <td>${item.code || ''}</td>
                    <td>${category}</td>
                    <td class="stock-quantity">${this.formatNumber(item.current_stock || 0)}</td>
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
        
        tableBody.innerHTML = html;
        
        // اضافه کردن رویدادهای حذف
        document.querySelectorAll('.delete-item-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const itemId = this.getAttribute('data-item-id');
                if (typeof deleteItem === 'function') {
                    deleteItem(itemId);
                } else if (typeof InventoryManager !== 'undefined' && typeof InventoryManager.deleteItem === 'function') {
                    InventoryManager.deleteItem(itemId);
                }
            });
        });
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
                <a class="page-link" href="javascript:void(0)" onclick="InventoryFilter.loadPage(${pagination.current_page - 1})" aria-label="قبلی">
                    <span aria-hidden="true">«</span>
                </a>
            </li>
        `;
        
        // صفحات
        for (let i = 1; i <= pagination.total_pages; i++) {
            html += `
                <li class="page-item ${i === pagination.current_page ? 'active' : ''}">
                    <a class="page-link" href="javascript:void(0)" onclick="InventoryFilter.loadPage(${i})">${i}</a>
                </li>
            `;
        }
        
        // دکمه بعدی
        html += `
            <li class="page-item ${pagination.has_next ? '' : 'disabled'}">
                <a class="page-link" href="javascript:void(0)" onclick="InventoryFilter.loadPage(${pagination.current_page + 1})" aria-label="بعدی">
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
        // دریافت مقادیر فیلترها
        const searchQuery = document.getElementById('itemSearch')?.value.trim() || '';
        const categoryId = document.getElementById('categoryFilter')?.value || '';
        const stockStatus = document.getElementById('stockFilter')?.value || '';
        const status = document.getElementById('statusFilter')?.value || '';
        
        // بارگذاری کالاها با فیلترهای فعلی
        this.loadItems(page, searchQuery, categoryId, stockStatus, status);
    }
    
    /**
     * به‌روزرسانی نمایش تعداد کالاها
     * @param {number} count - تعداد کل کالاها
     */
    static updateItemCount(count) {
        const itemCountElement = document.getElementById('itemCount');
        if (itemCountElement) {
            itemCountElement.textContent = this.formatNumber(count);
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
        const itemSearchInput = document.getElementById('itemSearch');
        if (itemSearchInput) {
            itemSearchInput.value = '';
        }
        
        // به‌روزرسانی UI نتایج جستجو
        this.updateSearchResultsUI('');
        
        // بارگذاری مجدد کالاها
        this.applyFilters();
    }
    
    /**
     * بازنشانی فیلترها
     */
    static resetFilters() {
        // بازنشانی فیلترها در UI
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) categoryFilter.value = '';
        
        const stockFilter = document.getElementById('stockFilter');
        if (stockFilter) stockFilter.value = '';
        
        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) statusFilter.value = '';
        
        const itemSearchInput = document.getElementById('itemSearch');
        if (itemSearchInput) itemSearchInput.value = '';
        
        // به‌روزرسانی UI نتایج جستجو
        this.updateSearchResultsUI('');
        
        // بارگذاری مجدد کالاها
        this.loadItems(1);
    }
    
    /**
     * نمایش لودینگ
     */
    static showLoading() {
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'block';
        } else {
            // ایجاد نشانگر لودینگ اگر وجود نداشت
            const container = document.querySelector('.table-responsive');
            if (container) {
                const loadingDiv = document.createElement('div');
                loadingDiv.id = 'loadingIndicator';
                loadingDiv.className = 'text-center py-3';
                loadingDiv.innerHTML = `
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">در حال بارگذاری...</span>
                    </div>
                    <p class="mt-2">در حال بارگذاری...</p>
                `;
                container.prepend(loadingDiv);
            }
        }
    }
    
    /**
     * مخفی کردن لودینگ
     */
    static hideLoading() {
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
    }
    
    /**
     * نمایش خطا
     * @param {string} message - پیام خطا
     */
    static showError(message) {
        // اگر تابع نمایش خطا در InventoryUI وجود داشت، از آن استفاده کن
        if (typeof InventoryUI !== 'undefined' && typeof InventoryUI.showToast === 'function') {
            InventoryUI.showToast(message, 'error');
        } else {
            // در غیر این صورت، از alert استفاده کن
            console.error(message);
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
}

// راه‌اندازی فیلتر کالاها پس از بارگذاری صفحه
document.addEventListener('DOMContentLoaded', function() {
    InventoryFilter.initialize();
});

// تعریف توابع전역 برای استفاده در HTML
function searchItems() {
    const itemSearchInput = document.getElementById('itemSearch');
    InventoryFilter.searchItems(itemSearchInput?.value.trim() || '');
}

function clearSearch() {
    InventoryFilter.clearSearch();
}

function resetFilters() {
    InventoryFilter.resetFilters();
}
