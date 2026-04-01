import { formatEventTime } from './format.js';
import { safeSendMessage } from './api.js';

export async function refreshEvents(storedAddress) {
    console.log('[Hyperscaled Popup] refreshEvents called, storedAddress:', storedAddress);
    if (!storedAddress) {
        console.log('[Hyperscaled Popup] No stored address, skipping events');
        const container = document.getElementById('eventsContainer');
        if (container) container.innerHTML = '<div class="no-more-positions">Set wallet address to see events</div>';
        return;
    }
    try {
        console.log('[Hyperscaled Popup] Sending fetchEvents message to background...');
        const result = await safeSendMessage({ action: 'fetchEvents', address: storedAddress, since: 0 });
        console.log('[Hyperscaled Popup] fetchEvents result:', JSON.stringify(result).slice(0, 500));

        const events = result.events || [];
        console.log('[Hyperscaled Popup] Rendering', events.length, 'events');
        renderEvents(events);

        if (events.length > 0) {
            let maxTs = 0;
            for (const e of events) {
                if (e.timestamp_ms > maxTs) maxTs = e.timestamp_ms;
            }
            chrome.storage.local.set({ lastEventTimestampMs: maxTs });
            chrome.storage.local.set({ recentEvents: events.slice(0, 50) });
        }
    } catch (e) {
        console.error('[Hyperscaled Popup] Events fetch failed:', e.message, e);
        const cached = await new Promise(resolve => {
            chrome.storage.local.get(['recentEvents'], resolve);
        });
        console.log('[Hyperscaled Popup] Cached events:', cached.recentEvents?.length ?? 0);
        if (cached.recentEvents && cached.recentEvents.length > 0) {
            renderEvents(cached.recentEvents);
        } else {
            const container = document.getElementById('eventsContainer');
            if (container) container.innerHTML = `<div class="no-more-positions">Unable to load events: ${e.message}</div>`;
        }
    }
}

export function renderEvents(events) {
    const container = document.getElementById('eventsContainer');
    const countEl = document.getElementById('eventsCount');
    if (!container) return;

    if (!events || events.length === 0) {
        container.innerHTML = '<div class="no-more-positions">No events yet</div>';
        if (countEl) countEl.textContent = '';
        return;
    }

    const filtered = events.filter(evt => !evt.error_message || !evt.error_message.toLowerCase().includes('rate limited'));

    if (countEl) countEl.textContent = `${filtered.length} event${filtered.length !== 1 ? 's' : ''}`;

    const display = filtered
        .sort((a, b) => b.timestamp_ms - a.timestamp_ms)
        .slice(0, 20);

    container.innerHTML = display.map(evt => {
        const isAccepted = evt.status === 'accepted';
        const statusClass = isAccepted ? 'event-accepted' : 'event-rejected';
        const statusLabel = isAccepted ? 'Accepted' : 'Rejected';
        const pair = evt.trade_pair || 'Unknown';
        const direction = evt.order_type || '';
        const badgeClass = direction === 'LONG' ? 'long' : direction === 'SHORT' ? 'short' : '';
        const time = formatEventTime(evt.timestamp_ms);

        let details = '';
        if (evt.error_message) {
            details = `<div class="event-error">${evt.error_message}</div>`;
        }
        if (evt.fill_hash) {
            details += `<div class="event-fill">Fill: ${evt.fill_hash.slice(0, 14)}...</div>`;
        }

        return `
            <div class="event-card ${statusClass}">
                <div class="event-header">
                    <div class="event-pair">
                        <span class="event-pair-name">${pair}</span>
                        ${direction ? `<span class="position-badge ${badgeClass}">${direction}</span>` : ''}
                    </div>
                    <span class="event-status-badge ${statusClass}">${statusLabel}</span>
                </div>
                ${details}
                <div class="event-time">${time}</div>
            </div>
        `;
    }).join('');
}
