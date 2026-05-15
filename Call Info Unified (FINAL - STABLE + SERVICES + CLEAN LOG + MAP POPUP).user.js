// ==UserScript==
// @name         Call Info Unified (FINAL - STABLE + SERVICES + CLEAN LOG + MAP POPUP)
// @match        https://edge.bigbrandtire.com/*
// @match        https://example.com/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addValueChangeListener
// ==/UserScript==

(function() {
    'use strict';

    const isEdge = location.hostname.includes("edge.bigbrandtire.com");
    const isUI = location.hostname === "example.com";

    // =========================================================
    // ====================== EDGE SIDE =========================
    // =========================================================
    if (isEdge) {

        let lastPayload = "";
        let lastCustomer = "";
        let lastServices = "";

        function cleanCity(str) {
            return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
        }

        function getPhoneFromAddressBlock() {
            const addrBlock = document.querySelector("address");
            if (!addrBlock) return "";

            const text = addrBlock.innerText;
            const match = text.match(/\(?\d{3}\)?[\s-]?\d{3}-\d{4}/);
            return match ? match[0] : "";
        }

        function getServices() {
            const nodes = document.querySelectorAll("div[data-itemtype='S']");
            const services = [];

            nodes.forEach(el => {
                const text = el.innerText.trim();
                if (text && !services.includes(text)) {
                    services.push(text.toUpperCase());
                }
            });

            return services;
        }

        function getData() {
            const numEl = document.getElementById("storenospn");
            const addrEl = document.getElementById("storeaddspn");
            const cityEl = document.getElementById("storecsspn");

            if (!numEl || !addrEl || !cityEl) return null;

            const store = numEl.innerText.replace("Store #", "").trim();
            const address = addrEl.innerText.trim();
            const city = cleanCity(cityEl.innerText.trim());

            const newCustomer =
                document.querySelector(".cust-card-name")?.innerText?.trim() ||
                document.getElementById("customerFirstname")?.innerText?.trim() ||
                "";

            if (newCustomer) lastCustomer = newCustomer;

            const customer = lastCustomer;

            const yearMakeEl = document.getElementById("yearMake");
            const modelEl = document.getElementById("modelClass");

            let vehicle = "";
            if (yearMakeEl && modelEl) {
                vehicle = `${yearMakeEl.innerText.trim()} ${modelEl.innerText.trim()}`;
            }

            const tireEl = document.getElementById("TireSizeSelector");

            let tire = "";
            if (tireEl && tireEl.innerText.trim()) {
                tire = tireEl.innerText.trim()
                    .replace(/^[A-Z]\s+/, "")
                    .replace("-", "/");
            }

            let hours = "";
            const hrsEl = document.querySelector("#storehrsspn");

            if (hrsEl) {
                hours = Array.from(hrsEl.childNodes)
                    .map(n => n.textContent.trim())
                    .filter(Boolean)
                    .join("\n");
            }

            const phone = getPhoneFromAddressBlock();

            return {
                store: store.toUpperCase(),
                customer: customer.toUpperCase(),
                vehicle: vehicle.toUpperCase(),
                tire: tire.toUpperCase(),
                address: `${address}, ${city}`.toUpperCase(),
                hours: hours.toUpperCase(),
                phone: phone,
                services: getServices()
            };
        }

        function pushData(data) {
            if (!data) return;

            const payload = JSON.stringify({
                store: data.store,
                customer: data.customer,
                address: data.address,
                phone: data.phone,
                vehicle: data.vehicle,
                tire: data.tire
            });

            if (payload === lastPayload) return;

            lastPayload = payload;
            GM_setValue("callInfo", data);
        }

        const observer = new MutationObserver(() => {
            const data = getData();
            if (data) pushData(data);
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Services polling
        setInterval(() => {
            const data = getData();
            if (!data) return;

            const servicesStr = (data.services || []).join("|");

            if (servicesStr !== lastServices) {
                lastServices = servicesStr;
                GM_setValue("callInfo", data);
            }
        }, 5000);
   // =========================================================
// ================= CALL INFO BUTTON =======================
// =========================================================

let callInfoWindowRef = null;

function addCallInfoButton() {
    // find the existing Map button
    const mapBtn = document.querySelector("#map-btn");
    if (!mapBtn) return;

    // prevent duplicates
    if (document.getElementById("call-info-btn")) return;

    // create button
    const btn = document.createElement("button");
    btn.id = "call-info-btn";
    btn.className = "nav-btn-font nav-btn";
    btn.innerText = "Call Info";
    btn.style.marginLeft = "8px";

    btn.onclick = () => {
        const url = "https://example.com/";

        // reuse window if open
        if (callInfoWindowRef && !callInfoWindowRef.closed) {
            callInfoWindowRef.focus();
        } else {
            callInfoWindowRef = window.open(url, "BBT_CALL_INFO_WINDOW", "width=500,height=600");
        }
    };

    // insert after map button
    mapBtn.insertAdjacentElement("afterend", btn);
}

// run once
addCallInfoButton();

// 🔥 keep it alive across UI changes
const navObserver = new MutationObserver(() => {
    addCallInfoButton();
});

navObserver.observe(document.body, {
    childList: true,
    subtree: true
}); }

    // =========================================================
    // ======================= UI SIDE ==========================
    // =========================================================
    if (isUI) {

        let mapWindowRef = null;

        document.body.innerHTML = `
        <style>
            body { margin:0; padding:8px; background:#0e0e0e; display:flex; }
            .container { width:2000px; font-family:Segoe UI; font-size:13px; line-height:1.85; color:white; }
            .row { display:flex; gap:40px; margin-bottom:6px; }
            .label { width:55px; font-weight:600; color:#aaa; }
            textarea { width:400px; height:80px; background:#1a1a1a; color:white; border:1px solid #333; padding:6px; }
            button { margin-top:10px; margin-right:10px; background:#222; color:white; border:1px solid #444; padding:6px 10px; cursor:pointer; }
            #hours { white-space:pre-line; }
        </style>

        <div class="container">
            <div class="row"><span class="label">STORE</span><span id="store"></span></div>
            <div class="row"><span class="label">HOURS</span><span id="hours"></span></div>

            <div class="row"><span class="label">ADDRESS</span><span id="address1"></span></div>
            <div class="row"><span class="label"></span><span id="address2"></span></div>

            <div class="row"><span class="label">CUSTOMER</span><span id="customer"></span></div>
            <div class="row"><span class="label">PHONE</span><span id="phone"></span></div>
            <div class="row"><span class="label">VEHICLE</span><span id="vehicle"></span></div>
            <div class="row"><span class="label">TIRE</span><span id="tire"></span></div>

            <div class="row"><span class="label">SERVICES</span><span id="services"></span></div>

            <div class="row"><span class="label">NOTES</span></div>
            <textarea id="notes"></textarea>

            <button id="mapBtn">Map</button>
            <button id="logBtn">Call Log</button>
        </div>
        `;

        const notesEl = document.getElementById("notes");
        let callHistory = JSON.parse(localStorage.getItem("callHistory") || "[]");

        let lastPayload = "";
        let emptyTimer = null;
        let currentCallStore = null;
        let currentData = null;

        function logCall(data) {
            if (!data || !data.store) return;

            callHistory.push({
                time: new Date().toLocaleString(),
                ...data,
                notes: notesEl.value || ""
            });

            if (callHistory.length > 50) callHistory.shift();
            localStorage.setItem("callHistory", JSON.stringify(callHistory));
        }

        // 🔥 CONTROLLED MAP POPUP (iframe)
        document.getElementById("mapBtn").onclick = () => {
            const addr = address1.innerText + ", " + address2.innerText;
            if (!addr.trim()) return;

            const encoded = encodeURIComponent(addr);

            if (!mapWindowRef || mapWindowRef.closed) {
                mapWindowRef = window.open("", "BBT_MAP_POPUP", "width=900,height=700");
            }

            if (!mapWindowRef) return;

            mapWindowRef.document.open();
            mapWindowRef.document.write(`
                <html>
                <head>
                    <title>Map</title>
                    <style>
                        body { margin:0; background:#000; }
                        iframe { width:100%; height:100vh; border:none; }
                    </style>
                </head>
                <body>
                    <iframe src="https://www.google.com/maps?q=${encoded}&output=embed"></iframe>
                </body>
                </html>
            `);
            mapWindowRef.document.close();
            mapWindowRef.focus();
        };

        document.getElementById("logBtn").onclick = () => {
            const win = window.open("", "CallLog", "width=500,height=600");

            let html = "<body style='background:#0e0e0e;color:white;font-family:Segoe UI'>";
            callHistory.slice().reverse().forEach(e => {
                html += `<div style="margin-bottom:10px;border-bottom:1px solid #333">
                    <b>${e.time}</b><br>
                    ${e.store} - ${e.customer}<br>
                    ${e.phone}<br>
                    ${e.address}<br>
                    SERVICES: ${(e.services || []).join(", ")}<br>
                    Notes: ${e.notes || ""}
                </div>`;
            });

            win.document.write(html);
        };

        function isValid(data) {
            return data && data.store && data.address;
        }

        function clearUI() {
            if (currentData && currentData.store) {
                logCall(currentData);
            }

            store.innerText = "";
            hours.innerText = "";
            address1.innerText = "";
            address2.innerText = "";
            customer.innerText = "";
            phone.innerText = "";
            vehicle.innerText = "";
            tire.innerText = "";
            services.innerText = "";

            notesEl.value = "";
            currentCallStore = null;
            currentData = null;
        }

        function updateUI(data) {
            if (!data || !isValid(data)) return;

            const payload = JSON.stringify(data);
            if (payload === lastPayload) return;

            if (currentCallStore && currentCallStore !== data.store && currentData) {
                logCall(currentData);
            }

            currentCallStore = data.store;
            currentData = data;
            lastPayload = payload;

            store.innerText = data.store;
            hours.innerText = data.hours;

            const parts = data.address.split(",");
            address1.innerText = parts[0];
            address2.innerText = parts.slice(1).join(",").trim();

            customer.innerText = data.customer;
            phone.innerText = data.phone;
            vehicle.innerText = data.vehicle;
            tire.innerText = data.tire;
            services.innerText = (data.services || []).join(", ");
        }

        const initial = GM_getValue("callInfo", null);
        if (initial) updateUI(initial);

        GM_addValueChangeListener("callInfo", (k, o, n) => {
            if (n && n.store) {
                if (emptyTimer) {
                    clearTimeout(emptyTimer);
                    emptyTimer = null;
                }

                if (isValid(n)) updateUI(n);
                return;
            }

            if (!emptyTimer) {
                emptyTimer = setTimeout(() => {
                    clearUI();
                    emptyTimer = null;
                }, 2000);
            }
        });
    }

})();