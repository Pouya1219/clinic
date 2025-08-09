document.addEventListener("DOMContentLoaded", function () {
    function updatePersianDate() {
        const date = new Date();
        const formatter = new Intl.DateTimeFormat("fa-IR", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
        document.getElementById('persian-date').innerText = formatter.format(date);
    }

    updatePersianDate();
});