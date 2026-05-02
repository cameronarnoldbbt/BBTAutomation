// ==UserScript==
// @name         Auto Coupon Applier (Final Stable w/ Close Fix)
// @match        *://edge.bigbrandtire.com/pos/invoice/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    console.log("Auto Coupon System Initialized");

    // =========================
    // STATE
    // =========================
    let couponTabLoaded = false;
    let weOpenedCouponTab = false;

    let oilAttempted = false;
    let alignAttempted = false;

    // =========================
    // HELPERS
    // =========================

    function hasText(text) {
        return [...document.querySelectorAll('td')]
            .some(td => td.innerText.includes(text));
    }

    function clickCoupon(code) {
        const btn = [...document.querySelectorAll('td')]
            .find(td => td.innerText.includes(code))
            ?.closest('tr')
            ?.querySelector('button.btn-success');

        if (btn) {
            btn.click();
            console.log("Clicked coupon:", code);
            return true;
        }

        return false;
    }

    async function manualAdd(code) {
        const input = document.querySelector('#quickAddBtn');
        if (!input) return false;

        input.focus();
        input.value = code;

        input.dispatchEvent(new Event('input', { bubbles: true }));

        await sleep(150);

        ['keydown','keypress','keyup'].forEach(type => {
            input.dispatchEvent(new KeyboardEvent(type, {
                key: 'Enter',
                code: 'Enter',
                keyCode: 13,
                which: 13,
                bubbles: true
            }));
        });

        console.log("Manual add:", code);
        return true;
    }

    function sleep(ms) {
        return new Promise(r => setTimeout(r, ms));
    }

    function couponsExist() {
        return document.querySelectorAll('button.btn-success').length > 0;
    }

    // 🔥 NEW: Close only visible modal (with delay safety)
    async function closeCouponModal() {
        await sleep(300); // allow UI to settle

        const modal = document.querySelector('.modal.in, .modal.show');
        if (!modal) {
            console.warn("No visible modal found");
            return;
        }

        const btn = modal.querySelector('button[data-dismiss="modal"]');
        if (btn) {
            btn.click();
            console.log("Closed coupon modal");
        } else {
            console.warn("Close button not found in modal");
        }
    }

    // =========================
    // LOAD COUPON TAB
    // =========================
    async function ensureCouponTabLoaded() {
        if (couponTabLoaded) return;

        console.log("Loading coupon tab...");

        const tab = [...document.querySelectorAll('a, button')]
            .find(el => el.innerText.toLowerCase().includes('coupon'));

        if (!tab) {
            console.warn("Coupon tab not found");
            return;
        }

        tab.click();
        weOpenedCouponTab = true;

        for (let i = 0; i < 10; i++) {
            await sleep(300);
            if (couponsExist()) {
                couponTabLoaded = true;
                console.log("Coupon tab loaded");
                return;
            }
        }

        console.warn("Coupon tab failed to load");
    }

    // =========================
    // CORE LOGIC
    // =========================
    async function run() {

        const hasOil = hasText('VSTOIL');
        const hasAlign = hasText('LABAP') || hasText('LABAS');

        const hasOilCoupon = hasText('4HG7KL9');
        const hasAlignCoupon = hasText('MZ435AL');

        // =========================
        // OIL FLOW
        // =========================
        if (hasOil && !hasOilCoupon && !oilAttempted) {
            oilAttempted = true;

            await ensureCouponTabLoaded();

            const success = clickCoupon('4HG7KL9');

            if (!success) {
                if (weOpenedCouponTab) await closeCouponModal();
                await manualAdd('4HG7KL9');
            }

            return;
        }

        // =========================
        // ALIGNMENT FLOW
        // =========================
        if (hasAlign && !hasAlignCoupon && !alignAttempted) {
            alignAttempted = true;

            await ensureCouponTabLoaded();

            const success = clickCoupon('MZ435AL');

            if (!success) {
                if (weOpenedCouponTab) await closeCouponModal();
                await manualAdd('MZ435AL');
            }

            return;
        }
    }

    // =========================
    // OBSERVER
    // =========================
    const observer = new MutationObserver(() => {
        run();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Initial run
    setTimeout(run, 1000);

})();