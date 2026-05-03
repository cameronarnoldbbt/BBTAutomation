// ==UserScript==
// @name         Auto Coupon Applier (AddSingleItem Fallback)
// @match        *://edge.bigbrandtire.com/pos/invoice/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    console.log("Auto Coupon System Initialized (Updated)");

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

    function findRowByText(text) {
        return [...document.querySelectorAll('tr')]
            .find(r => r.innerText.includes(text));
    }

    function flipToNegative(code) {
        const row = findRowByText(code);
        if (!row) return;

        const input = row.querySelector('input[type="number"]');
        if (!input) return;

        if (input.value === '-1') return;

        input.value = -1;

        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        input.dispatchEvent(new Event('blur', { bubbles: true }));

        console.log(`[TM] Flipped ${code} to -1`);
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

    function sleep(ms) {
        return new Promise(r => setTimeout(r, ms));
    }

    function couponsExist() {
        return document.querySelectorAll('button.btn-success').length > 0;
    }

    async function closeCouponModal() {
        await sleep(300);

        const modal = document.querySelector('.modal.in, .modal.show');
        if (!modal) return;

        const btn = modal.querySelector('button[data-dismiss="modal"]');
        if (btn) {
            btn.click();
            console.log("Closed coupon modal");
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

        if (!tab) return;

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
    }

    // =========================
    // MAIN LOGIC
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

                console.log("[TM] Fallback → addSingleItem (Oil)");

                if (typeof addSingleItem === 'function') {
                    addSingleItem(101002); // adjust if needed
                    await sleep(400);
                    flipToNegative('4HG7KL9');
                }
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

                console.log("[TM] Fallback → addSingleItem (Alignment)");

                if (typeof addSingleItem === 'function') {
                    addSingleItem(101004);
                    await sleep(400);
                    flipToNegative('MZ435AL');
                }
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

    setTimeout(run, 1000);

})();
