/**
 * کلاس رابط کاربری برای سیستم انبارداری
 */
class InventoryUI {
    /**
     * راه‌اندازی اولیه رابط کاربری
     */
    static initialize() {
        console.log('Initializing InventoryUI...');
        
        // تنظیم رویدادها
        this.setupEventListeners();
        this.setupTooltips();
        this.setupModals();
        this.setupFormValidation();
        this.setupGlobalSearch(); // اضافه شد
        
}
    

    /**
     * تنظیم گوش‌دهنده‌های رویداد
     */
    static setupEventListeners() {
        // رویدادهای جستجو
        const searchInputs = document.querySelectorAll('.search-input');
        searchInputs.forEach(input => {
            input.addEventListener('input', this.debounce(e => {
                const searchTerm = e.target.value.trim();
                const searchTarget = e.target.dataset.searchTarget;
                
                if (searchTarget === 'items') {
                    InventoryManager.searchItems(searchTerm);
                } else if (searchTarget === 'entries') {
                    InventoryManager.searchEntries(searchTerm);
                } else if (searchTarget === 'exits') {
                    InventoryManager.searchExits(searchTerm);
                }
            }, INVENTORY_CONFIG.UI.SEARCH_DELAY));
        });

        // رویدادهای فیلتر
        const filterSelects = document.querySelectorAll('.filter-select');
        filterSelects.forEach(select => {
            select.addEventListener('change', () => {
                const filterTarget = select.dataset.filterTarget;
                
                if (filterTarget === 'items') {
                    InventoryManager.applyItemFilters();
                } else if (filterTarget === 'entries') {
                    InventoryManager.applyEntryFilters();
                } else if (filterTarget === 'exits') {
                    InventoryManager.applyExitFilters();
                }
            });
        });

        // رویدادهای دکمه‌های صفحه‌بندی
        document.addEventListener('click', e => {
            if (e.target.matches('.page-link') || e.target.closest('.page-link')) {
                e.preventDefault();
                const pageLink = e.target.matches('.page-link') ? e.target : e.target.closest('.page-link');
                const page = parseInt(pageLink.dataset.page);
                const target = pageLink.dataset.target;
                
                if (target === 'items') {
                    InventoryManager.loadItemsPage(page);
                } else if (target === 'entries') {
                    InventoryManager.loadEntriesPage(page);
                } else if (target === 'exits') {
                    InventoryManager.loadExitsPage(page);
                }
            }
        });

        // رویدادهای انتخاب همه
        const selectAllCheckboxes = document.querySelectorAll('.select-all');
        selectAllCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', e => {
                const target = e.target.dataset.target;
                const checked = e.target.checked;
                
                if (target === 'items') {
                    InventoryManager.selectAllItems(checked);
                } else if (target === 'entries') {
                    InventoryManager.selectAllEntries(checked);
                } else if (target === 'exits') {
                    InventoryManager.selectAllExits(checked);
                }
            });
        });

        // رویدادهای مرتب‌سازی
        const sortHeaders = document.querySelectorAll('.sortable-header');
        sortHeaders.forEach(header => {
            header.addEventListener('click', e => {
                const field = e.target.dataset.sort;
                const target = e.target.dataset.target;
                
                if (target === 'items') {
                    InventoryManager.sortItems(field);
                } else if (target === 'entries') {
                    InventoryManager.sortEntries(field);
                } else if (target === 'exits') {
                    InventoryManager.sortExits(field);
                }
            });
        });
    }

    /**
     * تنظیم tooltips
     */
    static setupTooltips() {
        if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
            const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
            tooltipTriggerList.map(function (tooltipTriggerEl) {
                return new bootstrap.Tooltip(tooltipTriggerEl);
            });
        }
    }

/**
 * حذف کامل مودال و backdrop
 * @param {string} modalId - شناسه مودال
 */
