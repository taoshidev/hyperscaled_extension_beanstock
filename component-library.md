# Component Library

Recurring UI patterns in `popup.html` / `popup.css`. Use these structures when adding new UI. Each section describes the pattern, its full HTML, and the CSS tokens it consumes.

---

## Trading Capacity Block

A header-bar-footer layout displaying the trader's used vs. remaining position capacity. Uses an indigo bar (distinct from teal/amber) to signal a neutral utilization metric.

### HTML structure

```html
<div class="capacity-block">
    <div class="capacity-header">
        <span class="capacity-title">Trading Capacity</span>
        <span class="capacity-rule">62.5% / 125% LIMITS</span>
    </div>
    <div class="capacity-bar">
        <div class="capacity-fill" style="width: 11.4%;"></div>
    </div>
    <div class="capacity-footer">
        <span class="capacity-used">$234.50 used</span>
        <span class="capacity-remaining">$1,822.59 left</span>
    </div>
</div>
```

### Tokens used

| Element | Property | Token / Value |
|---------|----------|---------------|
| Title | Font size / weight | `14px / 600` |
| Title | Color | `--text-strong` |
| Limits badge | Border | `--border-outer` |
| Limits badge | Color | `--text-strong` |
| Limits badge | Padding | `4px 8px` |
| Bar track | Background | `--indigo-bg` |
| Bar fill | Gradient | `linear-gradient(90deg, --indigo, #4041c8)` |
| Bar height | — | `10px` |
| Footer labels | Color | `--text-faint` |
| Footer labels | Font size | `11px` |

### Rules

- Never use teal or amber for this bar — indigo keeps capacity visually separate from P&L and challenge indicators.
- Footer is always `$X used` left, `$X left` right. No "of $total" format.
- Bar fill width is set inline via `style="width: XX%;"` calculated from JS.

---

## Metric Section

A self-contained section displaying a single tracked metric with a title/value header, a progress bar, and a sublabel. Used by Challenge Progress and Current Drawdown.

### HTML structure

```html
<div class="section">
  <div class="section-header">
    <div class="section-title">Challenge Progress</div>
    <div class="section-value">6.45% / 10%</div>
  </div>
  <div class="progress-bar">
    <div class="progress-fill" style="width: 61.25%;"></div>
  </div>
  <div class="progress-label">$3,543 to target ($10,000 goal)</div>
</div>
```

### Tokens used

| Property | Token | Notes |
|----------|-------|-------|
| Section title color | `--text-strong` | 13px / 500 (UI font) — primary instrument label |
| Section value color | `--text-body` | 12px / 500 (Menlo, tabular-nums) — primary reading |
| Bar height | — | `10px` — never lower; this is a gauge, not a rule |
| Bar radius | — | `5px` track + fill (must match) |
| Bar spacing | — | `margin-top: 4px`, `margin-bottom: 12px` |
| Bar background | `--bar-bg` | |
| Challenge fill | `--accent` | |
| Sublabel color | `--text-faint` | |

### Variants

**Drawdown variant** — amber fill and amber-tinted bar background:
```html
<div class="section-value drawdown">2.3% / 5%</div>   <!-- amber color -->
<div class="progress-bar drawdown-bar">               <!-- amber bg tint -->
  <div class="progress-fill drawdown-fill" style="width: 46%;"></div>
</div>
```

| Property | Token / value |
|----------|--------------|
| Section value color | `--amber` |
| Bar background | `rgba(251, 191, 36, 0.1)` (amber tint) |
| Fill gradient | `linear-gradient(90deg, #fbbf24, #f59e0b)` |

---

## Wallet Inline (Header)

The wallet address lives in the header once saved — zero screen real estate wasted on setup UI during normal operation. On first run (no address saved), the full `#walletConfig` card is shown below the header.

### Collapsed state (HTML in `.header-right`)

```html
<div id="walletCollapsed" class="wallet-inline" style="display: none;">
  <span id="walletAddressDisplay" class="wallet-inline-address">0x34...abcd</span>
  <button id="walletEdit" class="wallet-inline-edit">· Edit</button>
</div>
```

