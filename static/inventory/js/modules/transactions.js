// static/inventory/js/modules/transactions.js

class TransactionManager {
    constructor() {
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.currentFilters = {};
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadTransactions();
    }

    bindEvents() {
        // Form submissions
        document.addEventListener('submit', (e) => {
            if (e.target.matches('#entryForm')) {
                e.preventDefault();
                this.handleEntrySubmit(e.target);
            }
            if (e.target.matches('#exitForm')) {
                e.preventDefault();
                this.handleExitSubmit(e.target);
            }
        });

        // Filter events
        document.addEventListener('change', (e) => {
            if (e.target.matches('.transaction-filter')) {
                this.applyFilters();
            }
        });

        // Search
        const searchInput = document.getElementById('transactionSearch');
        if (searchInput) {
            searchInput.addEventListener('input', debounce((e) => {
                this.searchTransactions(e.target.value);
            }, 300));
        }

        // Item selection for transactions
        document.addEventListener('change', (e) => {
            if (e.target.matches('#entryItemSelect')) {
                this.loadItemDetails(e.target.value, 'entry');
            }
            if (e.target.matches('#exitItemSelect')) {
                this.loadItemDetails(e.target.value, 'exit');
            }
        });

        // Quantity validation
        document.addEventListener('input', (e) => {
            if (e.target.matches('#exitQuantity')) {
                this.validateExitQuantity(e.target);
            }
        });
    }

    async loadTransactions(page = 1) {
        try {
            showLoading();
            
            const params = {
                page: page,
                per_page: this.itemsPerPage,
                ...this.currentFilters
            };

            const response = await inventoryAPI.getTransactions(params);
            
            if (response.success) {
                this.renderTransactions(response.transactions);
                this.renderPagination(response.pagination);
            }
        } catch (error) {
            console.error('Error loading transactions:', error);
            showToast('خطا در بارگذاری تراکنش‌ها', 'error');
        } finally {
            hideLoading();
        }
    }