static cleanupModal(modalId) {
    // بستن مودال
    const modalElement = document.getElementById(modalId);
    const modal = bootstrap.Modal.getInstance(modalElement);
    if (modal) {
        modal.hide();
    }
    
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

    /**
     * تنظیم مودال‌ها
     */
    static setupModals() {
        // رویدادهای باز شدن مودال
        document.addEventListener('show.bs.modal', e => {
            if (e.target.id === 'itemModal') {
                const button = e.relatedTarget;
                const mode = button.dataset.mode || 'create';
                const itemId = button.dataset.itemId;
                
                if (mode === 'edit' && itemId) {
                    InventoryManager.loadItemForEdit(itemId);
                } else {
                    InventoryManager.resetItemForm();
                }
            } else if (e.target.id === 'entryModal') {
                const button = e.relatedTarget;
                const mode = button.dataset.mode || 'create';
                const entryId = button.dataset.entryId;
                
                if (mode === 'edit' && entryId) {
                    InventoryManager.loadEntryForEdit(entryId);
                } else {
                    InventoryManager.resetEntryForm();
                }
            } else if (e.target.id === 'exitModal') {
                const button = e.relatedTarget;
                const mode = button.dataset.mode || 'create';
                const exitId = button.dataset.exitId;
                
                if (mode === 'edit' && exitId) {
                    InventoryManager.loadExitForEdit(exitId);
                } else {
                    InventoryManager.resetExitForm();
                }
            }
        });

        // رویدادهای بسته شدن مودال
        document.addEventListener('hidden.bs.modal', e => {
            if (e.target.id === 'itemModal') {
                InventoryManager.resetItemForm();
            } else if (e.target.id === 'entryModal') {
                InventoryManager.resetEntryForm();
            } else if (e.target.id === 'exitModal') {
                InventoryManager.resetExitForm();
            }
        });
    }

    /**
     * تنظیم اعتبارسنجی فرم‌ها
     */
    static setupFormValidation() {
        // فرم کالا
        const itemForm = document.getElementById('itemForm');
        if (itemForm) {
            itemForm.addEventListener('submit', e => {
                e.preventDefault();
                if (this.validateItemForm()) {
                    InventoryManager.saveItem();
                }
            });
        }

        // فرم ورودی
        const entryForm = document.getElementById('entryForm');
        if (entryForm) {
            entryForm.addEventListener('submit', e => {
                e.preventDefault();
                if (this.validateEntryForm()) {
                    InventoryManager.saveEntry();
                }
            });
        }

        // فرم خروجی
        const exitForm = document.getElementById('exitForm');
        if (exitForm) {
            exitForm.addEventListener('submit', e => {
                e.preventDefault();
                if (this.validateExitForm()) {
                    InventoryManager.saveExit();
                }
            });
        }
    }

    /**
 * اعتبارسنجی فرم کالا
 * @returns {boolean} نتیجه اعتبارسنجی
 */
static validateItemForm() {
    const form = document.getElementById('itemForm');
    if (!form) return false;
    
    // بررسی فیلدهای اجباری
    const requiredFields = ['name', 'code', 'category_id', 'primary_unit_id'];
    let isValid = true;
    
    requiredFields.forEach(field => {
        const input = form.querySelector(`[name="${field}"]`);
        if (!input || !input.value.trim()) {
            isValid = false;
            
            // نمایش پیام خطا
            const formGroup = input ? input.closest('.mb-3') : null;
            if (formGroup) {
                const invalidFeedback = formGroup.querySelector('.invalid-feedback') || document.createElement('div');
                invalidFeedback.className = 'invalid-feedback';
                invalidFeedback.textContent = 'این فیلد الزامی است';
                
                if (!formGroup.querySelector('.invalid-feedback')) {
                    formGroup.appendChild(invalidFeedback);
                }
                
                input.classList.add('is-invalid');
            }
        } else if (input) {
            input.classList.remove('is-invalid');
            input.classList.add('is-valid');
        }
    });
    
    if (!isValid) {
        InventoryUI.showToast(INVENTORY_CONFIG.ERROR_MESSAGES.VALIDATION_FAILED, 'error');
    }
    
    return isValid;
}


    /**
     * اعتبارسنجی فرم ورودی
     * @returns {boolean} نتیجه اعتبارسنجی
     */
    static validateEntryForm() {
        const form = document.getElementById('entryForm');
        if (!form) return false;

        // پاک کردن خطاهای قبلی
        this.clearFormErrors(form);

        let isValid = true;

        // اعتبارسنجی کالا
        const itemInput = form.querySelector('#entryItem');
        if (!itemInput.value) {
            this.showFieldError(itemInput, 'انتخاب کالا الزامی است');
            isValid = false;
        }

        // اعتبارسنجی انبار
        const warehouseInput = form.querySelector('#entryWarehouse');
        if (!warehouseInput.value) {
            this.showFieldError(warehouseInput, 'انتخاب انبار الزامی است');
            isValid = false;
        }

        // اعتبارسنجی مقدار
        const quantityInput = form.querySelector('#entryQuantity');
        if (!quantityInput.value || parseFloat(quantityInput.value) <= 0) {
            this.showFieldError(quantityInput, 'مقدار باید بزرگتر از صفر باشد');
            isValid = false;
        }

        return isValid;
    }
/**
 * تنظیم جستجوی سراسری
 */
static setupGlobalSearch() {
    const globalSearch = document.getElementById('globalSearch');
    if (globalSearch) {
        globalSearch.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const query = this.value.trim();
                if (query) {
                    InventoryUI.searchGlobally(query);
                }
            }
        });
    }
}

