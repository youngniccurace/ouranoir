// Sends the contact form to contact.php without leaving the page.
(function () {
    "use strict";

    var form = document.getElementById("contactForm");
    if (!form) return;
    var status = document.getElementById("contactStatus");
    var button = form.querySelector("button[type=submit]");

    function show(type, text) {
        status.className = "alert alert-" + type + " mb-0";
        status.textContent = text;
    }

    form.addEventListener("submit", function (e) {
        e.preventDefault();

        if (!form.checkValidity()) {
            form.classList.add("was-validated");
            show("warning", "Please fill in your name, a valid email and your message.");
            return;
        }

        button.disabled = true;
        button.textContent = "Sending...";

        fetch(form.action, { method: "POST", body: new FormData(form) })
            .then(function (res) {
                return res.json().catch(function () {
                    return { success: false, message: "Unexpected server response (" + res.status + ")." };
                });
            })
            .then(function (result) {
                if (result.success) {
                    show("success", result.message);
                    form.reset();
                    form.classList.remove("was-validated");
                } else {
                    show("danger", result.message || "Sorry, your message could not be sent.");
                }
            })
            .catch(function () {
                show("danger", "Network error. Please check your connection and try again.");
            })
            .then(function () {
                button.disabled = false;
                button.textContent = "Send Message";
            });
    });
})();
