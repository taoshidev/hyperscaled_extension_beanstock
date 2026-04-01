// Pure utility functions — formatting, parsing, leverage calculations, input detection
(() => {
  const HF = window.__HF;
  const { ACCOUNT } = HF.state;

  function marginLimitBasisUsd() {
    const walletEquity = Number(ACCOUNT.hlEquity) || 0;
    const openNotional = Number(ACCOUNT.openTotalUsed) || 0;
    return walletEquity + openNotional;
  }

  function perPositionLeverageCap() {
    return ACCOUNT.inChallenge ? 0.625 : 2.5;
  }

  function totalPositionLeverageCap() {
    return ACCOUNT.inChallenge ? 1.25 : 5;
  }

  function resolveChallengeModeFromValidator(result) {
    const candidates = [
      result?.challenge_period?.bucket,
      result?.challenge_period?.status,
      result?.subaccount_status,
      result?.account_size_data?.status,
    ]
      .filter((v) => typeof v === "string")
      .map((v) => v.toUpperCase());

    if (candidates.some((v) => v.includes("FUNDED"))) return false;
    if (candidates.some((v) => v.includes("CHALLENGE") || v.includes("EVAL"))) return true;
    return ACCOUNT.inChallenge;
  }

  function effectiveMaxSingleUsd() {
    const modeCap = marginLimitBasisUsd() * perPositionLeverageCap();
    if (HF.state.limitsLoaded && ACCOUNT.maxPositionPerPair > 0) {
      return Math.min(modeCap, ACCOUNT.maxPositionPerPair);
    }
    return modeCap;
  }

  function effectiveMaxTotalUsd() {
    const modeCap = marginLimitBasisUsd() * totalPositionLeverageCap();
    if (HF.state.limitsLoaded && ACCOUNT.maxPortfolio > 0) {
      return Math.min(modeCap, ACCOUNT.maxPortfolio);
    }
    return modeCap;
  }

  const fmt = (n) =>
    "$" +
    Number(n).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const pct = (used, max) => max > 0 ? Math.min((used / max) * 100, 100).toFixed(1) : "0.0";
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

  function parseNumber(raw) {
    if (!raw) return 0;
    const s = raw.toString().trim();
    if (!s) return 0;
    const cleaned = s.replace(/,/g, "").replace(/\$/g, "");
    const v = parseFloat(cleaned);
    return Number.isFinite(v) ? v : 0;
  }

  function getHLLeverage() {
    const buttons = document.querySelectorAll('button');
    for (const btn of buttons) {
      if (btn.closest('#' + HF.state.BANNER_ID)) continue;
      const text = (btn.textContent || '').trim();
      const match = text.match(/^(\d+(?:\.\d+)?)x$/i);
      if (match) return parseFloat(match[1]);
    }
    return 1;
  }

  function getSizeUnit() {
    const container = document.querySelector('[data-testid="sz-input"]');
    if (!container) return 'USD';
    const divs = [...container.querySelectorAll('div')].filter(d => {
      if (d.children.length > 1) return false;
      if (d.children.length === 1 && d.children[0].tagName.toLowerCase() !== 'svg') return false;
      return true;
    });
    for (const d of divs) {
      const t = (d.textContent || '').trim().toUpperCase();
      if (!t || t === 'SIZE') continue;
      if (t === 'USD' || t === 'USDC') return 'USD';
      if (/^[A-Z]{2,10}$/.test(t)) return t;
    }
    return 'USD';
  }

  function getCurrentSymbol() {
    const urlMatch = location.pathname.match(/\/trade\/(@?\w+)/);
    if (urlMatch) {
      return urlMatch[1].replace(/^@/, "").toUpperCase();
    }

    const titleMatch = document.title.match(/^([A-Z0-9]+)\s*[\|–—]/);
    if (titleMatch) {
      return titleMatch[1].toUpperCase();
    }

    const candidates = document.querySelectorAll(
      'header *, [class*="asset"] *, [class*="pair"] *, [class*="symbol"] *, ' +
      '[class*="market"] *, [class*="coin"] *, [class*="ticker"] *'
    );
    for (const el of candidates) {
      if (el.children && el.children.length > 0) continue;
      const txt = (el.textContent || "").trim().toUpperCase();
      const m = txt.match(/^([A-Z]{2,10})(?:[\/\-](?:USD[CT]?|PERP))?$/);
      if (m) return m[1];
    }

    const allEls = document.querySelectorAll("span, div, a, button, p");
    for (const el of allEls) {
      if (el.children && el.children.length > 0) continue;
      if (el.offsetParent === null) continue;
      const txt = (el.textContent || "").trim();
      if (txt.length > 20) continue;
      const m = txt.match(/^([A-Z]{2,10})\s*[\/-]\s*(USDC|USD|PERP)$/i);
      if (m) return m[1].toUpperCase();
    }

    return null;
  }

  function inputToNotional(inputValue) {
    if (inputValue <= 0) return 0;
    const unit = getSizeUnit();
    if (unit === 'USD' || unit === 'USDC') return inputValue;
    const symbol = getCurrentSymbol();
    const price = symbol ? (HF.state.midPrices[symbol] || 0) : 0;
    return price > 0 ? inputValue * price : 0;
  }

  function notionalToInput(notional) {
    if (notional <= 0) return 0;
    const unit = getSizeUnit();
    if (unit === 'USD' || unit === 'USDC') return notional;
    const symbol = getCurrentSymbol();
    const price = symbol ? (HF.state.midPrices[symbol] || 0) : 0;
    return price > 0 ? notional / price : 0;
  }

  function readOrderValueFromDOM() {
    const allDivs = document.querySelectorAll('div');
    for (const div of allDivs) {
      if (div.children.length > 0) continue;
      if ((div.textContent || '').trim() !== 'Order Value') continue;
      const row = div.parentElement;
      if (!row) continue;
      for (const sibling of row.children) {
        if (sibling === div) continue;
        const text = (sibling.textContent || '').trim();
        if (text === 'N/A' || !text) return 0;
        return parseNumber(text);
      }
    }
    return 0;
  }

  function isSizeInput(input) {
    if (!(input instanceof HTMLInputElement)) return false;
    return !!input.closest('[data-testid="sz-input"]');
  }

  function isLikelySizeInput(input) {
    if (!(input instanceof HTMLInputElement)) return false;
    if (isSizeInput(input)) return true;
    const hint = (
      (input.placeholder || "") + " " + (input.getAttribute("aria-label") || "")
    ).toLowerCase();
    if (hint.includes("qty") || hint.includes("quantity") || hint.includes("size") || hint.includes("amount")) {
      return true;
    }
    const name = (input.name || "").toLowerCase();
    if (name.includes("qty") || name.includes("quantity") || name.includes("size") || name.includes("amount")) {
      return true;
    }
    return false;
  }

  function isLiveEditableInput(input) {
    return (
      input instanceof HTMLInputElement &&
      input.isConnected &&
      !input.disabled &&
      input.offsetParent !== null
    );
  }

  const CLAMP_DEBUG = (() => {
    try {
      return window.HF_CLAMP_DEBUG === true || localStorage.getItem("hf_clamp_debug") === "1";
    } catch (_) {
      return window.HF_CLAMP_DEBUG === true;
    }
  })();

  function clampDebug(event, details = {}) {
    if (!CLAMP_DEBUG) return;
    console.log("[Hyperscaled][ClampDebug]", event, details);
  }

  function describeInput(input) {
    if (!(input instanceof HTMLInputElement)) {
      return { kind: "none" };
    }
    return {
      className: (input.className || "").trim(),
      name: input.name || "",
      placeholder: input.placeholder || "",
      value: input.value,
      connected: input.isConnected,
      active: input === document.activeElement,
      inSizeContainer: !!input.closest('[data-testid="sz-input"]'),
      wrapperClass: (input.closest(".sc-fEXmlR")?.className || "").trim(),
    };
  }

  function inputContextSignature(input) {
    if (!(input instanceof HTMLInputElement)) return { className: "", wrapperClass: "" };
    return {
      className: (input.className || "").trim(),
      wrapperClass: (input.closest(".sc-fEXmlR")?.className || "").trim(),
    };
  }

  function withinTolerance(a, b, toleranceBase = Math.max(Math.abs(b) * 0.001, 1e-6)) {
    return Math.abs(a - b) <= toleranceBase;
  }

  function formatSizeForToast(value, unit) {
    if (unit === undefined) unit = getSizeUnit();
    if (!Number.isFinite(value) || value <= 0) return "0";
    if (unit === "USD" || unit === "USDC") {
      return Number(value).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
    return parseFloat(Number(value).toFixed(6)).toString();
  }

  HF.utils = {
    marginLimitBasisUsd,
    perPositionLeverageCap,
    totalPositionLeverageCap,
    resolveChallengeModeFromValidator,
    effectiveMaxSingleUsd,
    effectiveMaxTotalUsd,
    fmt,
    pct,
    clamp,
    parseNumber,
    getHLLeverage,
    getSizeUnit,
    getCurrentSymbol,
    inputToNotional,
    notionalToInput,
    readOrderValueFromDOM,
    isSizeInput,
    isLikelySizeInput,
    isLiveEditableInput,
    CLAMP_DEBUG,
    clampDebug,
    describeInput,
    inputContextSignature,
    withinTolerance,
    formatSizeForToast,
  };
})();