/**
 * جستجوی سراسری
 * @param {string} query - عبارت جستجو
 */
static searchGlobally(query) {
    this.showLoading();
    
    fetch(`/inventory/api/search/advanced/?q=${encodeURIComponent(query)}`)
        .then(response => response.json())
        .then(data => {
            console.log('Search results:', data);
            this.showToast('جستجو انجام شد');
            
            // نمایش نتایج جستجو
            this.displaySearchResults(data);
        })
        .catch(error => {
            console.error('Search error:', error);
            this.showToast('خطا در جستجو', 'error');
        })
        .finally(() => {
            this.hideLoading();
        });
}

/**
 * نمایش نتایج جستجو
 * @param {Object} results - نتایج جستجو
 */
static displaySearchResults(results) {
    const resultsContainer = document.getElementById('searchResults');
    if (!resultsContainer) return;
    
    // نمایش کانتینر نتایج
    resultsContainer.style.display = 'block';
    
    // ساخت HTML نتایج
    let html = '<div class="search-results-header d-flex justify-content-between align-items-center mb-3">';
    html += `<h5>نتایج جستجو (${results.total || 0})</h5>`;
    html += '<button type="button" class="btn-close" onclick="InventoryUI.closeSearchResults()"></button>';
    html += '</div>';
    
    if (!results.items || results.items.length === 0) {
        html += '<div class="alert alert-info">هیچ نتیجه‌ای یافت نشد</div>';
    } else {
        html += '<div class="list-group">';
        results.items.forEach(item => {
            html += `
                <a href="javascript:void(0)" onclick="InventoryUI.selectSearchResult('${item.id}', '${results.query}')" class="list-group-item list-group-item-action">
                    <div class="d-flex w-100 justify-content-between">
                        <h6 class="mb-1">${item.name}</h6>
                        <small>${item.category_name || 'بدون دسته‌بندی'}</small>
                    </div>
                    <p class="mb-1">کد: ${item.code}</p>
                    <small>موجودی: ${this.formatNumber(item.current_stock)} ${item.primary_unit_name || ''}</small>
                </a>
            `;
        });
        
        // اضافه کردن لینک "مشاهده همه نتایج"
        if (results.total > results.items.length) {
            html += `
                <a href="javascript:void(0)" onclick="InventoryUI.viewAllSearchResults('${results.query}')" class="list-group-item list-group-item-action text-center text-primary">
                    <i class="fas fa-search me-1"></i>
                    مشاهده همه ${results.total} نتیجه
                </a>
            `;
        }
        
        html += '</div>';
    }
    
    resultsContainer.innerHTML = html;
}


/**
 * انتخاب یک نتیجه جستجو
 * @param {string} itemId - شناسه کالا
 * @param {string} query - عبارت جستجو
 */
static selectSearchResult(itemId, query) {
    // بستن پاپ‌آپ نتایج
    this.closeSearchResults();
    
    // نمایش جزئیات کالا
    InventoryManager.viewItemDetails(itemId);
}

/**
 * مشاهده همه نتایج جستجو
 * @param {string} query - عبارت جستجو
 */
