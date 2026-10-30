/* =========================================================
   Fleet Rescue — Roadside Assistance
   Location capture, form validation, submission
   ========================================================= */
(function () {
  "use strict";

  /* ---------- CONFIG ----------
     Requests are delivered by Web3Forms (https://web3forms.com) to the
     email address the access key was created with. Leave FORM_ENDPOINT
     empty to run in preview mode (simulated send, payload logged to the
     console).
     ATTACH_PHOTOS: file attachments are a Web3Forms Pro feature. While
     false the photo field is hidden; set to true after upgrading.
  --------------------------------------------------------- */
  var FORM_ENDPOINT = "https://api.web3forms.com/submit";
  var WEB3FORMS_ACCESS_KEY = "edb620d7-3ac3-4d04-b6b6-e25d1554e1c5";
  var ATTACH_PHOTOS = false;
  var DISPATCH_PHONE_DISPLAY = "984-315-3301";
  var DISPATCH_PHONE_TEL = "tel:9843153301";
  var GPS_TIMEOUT_MS = 12000;
  var MAX_PHOTOS = 3;
  var MAX_PHOTO_MB = 8;

  /* ---------- Elements ---------- */
  var navToggle = document.querySelector(".nav-toggle");
  var siteNav = document.getElementById("site-nav");

  var form = document.getElementById("assist-form");
  var formCard = document.getElementById("request");
  var successPanel = document.querySelector(".form-success");
  var formStatus = document.querySelector(".form-status");
  var submitBtn = document.querySelector(".btn-submit");
  var submitLabel = document.querySelector(".btn-submit-label");

  var locationInput = document.getElementById("location");
  var latInput = document.getElementById("lat");
  var lngInput = document.getElementById("lng");
  var mapLinkInput = document.getElementById("maplink");
  var locationStatus = document.querySelector(".js-location-status");
  var locationStatusText = locationStatus.querySelector("span");
  var shareButtons = document.querySelectorAll(".js-share-location");
  var heroShareLabel = document.querySelector(".js-share-label");

  var photoInput = document.getElementById("photos");
  var photoList = document.querySelector(".file-list");
  var photoDropText = document.querySelector(".file-drop-text");
  var selectedPhotos = [];
  if (!ATTACH_PHOTOS) photoInput.closest(".field").hidden = true;

  var isSubmitting = false;
  var isLocating = false;

  /* =========================================================
     Mobile nav
     ========================================================= */
  navToggle.addEventListener("click", function () {
    var open = siteNav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  });
  siteNav.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      siteNav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });

  /* =========================================================
     Location capture
     States: idle -> locating -> captured | failed
     ========================================================= */
  function setLocationState(state, message) {
    locationStatus.classList.remove("is-locating", "is-success", "is-error");
    if (state !== "idle") locationStatus.classList.add("is-" + state);

    if (message) locationStatusText.innerHTML = message;

    shareButtons.forEach(function (btn) {
      btn.setAttribute("aria-busy", state === "locating" ? "true" : "false");
      btn.disabled = state === "locating";
    });

    heroShareLabel.textContent =
      state === "locating" ? "Locating…" :
      state === "success" ? "Location Captured" : "Share GPS Location";
  }

  function scrollToForm() {
    if (window.innerWidth <= 820) {
      formCard.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function onLocationSuccess(pos) {
    isLocating = false;
    var lat = pos.coords.latitude.toFixed(6);
    var lng = pos.coords.longitude.toFixed(6);
    var accuracy = Math.round(pos.coords.accuracy);

    latInput.value = lat;
    lngInput.value = lng;
    mapLinkInput.value = "https://www.google.com/maps?q=" + lat + "," + lng;

    if (!locationInput.value.trim()) {
      locationInput.value = "GPS: " + lat + ", " + lng;
    }
    clearFieldError(locationInput);

    setLocationState(
      "success",
      "Location captured (±" + accuracy + " m). " +
        '<a href="' + mapLinkInput.value + '" target="_blank" rel="noopener">View on map</a>' +
        " — add highway or exit details if you can."
    );
  }

  function onLocationError(err) {
    isLocating = false;
    var msg;
    if (err && err.code === 1) {
      msg = "Location access was denied. Please type your address, ZIP code or mile marker above.";
    } else if (err && err.code === 3) {
      msg = "GPS timed out. Try again or enter your location manually.";
    } else {
      msg = "We couldn't get your location. Please enter it manually above.";
    }
    setLocationState("error", msg);
    locationInput.focus();
  }

  function requestLocation() {
    if (isLocating) return;
    scrollToForm();

    if (!("geolocation" in navigator)) {
      setLocationState("error", "GPS isn't available on this device. Please enter your location manually above.");
      locationInput.focus();
      return;
    }
    if (window.location.protocol !== "https:" && !/^(localhost|127\.0\.0\.1)$/.test(window.location.hostname)) {
      setLocationState("error", "GPS requires a secure (https) connection. Please enter your location manually above.");
      locationInput.focus();
      return;
    }

    isLocating = true;
    setLocationState("locating", "Getting your GPS location…");

    navigator.geolocation.getCurrentPosition(onLocationSuccess, onLocationError, {
      enableHighAccuracy: true,
      timeout: GPS_TIMEOUT_MS,
      maximumAge: 0
    });
  }

  shareButtons.forEach(function (btn) {
    btn.addEventListener("click", requestLocation);
  });

  /* =========================================================
     Photo upload (optional, max MAX_PHOTOS)
     ========================================================= */
  function formatSize(bytes) {
    return bytes >= 1048576
      ? (bytes / 1048576).toFixed(1) + " MB"
      : Math.max(1, Math.round(bytes / 1024)) + " KB";
  }

  function renderPhotoList() {
    photoList.innerHTML = "";
    selectedPhotos.forEach(function (file, idx) {
      var li = document.createElement("li");
      var name = document.createElement("span");
      name.textContent = file.name + " (" + formatSize(file.size) + ")";
      var remove = document.createElement("button");
      remove.type = "button";
      remove.textContent = "Remove";
      remove.setAttribute("aria-label", "Remove " + file.name);
      remove.addEventListener("click", function () {
        selectedPhotos.splice(idx, 1);
        renderPhotoList();
      });
      li.appendChild(name);
      li.appendChild(remove);
      photoList.appendChild(li);
    });
    photoDropText.textContent = selectedPhotos.length
      ? "Add another photo (" + selectedPhotos.length + "/" + MAX_PHOTOS + ")"
      : "Add photos of the problem";
  }

  photoInput.addEventListener("change", function () {
    clearFieldError(photoInput);
    var rejected = [];

    Array.prototype.forEach.call(photoInput.files, function (file) {
      if (selectedPhotos.length >= MAX_PHOTOS) { rejected.push("limit"); return; }
      if (!/^image\//.test(file.type)) { rejected.push("type"); return; }
      if (file.size > MAX_PHOTO_MB * 1048576) { rejected.push("size"); return; }
      selectedPhotos.push(file);
    });

    if (rejected.indexOf("limit") !== -1) {
      setFieldError(photoInput, "You can attach up to " + MAX_PHOTOS + " photos.");
    } else if (rejected.indexOf("size") !== -1) {
      setFieldError(photoInput, "Each photo must be under " + MAX_PHOTO_MB + " MB.");
    } else if (rejected.indexOf("type") !== -1) {
      setFieldError(photoInput, "Only image files can be attached.");
    }

    photoInput.value = ""; // allow re-selecting the same file later
    renderPhotoList();
  });

  /* =========================================================
     Validation
     ========================================================= */
  function setFieldError(input, message) {
    var wrap = input.closest(".field");
    if (!wrap) return;
    wrap.classList.add("is-invalid");
    var el = wrap.querySelector(".field-error");
    if (el) el.textContent = message;
    input.setAttribute("aria-invalid", "true");
  }

  function clearFieldError(input) {
    var wrap = input.closest(".field");
    if (!wrap) return;
    wrap.classList.remove("is-invalid");
    var el = wrap.querySelector(".field-error");
    if (el) el.textContent = "";
    input.removeAttribute("aria-invalid");
  }

  function isValidPhone(value) {
    var digits = value.replace(/\D/g, "");
    return digits.length >= 10 && digits.length <= 15;
  }

  function validate() {
    var firstInvalid = null;

    function fail(input, msg) {
      setFieldError(input, msg);
      if (!firstInvalid) firstInvalid = input;
    }

    var company = form.elements.company;
    var name = form.elements.name;
    var phone = form.elements.phone;
    var truck = form.elements.truck_type;
    var repair = form.elements.repair_type;
    var issue = form.elements.issue;

    [company, name, phone, locationInput, truck, repair, issue].forEach(clearFieldError);

    if (!company.value.trim()) fail(company, "Please enter your company name.");
    if (!name.value.trim()) fail(name, "Please enter your name.");
    if (!phone.value.trim()) fail(phone, "Please enter a phone number we can call back.");
    else if (!isValidPhone(phone.value)) fail(phone, "Please enter a valid phone number.");

    var hasGps = latInput.value && lngInput.value;
    if (!locationInput.value.trim() && !hasGps) {
      fail(locationInput, "Share your GPS location or enter an address, ZIP code or mile marker.");
    }

    if (!truck.value) fail(truck, "Please select your truck type.");
    if (!repair.value) fail(repair, "Please select a repair type.");
    if (!issue.value.trim()) fail(issue, "Please describe the truck and the problem.");

    if (firstInvalid) {
      firstInvalid.focus();
      firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
      return false;
    }
    return true;
  }

  // Clear an error as soon as the driver starts fixing the field
  form.querySelectorAll("input, select, textarea").forEach(function (el) {
    el.addEventListener("input", function () { clearFieldError(el); });
    el.addEventListener("change", function () { clearFieldError(el); });
  });

  /* =========================================================
     Submission
     ========================================================= */
  function setSubmitting(state) {
    isSubmitting = state;
    submitBtn.disabled = state;
    submitBtn.setAttribute("aria-busy", String(state));
    submitLabel.textContent = state ? "Sending…" : "Send Assistance Request";
  }

  function showFormError(message) {
    formStatus.className = "form-status is-error";
    formStatus.innerHTML =
      message +
      ' Call dispatch directly at <a href="' + DISPATCH_PHONE_TEL + '">' + DISPATCH_PHONE_DISPLAY + "</a>.";
  }

  function clearFormError() {
    formStatus.className = "form-status";
    formStatus.textContent = "";
  }

  function showSuccess() {
    form.hidden = true;
    successPanel.hidden = false;
    formCard.scrollIntoView({ behavior: "smooth", block: "start" });
    var heading = successPanel.querySelector("h3");
    if (heading) {
      heading.setAttribute("tabindex", "-1");
      heading.focus();
    }
  }

  function buildPayload() {
    var data = new FormData(form);

    // Replace the raw file input with the curated photo list.
    // Web3Forms reads attachments from the reserved "attachment" field.
    data.delete("photos");
    if (ATTACH_PHOTOS) {
      selectedPhotos.forEach(function (file) { data.append("attachment", file, file.name); });
    }

    // Grouped, readable message for the dispatcher's inbox
    var summary =
      "=== CONTACT ===\n" +
      "Company:  " + data.get("company") + "\n" +
      "Name:     " + data.get("name") + "\n" +
      "Phone:    " + data.get("phone") + "\n\n" +
      "=== LOCATION ===\n" +
      "Reported: " + (data.get("location") || "(not provided)") + "\n" +
      "Map link: " + (data.get("map_link") || "(GPS not shared)") + "\n\n" +
      "=== VEHICLE ===\n" +
      "Truck:    " + data.get("truck_type") + "\n\n" +
      "=== ISSUE ===\n" +
      "Repair:   " + data.get("repair_type") + "\n" +
      "Details:  " + data.get("issue") + "\n" +
      (ATTACH_PHOTOS ? "Photos:   " + selectedPhotos.length + " attached\n" : "");

    data.append("access_key", WEB3FORMS_ACCESS_KEY);
    data.append("subject", "Roadside request: " + data.get("repair_type") + " — " + data.get("company"));
    data.append("message", summary);
    return data;
  }

  function sendRequest(payload) {
    if (!FORM_ENDPOINT) {
      // Preview mode: simulate a successful send so the flow can be reviewed
      console.info("[Fleet Rescue] Preview mode — no FORM_ENDPOINT configured. Payload:\n" + payload.get("message"));
      return new Promise(function (resolve) { setTimeout(resolve, 900); });
    }
    return fetch(FORM_ENDPOINT, {
      method: "POST",
      body: payload,
      headers: { Accept: "application/json" }
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (json) {
        if (!res.ok || json.success === false) {
          throw new Error("HTTP " + res.status + " " + (json.message || (json.body && json.body.message) || ""));
        }
      });
    });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (isSubmitting) return;
    clearFormError();

    // Honeypot filled => bot; pretend success silently
    if (form.elements.botcheck && form.elements.botcheck.value) {
      showSuccess();
      return;
    }

    if (!validate()) return;

    setSubmitting(true);
    sendRequest(buildPayload())
      .then(function () {
        setSubmitting(false);
        showSuccess();
      })
      .catch(function (err) {
        console.error("[Fleet Rescue] Send failed:", err);
        setSubmitting(false);
        showFormError("We couldn't send your request right now.");
      });
  });
})();
