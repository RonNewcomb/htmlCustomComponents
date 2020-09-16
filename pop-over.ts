import { TooltipInfo } from "pie-chart";

class Popover extends HTMLElement {
    connectedCallback() {
        this.attachShadow({ mode: 'open' }).innerHTML = template();
    }

    onShowTip(e: CustomEvent<TooltipInfo>) {
        console.log('onShowTip')
        const host = (this.shadowRoot!.host! as HTMLElement);
        host.style.display = 'block';
        host.style.top = e.detail.event.screenY + 'px';
        host.style.left = e.detail.event.screenX + 'px';
        this.shadowRoot!.firstElementChild!.firstElementChild!.textContent = e.detail.yPerX.key;
        this.shadowRoot!.firstElementChild!.lastElementChild!.innerHTML = e.detail.fields.map(field => `<div>${field.fieldName}: ${e.detail.yPerX.values[field.fieldName]}</div>`).join('');
    }

    onHideTip(e: CustomEvent<void>) {
        const host = (this.shadowRoot!.host! as HTMLElement);
        host.style.display = 'none';
    }
}

const template = () => /*html*/`
<div>
    <div class=title></div>
    <div class=value></div>
</div>
<style>
    :host { 
        display: none;
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%,-50%);
        padding: 10px;
        border: 1px solid grey;
        box-shadow: 2px 2px 7px 2px;
        background-color:white;
        border-radius:10px;
        min-width: 15em;
    }
    .title{
        text-transform: capitalize;
        font-weight:bold;
        text-align:center;
    }
    .value{
        text-transform: capitalize;
    }
</style>
`;

customElements.define('pop-over', Popover);
