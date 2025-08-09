// static/inventory/js/inventory.js

class InventoryManager {
    constructor() {
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.currentFilters = {};
        this.selectedItems = new Set();
        this.sortBy = 'name';
        this.sortOrder = 'asc';
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadInitialData();
        this.initializeComponents();
    }

    bindEvents() {
        // Search functionality
        const searchInput = document.getElementById('itemSearch');
        if (searchInput) {
            searchInput.addEventListener('input', debounce((e) => {
                this.searchItems(e.target.value);
            }, 300));
        }

        // Filter events
        document.addEventListener('change', (e) => {
            if (e.target.matches('.filter-select')) {
                this.applyFilters();
            }
        });

        // Pagination events
        document.addEventListener('click', (e) => {
            if (e.target.matches('.page-link')) {
                e.preventDefault();
                const page = parseInt(e.target.dataset.page);
                if (page) this.loadPage(page);
            }
        });

        // Bulk actions
        document.addEventListener('change', (e) => {
            if (e.target.matches('.item-checkbox')) {
                this.handleItemSelection(e.target);
            }
            if (e.target.matches('#selectAllItems')) {
                this.handleSelectAll(e.target.checked);
            }
        });

        // Sort events
        document.addEventListener('click', (e) => {
            if (e.target.matches('.sortable-header')) {
                const field = e.target.dataset.sort;
                this.sortItems(field);
            }
        });

        // Modal events
        document.addEventListener('show.bs.modal', (e) => {
            if (e.target.id === 'itemModal') {
                this.prepareItemModal(e.relatedTarget);
            }
        });

        // Form submissions
        document.addEventListener('submit', (e) => {
            if (e.target.matches('#itemForm')) {
                e.preventDefault();
                this.handleItemSubmit(e.target);
            }
            if (e.target.matches('#entryForm')) {
                e.preventDefault();
                this.handleEntrySubmit(e.target);
            }
            if (e.target.matches('#exitForm')) {
                e.preventDefault();
                this.handleExitSubmit(e.target);
            }
        });

        // Quick actions
        document.addEventListener('click', (e) => {
            if (e.target.matches('.quick-entry-btn')) {
                this.openQuickEntry(e.target.dataset.itemId);
            }
            if (e.target.matches('.quick-exit-btn')) {
                this.openQuickExit(e.target.dataset.itemId);
            }
        });

        // Real-time updates
        this.initializeWebSocket();
    }

    async loadInitialData() {
        try {
            showLoading();
            await Promise.all([
                this.loadItems(),
                this.loadCategories(),
                this.loadWarehouses(),
                this.loadSuppliers()
            ]);
        } catch (error) {
            console.error('Error loading initial data:', error);
            showToast('خطا در بارگذاری اطلاعات', 'error');
        } finally {
            hideLoading();
        }
    }

    async loadItems(page = 1) {
        try {
            const params = new URLSearchParams({
                page: page,
                per_page: this.itemsPerPage,
                sort_by: this.sortBy,
                sort_order: this.sortOrder,
                ...this.currentFilters
            });

            const response = await fetch(`/inventory/api/items/?${params}`);
            const data = await response.json();

            if (data.success) {
                this.renderItems(data.items);
                this.renderPagination(data.pagination);
                this.updateItemsCount(data.pagination.total);
            }
        } catch (error) {
            console.error('Error loading items:', error);
            showToast('خطا در بارگذاری کالاها', 'error');
        }
    }