### Expanded state (shown on first run or when editing)

```html
<div id="walletConfig" class="wallet-config">
  <div class="wallet-config-header">
    <span class="wallet-config-label">Wallet Address</span>
    <span id="walletStatus" class="wallet-status"></span>
  </div>
  <div class="wallet-input-row">
    <input type="text" id="walletAddress" placeholder="0x..." class="wallet-input" spellcheck="false" />
    <button id="walletSave" class="wallet-save-btn">Save</button>
  </div>
</div>
```

### Tokens used

| Element | Property | Token |
|---------|----------|-------|
| Address text | Font | `--font-mono` |
| Address text | Color | `--text-dim` |
| Edit button | Color | `--text-ghost` → `--text-subtle` on hover |

### Rule

Never show the full wallet-config card when an address is already saved. `showWalletCollapsed()` hides `#walletConfig` and reveals the inline element; `showWalletExpanded()` reverses this.

---

## Accent Card Block

Card treatment is **reserved** for:
- Funded Account balance card (primary KPI — the one number that matters most)
- Position cards (grouped interactive data)
- Wallet Config form (setup UI, first-run only)

Everything else — Trading Capacity, Challenge Progress, Drawdown, HL Account, Analytics link — breathes directly on the background. No card needed.

### Position card HTML

```html
<div class="position-card"> ... </div>
```

### Tokens used (position card)

| Property | Token |
|----------|-------|
| Background | `--card-bg` |
| Border | `--border-card` |
| Border radius | `--radius-card` |
| Padding | `16px` uniform |

### Variants

**Primary card** (stronger surface — used by Funded Account balance card):
```css
background: var(--card-bg);
border-color: rgba(255,255,255,0.1);
```

**Position card** (uses `--radius-card`, `--card-bg`, `--border-card`, uniform `16px` padding):
```html
<div class="position-card"> ... </div>
```

Position card PnL typography and color:

| Property | Value |
|----------|-------|
| Font | `--font-ui` (Inter) |
| Size | `12px` |
| Weight | `600` |

| State | Class | Token |
|-------|-------|-------|
| Positive PnL | `.position-pnl.positive` | `--green` |
| Negative PnL | `.position-pnl.negative` | `--red` |

**Rule:** Never render a directional value (P&L, change) in `--text-primary`. Color encodes direction before the user reads a single character — positive must be green, negative must be red.

---

## Accent Button

Reserved for true primary actions. Currently no instances exist in the popup — the badge components (LONG, In Challenge) use `--accent-bg` but are not buttons. If a primary CTA is added in future, use this pattern.

### Tokens used

| State | Property | Token |
|-------|----------|-------|
| Default | Background | `--accent-bg` |
| Default | Border | `--accent-border` |
| Default | Color | `--text-primary` |
| Hover | Background | `--accent-border` |
| Hover | Border | `--accent-hover-border` |
| Transition | All | `0.15s ease` |

### Do not

- Use raw teal (`--accent`) as a button background — it's too loud. Use `--accent-bg` only.
- Use this pattern for utility or debug actions. See Ghost Button and Muted Button below.

---

## Ghost Button

For utility / setup actions that need to be clearly interactive but should not compete for attention. Current instance: `wallet-save-btn`.

### HTML structure

```html
<button class="wallet-save-btn">Save</button>
```

### Tokens used

| State | Property | Token |
|-------|----------|-------|
| Default | Background | `transparent` |
| Default | Border | `--border-card` |
| Default | Color | `--text-subtle` |
| Hover | Background | `transparent` |
| Hover | Border | `--accent-border` |
| Hover | Color | `--text-primary` |
| Transition | All | `0.15s ease` |

### Rule

Hover reveals a teal border as the only accent signal — confirming interactivity without adding teal to the at-rest view.

---

## Muted Button

For debug / developer tools that must exist in production but should not draw attention. Current instance: `test-btn`.

