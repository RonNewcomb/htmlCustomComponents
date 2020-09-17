import type { PieSliceData, DrilldownArgs } from "pie-chart";

export class ChartLegend extends HTMLElement {
    get chartId(): string { return this.getAttribute('chartId') || ''; }
    #colors: string[] = [];
    get colors() { return this.#colors; }
    set colors(v: string[]) { this.#colors = v || []; this.render() };
    #fields: PieSliceData[] = [];
    get fields() { return this.#fields; }
    set fields(v: PieSliceData[]) { this.#fields = v || []; this.render() };
    get selectable(): boolean { return this.getAttribute('selectable') === 'true' }
    get canMultiselect(): boolean { return this.getAttribute('canMultiselect') === 'true' }
    get hoveringOver(): number { return parseInt(this.getAttribute('hoveringOver') || '0') }
    mouseenter = "onMouseEnterLegend($event)";
    mouseleave = "onMouseLeaveLegend($event)";

    connectedCallback() {
        this.attachShadow({ mode: 'open' });
    }

    propertyChangedCallback(e: CustomEvent<DrilldownArgs>) {
        this.#fields = e.detail.fields;
        this.#colors = e.detail.colors;
        this.render()
    }

    render() {
        if (this.shadowRoot) this.shadowRoot.innerHTML = template(this);
    }
}

function template({ chartId, fields, colors }: ChartLegend) {
    return /*html*/`
<div id=${chartId} class=legend>
    ${fields.map((field, i) => `<div><div class=swatch style='background-color:${colors[i % colors.length]}'></div>${field.label}</div>`).join('')}
</div>    
<style>
    :host {
        display: block;
        overflow: auto;
    }
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
