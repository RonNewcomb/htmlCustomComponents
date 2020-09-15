var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, privateMap) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to get private field on non-instance");
    }
    return privateMap.get(receiver);
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, privateMap, value) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to set private field on non-instance");
    }
    privateMap.set(receiver, value);
    return value;
};
var _colors, _fields;
export class ChartLegend extends HTMLElement {
    constructor() {
        super(...arguments);
        _colors.set(this, []);
        _fields.set(this, []);
        this.drilldown = "onDrilldown($event)";
        this.mouseenter = "onMouseEnterLegend($event)";
        this.mouseleave = "onMouseLeaveLegend($event)";
    }
    get chartId() { return this.getAttribute('chartId') || ''; }
    get colors() { return __classPrivateFieldGet(this, _colors); }
    set colors(v) { __classPrivateFieldSet(this, _colors, v || []); this.render(); }
    ;
    get fields() { return __classPrivateFieldGet(this, _fields); }
    set fields(v) { __classPrivateFieldSet(this, _fields, v || []); this.render(); }
    ;
    get selectable() { return this.getAttribute('selectable') === 'true'; }
    get canMultiselect() { return this.getAttribute('canMultiselect') === 'true'; }
    get hoveringOver() { return parseInt(this.getAttribute('hoveringOver') || '0'); }
    connectedCallback() {
        this.attachShadow({ mode: 'open' });
        this.addEventListener('drilldown', this.propertyChangedCallback.bind(this));
    }
    propertyChangedCallback(e) {
        console.log('chart-legend got', e);
        if (!(e instanceof CustomEvent))
            return;
        this.fields = e.detail.fields;
        this.colors = e.detail.colors;
        console.log('chart-legend set');
    }
    render() {
        if (this.shadowRoot)
            this.shadowRoot.innerHTML = template(this);
    }
}
_colors = new WeakMap(), _fields = new WeakMap();
function template({ chartId, fields, colors }) {
    return `
<div id=${chartId} class=legend>
    ${fields.map((field, i) => `<div><div class=swatch style='background-color:${colors[i]}'></div>${field.label}</div>`).join('')}
</div>    
<style>
    .swatch {
        display: inline-block;
        height: 1em;
        width: 1em;
        border-radius: 50%;
        margin-right: 0.5em;
        color: lightgray;
    }
</style>
`;
}
customElements.define('chart-legend', ChartLegend);