    renderItems(items) {
        const container = document.getElementById('itemsContainer');
        if (!container) return;

        if (items.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-box-open fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">هیچ کالایی یافت نشد</h5>
                    <p class="text-muted">برای شروع، کالای جدید اضافه کنید</p>
                    <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#itemModal">
                        <i class="fas fa-plus me-2"></i>افزودن کالا
                    </button>
                </div>
            `;
            return;
        }

        const itemsHTML = items.map(item => this.renderItemCard(item)).join('');
        container.innerHTML = itemsHTML;
    }

    renderItemCard(item) {
        const stockStatus = this.getStockStatus(item);
        const stockBadge = this.getStockBadge(stockStatus);
        
        return `
            <div class="col-xl-3 col-lg-4 col-md-6 mb-4">
                <div class="card item-card h-100 ${stockStatus.class}" data-item-id="${item.id}">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <div class="form-check">
                            <input class="form-check-input item-checkbox" type="checkbox" value="${item.id}">
                        </div>
                        <div class="dropdown">
                            <button class="btn btn-sm btn-outline-secondary" type="button" data-bs-toggle="dropdown">
                                <i class="fas fa-ellipsis-v"></i>
                            </button>
                            <ul class="dropdown-menu">
                                <li><a class="dropdown-item" href="#" onclick="editItem(${item.id})">
                                    <i class="fas fa-edit me-2"></i>ویرایش
                                </a></li>
                                <li><a class="dropdown-item quick-entry-btn" href="#" data-item-id="${item.id}">
                                    <i class="fas fa-plus me-2 text-success"></i>ورودی سریع
                                </a></li>
                                <li><a class="dropdown-item quick-exit-btn" href="#" data-item-id="${item.id}">
                                    <i class="fas fa-minus me-2 text-warning"></i>خروجی سریع
                                </a></li>
                                <li><hr class="dropdown-divider"></li>
                                <li><a class="dropdown-item text-danger" href="#" onclick="deleteItem(${item.id})">
                                    <i class="fas fa-trash me-2"></i>حذف
                                </a></li>
                            </ul>
                        </div>
                    </div>
                    
                    <div class="card-body p-3">
                        <div class="text-center mb-3">
                            <img src="${item.image || '/static/inventory/img/no-image.png'}" 
                                 alt="${item.name}" 
                                 class="item-image rounded"
                                 style="width: 80px; height: 80px; object-fit: cover;">
                        </div>
                        
                        <h6 class="card-title text-truncate" title="${item.name}">${item.name}</h6>
                        <p class="card-text text-muted small mb-2">کد: ${item.code}</p>
                        
                        <div class="row text-center mb-3">
                            <div class="col-6">
                                <div class="border-end">
                                    <div class="h5 mb-0 text-primary">${formatNumber(item.current_stock)}</div>
                                    <small class="text-muted">${item.unit}</small>
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="h6 mb-0 text-success">${formatCurrency(item.unit_price)}</div>
                                <small class="text-muted">قیمت واحد</small>
                            </div>
                        </div>
                        
                        <div class="d-flex justify-content-between align-items-center">
                            ${stockBadge}
                            <small class="text-muted">${item.category_name || 'بدون دسته'}</small>
                        </div>
                    </div>
                    
                    <div class="card-footer bg-transparent">
                        <div class="btn-group w-100" role="group">
                            <button type="button" class="btn btn-sm btn-outline-success quick-entry-btn" data-item-id="${item.id}">
                                <i class="fas fa-plus"></i>
                            </button>
                            <button type="button" class="btn btn-sm btn-outline-warning quick-exit-btn" data-item-id="${item.id}">
                                <i class="fas fa-minus"></i>
                            </button>
                            <button type="button" class="btn btn-sm btn-outline-info" onclick="viewItemDetails(${item.id})">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getStockStatus(item) {
        if (item.current_stock <= 0) {
            return { status: 'out_of_stock', class: 'border-danger', text: 'ناموجود' };
        } else if (item.current_stock <= item.min_stock) {
            return { status: 'low_stock', class: 'border-warning', text: 'کم موجود' };
        } else {
            return { status: 'in_stock', class: 'border-success', text: 'موجود' };
        }
    }

    getStockBadge(stockStatus) {
        const badges = {
            'out_of_stock': '<span class="badge bg-danger">ناموجود</span>',
            'low_stock': '<span class="badge bg-warning">کم موجود</span>',
            'in_stock': '<span class="badge bg-success">موجود</span>'
        };
        return badges[stockStatus.status] || '';
    }

    renderPagination(pagination) {
        const container = document.getElementById('paginationContainer');
        if (!container || pagination.total_pages <= 1) {
            container.innerHTML = '';
            return;
        }

        let paginationHTML = '<nav><ul class="pagination justify-content-center">';
        
        // Previous button
        if (pagination.current_page > 1) {
            paginationHTML += `
                <li class="page-item">
                    <a class="page-link" href="#" data-page="${pagination.current_page - 1}">قبلی</a>
                </li>
            `;
        }

        // Page numbers
        const startPage = Math.max(1, pagination.current_page - 2);
        const endPage = Math.min(pagination.total_pages, pagination.current_page + 2);

        if (startPage > 1) {
            paginationHTML += '<li class="page-item"><a class="page-link" href="#" data-page="1">1</a></li>';
            if (startPage > 2) {
                paginationHTML += '<li class="page-item disabled"><span class="page-link">...</span></li>';
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <li class="page-item ${i === pagination.current_page ? 'active' : ''}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>
            `;
        }

        if (endPage < pagination.total_pages) {
            if (endPage < pagination.total_pages - 1) {
                paginationHTML += '<li class="page-item disabled"><span class="page-link">...</span></li>';
            }
            paginationHTML += `<li class="page-item"><a class="page-link" href="#" data-page="${pagination.total_pages}">${pagination.total_pages}</a></li>`;
        }

        // Next button
        if (pagination.current_page < pagination.total_pages) {
            paginationHTML += `
                <li class="page-item">
                    <a class="page-link" href="#" data-page="${pagination.current_page + 1}">بعدی</a>
                </li>
            `;
        }

        paginationHTML += '</ul></nav>';
        container.innerHTML = paginationHTML;
    }

    async searchItems(query) {
        this.currentFilters.search = query;
        this.currentPage = 1;
        await this.loadItems(1);
    }

    async applyFilters() {
        const filters = {};
        
        // Category filter
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter && categoryFilter.value) {
            filters.category = categoryFilter.value;
        }

        // Warehouse filter
        const warehouseFilter = document.getElementById('warehouseFilter');
        if (warehouseFilter && warehouseFilter.value) {
            filters.warehouse = warehouseFilter.value;
        }

        // Stock status filter
        const stockFilter = document.getElementById('stockFilter');
        if (stockFilter && stockFilter.value) {
            filters.stock_status = stockFilter.value;
        }

        this.currentFilters = { ...this.currentFilters, ...filters };
        this.currentPage = 1;
        await this.loadItems(1);
    }

    sortItems(field) {
        if (this.sortBy === field) {
            this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortBy = field;
            this.sortOrder = 'asc';
        }
        
        this.updateSortIndicators();
        this.loadItems(this.currentPage);
    }

    updateSortIndicators() {
        document.querySelectorAll('.sortable-header').forEach(header => {
            const icon = header.querySelector('.sort-icon');
            if (header.dataset.sort === this.sortBy) {
                icon.className = `fas fa-sort-${this.sortOrder === 'asc' ? 'up' : 'down'} sort-icon`;
            } else {
                icon.className = 'fas fa-sort sort-icon';
            }
        });
    }

    handleItemSelection(checkbox) {
        if (checkbox.checked) {
            this.selectedItems.add(parseInt(checkbox.value));
        } else {
            this.selectedItems.delete(parseInt(checkbox.value));
        }
        
        this.updateBulkActionsVisibility();
        this.updateSelectAllState();
    }

    handleSelectAll(checked) {
        const checkboxes = document.querySelectorAll('.item-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = checked;
            this.handleItemSelection(checkbox);
        });
    }

    updateBulkActionsVisibility() {
        const bulkActions = document.getElementById('bulkActions');
        const selectedCount = document.getElementById('selectedCount');
        
        if (bulkActions) {
            bulkActions.style.display = this.selectedItems.size > 0 ? 'block' : 'none';
        }
        
        if (selectedCount) {
            selectedCount.textContent = this.selectedItems.size;
        }
    }

    updateSelectAllState() {
        const selectAllCheckbox = document.getElementById('selectAllItems');
        const itemCheckboxes = document.querySelectorAll('.item-checkbox');
        
        if (selectAllCheckbox && itemCheckboxes.length > 0) {
            const checkedCount = document.querySelectorAll('.item-checkbox:checked').length;
            selectAllCheckbox.indeterminate = checkedCount > 0 && checkedCount < itemCheckboxes.length;
            selectAllCheckbox.checked = checkedCount === itemCheckboxes.length;
        }
    }

    async loadCategories() {
        try {
            const response = await fetch('/inventory/api/categories/');
            const data = await response.json();
            
            if (data.success) {
                this.renderCategoryOptions(data.categories);
            }
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    }

    renderCategoryOptions(categories) {
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

    async loadWarehouses() {
        try {
            const response = await fetch('/inventory/api/warehouses/');
            const data = await response.json();
            
            if (data.success) {
                this.renderWarehouseOptions(data.warehouses);
            }
        } catch (error) {
            console.error('Error loading warehouses:', error);
        }
    }

    renderWarehouseOptions(warehouses) {
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

    async handleItemSubmit(form) {
        const submitBtn = form.querySelector('button[type="submit"]');
        const spinner = submitBtn.querySelector('.spinner-border');
        
        try {
            submitBtn.disabled = true;
            if (spinner) spinner.style.display = 'inline-block';
            
            const formData = new FormData(form);
            const itemId = formData.get('item_id');
            
            const url = itemId ? `/inventory/api/items/${itemId}/` : '/inventory/api/items/';
            const method = itemId ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method: method,
                body: formData,
                headers: {
                    'X-CSRFToken': getCsrfToken()
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                showToast(itemId ? 'کالا با موفقیت ویرایش شد' : 'کالا با موفقیت اضافه شد', 'success');
                form.reset();
                
                // Close modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('itemModal'));
                if (modal) modal.hide();
                
                // Refresh items list
                await this.loadItems(this.currentPage);
            } else {
                showToast(data.message || 'خطا در ذخیره کالا', 'error');
            }
        } catch (error) {
            console.error('Error submitting item:', error);
            showToast('خطا در ارتباط با سرور', 'error');
        } finally {
            submitBtn.disabled = false;
            if (spinner) spinner.style.display = 'none';
        }
    }

    initializeWebSocket() {
        if (typeof WebSocket === 'undefined') return;
        
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws/inventory/`;
        
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleWebSocketMessage(data);
        };
        
        this.ws.onclose = () => {
            // Reconnect after 5 seconds
            setTimeout(() => {
                this.initializeWebSocket();
            }, 5000);
        };
    }

    handleWebSocketMessage(data) {
        switch (data.type) {
            case 'stock_update':
                this.updateItemStock(data.item_id, data.new_stock);
                break;
            case 'new_transaction':
                this.showTransactionNotification(data.transaction);
                break;
            case 'low_stock_alert':
                this.showLowStockAlert(data.items);
                break;
        }
    }

    updateItemStock(itemId, newStock) {
        const itemCard = document.querySelector(`[data-item-id="${itemId}"]`);
        if (itemCard) {
            const stockElement = itemCard.querySelector('.h5.text-primary');
            if (stockElement) {
                stockElement.textContent = formatNumber(newStock);
            }
        }
    }

    initializeComponents() {
        // Initialize tooltips
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });

        // Initialize popovers
        const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
        popoverTriggerList.map(function (popoverTriggerEl) {
            return new bootstrap.Popover(popoverTriggerEl);
        });
    }
}

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function formatNumber(number) {
    return new Intl.NumberFormat('fa-IR').format(number);
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('fa-IR').format(amount) + ' ریال';
}

function getCsrfToken() {
    return document.querySelector('[name=csrfmiddlewaretoken]').value;
}

function showLoading() {
    const loader = document.getElementById('loadingSpinner');
    if (loader) loader.style.display = 'block';
}

function hideLoading() {
    const loader = document.getElementById('loadingSpinner');
    if (loader) loader.style.display = 'none';
}

function showToast(message, type = 'info') {
    // Implementation depends on your toast library
    console.log(`Toast: ${message} (${type})`);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.inventoryManager = new InventoryManager();
});

