import { fmtUsd } from './format.js';
import { showDashboard } from './screens.js';

const CHALLENGE_TARGET = 10;
const DRAWDOWN_MAX = 5;

export function applyValidatorData(result, state) {
    const accountSize = result.account_size || 0;
    const positionsRaw = result.positions;
    const positions = Array.isArray(positionsRaw) ? positionsRaw : (positionsRaw?.positions || []);
    const openPositions = positions.filter(p => !p.is_closed_position && !p.close_ms);

    let totalUnrealizedPnl = 0;
    let totalNotional = 0;
    let maxSingleNotional = 0;

    for (const pos of openPositions) {
        const notional = pos.net_leverage != null
            ? Math.abs(parseFloat(pos.net_leverage)) * accountSize
            : (pos.filled_orders || []).reduce((s, o) => s + Math.abs(parseFloat(o.value) || 0), 0);
        const pnl = ((parseFloat(pos.current_return) || 1) - 1) * accountSize;

        totalUnrealizedPnl += pnl;
        totalNotional += notional;
        if (notional > maxSingleNotional) maxSingleNotional = notional;
    }

    const cp = result.challenge_period || {};
    const dd = result.drawdown || {};
    const currentEquity = parseFloat(dd.current_equity) || 1;
    const validatorEquity = accountSize * currentEquity;
    const returnsPct = (currentEquity - 1) * 100;
    const targetPct = CHALLENGE_TARGET;
    const challengeCompletionPct = targetPct > 0 ? Math.min((returnsPct / targetPct) * 100, 100) : 0;
    const inChallenge = cp.bucket !== 'SUBACCOUNT_FUNDED';

    const drawdownPct = parseFloat(dd.intraday_drawdown_pct) || 0;
    const drawdownLimitPct = parseFloat(dd.intraday_threshold_pct) || DRAWDOWN_MAX;
    const drawdownUsagePct = parseFloat(dd.intraday_usage_pct) || 0;

    const fundedBalanceEl = document.getElementById('fundedBalance');
    if (fundedBalanceEl) fundedBalanceEl.textContent = fmtUsd(validatorEquity);
    const hlBalanceHeaderEl = document.getElementById('hlBalanceHeader');
    if (hlBalanceHeaderEl) hlBalanceHeaderEl.textContent = fmtUsd(validatorEquity);

    const fundedChangeEl = document.getElementById('fundedChange');
    if (fundedChangeEl) {
        const sign = totalUnrealizedPnl >= 0 ? '+' : '';
        const pnlPct = accountSize > 0 ? (totalUnrealizedPnl / accountSize) * 100 : 0;
        fundedChangeEl.textContent = `${sign}${fmtUsd(totalUnrealizedPnl)} (${sign}${pnlPct.toFixed(2)}%)`;
        const changeParent = fundedChangeEl.closest('.balance-change');
        if (changeParent) {
            changeParent.className = 'balance-change ' + (totalUnrealizedPnl >= 0 ? 'positive' : 'negative');
        }
    }

    const statusBadge = document.querySelector('.status-badge');
    if (statusBadge) {
        statusBadge.textContent = inChallenge ? 'In Challenge' : 'Funded';
    }

    const challengeValueEl = document.getElementById('challengeValue');
    const challengeFillEl = document.getElementById('challengeFill');
    const challengeLabelEl = document.getElementById('challengeLabel');
    if (challengeValueEl) challengeValueEl.textContent = `${returnsPct.toFixed(2)}% / ${targetPct}%`;
    if (challengeFillEl) {
        challengeFillEl.style.width = Math.min(challengeCompletionPct, 100) + '%';
    }
    if (challengeLabelEl) {
        const remainingPct = targetPct - returnsPct;
        const remainingDollar = accountSize * (remainingPct / 100);
        challengeLabelEl.textContent = remainingPct > 0
            ? `${fmtUsd(remainingDollar)} to target (${targetPct}% goal)`
            : 'Target reached!';
    }

    const drawdownValueEl = document.getElementById('drawdownValue');
    const drawdownFillEl = document.getElementById('drawdownFill');
    const drawdownLabelEl = document.getElementById('drawdownLabel');
    if (drawdownValueEl) drawdownValueEl.textContent = `${drawdownPct.toFixed(3)}% / ${drawdownLimitPct.toFixed(0)}%`;
    if (drawdownFillEl) {
        drawdownFillEl.style.width = Math.min(drawdownUsagePct, 100) + '%';
        drawdownFillEl.style.background = drawdownUsagePct > 80 ? 'var(--red)' : drawdownUsagePct > 50 ? 'var(--amber)' : '';
    }
    if (drawdownLabelEl) {
        const bufferPct = drawdownLimitPct - drawdownPct;
        const bufferDollar = accountSize * (bufferPct / 100);
        drawdownLabelEl.textContent = `${fmtUsd(Math.max(bufferDollar, 0))} remaining buffer (${bufferPct.toFixed(2)}%)`;
    }

    const perPairLevCap = inChallenge ? 0.625 : 2.5;
    const totalLevCap   = inChallenge ? 1.25  : 5;
    const basisUsd = state.hlBalance;

    let maxPerPair = basisUsd * perPairLevCap;
    let maxTotal   = basisUsd * totalLevCap;

    if (state.traderLimits) {
        const backendPair = parseFloat(state.traderLimits.max_position_per_pair_usd) || 0;
        const backendTotal = parseFloat(state.traderLimits.max_portfolio_usd) || 0;
        if (backendPair > 0) maxPerPair = Math.min(maxPerPair, backendPair);
        if (backendTotal > 0) maxTotal = Math.min(maxTotal, backendTotal);
    }

    const largestPairNotional = maxSingleNotional;
    const perPairUsedEl = document.getElementById('perPairUsed');
    const perPairMaxEl = document.getElementById('perPairMax');
    const perPairFillEl = document.getElementById('perPairFill');
    const perPairRemainingEl = document.getElementById('perPairRemaining');
    if (perPairUsedEl) perPairUsedEl.textContent = fmtUsd(largestPairNotional);
    if (perPairMaxEl) perPairMaxEl.textContent = fmtUsd(maxPerPair);
    if (perPairFillEl) {
        const ppPct = maxPerPair > 0 ? Math.min((largestPairNotional / maxPerPair) * 100, 100) : 0;
        perPairFillEl.style.width = ppPct + '%';
    }
    if (perPairRemainingEl) perPairRemainingEl.textContent = fmtUsd(Math.max(maxPerPair - largestPairNotional, 0));

    const capacityUsedEl = document.getElementById('capacityUsed');
    const capacityMaxEl = document.getElementById('capacityMax');
    const capacityFillEl = document.getElementById('capacityFill');
    const capacityRemainingEl = document.getElementById('capacityRemaining');
    if (capacityUsedEl) capacityUsedEl.textContent = fmtUsd(totalNotional);
    if (capacityMaxEl) capacityMaxEl.textContent = fmtUsd(maxTotal);
    if (capacityFillEl) {
        const capPct = maxTotal > 0 ? Math.min((totalNotional / maxTotal) * 100, 100) : 0;
        capacityFillEl.style.width = capPct + '%';
    }
    if (capacityRemainingEl) capacityRemainingEl.textContent = fmtUsd(Math.max(maxTotal - totalNotional, 0));

    renderPositions(openPositions, accountSize);
    showDashboard();
    state.dashboardShown = true;
}

