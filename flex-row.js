"use strict";
class FlexRow extends HTMLElement {
    connectedCallback() {
        this.wrap = typeof this.getAttribute('wrap') === 'string' ? 'wrap' : typeof this.getAttribute('nowrap') === 'string' ? 'nowrap' : '';
        this.innerHTML = template(this.wrap);
    }
    get wrap() { return this.getAttribute('wrap'); }
    set wrap(v) { this.setAttribute('wrap', v || ''); render(this); }
    ;
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue)
            render(this);
    }
}
FlexRow.observedAttributes = ['wrap', 'nowrap'];
const render = (el) => el.innerHTML = template(el.wrap);
const template = (flexWrap) => `<slot style="display: flex; flex-direction: row; flex: 1 1 auto; align-items: flex-start; ${flexWrap ? `flex-wrap: ${flexWrap};` : ''}"></slot>`;
customElements.define('flex-row', FlexRow);
