/*
 * Client-side validation + submission for site forms (currently the contact form).
 * - Inline error messages under each field (messages come from data-msg-* attributes)
 * - Spam protection: honeypot + time trap + optional Cloudflare Turnstile
 * - The server (contact.php) re-validates everything; its field errors are shown inline too.
 */
(function () {
    "use strict";

    var config = window.OURANOIR_CONFIG || {};

    function messageFor(field) {
        var box = document.getElementById(field.id + "-error");
        var v = field.validity;
        var data = box ? box.dataset : {};
        if (v.valueMissing) return data.msgRequired || "This field is required.";
        if (v.typeMismatch) return data.msgType || "Please enter a valid value.";
        if (v.tooShort) return data.msgShort || "Please enter a little more.";
        if (v.tooLong) return "This is too long.";
        return field.validationMessage;
    }

    function setError(form, name, message) {
        var field = form.elements[name];
        var box = form.querySelector("#" + name + "-error");
        if (field && field.classList) {
            field.classList.toggle("is-invalid", !!message);
            field.setAttribute("aria-invalid", message ? "true" : "false");
        }
        if (box) box.textContent = message || "";
    }

    function validateField(form, field) {
        if (!field.name || field.type === "hidden" || field.closest(".hp-field")) return true;
        if (field.type === "email") field.value = field.value.trim();
        var ok = field.checkValidity();
        setError(form, field.name, ok ? "" : messageFor(field));
        return ok;
    }

    function loadTurnstile(form) {
        var slot = form.querySelector("[data-turnstile]");
        if (!slot || !config.turnstileSiteKey) return;
        window.onOuraNoirTurnstile = function () {
            window.turnstile.render(slot, { sitekey: config.turnstileSiteKey, theme: "light" });
        };
        var s = document.createElement("script");
        s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onOuraNoirTurnstile&render=explicit";
        s.async = true;
        document.head.appendChild(s);
    }

    function enhance(form) {
        var status = form.querySelector("[role=status]");
        var button = form.querySelector("button[type=submit]");
        var buttonText = button.textContent;
        var started = form.elements.form_started;
        if (started) started.value = String(Date.now());
        loadTurnstile(form);

        function show(type, text) {
            status.className = "alert alert-" + type + " mb-0";
            status.textContent = text;
        }

        // Validate a field when the user leaves it, and re-validate as they fix it
        form.addEventListener("blur", function (e) {
            if (e.target.form === form && e.target.value !== "") validateField(form, e.target);
        }, true);
        form.addEventListener("input", function (e) {
            if (e.target.classList.contains("is-invalid")) validateField(form, e.target);
        });
        form.addEventListener("change", function (e) {
            if (e.target.type === "checkbox") validateField(form, e.target);
        });

        form.addEventListener("submit", function (e) {
            e.preventDefault();
            var fields = Array.prototype.slice.call(form.elements);
            var invalid = fields.filter(function (f) { return !validateField(form, f); });
            if (invalid.length) {
                show("danger", "Please correct the " + (invalid.length === 1 ? "highlighted field" : invalid.length + " highlighted fields") + " below.");
                invalid[0].focus();
                return;
            }
            if (config.turnstileSiteKey && window.turnstile) {
                var token = form.querySelector("[name='cf-turnstile-response']");
                if (!token || !token.value) {
                    setError(form, "turnstile", "Please complete the security check.");
                    return;
                }
            }
            setError(form, "turnstile", "");

            button.disabled = true;
            button.textContent = "Sending…";
            status.className = "alert d-none mb-0";

            fetch(form.action, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } })
                .then(function (res) {
                    return res.json().catch(function () {
                        return { success: false, message: "Unexpected server response (" + res.status + "). Please try again." };
                    });
                })
                .then(function (result) {
                    if (result.success) {
                        show("success", result.message);
                        form.reset();
                        if (started) started.value = String(Date.now());
                        if (window.ouranoirTrack) window.ouranoirTrack("contact_form_submit");
                    } else {
                        var errors = result.errors || {};
                        Object.keys(errors).forEach(function (name) { setError(form, name, errors[name]); });
                        show("danger", result.message || "Sorry, your message could not be sent.");
                        var first = form.querySelector(".is-invalid");
                        if (first) first.focus();
                    }
                    if (window.turnstile) window.turnstile.reset();
                })
                .catch(function () {
                    show("danger", "Network error. Please check your connection and try again.");
                })
                .then(function () {
                    button.disabled = false;
                    button.textContent = buttonText;
                });
        });
    }

    Array.prototype.forEach.call(document.querySelectorAll("form[data-enhanced-form], #contactForm"), enhance);
})();
