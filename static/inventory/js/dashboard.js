// static/inventory/js/dashboard.js

class InventoryDashboard {
    constructor() {
        this.charts = {};
        this.refreshInterval = 30000; // 30 seconds
        this.init();
    }

    init() {
        this.loadDashboardData();
        this.initializeCharts();
        this.startAutoRefresh();
        this.bindEvents();
    }

    async loadDashboardData() {
        try {
            showLoading();
            
            const [
                statsResponse,
                stockLevelsResponse,
                recentTransactionsResponse,
                lowStockResponse
            ] = await Promise.all([
                inventoryAPI.request('/dashboard/stats/'),
                inventoryAPI.request('/dashboard/stock-levels/'),
                inventoryAPI.request('/dashboard/recent-transactions/'),
                inventoryAPI.request('/dashboard/low-stock/')
            ]);

            this.updateStats(statsResponse.data);
            this.updateStockLevelsChart(stockLevelsResponse.data);
            this.updateRecentTransactions(recentTransactionsResponse.data);
            this.updateLowStockAlerts(lowStockResponse.data);
            
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            showToast('خطا در بارگذاری داده‌های داشبورد', 'error');
        // static/inventory/js/core/dashboard.js

        } finally {
            hideLoading();
        }
    }

    updateStats(stats) {
        // Update stat cards
        const statElements = {
            totalItems: document.getElementById('totalItemsCount'),
            totalValue: document.getElementById('totalInventoryValue'),
            lowStockItems: document.getElementById('lowStockCount'),
            outOfStockItems: document.getElementById('outOfStockCount'),
            todayEntries: document.getElementById('todayEntriesCount'),
            todayExits: document.getElementById('todayExitsCount')
        };

        Object.keys(statElements).forEach(key => {
            const element = statElements[key];
            if (element && stats[key] !== undefined) {
                if (key === 'totalValue') {
                    element.textContent = formatCurrency(stats[key]);
                } else {
                    element.textContent = formatNumber(stats[key]);
                }
                
                // Add animation
                element.classList.add('stat-updated');
                setTimeout(() => element.classList.remove('stat-updated'), 1000);
            }
        });

        // Update trend indicators
        this.updateTrendIndicators(stats.trends || {});
    }

    updateTrendIndicators(trends) {
        Object.keys(trends).forEach(key => {
            const indicator = document.getElementById(`${key}Trend`);
            if (indicator) {
                const trend = trends[key];
                const isPositive = trend > 0;
                const isNegative = trend < 0;
                
                indicator.innerHTML = `
                    <i class="fas fa-arrow-${isPositive ? 'up' : isNegative ? 'down' : 'right'} 
                       text-${isPositive ? 'success' : isNegative ? 'danger' : 'muted'}"></i>
                    <span class="text-${isPositive ? 'success' : isNegative ? 'danger' : 'muted'}">
                        ${Math.abs(trend)}%
                    </span>
                `;
            }
        });
    }

    initializeCharts() {
        this.initStockLevelsChart();
        this.initTransactionChart();
        this.initCategoryChart();
        this.initWarehouseChart();
    }

