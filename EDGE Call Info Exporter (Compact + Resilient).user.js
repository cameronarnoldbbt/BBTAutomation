// ==UserScript==
// @name EDGE Call Info Exporter (Compact + Resilient)
// @match *://edge.bigbrandtire.com/*
// ==/UserScript==

(function() {
    let lastData = "";
    let currentTitle = "";
    let lastCustomer = "";

    function cleanCity(str) {
        return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
    }

    function getData() {
        const numEl = document.getElementById("storenospn");
        const addrEl = document.getElementById("storeaddspn");
        const cityEl = document.getElementById("storecsspn");

        // --- Tire (new source) ---
const tireEl = document.getElementById("TireSizeSelector");

let tire = "";

if (tireEl && tireEl.innerText.trim() !== "") {
    tire = tireEl.innerText.trim();

    // Remove leading letter (like "B ")
    tire = tire.replace(/^[A-Z]\s+/, "");

    // Convert dash to slash (first dash only)
    tire = tire.replace("-", "/");
}

        // --- Customer (handles BOTH DOM states) ---
        const newCustomer =
            document.querySelector(".cust-card-name")?.innerText?.trim() ||
            document.getElementById("customerFirstname")?.innerText?.trim() ||
            "";

        if (newCustomer !== "")
            lastCustomer = newCustomer;

        const customer = lastCustomer;

        // --- Vehicle (year + model) ---
        const yearMakeEl = document.getElementById("yearMake");
        const modelEl = document.getElementById("modelClass");

        let vehicle = "";
        if (yearMakeEl && modelEl) {
            vehicle = `${yearMakeEl.innerText.trim()} ${modelEl.innerText.trim()}`;
        }

        if (!numEl || !addrEl || !cityEl) return null;

        const store = numEl.innerText.replace("Store #", "").trim();
        const address = addrEl.innerText.trim();
        const city = cleanCity(cityEl.innerText.trim());

        return {
            store: store || "",
            address: `${address}, ${city}`,
            customer: customer || "",
            vehicle: vehicle || "",
            tire: tireEl ? tireEl.innerText.trim() : ""
        };
    }

    function formatData(data) {
        return `[EDGE] S:${data.store}|C:${data.customer}|T:${data.tire}|V:${data.vehicle}|A:${data.address}`;
    }

    function exportData(data) {
        const formatted = formatData(data);

        if (formatted === lastData) return;
        lastData = formatted;
        currentTitle = formatted;

        // Store internally (optional)
        localStorage.setItem("call_info", formatted);

        // Send to AHK via title
        document.title = formatted;
    }

    // Keep title stable (EDGE overwrites it)
    setInterval(() => {
        if (currentTitle && document.title !== currentTitle) {
            document.title = currentTitle;
        }
    }, 400);

    // Watch for DOM changes
    const observer = new MutationObserver(() => {
        const data = getData();
        if (data) exportData(data);
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
})();