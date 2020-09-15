const eventTypesWithListeners = {};
function copyEvent(e) {
    const copy = {};
    for (let current = e; current; current = Object.getPrototypeOf(current)) {
        for (const each in current)
            if (each !== 'bubbles')
                copy[each] = e[each];
    }
    const ev = new CustomEvent(e.type, copy);
    for (let current = e; current; current = Object.getPrototypeOf(current)) {
        for (const each in current)
            if (each !== 'bubbles')
                try {
                    ev[each] = e[each];
                }
                catch (e) { }
    }
    return ev;
}
const resend = (e) => eventTypesWithListeners[e.type]?.map(getElements => getElements().forEach(element => element.dispatchEvent(copyEvent(e))));
export function listen(customEventType, elementOrSelector) {
    if (!eventTypesWithListeners[customEventType]) {
        eventTypesWithListeners[customEventType] = [];
        document.addEventListener(customEventType, resend);
    }
    const getElements = () => typeof elementOrSelector === 'string' ? Array.from(document.querySelectorAll(elementOrSelector)) : [elementOrSelector];
    getElements.id = new Date().getTime();
    eventTypesWithListeners[customEventType].push(getElements);
    return getElements.id;
}
export function unlisten(id) {
    for (const eventType in eventTypesWithListeners) {
        const listeners = eventTypesWithListeners[eventType];
        for (const listener of listeners)
            if (listener.id === id) {
                eventTypesWithListeners[eventType] = listeners.filter(l => l.id !== id);
                return true;
            }
    }
    return false;
}
