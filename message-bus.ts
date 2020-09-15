interface ListeningElements {
    (): Element[];
    id: number;
}

const eventTypesWithListeners = {} as { [customEventType: string]: ListeningElements[] };

function copyEvent(e: Event): CustomEvent {
    const copy: any = {};
    for (let current = e; current; current = Object.getPrototypeOf(current)) {
        for (const each in current)
            if (each !== 'bubbles')
                copy[each] = (e as any)[each];
    }
    const ev = new CustomEvent(e.type, copy);
    for (let current = e; current; current = Object.getPrototypeOf(current)) {
        for (const each in current)
            if (each !== 'bubbles')
                try {
                    (ev as any)[each] = (e as any)[each];
                } catch (e) { }
    }
    return ev;
}

const resend = (e: Event) => eventTypesWithListeners[e.type]?.map(getElements => getElements().forEach(element => element.dispatchEvent(copyEvent(e))));

export function listen(customEventType: string, elementOrSelector: string | Element): number {
    if (!eventTypesWithListeners[customEventType]) {
        eventTypesWithListeners[customEventType] = [];
        document.addEventListener(customEventType, resend);
    }
    const getElements = () => typeof elementOrSelector === 'string' ? Array.from(document.querySelectorAll(elementOrSelector)) : [elementOrSelector];
    getElements.id = new Date().getTime();
    eventTypesWithListeners[customEventType]!.push(getElements);
    return getElements.id;
}

export function unlisten(id: number): boolean {
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
