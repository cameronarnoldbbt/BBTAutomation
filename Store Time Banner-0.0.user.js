// ==UserScript==
// @name         Store Time Banner
// @match        *://edge.bigbrandtire.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

 const stateToTZ = {
    CA: { tz: "America/Los_Angeles", name: "CALIFORNIA" },
    TX: { tz: "America/Chicago", name: "TEXAS" },
    UT: { tz: "America/Denver", name: "UTAH" },
    AZ: { tz: "America/Phoenix", name: "ARIZONA" },
    CO: { tz: "America/Denver", name: "COLORADO" },
    NV: { tz: "America/Los_Angeles", name: "NEVADA" }
  };

  function getStateFromText(text) {
    const match = text.match(/,\s*([A-Z]{2})\s/);
    return match ? match[1] : null;
  }

  function getTime(tz) {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    }).format(new Date());
  }

  function injectBanner() {
    const storeEl = document.getElementById("storecsspn");
    const container = document.querySelector("#appointmentGrid_wrapper");

    if (!storeEl || !container) return;

    // prevent duplicate
    if (document.getElementById("store-time-banner")) return;

    const state = getStateFromText(storeEl.innerText);
    if (!state || !stateToTZ[state]) return;

    const { tz, name } = stateToTZ[state];
    const time = getTime(tz);

    const banner = document.createElement("div");
    banner.id = "store-time-banner";

    banner.innerText = `TIME IN ${name} ${time}`;

    banner.style.color = "red";
    banner.style.fontWeight = "bold";
    banner.style.fontSize = "16px";
    banner.style.marginBottom = "6px";

    container.prepend(banner);

    console.log("Time banner injected:", banner.innerText);
  }

  function init() {
    // retry because UI is dynamic
    const interval = setInterval(() => {
      injectBanner();

      if (document.getElementById("store-time-banner")) {
        clearInterval(interval);
      }
    }, 1000);
  }

  init();

})();