    initStockLevelsChart() {
        const ctx = document.getElementById('stockLevelsChart');
        if (!ctx) return;

        this.charts.stockLevels = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['موجود', 'کم موجود', 'ناموجود'],
                datasets: [{
                    data: [0, 0, 0],
                    backgroundColor: ['#28a745', '#ffc107', '#dc3545'],
                    borderWidth: 2,
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
                            padding: 20,
                            usePointStyle: true,
                            font: {
                                family: 'IRANSans'
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = formatNumber(context.raw);
                                const percentage = Math.round(context.parsed * 100 / context.dataset.data.reduce((a, b) => a + b, 0));
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    initTransactionChart() {
        const ctx = document.getElementById('transactionChart');
        if (!ctx) return;

        this.charts.transactions = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'ورودی',
                    data: [],
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                    tension: 0.4,
                    fill: true
                }, {
                    label: 'خروجی',
                    data: [],
                    borderColor: '#dc3545',
                    backgroundColor: 'rgba(220, 53, 69, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
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
                                return formatNumber(value);
                            }
                        }
                    }
                }
            }
        });
    }

    initCategoryChart() {
        const ctx = document.getElementById('categoryChart');
        if (!ctx) return;

        this.charts.categories = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'تعداد کالا',
                    data: [],
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
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    updateStockLevelsChart(data) {
        if (this.charts.stockLevels) {
            this.charts.stockLevels.data.datasets[0].data = [
                data.in_stock || 0,
                data.low_stock || 0,
                data.out_of_stock || 0
            ];
            this.charts.stockLevels.update();
        }
    }

    updateRecentTransactions(transactions) {
        const container = document.getElementById('recentTransactionsList');
        if (!container) return;

        if (transactions.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4 text-muted">
                    <i class="fas fa-exchange-alt fa-2x mb-2"></i>
                    <p>هیچ تراکنش اخیری یافت نشد</p>
                </div>
            `;
            return;
        }

        const transactionsHTML = transactions.map(transaction => `
            <div class="d-flex align-items-center py-2 border-bottom">
                <div class="flex-shrink-0 me-3">
                    <div class="avatar avatar-sm bg-${transaction.type === 'entry' ? 'success' : 'warning'} rounded-circle">
                        <i class="fas fa-${transaction.type === 'entry' ? 'plus' : 'minus'} text-white"></i>
                    </div>
                </div>
                <div class="flex-grow-1">
                    <h6 class="mb-0">${transaction.item_name}</h6>
                    <small class="text-muted">
                        ${transaction.type === 'entry' ? 'ورودی' : 'خروجی'} 
                        ${formatNumber(transaction.quantity)} ${transaction.unit}
                    </small>
                </div>
                <div class="flex-shrink-0">
                    <small class="text-muted">${formatTime(transaction.created_at)}</small>
                </div>
            </div>
        `).join('');

        container.innerHTML = transactionsHTML;
    }

    updateLowStockAlerts(items) {
        const container = document.getElementById('lowStockAlertsList');
        const badge = document.getElementById('lowStockBadge');
        
        if (!container) return;

        if (badge) {
            badge.textContent = items.length;
            badge.style.display = items.length > 0 ? 'inline' : 'none';
        }

        if (items.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4 text-muted">
                    <i class="fas fa-check-circle fa-2x mb-2 text-success"></i>
                    <p>همه کالاها موجودی کافی دارند</p>
                </div>
            `;
            return;
        }

        const alertsHTML = items.map(item => `
            <div class="alert alert-warning d-flex align-items-center py-2 mb-2">
                <i class="fas fa-exclamation-triangle me-2"></i>
                <div class="flex-grow-1">
                    <strong>${item.name}</strong>
                    <br>
                    <small>موجودی: ${formatNumber(item.current_stock)} ${item.unit}</small>
                </div>
                <button class="btn btn-sm btn-outline-primary" onclick="quickEntry(${item.id})">
                    <i class="fas fa-plus"></i>
                </button>
            </div>
        `).join('');

        container.innerHTML = alertsHTML;
    }

    startAutoRefresh() {
        setInterval(() => {
            this.loadDashboardData();
        }, this.refreshInterval);
    }

    bindEvents() {
        // Refresh button
        const refreshBtn = document.getElementById('refreshDashboard');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadDashboardData();
            });
        }

        // Period selector
        const periodSelector = document.getElementById('dashboardPeriod');
        if (periodSelector) {
            periodSelector.addEventListener('change', (e) => {
                this.loadDashboardData(e.target.value);
            });
        }

        // Export buttons
        document.addEventListener('click', (e) => {
            if (e.target.matches('.export-btn')) {
                const type = e.target.dataset.export;
                this.exportData(type);
            }
        });
    }

    async exportData(type) {
        try {
            const response = await inventoryAPI.request(`/dashboard/export/${type}/`);
            
            if (response.success) {
                // Create download link
                const link = document.createElement('a');
                link.href = response.download_url;
                link.download = response.filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                showToast('فایل با موفقیت دانلود شد', 'success');
            }
        } catch (error) {
            console.error('Export error:', error);
            showToast('خطا در دانلود فایل', 'error');
        }
    }
}

// Utility functions
function formatTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'همین الان';
    if (diffInMinutes < 60) return `${diffInMinutes} دقیقه پیش`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} ساعت پیش`;
    return `${Math.floor(diffInMinutes / 1440)} روز پیش`;
}

function quickEntry(itemId) {
    if (window.inventoryManager && window.inventoryManager.openQuickEntry) {
        window.inventoryManager.openQuickEntry(itemId);
    }
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('dashboardContainer')) {
        window.inventoryDashboard = new InventoryDashboard();
    }
});