// Global functions for onclick handlers
function editItem(itemId) {
    window.inventoryManager.editItem(itemId);
}

function deleteItem(itemId) {
    if (confirm('آیا از حذف این کالا اطمینان دارید؟')) {
        window.inventoryManager.deleteItem(itemId);
    }
}

function viewItemDetails(itemId) {
    window.inventoryManager.viewItemDetails(itemId);
}
function validateItemForm() {
    const form = document.getElementById('itemForm');
    if (!form) {
        console.error('Form not found');
        return false;
    }
    
    let isValid = true;
    
    // پاک کردن خطاهای قبلی
    form.querySelectorAll('.is-invalid').forEach(el => {
        el.classList.remove('is-invalid');
    });
    form.querySelectorAll('.invalid-feedback').forEach(el => {
        el.remove();
    });
    
    // اعتبارسنجی نام کالا
    const nameInput = form.querySelector('#itemName');
    if (nameInput && !nameInput.value.trim()) {
        showFieldError(nameInput, 'نام کالا الزامی است');
        isValid = false;
    } else if (!nameInput) {
        console.error('Name input not found');
        isValid = false;
    }
    
    // اعتبارسنجی کد کالا
    const codeInput = form.querySelector('#itemCode');
    if (codeInput && !codeInput.value.trim()) {
        showFieldError(codeInput, 'کد کالا الزامی است');
        isValid = false;
    } else if (!codeInput) {
        console.error('Code input not found');
        isValid = false;
    }
    
    // اعتبارسنجی دسته‌بندی
    const categoryInput = form.querySelector('#itemCategory');
    if (categoryInput && !categoryInput.value) {
        showFieldError(categoryInput, 'انتخاب دسته‌بندی الزامی است');
        isValid = false;
    } else if (!categoryInput) {
        console.error('Category input not found');
        isValid = false;
    }
    
    // اعتبارسنجی واحد اصلی
    const unitInput = form.querySelector('#itemPrimaryUnit');
    if (unitInput && !unitInput.value) {
        showFieldError(unitInput, 'انتخاب واحد اصلی الزامی است');
        isValid = false;
    } else if (!unitInput) {
        console.error('Unit input not found');
        isValid = false;
    }
    
    return isValid;
}
