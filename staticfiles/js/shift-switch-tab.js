function shiftSwitchTab(tab, scheduleId) {
    // فقط تغییر تب بدون هیچ عملیات ذخیره
    document.querySelectorAll('.shift-tab-button').forEach(t => t.classList.remove('shift-tab-active'));
    tab.classList.add('shift-tab-active');
    
    document.querySelectorAll('.shift-schedule-wrapper').forEach(s => s.style.display = 'none');
    document.getElementById(scheduleId).style.display = 'block';
}
