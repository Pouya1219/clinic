document.addEventListener("DOMContentLoaded", function () {
    const logoutBtn = document.getElementById("logout-btn");

    if (logoutBtn) {
        logoutBtn.addEventListener("click", function () {
            fetch('/logout/', {
                method: 'POST',
                headers: {
                    "X-CSRFToken": getCookie("csrftoken")
                }
            }).then(() => {
                window.location.href = "/";
            });
        });
    }

    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie) {
            const cookies = document.cookie.split(';');
            cookies.forEach(cookie => {
                const trimmedCookie = cookie.trim();
                if (trimmedCookie.startsWith(name + '=')) {
                    cookieValue = trimmedCookie.split('=')[1];
                }
            });
        }
        return cookieValue;
    }
});