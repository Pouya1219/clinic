// static/appointments/js/config.js
const CONFIG = {
    API_URLS: {
        // اصلاح مسیرها با افزودن / در ابتدا
        UNITS: '/appointments/api/units/',
        DOCTORS: '/appointments/api/doctors/',
        SCHEDULE: (id) => `/appointments/api/schedule/${id}/`,
        APPOINTMENTS: '/appointments/api/appointments/',
        SAVE_APPOINTMENT: '/appointments/api/appointment/save/',
        DELETE_APPOINTMENT: (id) => `/appointments/api/appointment/${id}/delete/`,
        APPOINTMENT_DETAILS: (id) => `/appointments/api/appointments/${id}/`,
        UPDATE_APPOINTMENT: (id) => `/appointments/api/appointments/${id}/update/`,
        TREATINGS: '/appointments/api/treatings/',
    },
    STATUS_COLORS: {
        'normal': '#d4edda',
        'emergency': '#f8d7da',
        'pending': '#fff3cd',
        'visit': '#cce5ff',
        'completed': '#c3e6cb',
        'cancelled': '#e2e3e5'
    },
    DEFAULT_DURATION: 30,
    // اصلاح این خط
    get CSRF_TOKEN() {
        return document.querySelector('[name=csrfmiddlewaretoken]')?.value || '';
    }
};