    renderTransactions(transactions) {
        const container = document.getElementById('transactionsContainer');
        if (!container) return;

        if (transactions.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-exchange-alt fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">هیچ تراکنشی یافت نشد</h5>
                </div>
            `;
            return;
        }

        const transactionsHTML = transactions.map(transaction => `
            <tr>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="avatar avatar-sm bg-${transaction.type === 'entry' ? 'success' : 'warning'} rounded-circle me-2">
                            <i class="fas fa-${transaction.type === 'entry' ? 'plus' : 'minus'} text-white"></i>
                        </div>
                        <span class="badge bg-${transaction.type === 'entry' ? 'success' : 'warning'}">
                            ${transaction.type === 'entry' ? 'ورودی' : 'خروجی'}
                        </span>
                    </div>
                </td>
                <td>
                    <div>
                        <strong>${transaction.item_name}</strong>
                        <br>
                        <small class="text-muted">کد: ${transaction.item_code}</small>
                    </div>
                </td>
                <td>
                    <span class="fw-bold text-${transaction.type === 'entry' ? 'success' : 'warning'}">
                        ${transaction.type === 'entry' ? '+' : '-'}${formatNumber(transaction.quantity)}
                    </span>
                    <small class="text-muted d-block">${transaction.unit}</small>
                </td>
                <td>${transaction.warehouse_name}</td>
                <td>
                    <div>
                        ${formatDate(transaction.created_at)}
                        <br>
                        <small class="text-muted">${formatTime(transaction.created_at)}</small>
                    </div>
                </td>
                <td>${transaction.user_name}</td>
                <td>
                    ${transaction.notes ? `<small class="text-muted">${transaction.notes}</small>` : '-'}
                </td>
                <td>
                    <div class="dropdown">
                        <button class="btn btn-sm btn-outline-secondary" type="button" data-bs-toggle="dropdown">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                        <ul class="dropdown-menu">
                            <li><a class="dropdown-item" href="#" onclick="viewTransactionDetails(${transaction.id})">
                                <i class="fas fa-eye me-2"></i>جزئیات
                            </a></li>
                            <li><a class="dropdown-item" href="#" onclick="printTransaction(${transaction.id})">
                                <i class="fas fa-print me-2"></i>چاپ
                            </a></li>
                            ${transaction.can_reverse ? `
                                <li><hr class="dropdown-divider"></li>
                                <li><a class="dropdown-item text-danger" href="#" onclick="reverseTransaction(${transaction.id})">
                                    <i class="fas fa-undo me-2"></i>برگشت تراکنش
                                </a></li>
                            ` : ''}
                        </ul>
                    </div>
                </td>
            </tr>
        `).join('');

        container.innerHTML = transactionsHTML;
    }

    async handleEntrySubmit(form) {
        const submitBtn = form.querySelector('button[type="submit"]');
        const spinner = submitBtn.querySelector('.spinner-border');
        
        try {
            submitBtn.disabled = true;
            if (spinner) spinner.style.display = 'inline-block';
            
            const formData = new FormData(form);
            const response = await inventoryAPI.createEntry(formData);
            
            if (response.success) {
                showToast('ورودی با موفقیت ثبت شد', 'success');
                form.reset();
                
                // Close modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('entryModal'));
                if (modal) modal.hide();
                
                // Refresh transactions
                await this.loadTransactions(this.currentPage);
                
                // Update dashboard if exists
                if (window.inventoryDashboard) {
                    window.inventoryDashboard.loadDashboardData();
                }
            } else {
                showToast(response.message || 'خطا در ثبت ورودی', 'error');
            }
        } catch (error) {
            console.error('Entry submission error:', error);
            showToast('خطا در ارتباط با سرور', 'error');
        } finally {
            submitBtn.disabled = false;
            if (spinner) spinner.style.display = 'none';
        }
    }

    async handleExitSubmit(form) {
        const submitBtn = form.querySelector('button[type="submit"]');
        const spinner = submitBtn.querySelector('.spinner-border');
        
        try {
            submitBtn.disabled = true;
            if (spinner) spinner.style.display = 'inline-block';
            
            const formData = new FormData(form);
            const response = await inventoryAPI.createExit(formData);
            
            if (response.success) {
                showToast('خروجی با موفقیت ثبت شد', 'success');
                form.reset();
                
                // Close modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('exitModal'));
                if (modal) modal.hide();
                
                // Refresh transactions
                await this.loadTransactions(this.currentPage);
                
                // Update dashboard if exists
                if (window.inventoryDashboard) {
                    window.inventoryDashboard.loadDashboardData();
                }
            } else {
                showToast(response.message || 'خطا در ثبت خروجی', 'error');
            }
        } catch (error) {
            console.error('Exit submission error:', error);
            showToast('خطا در ارتباط با سرور', 'error');
        } finally {
            submitBtn.disabled = false;
            if (spinner) spinner.style.display = 'none';
        }
    }

    async loadItemDetails(itemId, type) {
        if (!itemId) return;
        
        try {
            const response = await inventoryAPI.getItem(itemId);
            
            if (response.success) {
                const item = response.item;
                this.updateItemDetails(item, type);
            }
        } catch (error) {
            console.error('Error loading item details:', error);
        }
    }

    updateItemDetails(item, type) {
        const prefix = type === 'entry' ? 'entry' : 'exit';
        
        // Update item info display
        const itemInfo = document.getElementById(`${prefix}ItemInfo`);
        if (itemInfo) {
            itemInfo.innerHTML = `
                <div class="d-flex align-items-center">
                    <img src="${item.image || '/static/inventory/img/no-image.png'}" 
                         alt="${item.name}" 
                         class="me-3 rounded" 
                         style="width: 50px; height: 50px; object-fit: cover;">
                    <div>
                        <h6 class="mb-1">${item.name}</h6>
                        <small class="text-muted">
                            کد: ${item.code} | 
                            موجودی فعلی: <span class="fw-bold">${formatNumber(item.current_stock)} ${item.unit}</span>
                        </small>
                    </div>
                </div>
            `;
            itemInfo.style.display = 'block';
        }

        // Update unit display
        const unitSpan = document.getElementById(`${prefix}Unit`);
        if (unitSpan) {
            unitSpan.textContent = item.unit;
        }

        // For exit, show available stock and validate quantity
        if (type === 'exit') {
            const availableStock = document.getElementById('exitAvailableStock');
            if (availableStock) {
                availableStock.textContent = formatNumber(item.current_stock);
            }
            
            // Set max quantity for exit
            const quantityInput = document.getElementById('exitQuantity');
            if (quantityInput) {
                quantityInput.max = item.current_stock;
                quantityInput.addEventListener('input', () => {
                    this.validateExitQuantity(quantityInput);
                });
            }
        }
    }

    validateExitQuantity(input) {
        const quantity = parseFloat(input.value) || 0;
        const maxQuantity = parseFloat(input.max) || 0;
        
        if (quantity > maxQuantity) {
            input.setCustomValidity(`حداکثر مقدار قابل خروج: ${formatNumber(maxQuantity)}`);
            input.classList.add('is-invalid');
        } else {
            input.setCustomValidity('');
            input.classList.remove('is-invalid');
        }
    }

    async applyFilters() {
        const filters = {};
        
        // Type filter
        const typeFilter = document.getElementById('transactionTypeFilter');
        if (typeFilter && typeFilter.value) {
            filters.type = typeFilter.value;
        }

        // Date range filter
        const dateFromFilter = document.getElementById('dateFromFilter');
        const dateToFilter = document.getElementById('dateToFilter');
        if (dateFromFilter && dateFromFilter.value) {
            filters.date_from = dateFromFilter.value;
        }
        if (dateToFilter && dateToFilter.value) {
            filters.date_to = dateToFilter.value;
        }

        // Warehouse filter
        const warehouseFilter = document.getElementById('transactionWarehouseFilter');
        if (warehouseFilter && warehouseFilter.value) {
            filters.warehouse = warehouseFilter.value;
        }

        this.currentFilters = { ...this.currentFilters, ...filters };
        this.currentPage = 1;
        await this.loadTransactions(1);
    }

    async searchTransactions(query) {
        this.currentFilters.search = query;
        this.currentPage = 1;
        await this.loadTransactions(1);
    }
}

// Global functions
function viewTransactionDetails(transactionId) {
    // Implementation for viewing transaction details
    console.log('View transaction details:', transactionId);
}

function printTransaction(transactionId) {
    // Implementation for printing transaction
    window.open(`/inventory/transactions/${transactionId}/print/`, '_blank');
}

function reverseTransaction(transactionId) {
    if (confirm('آیا از برگشت این تراکنش اطمینان دارید؟')) {
        // Implementation for reversing transaction
        console.log('Reverse transaction:', transactionId);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('transactionsContainer')) {
        window.transactionManager = new TransactionManager();
    }
});