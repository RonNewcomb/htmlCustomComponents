const registeredCustomEventTypes: { [key: string]: boolean } = {};

export function say<T>(element: Element, customEventType: string, detail?: T) {
    if (!registeredCustomEventTypes[customEventType]) register(customEventType);
    element.dispatchEvent(new CustomEvent<T>(customEventType, { detail, bubbles: true }));
}

export function register(customEventType: string) {
    document.addEventListener(customEventType, go);
    registeredCustomEventTypes[customEventType] = true;
}

function go(event: Event | CustomEvent) {
    const onEventType = 'on' + event.type;
    document.querySelectorAll(`[${onEventType}]`).forEach((element: any) =>
        element?.[element.getAttribute(onEventType) || onEventType]?.bind(element)(event))
}