### HTML structure

```html
<button class="test-btn">🔔 Test Notification</button>
```

### Tokens used

| State | Property | Token |
|-------|----------|-------|
| Default | Background | `--card-bg-subtle` |
| Default | Border | `--border-card` |
| Default | Color | `--text-subtle` |
| Hover | Background | `--card-bg` |
| Hover | Border | `rgba(255,255,255,0.1)` |
| Hover | Color | `--text-body` |
| Transition | All | `0.15s ease` |

### Rule

No teal at any state. This button should read as infrastructure, not call-to-action.

---

## Label / Value Pair

A vertically stacked label-above-value pattern used wherever data is displayed: balance cards, position details, capacity rows. Uses `--font-mono` for all financial data.

### HTML structure

```html
<!-- Balance card -->
<div class="balance-label">Funded Account</div>
<div class="balance-value">$106,456.78</div>
<div class="balance-change positive">+$6,456.78 (6.45%)</div>

<!-- Position detail column -->
<div class="detail-col detail-col--left">
  <span class="detail-label">Size</span>
  <span class="detail-value">0.15 BTC</span>
</div>
```

### Tokens used

| Element | Font | Size | Color token |
|---------|------|------|-------------|
| Label | Inter | 11px | `--text-label` |
| Large value | Inter | 22px, tracking -0.44px | `--text-primary` |
| Secondary value | Inter | 18px, tracking -0.36px | `--text-primary` |
| Change — positive | Inter | 12px | `--green` |
| Change — negative | Inter | 12px | `--red` |
| Change — neutral | Inter | 12px | `--text-neutral` |
| Detail label | Menlo | 10px | `--text-dim` |
| Detail value | Menlo | 10px | `--text-light` |

### Rule

All prices, sizes, percentages, and symbols **must** use `--font-mono`. Only UI chrome (labels, descriptions, section titles) uses `--font-ui`.

---

## Collapsible Utility Card

A card that collapses to a single-line summary once the user has completed setup. Reduces prime-real-estate cost of configuration UI that is only needed on first run or when editing. Current instance: Wallet Config.

### States

**Collapsed (default after setup):** A single flex row showing a monospace-truncated identifier, a muted confirmation mark, and a ghost edit icon. The full form is hidden in the DOM.

**Expanded (editing):** The full card content — restores on edit icon click, collapses again on save.

### HTML structure

```html
<div id="walletConfig" class="wallet-config">

  <!-- Collapsed state -->
  <div id="walletCollapsed" class="wallet-collapsed" style="display: none;">
    <span id="walletAddressDisplay" class="wallet-address-display">0x1234...abcd</span>
    <span class="wallet-connected-mark">✓</span>
    <button id="walletEdit" class="wallet-edit-btn" title="Edit address">
      <!-- 12×12 pencil SVG -->
    </button>
  </div>

  <!-- Expanded state -->
  <div id="walletExpanded" class="wallet-expanded">
    <div class="wallet-config-header">
      <span class="wallet-config-label">Wallet Address</span>
      <span id="walletStatus" class="wallet-status"></span>
    </div>
    <div class="wallet-input-row">
      <input type="text" id="walletAddress" placeholder="0x..." class="wallet-input" />
      <button id="walletSave" class="wallet-save-btn">Save</button>
    </div>
  </div>

</div>
```

### Tokens used

| Element | Token |
|---------|-------|
| Card surface | `--card-bg-subtle` / `--border-card` |
| Address text | `--font-mono`, `--text-body` |
| Confirmation mark | `--text-subtle` |
| Edit icon (rest) | `--text-ghost` |
| Edit icon (hover) | `--text-subtle` |

### Rules

- Address is truncated to `0x34...1234` format: `address.slice(0, 4) + '...' + address.slice(-4)` — first 4 chars (0x + 2 hex) + last 4 chars, in monospace.
- The confirmation mark (`✓`) uses `--text-subtle`, not `--accent` — it is a confirmation signal, not a call to action.
- The edit icon uses `--text-ghost` at rest (barely visible) and `--text-subtle` on hover. No teal at any state.
- On save: collapse immediately (do not show a success badge — the collapsed address itself is the confirmation).
- The card's outer padding and border remain identical in both states. Only the inner content swaps.

