document.addEventListener("DOMContentLoaded", function () {
    const modeToggle = document.getElementById("mode-toggle");

    if (modeToggle) {
        modeToggle.addEventListener("click", function () {
            document.body.classList.toggle("dark-mode");
            document.body.classList.toggle("light-mode");

            if (document.body.classList.contains("dark-mode")) {
                this.innerHTML = "🌙";
                this.setAttribute("title", "حالت روز را فعال کنید");
            } else {
                this.innerHTML = "🌞";
                this.setAttribute("title", "حالت شب را فعال کنید");
            }
        });
    }
});