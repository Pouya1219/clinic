// static/js/edit_user_tabs.js
class EditUserTabs {
    constructor() {
        this.tabButtons = document.querySelectorAll('.edit-user-tabs__button');
        this.tabContents = document.querySelectorAll('.edit-user-tabs__content');
        this.init();
    }

    init() {
        this.addEventListeners();
        this.activateDefaultTab();
    }

    addEventListeners() {
        this.tabButtons.forEach(button => {
            button.addEventListener('click', () => this.switchTab(button));
        });
    }

    switchTab(selectedButton) {
        // حذف کلاس active از همه تب‌ها
        this.tabButtons.forEach(button => {
            button.classList.remove('edit-user-tabs__button--active');
        });
        this.tabContents.forEach(content => {
            content.classList.remove('edit-user-tabs__content--active');
        });

        // فعال کردن تب انتخاب شده
        selectedButton.classList.add('edit-user-tabs__button--active');
        const tabId = `edit-user-tabs-${selectedButton.dataset.editTab}`;
        document.getElementById(tabId).classList.add('edit-user-tabs__content--active');
    }

    activateDefaultTab() {
        // فعال کردن اولین تب به صورت پیش‌فرض
        if (this.tabButtons[0]) {
            this.switchTab(this.tabButtons[0]);
        }
    }
}

// راه‌اندازی تب‌ها
document.addEventListener('DOMContentLoaded', () => {
    new EditUserTabs();
});