export function renderPositions(positions, accountSize) {
    const container = document.getElementById('positionsContainer');
    if (!container) return;

    if (!positions || positions.length === 0) {
        container.innerHTML = '<div class="no-more-positions">No open positions</div>';
        return;
    }

    container.innerHTML = positions.map(pos => {
        const tp = pos.trade_pair || '';
        const displayPair = typeof tp === 'string' ? tp : (tp[1] || tp[0] || 'UNKNOWN');
        const symbol = typeof tp === 'string' ? tp.replace(/\/.*$/, '') : ((tp[0] || '').replace(/USD[CT]?$/, '') || 'UNKNOWN');

        const netLev = parseFloat(pos.net_leverage);
        const isLong = !isNaN(netLev) ? netLev > 0 : (pos.position_type === 'LONG');
        const direction = isLong ? 'LONG' : 'SHORT';
        const badgeClass = isLong ? 'long' : 'short';
        const leverage = !isNaN(netLev) && netLev !== 0 ? Math.abs(netLev).toFixed(2) + 'x' : '--';

        const value = !isNaN(netLev)
            ? Math.abs(netLev) * (accountSize || 0)
            : 0;

        const entryPx = parseFloat(pos.average_entry_price) || 0;

        const pnl = ((parseFloat(pos.current_return) || 1) - 1) * (accountSize || 0);
        const pnlSign = pnl >= 0 ? '+' : '';
        const pnlClass = pnl >= 0 ? 'positive' : 'negative';

        return `
            <div class="position-card">
                <div class="position-header">
                    <div class="position-symbol">
                        <span class="symbol-name">${displayPair}</span>
                        <span class="position-badge ${badgeClass}">${direction}</span>
                    </div>
                    <div class="position-pnl ${pnlClass}">${pnlSign}${fmtUsd(pnl)}</div>
                </div>
                <div class="position-details">
                    <div class="detail-row">
                        <span class="detail-label">Value</span>
                        <span class="detail-value">${fmtUsd(value)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Entry</span>
                        <span class="detail-value">${fmtUsd(entryPx)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Leverage</span>
                        <span class="detail-value">${leverage}</span>
                    </div>
                    ${pos.total_fees > 0 ? `
                    <div class="detail-row">
                        <span class="detail-label">Fees</span>
                        <span class="detail-value negative">-${fmtUsd(pos.total_fees)}</span>
                    </div>` : ''}
                </div>
            </div>
        `;
    }).join('');
}
