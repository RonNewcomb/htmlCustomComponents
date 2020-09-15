
class FlexRow extends HTMLElement {
    connectedCallback() {
        this.wrap = typeof this.getAttribute('wrap') === 'string' ? 'wrap' : typeof this.getAttribute('nowrap') === 'string' ? 'nowrap' : '';
        this.innerHTML = template(this.wrap);
    }

    get wrap() { return this.getAttribute('wrap'); }
    set wrap(v) { this.setAttribute('wrap', v || ''); render(this); };

    static observedAttributes = ['wrap', 'nowrap'];

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        if (oldValue !== newValue) render(this);
    }
}

const render = (el: FlexRow) => el.innerHTML = template(el.wrap)

const template = (flexWrap: string | null) =>
  /*html*/`<slot style="display: flex; flex-direction: row; flex: 1 1 auto; align-items: flex-start; ${flexWrap ? `flex-wrap: ${flexWrap};` : ''}"></slot>`;

customElements.define('flex-row', FlexRow);
