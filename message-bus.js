const eventTypesWithListeners = new Map();
function copyEvent(e) {
    const copy = {};
    let current = e;
    do {
        for (const each in current)
            if (each !== 'bubbles')
                copy[each] = e[each];
        current = Object.getPrototypeOf(current);
    } while (current);
    const ev = new CustomEvent(e.type, copy);
    current = e;
    do {
        for (const each in current)
            if (each !== 'bubbles')
                try {
                    ev[each] = e[each];
                }
                catch (e) { }
        current = Object.getPrototypeOf(current);
    } while (current);
    return ev;
}
function resend(e) {
    const ev = copyEvent(e);
    eventTypesWithListeners.get(e.type)?.map(L => L.gettor().forEach(el => el.dispatchEvent(ev)));
}
export function listen(customEventType, elementOrSelector) {
    if (!eventTypesWithListeners.has(customEventType)) {
        eventTypesWithListeners.set(customEventType, []);
        document.addEventListener(customEventType, resend);
    }
    const id = new Date().getTime();
    const gettor = () => typeof elementOrSelector === 'string' ? Array.from(document.querySelectorAll(elementOrSelector)) : [elementOrSelector];
    eventTypesWithListeners.get(customEventType).push({ id, gettor });
    return id;
}
export function unlisten(id) {
    for (const [eventType, listeners] of eventTypesWithListeners.entries()) {
        for (const listener of listeners)
            if (listener.id === id) {
                eventTypesWithListeners.set(eventType, listeners.filter(l => l.id !== id));
                return true;
            }
    }
    return false;
}
