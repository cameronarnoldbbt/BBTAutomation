// ==UserScript==
// @name         Auto Coupon Applier (AddSingleItem Fallback)
// @version      2.1
// @updateURL    https://github.com/cameronarnoldbbt/BBTAutomation/raw/refs/heads/main/Auto%20Coupon%20Applier%20(Final%20Stable%20w-%20Close%20Fix)-0.0.user.js
// @downloadURL  https://github.com/cameronarnoldbbt/BBTAutomation/raw/refs/heads/main/Auto%20Coupon%20Applier%20(Final%20Stable%20w-%20Close%20Fix)-0.0.user.js
// @match        *://edge.bigbrandtire.com/pos/invoice/*
// @grant        none
// ==/UserScript==


(function () {
    'use strict';

    console.log("Auto Coupon System Initialized (modal test)");

    let couponTabLoaded = false;
    let weOpenedCouponTab = false;

    let oilAttempted = false;
    let alignAttempted = false;

    // ===== NEW: disable flag =====
    let couponDisabled = false;

    // ===== NEW: disable ONLY on Add Package click =====
    document.addEventListener('click', function (e) {
        var btn = e.target.closest('a.btn.btn-app');
        if (!btn) return;

        var text = (btn.innerText || "").trim();

        if (text === "Add Package") {
            couponDisabled = true;
            console.log("[TM] Disabled via Add Package click");
        }
    });

    function hasText(text) {
        return Array.from(document.querySelectorAll('td'))
            .some(function (td) { return td.innerText.includes(text); });
    }

    function findRowByText(text) {
        return Array.from(document.querySelectorAll('tr'))
            .find(function (r) { return r.innerText.includes(text); });
    }

    function flipToNegative(code) {
        var row = findRowByText(code);
        if (!row) return;

        var input = row.querySelector('input[type="number"]');
        if (!input) return;

        if (input.value === '-1') return;

        input.value = -1;

        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        input.dispatchEvent(new Event('blur', { bubbles: true }));

        console.log("[TM] Flipped " + code + " to -1");
    }

    function clickCoupon(code) {
        var btn = Array.from(document.querySelectorAll('td'))
            .find(function (td) { return td.innerText.includes(code); })
            ?.closest('tr')
            ?.querySelector('button.btn-success');

        if (btn) {
            btn.click();
            console.log("Clicked coupon:", code);
            return true;
        }

        return false;
    }

    function sleep(ms) {
        return new Promise(function (resolve) {
            setTimeout(resolve, ms);
        });
    }

    function couponsExist() {
        return document.querySelectorAll('button.btn-success').length > 0;
    }

    async function closeCouponModal() {
        await sleep(300);

        var modal = document.querySelector('.modal.in, .modal.show');
        if (!modal) return;

        var btn = modal.querySelector('button[data-dismiss="modal"]');
        if (btn) {
            btn.click();
            console.log("Closed coupon modal");
        }
    }

    async function ensureCouponTabLoaded() {
        if (couponTabLoaded) return;

        console.log("Loading coupon tab...");

        var tab = Array.from(document.querySelectorAll('a, button'))
            .find(function (el) {
                return el.innerText.toLowerCase().includes('coupon');
            });

        if (!tab) return;

        tab.click();
        weOpenedCouponTab = true;

        for (var i = 0; i < 10; i++) {
            await sleep(300);
            if (couponsExist()) {
                couponTabLoaded = true;
                console.log("Coupon tab loaded");
                return;
            }
        }
    }

    async function run() {

        // ===== NEW: STOP if disabled =====
        if (couponDisabled) return;

        var hasOil = hasText('VSTOIL');
        var hasAlign = hasText('LABAP') || hasText('LABAS');

        var hasOilCoupon = hasText('4HG7KL9');
        var hasAlignCoupon = hasText('MZ435AL');

        if (hasOil && !hasOilCoupon && !oilAttempted) {
            oilAttempted = true;

            await ensureCouponTabLoaded();

            var success = clickCoupon('4HG7KL9');

            if (!success) {
                if (weOpenedCouponTab) await closeCouponModal();

                if (typeof addSingleItem === 'function') {
                    addSingleItem(101002);
                    await sleep(400);
                    flipToNegative('4HG7KL9');
                }
            }

            return;
        }

        if (hasAlign && !hasAlignCoupon && !alignAttempted) {
            alignAttempted = true;

            await ensureCouponTabLoaded();

            var success = clickCoupon('MZ435AL');

            if (!success) {
                if (weOpenedCouponTab) await closeCouponModal();

                if (typeof addSingleItem === 'function') {
                    addSingleItem(101004);
                    await sleep(400);
                    flipToNegative('MZ435AL');
                }
            }

            return;
        }
    }

    var observer = new MutationObserver(function () {
        run();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    setTimeout(run, 1000);

})();

