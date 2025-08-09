// static/inventory/js/config/settings.js

const InventoryConfig = {
    // API Configuration
    api: {
        baseUrl: '/inventory/api',
        timeout: 30000,
        retryAttempts: 3,
        retryDelay: 1000
    },
    
    // Pagination
    pagination: {
        defaultPageSize: 20,
        pageSizeOptions: [10, 20, 50, 100]
    },
    
    // File Upload
    fileUpload: {
        maxSize: 5, // MB
        allowedTypes: ['image/jpeg', 'image/png', 'image/gif'],
        allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif']
    },
    
    // Validation
    validation: {
        itemCode: {
            minLength: 3,
            maxLength: 20,
            pattern: /^[A-Za-z0-9-_]+$/
        },
        itemName: {
            minLength: 2,
            maxLength: 100
        },
        quantity: {
            min: 0,
            max: 999999
        },
        price: {
            min: 0,
            max: 999999999
        }
    },
    
    // UI Settings
    ui: {
        animationDuration: 300,
        toastDuration: 5000,
        autoRefreshInterval: 30000,
        searchDebounceDelay: 300
    },
    
    // Chart Colors
    chartColors: {
        primary: '#4e73df',
        success: '#28a745',
        warning: '#ffc107',
        danger: '#dc3545',
        info: '#17a2b8',
        secondary: '#6c757d'
    },
    
    // Stock Status
    stockStatus: {
        inStock: {
            color: 'success',
            icon: 'fa-check-circle',
            text: 'موجود'
        },
        lowStock: {
            color: 'warning',
            icon: 'fa-exclamation-triangle',
            text: 'کم موجود'
        },
        outOfStock: {
            color: 'danger',
            icon: 'fa-times-circle',
            text: 'ناموجود'
        }
    },
    
    // Transaction Types
    transactionTypes: {
        entry: {
            color: 'success',
            icon: 'fa-plus',
            text: 'ورودی'
        },
        exit: {
            color: 'warning',
            icon: 'fa-minus',
            text: 'خروجی'
        },
        adjustment: {
            color: 'info',
            icon: 'fa-edit',
            text: 'تعدیل'
        }
    },
    
    // Date Formats
    dateFormats: {
        display: 'YYYY/MM/DD',
        input: 'YYYY-MM-DD',
        api: 'YYYY-MM-DD HH:mm:ss'
    },
    
    // Local Storage Keys
    storageKeys: {
        theme: 'inventory_theme',
        userPreferences: 'inventory_user_prefs',
        filters: 'inventory_filters',
        sortSettings: 'inventory_sort'
    },
    
    // WebSocket
    websocket: {
        reconnectInterval: 5000,
        maxReconnectAttempts: 10
    },
    
    // Print Settings
    print: {
        paperSize: 'A4',
        orientation: 'portrait',
        margins: '1cm'
    }
};

// Export configuration
window.InventoryConfig = InventoryConfig;