static viewAllSearchResults(query) {
    // بستن پاپ‌آپ نتایج
    this.closeSearchResults();
    
    // هدایت به صفحه مدیریت انبار و نمایش همه نتایج
    if (window.location.pathname.includes('/inventory/items/')) {
        // اگر در صفحه مدیریت انبار هستیم، فقط جستجو را اعمال کنیم
        InventoryManager.searchItems(query, false, true);
    } else {
        // در غیر این صورت، به صفحه مدیریت انبار هدایت شویم
        window.location.href = `/inventory/items/?search=${encodeURIComponent(query)}`;
    }
}
/**
 * بستن نتایج جستجو
 */
static closeSearchResults() {
    const resultsContainer = document.getElementById('searchResults');
    if (resultsContainer) {
        resultsContainer.style.display = 'none';
    }
}

    /**
     * اعتبارسنجی فرم خروجی
     * @returns {boolean} نتیجه اعتبارسنجی
     */
    static validateExitForm() {
        const form = document.getElementById('exitForm');
        if (!form) return false;

        // پاک کردن خطاهای قبلی
        this.clearFormErrors(form);

        let isValid = true;

        // اعتبارسنجی کالا
        const itemInput = form.querySelector('#exitItem');
        if (!itemInput.value) {
            this.showFieldError(itemInput, 'انتخاب کالا الزامی است');
            isValid = false;
        }

        // اعتبارسنجی انبار
        const warehouseInput = form.querySelector('#exitWarehouse');
        if (!warehouseInput.value) {
            this.showFieldError(warehouseInput, 'انتخاب انبار الزامی است');
            isValid = false;
        }

        // اعتبارسنجی مقدار
        const quantityInput = form.querySelector('#exitQuantity');
        if (!quantityInput.value || parseFloat(quantityInput.value) <= 0) {
            this.showFieldError(quantityInput, 'مقدار باید بزرگتر از صفر باشد');
            isValid = false;
        }

        return isValid;
    }

    /**
     * پاک کردن خطاهای فرم
     * @param {HTMLElement} form - المان فرم
     */
    static clearFormErrors(form) {
        form.querySelectorAll('.is-invalid').forEach(el => {
            el.classList.remove('is-invalid');
        });
        form.querySelectorAll('.invalid-feedback').forEach(el => {
            el.remove();
        });
    }

    /**
     * نمایش خطای فیلد
     * @param {HTMLElement} field - المان فیلد
     * @param {string} message - پیام خطا
     */
    static showFieldError(field, message) {
        field.classList.add('is-invalid');
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'invalid-feedback';
        errorDiv.textContent = message;
        
        field.parentNode.appendChild(errorDiv);
    }

    /**
     * نمایش پیام toast
     * @param {string} message - پیام
     * @param {string} type - نوع پیام (success, error, warning, info)
     */
    static showToast(message, type = 'success') {
        if (typeof Swal !== 'undefined') {
            const Toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: INVENTORY_CONFIG.UI.TOAST_DURATION,
                timerProgressBar: true
            });

            Toast.fire({
                icon: type,
                title: message
            });
        } else {
            // Fallback if SweetAlert is not available
            alert(message);
        }
    }

    /**
     * نمایش دیالوگ تأیید
     * @param {string} title - عنوان
     * @param {string} text - متن
     * @param {string} confirmText - متن دکمه تأیید
     * @param {string} cancelText - متن دکمه لغو
     * @returns {Promise<boolean>} نتیجه تأیید
     */
    static async confirm(title, text, confirmText = 'بله', cancelText = 'خیر') {
        if (typeof Swal !== 'undefined') {
            const result = await Swal.fire({
                title: title,
                text: text,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: confirmText,
                cancelButtonText: cancelText
            });

            return result.isConfirmed;
        } else {
            // Fallback if SweetAlert is not available
            return window.confirm(text);
        }
    }

    /**
     * نمایش لودینگ
     */
    static showLoading() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
        }
    }

    /**
     * مخفی کردن لودینگ
     */
    static hideLoading() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
    }

    /**
     * فرمت‌کردن مبلغ به صورت پول
     * @param {number} amount - مبلغ
     * @returns {string} مبلغ فرمت‌شده
     */
    static formatCurrency(amount) {
        if (amount === undefined || amount === null) return '0 ' + INVENTORY_CONFIG.UI.CURRENCY_SYMBOL;
        return new Intl.NumberFormat('fa-IR').format(amount) + ' ' + INVENTORY_CONFIG.UI.CURRENCY_SYMBOL;
    }

    /**
     * فرمت‌کردن عدد
     * @param {number} number - عدد
     * @returns {string} عدد فرمت‌شده
     */
    static formatNumber(number) {
        if (number === undefined || number === null) return '0';
        return new Intl.NumberFormat('fa-IR').format(number);
        try {
        return parseFloat(value).toLocaleString();
    } catch (e) {
        console.error('Error formatting number:', e);
        return '0';
    }
    }

    /**
     * فرمت‌کردن تاریخ
     * @param {string} date - تاریخ
     * @returns {string} تاریخ فرمت‌شده
     */
    static formatDate(date) {
        if (!date) return '';
        return new Date(date).toLocaleDateString('fa-IR');
    }

    /**
     * تبدیل اعداد انگلیسی به فارسی
     * @param {string|number} input - ورودی
     * @returns {string} اعداد فارسی
     */
    static toPersianDigits(input) {
        const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
        return String(input).replace(/[0-9]/g, function(w) {
            return persianDigits[+w];
        });
    }

    /**
     * تبدیل اعداد فارسی به انگلیسی
     * @param {string} input - ورودی
     * @returns {string} اعداد انگلیسی
     */
    static toEnglishDigits(input) {
        return String(input).replace(/[۰-۹]/g, function(w) {
            return w.charCodeAt(0) - 1776;
        });
    }

    /**
     * تأخیر در اجرای تابع (debounce)
     * @param {Function} func - تابع
     * @param {number} wait - زمان تأخیر (میلی‌ثانیه)
     * @returns {Function} تابع با تأخیر
     */
    static debounce(func, wait = 300) {
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

    /**
     * ایجاد صفحه‌بندی
     * @param {number} currentPage - صفحه فعلی
     * @param {number} totalPages - تعداد کل صفحات
     * @param {number} totalItems - تعداد کل آیتم‌ها
     * @param {number} itemsPerPage - تعداد آیتم در هر صفحه
     * @param {string} target - هدف صفحه‌بندی (items, entries, exits)
     * @returns {string} HTML صفحه‌بندی
     */
    static generatePagination(currentPage, totalPages, totalItems, itemsPerPage, target) {
        let html = '<nav><ul class="pagination justify-content-center">';
        
        // دکمه قبلی
        if (currentPage > 1) {
            html += `
                <li class="page-item">
                    <a class="page-link" href="#" data-page="${currentPage - 1}" data-target="${target}">قبلی</a>
                </li>
            `;
        } else {
            html += `
                <li class="page-item disabled">
                    <span class="page-link">قبلی</span>
                </li>
            `;
        }

        // صفحات
        const startPage = Math.max(1, currentPage - 2);
        const endPage = Math.min(totalPages, currentPage + 2);

        if (startPage > 1) {
            html += `<li class="page-item"><a class="page-link" href="#" data-page="1" data-target="${target}">${this.toPersianDigits(1)}</a></li>`;
            if (startPage > 2) {
                html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            html += `
                <li class="page-item ${i === currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" data-page="${i}" data-target="${target}">${this.toPersianDigits(i)}</a>
                </li>
            `;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
            html += `<li class="page-item"><a class="page-link" href="#" data-page="${totalPages}" data-target="${target}">${this.toPersianDigits(totalPages)}</a></li>`;
        }

        // دکمه بعدی
        if (currentPage < totalPages) {
            html += `
                <li class="page-item">
                    <a class="page-link" href="#" data-page="${currentPage + 1}" data-target="${target}">بعدی</a>
                </li>
            `;
        } else {
            html += `
                <li class="page-item disabled">
                    <span class="page-link">بعدی</span>
                </li>
            `;
        }

        html += '</ul></nav>';

        // اطلاعات صفحه‌بندی
        const startItem = (currentPage - 1) * itemsPerPage + 1;
        const endItem = Math.min(currentPage * itemsPerPage, totalItems);
        
        html += `
            <div class="text-center text-muted small mt-2">
                نمایش ${this.toPersianDigits(startItem)} تا ${this.toPersianDigits(endItem)} از ${this.toPersianDigits(totalItems)} مورد
            </div>
        `;

        return html;
    }

    /**
     * ایجاد کارت کالا
     * @param {Object} item - اطلاعات کالا
     * @returns {string} HTML کارت کالا
     */
    static createItemCard(item) {
        // تعیین وضعیت موجودی
        let stockStatus = 'in-stock';
        let stockBadge = '<span class="badge bg-success">موجود</span>';
        
        if (item.current_stock <= 0) {
            stockStatus = 'out-of-stock';
            stockBadge = '<span class="badge bg-danger">ناموجود</span>';
        } else if (item.current_stock <= item.min_stock_level) {
            stockStatus = 'low-stock';
            stockBadge = '<span class="badge bg-warning">کم موجود</span>';
        }

        return `
            <div class="col-xl-3 col-lg-4 col-md-6 mb-4">
                <div class="card item-card h-100 ${stockStatus}" data-item-id="${item.id}">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <div class="form-check">
                            <input class="form-check-input item-checkbox" type="checkbox" value="${item.id}">
                        </div>
                        <div class="dropdown">
                            <button class="btn btn-sm btn-outline-secondary" type="button" data-bs-toggle="dropdown">
                                <i class="fas fa-ellipsis-v"></i>
                            </button>
                            <ul class="dropdown-menu">
                                <li><a class="dropdown-item" href="#" onclick="InventoryManager.editItem('${item.id}')">
                                    <i class="fas fa-edit me-2"></i>ویرایش
                                </a></li>
                                <li><a class="dropdown-item" href="#" onclick="InventoryManager.openQuickEntry('${item.id}')">
                                    <i class="fas fa-plus me-2 text-success"></i>ورودی سریع
                                </a></li>
                                <li><a class="dropdown-item" href="#" onclick="InventoryManager.openQuickExit('${item.id}')">
                                    <i class="fas fa-minus me-2 text-warning"></i>خروجی سریع
                                </a></li>
                                <li><hr class="dropdown-divider"></li>
                                <li><a class="dropdown-item text-danger" href="#" onclick="InventoryManager.deleteItem('${item.id}')">
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
                                    <div class="h5 mb-0 text-primary">${this.formatNumber(item.current_stock)}</div>
                                    <small class="text-muted">${item.unit_name || 'عدد'}</small>
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="h6 mb-0 text-success">${this.formatCurrency(item.unit_price)}</div>
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
                            <button type="button" class="btn btn-sm btn-outline-success" onclick="InventoryManager.openQuickEntry('${item.id}')">
                                <i class="fas fa-plus"></i>
                            </button>
                            <button type="button" class="btn btn-sm btn-outline-warning" onclick="InventoryManager.openQuickExit('${item.id}')">
                                <i class="fas fa-minus"></i>
                            </button>
                            <button type="button" class="btn btn-sm btn-outline-info" onclick="InventoryManager.viewItemDetails('${item.id}')">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * ایجاد ردیف ورودی
     * @param {Object} entry - اطلاعات ورودی
     * @returns {string} HTML ردیف ورودی
     */
    static createEntryRow(entry) {
        return `
            <tr data-entry-id="${entry.id}">
                <td>
                    <div class="form-check">
                        <input class="form-check-input entry-checkbox" type="checkbox" value="${entry.id}">
                    </div>
                </td>
                <td>${entry.entry_number || '-'}</td>
                <td>${this.formatDate(entry.entry_date)}</td>
                <td>${entry.item_name}</td>
                <td>${entry.warehouse_name}</td>
                <td>${this.formatNumber(entry.quantity)} ${entry.unit_name || ''}</td>
                <td>${this.formatCurrency(entry.unit_cost)}</td>
                <td>${this.formatCurrency(entry.total_cost)}</td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button type="button" class="btn btn-outline-info" onclick="InventoryManager.viewEntryDetails('${entry.id}')" data-bs-toggle="tooltip" title="مشاهده">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button type="button" class="btn btn-outline-primary" onclick="InventoryManager.editEntry('${entry.id}')" data-bs-toggle="tooltip" title="ویرایش">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button type="button" class="btn btn-outline-danger" onclick="InventoryManager.deleteEntry('${entry.id}')" data-bs-toggle="tooltip" title="حذف">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    /**
     * ایجاد ردیف خروجی
     * @param {Object} exit - اطلاعات خروجی
     * @returns {string} HTML ردیف خروجی
     */
    static createExitRow(exit) {
        return `
            <tr data-exit-id="${exit.id}">
                <td>
                    <div class="form-check">
                        <input class="form-check-input exit-checkbox" type="checkbox" value="${exit.id}">
                    </div>
                </td>
                <td>${exit.exit_number || '-'}</td>
                <td>${this.formatDate(exit.exit_date)}</td>
                <td>${exit.item_name}</td>
                <td>${exit.warehouse_name}</td>
                <td>${this.formatNumber(exit.quantity)} ${exit.unit_name || ''}</td>
                <td>${this.formatCurrency(exit.unit_cost)}</td>
                <td>${this.formatCurrency(exit.total_cost)}</td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button type="button" class="btn btn-outline-info" onclick="InventoryManager.viewExitDetails('${exit.id}')" data-bs-toggle="tooltip" title="مشاهده">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button type="button" class="btn btn-outline-primary" onclick="InventoryManager.editExit('${exit.id}')" data-bs-toggle="tooltip" title="ویرایش">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button type="button" class="btn btn-outline-danger" onclick="InventoryManager.deleteExit('${exit.id}')" data-bs-toggle="tooltip" title="حذف">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }
/**
 * ذخیره کالا
 */
static async saveItem() {
    try {
        console.log('saveItem called');
        
        const form = document.getElementById('itemForm');
        if (!form) return;
        
        // اعتبارسنجی فرم
        if (!InventoryUI.validateItemForm()) {
            return;
        }
        
        InventoryUI.showLoading();
        
        // جمع‌آوری داده‌های فرم
        const formData = new FormData(form);
        const itemId = formData.get('item_id');
        
        // تبدیل فیلدهای عددی خالی به صفر
        const numericFields = ['min_stock_level', 'max_stock_level', 'alert_threshold'];
        numericFields.forEach(field => {
            const value = formData.get(field);
            if (!value && value !== 0) {
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
        
        // نمایش داده‌های فرم برای دیباگ
        console.log('Form data after processing:');
        for (let [key, value] of formData.entries()) {
            console.log(`${key}: ${value}`);
        }
        
        let response;
        if (itemId) {
            // ویرایش کالا
            response = await InventoryAPI.updateItem(itemId, formData);
        } else {
            // ایجاد کالای جدید
            response = await InventoryAPI.createItem(formData);
        }
        
        if (response.success) {
            InventoryUI.showToast(itemId ? INVENTORY_CONFIG.SUCCESS_MESSAGES.UPDATE_SUCCESS : INVENTORY_CONFIG.SUCCESS_MESSAGES.SAVE_SUCCESS, 'success');
            
            // بستن مودال
            const modal = bootstrap.Modal.getInstance(document.getElementById('addItemModal'));
            if (modal) modal.hide();
            
            // بروزرسانی لیست کالاها
            this.loadItems(this.currentPage);
        } else {
            InventoryUI.showToast(response.message || INVENTORY_CONFIG.ERROR_MESSAGES.SAVE_FAILED, 'error');
        }
        
    } catch (error) {
        console.error('Error saving item:', error);
        InventoryUI.showToast(INVENTORY_CONFIG.ERROR_MESSAGES.SAVE_FAILED, 'error');
    } finally {
        InventoryUI.hideLoading();
    }
}

/**
 * دریافت CSRF توکن
 * @returns {string} CSRF توکن
 */
static getCsrfToken() {
    const tokenElement = document.querySelector('[name=csrfmiddlewaretoken]');
    if (tokenElement) {
        return tokenElement.value;
    }
    return '';
}

/**
 * بروزرسانی موجودی کالا
 * @param {string} itemId - شناسه کالا
 * @param {number} newStock - موجودی جدید
 */
refreshItemStock(itemId, newStock) {
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

}

// توابع عمومی برای دسترسی آسان
function showToast(message, type = 'success') {
    InventoryUI.showToast(message, type);
}

function showLoading() {
    InventoryUI.showLoading();
}

function hideLoading() {
    InventoryUI.hideLoading();
}

function formatCurrency(amount) {
    return InventoryUI.formatCurrency(amount);
}

function formatNumber(number) {
    return InventoryUI.formatNumber(number);
}

function formatDate(date) {
    return InventoryUI.formatDate(date);
}

// راه‌اندازی رابط کاربری پس از بارگذاری صفحه
document.addEventListener('DOMContentLoaded', function() {
    InventoryUI.initialize();
});

     
