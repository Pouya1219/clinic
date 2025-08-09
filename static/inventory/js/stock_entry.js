class StockEntryManager {
    constructor() {
        this.apiUrl = '/inventory/api/stock-entries/';
        this.currentEntryId = null;
        this.entries = [];
        this.filters = {
            search: '',
            warehouse: '',
            start_date: '',
            end_date: ''
        };
        this.pagination = {
            current_page: 1,
            per_page: 20,
            total: 0
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        // PersianCalendar.initialize('.persian-date'); // این خط
        this.loadEntries();
        this.setDefaultValues();

        if (typeof PersianCalendar !== 'undefined' && PersianCalendar.initialize) {
            PersianCalendar.initialize();
        } else {
            console.warn('PersianCalendar یافت نشد یا متد initialize ندارد');
        }
    }

    setupEventListeners() {
        // جستجو
        const searchInput = document.getElementById('entrySearch');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.filters.search = e.target.value;
                    this.pagination.current_page = 1;
                    this.loadEntries();
                }, 500);
            });
        }

        // فیلترها
        const warehouseFilter = document.getElementById('warehouseFilter');
        if (warehouseFilter) {
            warehouseFilter.addEventListener('change', (e) => {
                this.filters.warehouse = e.target.value;
                this.pagination.current_page = 1;
                this.loadEntries();
            });
        }

        const dateFromFilter = document.getElementById('dateFromFilter');
        if (dateFromFilter) {
            dateFromFilter.addEventListener('change', (e) => {
                this.filters.start_date = e.target.value;
                this.pagination.current_page = 1;
                this.loadEntries();
            });
        }

        const dateToFilter = document.getElementById('dateToFilter');
        if (dateToFilter) {
            dateToFilter.addEventListener('change', (e) => {
                this.filters.end_date = e.target.value;
                this.pagination.current_page = 1;
                this.loadEntries();
            });
        }

        // فرم ذخیره
        const form = document.getElementById('entryForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        // محاسبه قیمت کل
        const quantityInput = document.getElementById('entryQuantity');
        const unitCostInput = document.getElementById('entryUnitCost');
        
        if (quantityInput && unitCostInput) {
            [quantityInput, unitCostInput].forEach(input => {
                input.addEventListener('input', () => this.calculateTotalCost());
            });
        }

        // تغییر کالا
        const itemSelect = document.getElementById('entryItem');
        if (itemSelect) {
            itemSelect.addEventListener('change', (e) => this.handleItemChange(e.target.value));
        }
    }

    setDefaultValues() {
        // تنظیم تاریخ امروز
        const today = new Date().toISOString().split('T')[0];
        const entryDate = document.getElementById('entryDate');
        if (entryDate) {
            entryDate.value = today;
        }

        // تنظیم انبار پیش‌فرض
        const warehouseSelect = document.getElementById('entryWarehouse');
        if (warehouseSelect && warehouseSelect.options.length > 1) {
            warehouseSelect.selectedIndex = 1;
        }
    }

    async loadEntries() {
        try {
            this.showLoading();
            
            const params = new URLSearchParams({
                page: this.pagination.current_page,
                per_page: this.pagination.per_page,
                ...this.filters
            });

            const response = await fetch(`${this.apiUrl}?${params}`);
            const data = await response.json();

            if (data.success) {
                this.entries = data.entries;
                this.pagination = data.pagination;
                this.renderEntries();
                this.renderPagination();
            } else {
                this.showToast(data.message, 'error');
            }
        } catch (error) {
            this.showToast('خطا در بارگذاری ورودی‌ها', 'error');
            console.error('Error loading entries:', error);
        } finally {
            this.hideLoading();
        }
    }

    renderEntries() {
        const tbody = document.getElementById('entriesTableBody');
        if (!tbody) return;

        if (this.entries.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center text-muted py-4">
                        <i class="fas fa-inbox fa-2x mb-2"></i>
                        <p class="mb-0">هیچ ورودی یافت نشد</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.entries.map(entry => `
            <tr>
                <td>
                    <span class="badge bg-primary">${entry.entry_number}</span>
                </td>
                <td>
                    <div class="d-flex align-items-center">
                        <i class="fas fa-box text-warning me-2"></i>
                        <span>${entry.item_name}</span>
                    </div>
                </td>
                <td>
                    <div class="d-flex align-items-center">
                        <i class="fas fa-warehouse text-info me-2"></i>
                        <span>${entry.warehouse_name}</span>
                    </div>
                </td>
                <td>
                    <span class="fw-bold">${this.formatNumber(entry.quantity)}</span>
                    <small class="text-muted d-block">${entry.unit_name}</small>
                </td>
                <td>
                    <span class="text-success fw-bold">${this.formatCurrency(entry.unit_cost)}</span>
                </td>
                <td>
                    <span class="text-primary fw-bold">${this.formatCurrency(entry.total_cost)}</span>
                </td>
                <td>
                    <span class="text-muted">${this.formatDate(entry.entry_date)}</span>
                </td>
                <td>
                    <span class="badge bg-success">تایید شده</span>
                </td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" onclick="stockEntryManager.viewEntry('${entry.id}')" title="مشاهده">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-outline-warning" onclick="stockEntryManager.editEntry('${entry.id}')" title="ویرایش">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-outline-danger" onclick="stockEntryManager.deleteEntry('${entry.id}')" title="حذف">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    renderPagination() {
        const pagination = document.getElementById('entryPagination');
        if (!pagination) return;

        const { current_page, total_pages, has_previous, has_next } = this.pagination;

        let paginationHTML = '';

        // دکمه قبلی
        paginationHTML += `
            <li class="page-item ${!has_previous ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="stockEntryManager.goToPage(${current_page - 1})">
                    <i class="fas fa-chevron-right"></i>
                </a>
            </li>
        `;

        // شماره صفحات
        const startPage = Math.max(1, current_page - 2);
        const endPage = Math.min(total_pages, current_page + 2);

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <li class="page-item ${i === current_page ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="stockEntryManager.goToPage(${i})">${i}</a>
                </li>
            `;
        }

        // دکمه بعدی
        paginationHTML += `
            <li class="page-item ${!has_next ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="stockEntryManager.goToPage(${current_page + 1})">
                    <i class="fas fa-chevron-left"></i>
                </a>
            </li>
        `;

        pagination.innerHTML = paginationHTML;
    }

    goToPage(page) {
        if (page < 1 || page > this.pagination.total_pages) return;
        this.pagination.current_page = page;
        this.loadEntries();
    }

    openEntryModal(entryId = null) {
        this.currentEntryId = entryId;
        
        const modal = document.getElementById('entryModal');
        const modalTitle = modal.querySelector('.modal-title');
        const form = document.getElementById('entryForm');
        
        if (entryId) {
            modalTitle.innerHTML = '<i class="fas fa-edit me-2"></i>ویرایش ورودی';
            this.loadEntryData(entryId);
        } else {
            modalTitle.innerHTML = '<i class="fas fa-plus me-2"></i>ثبت ورودی جدید';
            form.reset();
            this.setDefaultValues();
        }
        
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    }

    async loadEntryData(entryId) {
        try {
            this.showLoading();
            
            const response = await fetch(`${this.apiUrl}${entryId}/`);
            const data = await response.json();

            if (data.success) {
                const entry = data.entry;
                
                // پر کردن فرم
                document.getElementById('entry_id').value = entry.id;
                document.getElementById('entryDate').value = entry.entry_date;
                document.getElementById('entryWarehouse').value = entry.warehouse_id;
                document.getElementById('entryItem').value = entry.item_id;
                document.getElementById('entryQuantity').value = entry.quantity;
                document.getElementById('entryUnit').value = entry.unit_id;
                document.getElementById('entryUnitCost').value = entry.unit_cost;
                document.getElementById('entryTotalCost').value = entry.total_cost;
                document.getElementById('entrySupplier').value = entry.supplier || '';
                document.getElementById('entryInvoiceNumber').value = entry.invoice_number || '';
                document.getElementById('entryBatchNumber').value = entry.batch_number || '';
                document.getElementById('entryExpiryDate').value = entry.expiry_date || '';
                document.getElementById('entryDescription').value = entry.description || '';
                
                // نمایش فیلد تاریخ انقضا در صورت نیاز
                if (entry.expiry_date) {
                    document.getElementById('expiryDateGroup').style.display = 'block';
                }
                
            } else {
                this.showToast(data.message, 'error');
            }
        } catch (error) {
            this.showToast('خطا در بارگذاری اطلاعات ورودی', 'error');
            console.error('Error loading entry data:', error);
        } finally {
            this.hideLoading();
        }
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // حذف فیلدهای خالی
        Object.keys(data).forEach(key => {
            if (data[key] === '') {
                delete data[key];
            }
        });

        try {
            this.showLoading();
            
            const url = this.currentEntryId 
                ? `${this.apiUrl}${this.currentEntryId}/`
                : this.apiUrl;
                
            const method = this.currentEntryId ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCsrfToken()
                },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showToast(result.message, 'success');
                this.closeModal();
                this.loadEntries();
            } else {
                this.showToast(result.message, 'error');
            }
        } catch (error) {
            this.showToast('خطا در ذخیره ورودی', 'error');
            console.error('Error saving entry:', error);
        } finally {
            this.hideLoading();
        }
    }

    async deleteEntry(entryId) {
        if (!confirm('آیا از حذف این ورودی اطمینان دارید؟')) {
            return;
        }

        try {
            this.showLoading();
            
            const response = await fetch(`${this.apiUrl}${entryId}/`, {
                method: 'DELETE',
                headers: {
                    'X-CSRFToken': this.getCsrfToken()
                }
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showToast(result.message, 'success');
                this.loadEntries();
            } else {
                this.showToast(result.message, 'error');
            }
        } catch (error) {
            this.showToast('خطا در حذف ورودی', 'error');
            console.error('Error deleting entry:', error);
        } finally {
            this.hideLoading();
        }
    }

    viewEntry(entryId) {
        // نمایش جزئیات ورودی در مودال
        this.showEntryDetails(entryId);
    }

    editEntry(entryId) {
        this.openEntryModal(entryId);
    }

    async showEntryDetails(entryId) {
        try {
            const response = await fetch(`${this.apiUrl}${entryId}/`);
            const data = await response.json();

            if (data.success) {
                const entry = data.entry;
                this.showDetailsModal(entry);
            } else {
                this.showToast(data.message, 'error');
            }
        } catch (error) {
            this.showToast('خطا در بارگذاری جزئیات', 'error');
        }
    }

    showDetailsModal(entry) {
        const modalHTML = `
            <div class="modal fade" id="entryDetailsModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-info text-white">
                            <h5 class="modal-title">
                                <i class="fas fa-info-circle me-2"></i>
                                جزئیات ورودی
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row g-3">
                                <div class="col-md-6">
                                    <strong>شماره ورودی:</strong>
                                    <span class="badge bg-primary ms-2">${entry.entry_number}</span>
                                </div>
                                <div class="col-md-6">
                                    <strong>تاریخ ورود:</strong>
                                    <span class="ms-2">${this.formatDate(entry.entry_date)}</span>
                                </div>
                                <div class="col-md-6">
                                    <strong>کالا:</strong>
                                    <span class="ms-2">${entry.item_name}</span>
                                </div>
                                <div class="col-md-6">
                                    <strong>انبار:</strong>
                                    <span class="ms-2">${entry.warehouse_name}</span>
                                </div>
                                <div class="col-md-6">
                                    <strong>مقدار:</strong>
                                    <span class="ms-2">${this.formatNumber(entry.quantity)} ${entry.unit_name}</span>
                                </div>
                                <div class="col-md-6">
                                    <strong>قیمت واحد:</strong>
                                    <span class="ms-2 text-success">${this.formatCurrency(entry.unit_cost)}</span>
                                </div>
                                <div class="col-md-6">
                                    <strong>ارزش کل:</strong>
                                    <span class="ms-2 text-primary">${this.formatCurrency(entry.total_cost)}</span>
                                </div>
                                <div class="col-md-6">
                                    <strong>تامین‌کننده:</strong>
                                    <span class="ms-2">${entry.supplier || '-'}</span>
                                </div>
                                <div class="col-md-6">
                                    <strong>شماره فاکتور:</strong>
                                    <span class="ms-2">${entry.invoice_number || '-'}</span>
                                </div>
                                <div class="col-md-6">
                                    <strong>شماره بچ:</strong>
                                    <span class="ms-2">${entry.batch_number || '-'}</span>
                                </div>
                                <div class="col-md-6">
                                    <strong>تاریخ انقضا:</strong>
                                    <span class="ms-2">${entry.expiry_date ? this.formatDate(entry.expiry_date) : '-'}</span>
                                </div>
                                <div class="col-12">
                                    <strong>توضیحات:</strong>
                                    <p class="mt-2 p-2 bg-light rounded">${entry.description || 'بدون توضیحات'}</p>
                                </div>
                                <div class="col-md-6">
                                    <strong>ایجاد شده توسط:</strong>
                                    <span class="ms-2">${entry.created_by || '-'}</span>
                                </div>
                                <div class="col-md-6">
                                    <strong>تاریخ ایجاد:</strong>
                                    <span class="ms-2">${this.formatDateTime(entry.created_at)}</span>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">بستن</button>
                            <button type="button" class="btn btn-warning" onclick="stockEntryManager.editEntry('${entry.id}')" data-bs-dismiss="modal">
                                <i class="fas fa-edit me-1"></i>
                                ویرایش
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // حذف مودال قبلی در صورت وجود
        const existingModal = document.getElementById('entryDetailsModal');
        if (existingModal) {
            existingModal.remove();
        }

        // اضافه کردن مودال جدید
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        const modal = new bootstrap.Modal(document.getElementById('entryDetailsModal'));
        modal.show();

        // حذف مودال بعد از بسته شدن
        document.getElementById('entryDetailsModal').addEventListener('hidden.bs.modal', function() {
            this.remove();
        });
    }

    async handleItemChange(itemId) {
        if (!itemId) return;

        try {
            const response = await fetch(`/inventory/api/items/${itemId}/`);
            const data = await response.json();

            if (data.success) {
                const item = data.item;
                
                // تنظیم واحد اصلی
                if (item.primary_unit_id) {
                    document.getElementById('entryUnit').value = item.primary_unit_id;
                }
                
                // نمایش یا مخفی کردن فیلد تاریخ انقضا
                const expiryGroup = document.getElementById('expiryDateGroup');
                if (item.has_expiry) {
                    expiryGroup.style.display = 'block';
                    // تنظیم تاریخ انقضا پیش‌فرض (1 سال بعد)
                    const oneYearLater = new Date();
                    oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
                    document.getElementById('entryExpiryDate').value = oneYearLater.toISOString().split('T')[0];
                } else {
                    expiryGroup.style.display = 'none';
                    document.getElementById('entryExpiryDate').value = '';
                }
            }
        } catch (error) {
            console.error('Error loading item details:', error);
        }
    }

    calculateTotalCost() {
        const quantity = parseFloat(document.getElementById('entryQuantity').value) || 0;
        const unitCost = parseFloat(document.getElementById('entryUnitCost').value) || 0;
        const totalCost = quantity * unitCost;
        document.getElementById('entryTotalCost').value = totalCost;
    }

    resetFilters() {
        this.filters = {
            search: '',
            warehouse: '',
            start_date: '',
            end_date: ''
        };
        
        document.getElementById('entrySearch').value = '';
        document.getElementById('warehouseFilter').value = '';
        document.getElementById('dateFromFilter').value = '';
        document.getElementById('dateToFilter').value = '';
        
        this.pagination.current_page = 1;
        this.loadEntries();
    }

    closeModal() {
        const modal = bootstrap.Modal.getInstance(document.getElementById('entryModal'));
        if (modal) {
            modal.hide();
        }
    }

    // Helper Methods
    formatNumber(number) {
        return new Intl.NumberFormat('fa-IR').format(number);
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('fa-IR').format(amount) + ' ریال';
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('fa-IR');
    }

    formatDateTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('fa-IR') + ' ' + date.toLocaleTimeString('fa-IR');
    }

    showLoading() {
        const tbody = document.getElementById('entriesTableBody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center py-4">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">در حال بارگذاری...</span>
                        </div>
                        <p class="mt-2 text-muted">در حال بارگذاری...</p>
                    </td>
                </tr>
            `;
        }
    }

    hideLoading() {
        // Loading خودکار با renderEntries پاک می‌شود
    }

    showToast(message, type = 'info') {
        const bgClass = type === 'success' ? 'bg-success' : 
                       type === 'error' ? 'bg-danger' : 
                       type === 'warning' ? 'bg-warning' : 'bg-info';
        
        const icon = type === 'success' ? 'fa-check-circle' : 
                    type === 'error' ? 'fa-exclamation-circle' : 
                    type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle';
        
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white ${bgClass} border-0`;
        toast.style.cssText = 'position: fixed; top: 20px; left: 20px; z-index: 9999;';
        toast.setAttribute('role', 'alert');
        
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    <i class="fas ${icon} me-2"></i>
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        const bsToast = new bootstrap.Toast(toast, {
            autohide: true,
            delay: 3000
        });
        bsToast.show();
        
        toast.addEventListener('hidden.bs.toast', function() {
            this.remove();
        });
    }

    getCsrfToken() {
        return document.querySelector('[name=csrfmiddlewaretoken]')?.value ||
               document.querySelector('meta[name=csrf-token]')?.getAttribute('content');
    }
}

// توابع Global
function openEntryModal(entryId = null) {
    if (window.stockEntryManager) {
        window.stockEntryManager.openEntryModal(entryId);
    }
}

function saveEntry() {
    const form = document.getElementById('entryForm');
    if (form) {
        form.dispatchEvent(new Event('submit'));
    }
}

function searchEntries() {
    if (window.stockEntryManager) {
        window.stockEntryManager.loadEntries();
    }
}

function resetEntryFilters() {
    if (window.stockEntryManager) {
        window.stockEntryManager.resetFilters();
    }
}

function bulkEntry() {
    alert('قابلیت ورودی گروهی به زودی اضافه خواهد شد');
}

function exportEntries() {
    alert('قابلیت خروجی Excel به زودی اضافه خواهد شد');
}

// راه‌اندازی
document.addEventListener('DOMContentLoaded', function() {
    window.stockEntryManager = new StockEntryManager();
});