---

## Spacing Tokens

All spacing in this UI uses a 4px base unit. Never hardcode pixel values for `margin`, `padding`, `gap`, or `inset` — use the token scale.

### Token reference

| Token | px equivalent | Primary use in this UI |
|-------|--------------|------------------------|
| `--space-1` | 4px | Tight badge/icon pairs; progress bar `margin-top` |
| `--space-2` | 8px | Flex gaps between inline elements; section header `margin-bottom` |
| `--space-3` | 12px | Card padding (compact variant); section `margin-bottom`; progress bar `margin-bottom` |
| `--space-4` | 16px | Card padding (standard — position cards, balance cards) |
| `--space-5` | 20px | Loose section breathing room |
| `--space-6` | 24px | Container top/bottom padding |
| `--space-8`+ | 32px+ | Reserved for outer layout margins; not used inside cards |

### Component mapping

| Component | Property | Token |
|-----------|----------|-------|
| `.position-card` | `padding` | `--space-4` |
| `.capacity-block` | `padding` | `--space-3` |
| `.wallet-config` | `padding` | `--space-3` |
| `.section` | `margin-bottom` | `--space-3` |
| `.section-header` | `margin-bottom` | `--space-2` |
| `.progress-bar` | `margin-top` | `--space-1` |
| `.progress-bar` | `margin-bottom` | `--space-3` |
| `.wallet-collapsed` | `gap` | `--space-2` |
| `.wallet-input-row` | `gap` | `--space-2` |
| `.detail-grid` | `gap` | `--space-2` |

### Rule

New components must use tokens from this scale. If a value falls between two tokens (e.g. 10px between `--space-2` and `--space-3`), round to the nearest token. Exception: fixed visual dimensions (bar heights, border radii, icon sizes) are not spacing and may use explicit values.

---

## Not Registered Screen

A welcome/onboarding screen shown when no wallet address is saved. Contains a centered hero block and a wallet input card. Replaces the simpler wallet-config form with a more guided experience.

### HTML structure

```html
<div id="walletConfig" class="screen-not-registered">
    <div class="not-registered-hero">
        <div class="not-registered-icon">⬡</div>
        <div class="not-registered-title">Welcome to Hyperscaled</div>
        <div class="not-registered-body">Enter your Hyperliquid wallet address...</div>
    </div>
    <div class="not-registered-card">
        <div class="not-registered-card-header">
            <span class="not-registered-label">Hyperliquid Wallet Address</span>
            <span id="walletStatus" class="wallet-status"></span>
        </div>
        <input type="text" id="walletAddress" placeholder="0x..." class="wallet-input wallet-input--full" spellcheck="false" />
        <button id="walletSave" class="wallet-save-btn wallet-save-btn--full">Check</button>
        <div class="not-registered-signup">
            <span class="not-registered-signup-text">Not registered yet?</span>
            <a href="https://hyperscaled.trade" target="_blank" class="not-registered-signup-link">Sign up at hyperscaled.trade →</a>
        </div>
    </div>
</div>
```

### Tokens used

| Element | Property | Token / Value |
|---------|----------|---------------|
| Screen layout | Padding / gap | `--space-4` / `--space-4` |
| Hero padding-top | — | `--space-8` |
| Icon | Color / size | `--accent` / 28px |
| Title | Font / size / weight / color | `--font-ui` / 14px / 700 / `--text-strong` |
| Body text | Font / size / color / line-height | `--font-ui` / 12px / `--text-body` / 1.7 |
| Body max-width | — | 280px |
| Card surface | Background / border | `--card-bg` / `--border-card` |
| Card radius / padding | — | `--radius-card` / `--space-4` |
| Input label | Font / size / weight / color | `--font-ui` / 11px / 600 / `--text-label` |
| Input | Font / background / border / radius | `--font-mono` 12px / `--bg` / `--border-card` / `--radius-sm` |
| Input padding | — | `--space-2` `--space-3` |
| Input placeholder | Color | `--text-ghost` |
| Button | Pattern | Ghost button (full-width variant) |
| Signup text | Color / size | `--text-subtle` / 11px |
| Signup link | Color / size | `--accent` / 11px |

