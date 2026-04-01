// Toast notification system for order clamping/blocking
(() => {
  const HF = window.__HF;

  let activeClampToast = null;
  let blockedToastDismissed = false;

  function showClampToast(details) {
    const { fmt, effectiveMaxSingleUsd, formatSizeForToast, getSizeUnit } = HF.utils;
    const requested = Number(details?.requestedNotional) || 0;
    const allowed = Number(details?.allowedNotional) || 0;
    const constraint = details?.constraint || "portfolio";
    const requestedSize = Number(details?.requestedSize) || 0;
    const clampedSize = Number(details?.clampedSize) || 0;
    const sizeUnit = details?.sizeUnit || getSizeUnit();
    const isBlockedOnly = details?.blocked === true;

    if (isBlockedOnly && blockedToastDismissed) return;

    let messageHtml = "Order exceeds your <b>" + constraint + " position size limit</b>.";
    let titleHtml = "Hyperscaled: Size clamped to " + formatSizeForToast(clampedSize, sizeUnit) + " " + sizeUnit;
    let iconHtml = "\u26a0\ufe0f";
    let variantClass = "hf-toast hf-toast--alert";

    if (allowed === 0) {
       titleHtml = "Hyperscaled: Order Prevented";
       messageHtml =
         "No remaining capacity within your <b>" + constraint + "</b> position limit.";
       iconHtml = "\u26d4";
       variantClass = "hf-toast hf-toast--warning";
    } else if (isBlockedOnly) {
       titleHtml = "Order Blocked";
       messageHtml = "Reduce to <b>" + formatSizeForToast(clampedSize, sizeUnit) + " " + sizeUnit + "</b> or less.";
       iconHtml = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="#f87171" stroke-width="1.5"/><line x1="5" y1="5" x2="11" y2="11" stroke="#f87171" stroke-width="1.5" stroke-linecap="round"/></svg>';
       variantClass = "hf-toast hf-toast--blocked";
    } else if (constraint === 'per-pair') {
       messageHtml = "Single-asset limit is <b>" + fmt(effectiveMaxSingleUsd()) + "</b>. Size " +
         formatSizeForToast(requestedSize, sizeUnit) + " " + sizeUnit + " should be reduced to " +
         formatSizeForToast(clampedSize, sizeUnit) + " " + sizeUnit + ".";
    } else {
       messageHtml = "Portfolio capacity allows <b>" + fmt(allowed) + "</b>. Size " +
         formatSizeForToast(requestedSize, sizeUnit) + " " + sizeUnit + " should be reduced to " +
         formatSizeForToast(clampedSize, sizeUnit) + " " + sizeUnit + ".";
    }

    const showClose = isBlockedOnly;
    const innerHtml =
      '<div class="hf-toast-icon">' + iconHtml + '</div>' +
      '<div class="hf-toast-content">' +
        '<div class="hf-toast-title">' + titleHtml + '</div>' +
        '<div class="hf-toast-msg">' + messageHtml + '</div>' +
      '</div>' +
      (showClose ? '<button class="hf-toast-close" type="button" aria-label="Dismiss">' +
        '<svg width="10" height="10" viewBox="0 0 10 10" fill="none">' +
          '<line x1="1" y1="1" x2="9" y2="9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
          '<line x1="9" y1="1" x2="1" y2="9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
        '</svg>' +
      '</button>' : '');

    if (activeClampToast && activeClampToast.parentNode) {
      activeClampToast.className = variantClass + " hf-toast-show";
      activeClampToast.innerHTML = innerHtml;
      return;
    }

    let container = document.getElementById("hf-toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "hf-toast-container";
      container.className = "hf-toast-container";
      (document.body || document.documentElement).appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = variantClass;
    toast.innerHTML = innerHtml;

    container.appendChild(toast);
    activeClampToast = toast;

    toast.addEventListener("click", function(e) {
      if (e.target.closest(".hf-toast-close")) {
        e.stopPropagation();
        blockedToastDismissed = true;
        dismissClampToast();
      }
    });

    void toast.offsetWidth;
    toast.classList.add("hf-toast-show");
  }

  function dismissClampToast() {
    if (!activeClampToast) return;
    const toast = activeClampToast;
    activeClampToast = null;
    toast.classList.remove("hf-toast-show");
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }

  function resetBlockedToastDismissed() {
    blockedToastDismissed = false;
  }

  function isBlockedToastDismissed() {
    return blockedToastDismissed;
  }

  HF.toast = {
    showClampToast,
    dismissClampToast,
    resetBlockedToastDismissed,
    isBlockedToastDismissed,
  };
})();