### Rules

- The outer div retains `id="walletConfig"` for JS compatibility — the JS developer toggles this screen via `style.display`.
- `walletAddress`, `walletSave`, and `walletStatus` IDs must never change — they are bound in popup.js.
- The input uses `--bg` background (not `--input-bg`) to create a recessed effect inside the `--card-bg` card.
- The icon (⬡) is the single teal accent element for this screen — no other element uses `--accent` at rest.

---

## Pending Screen

A status screen shown when the wallet address is saved but no active challenge is found. Displays registration status with an amber progress indicator and placeholder registration details.

### HTML structure

```html
<div id="pendingScreen" class="screen-pending" style="display: none;">
    <div class="pending-status-card">
        <div class="pending-icon">⏳</div>
        <div class="pending-title">Registration Pending</div>
        <div class="pending-body">Your payment was received...</div>
        <div class="pending-progress-bar">
            <div class="pending-progress-fill" style="width: 65%;"></div>
        </div>
        <div class="pending-sublabel">Awaiting validator confirmation...</div>
    </div>
    <div class="pending-details-card">
        <div class="pending-details-title">Registration Details</div>
        <div class="pending-detail-row">
            <span class="pending-detail-key">Account Size</span>
            <span class="pending-detail-value">--</span>
        </div>
        <!-- ... more rows ... -->
        <div class="pending-detail-row pending-detail-row--last">
            <span class="pending-detail-key">Entity Miner</span>
            <span class="pending-detail-value">--</span>
        </div>
    </div>
    <div class="pending-footer-note">You'll receive an email confirmation...</div>
</div>
```

### Tokens used

| Element | Property | Token / Value |
|---------|----------|---------------|
| Screen layout | Padding / gap | `--space-4` / `--space-3` |
| Status card | Background / border / radius / padding | `--card-bg` / `--border-card` / `--radius-card` / `--space-5` |
| Icon | Size | 24px |
| Title | Font / size / weight / color | `--font-ui` / 14px / 700 / `--text-strong` |
| Body | Font / size / color / line-height | `--font-ui` / 12px / `--text-body` / 1.7 |
| Progress bar | Height / track / radius | 4px / `--bar-bg` / 5px |
| Progress fill | Background | `--amber` (flat, no gradient) |
| Progress spacing | margin-top | `--space-3` |
| Sublabel | Color / size | `--amber` / 10px |
| Details card | Background / border / radius / padding | `--card-bg-subtle` / `--border-card` / `--radius-card` / `--space-4` |
| Details title | Font / size / weight / color / transform | `--font-ui` / 10px / 600 / `--text-label` / uppercase 0.08em |
| Detail row | Padding / border | `--space-1` 0 / `--border-card` bottom |
| Detail key | Color / size | `--text-subtle` / 12px |
| Detail value | Color / size / weight | `--text-primary` / 12px / 600 |
| Footer note | Color / size / line-height | `--text-ghost` / 11px / 1.6 |

### Rules

- Hidden by default (`style="display: none;"`). JS developer toggles visibility.
- The progress bar uses 4px height — the thinnest in the system — to signal a transient status rather than a tracked metric.
- Amber is used for both the progress fill and sublabel, consistent with the caution/waiting semantic.
- The details card uses `--card-bg-subtle` (2% white) vs the status card's `--card-bg` (3% white) to establish visual hierarchy.
- The last detail row uses `pending-detail-row--last` modifier to remove its bottom border.
- All detail values are placeholder `--` text. The JS developer will add IDs or data-binding later.
