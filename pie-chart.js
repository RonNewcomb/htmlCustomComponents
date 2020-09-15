export class PieChart extends HTMLElement {
    constructor() {
        super(...arguments);
        this.yFields = [{ fieldName: 'popularity' }];
        this.data = [
            { key: 'Angular', values: { popularity: 5 } },
            { key: 'React', values: { popularity: 8 } },
            { key: 'HTML Custom Elements', values: { popularity: 2 } },
        ];
        this.colors = ["Blue ", "LimeGreen", "Red", "OrangeRed", "Indigo", "Yellow", "DarkMagenta", "Orange", "Crimson", "DeepSkyBlue", "DeepPink", "LightSeaGreen", '#4751e9', "#dc3912", '#00b862', '#ff5722', '#2196f3', '#eeeb0c', "#0e8816", "#910291", '#ff9800', '#ff4514'];
        this.selectedYFields = [];
        this.chartDivElementId = new Date().getTime().toString();
        this.tooltipComponent = {
            hideTip: () => void 0,
            showTip: (...rest) => console.log(rest),
        };
        this.drilldown = {
            next: (yPerX) => this.dispatchEvent(new CustomEvent('drilldown', { detail: yPerX })),
        };
        this.slices = [];
        this.hoveringOver = -1;
        this.fullCircle = 2 * Math.PI;
        this.radius = this.fullCircle / (2 * Math.PI);
        this.diameter = this.radius * 2;
        this.radiansToDegrees = 180 / Math.PI;
        this.degreesToRadians = Math.PI / 180;
        this.fontScalingFactor = 0.015;
        this.rotateEntirePie = Math.PI / 2;
        this.labelDistanceFromCenter = this.radius * 1.5;
    }
    connectedCallback() {
        this.refresh();
    }
    refresh() {
        if (this.selectedYFields.length === 0)
            this.selectedYFields = this.yFields.slice(0, 3).filter(f => f).map(f => f.fieldName);
        this.selectedYField = this.yFields.find(af => this.selectedYFields.indexOf(af.fieldName) >= 0) || this.yFields[0];
        this.yFieldName = this.selectedYField.fieldName;
        this.data = this.data.sort((a, b) => b.values[this.yFieldName] - a.values[this.yFieldName]);
        let sum = this.data.reduce((sum, each) => sum + each.values[this.yFieldName], 0);
        let runningSumOfAngles = 0;
        this.slices = this.data.map((datum) => {
            let v = datum.values[this.yFieldName] || 0;
            let percent = v / sum;
            let percentInRadians = percent * this.fullCircle;
            let angleToMiddleOfSlice = runningSumOfAngles - this.rotateEntirePie + (percentInRadians / 2);
            let percentSizeNeededForLabelLength = v.toString().length / 100;
            let s = {
                percentInAngles: percentInRadians,
                rotateBy: runningSumOfAngles,
                label: datum.key,
                fieldName: datum.key,
                value: (percent > percentSizeNeededForLabelLength) ? v : null,
                extraSmall: (percent < 0.04 + percentSizeNeededForLabelLength),
                labelAt: this.polarCoordinatesToRectilinearCoordinates(angleToMiddleOfSlice),
            };
            runningSumOfAngles += percentInRadians;
            return s;
        });
        this.innerHTML = template(this);
        const hitbubble = this.querySelector('#hitbubble');
        hitbubble?.addEventListener('mousemove', e => this.hoverSlice.bind(this)(e));
        hitbubble?.addEventListener('mouseleave', this.deselectArea.bind(this));
        hitbubble?.addEventListener('click', e => this.clickSlice.bind(this)(e));
        const legends = this.querySelectorAll('chart-legend');
        legends.forEach(legend => {
            legend.fields = this.slices;
            legend.colors = this.colors;
        });
    }
    polarCoordinatesToRectilinearCoordinates(angle, distanceFromCenter = this.labelDistanceFromCenter) {
        return (distanceFromCenter * Math.cos(angle)) + "," + (distanceFromCenter * Math.sin(angle));
    }
    rectilinearCoordinatesToPolarCoordinates(x, y) {
        let angle = Math.atan2(y, x) + this.rotateEntirePie;
        if (angle < 0)
            angle += this.fullCircle;
        return angle;
    }
    getMouseCoordinatesRelativeToCircleCenter(event) {
        let svgElement = this.getElementsByTagName('svg')[0];
        let bbox = svgElement.getBoundingClientRect();
        let x = event.clientX - bbox.left - svgElement.clientHeight / 2;
        let y = event.clientY - bbox.top - svgElement.clientHeight / 2;
        return { x: x, y: y };
    }
    mouseToIndex(event) {
        let mouseAt = this.getMouseCoordinatesRelativeToCircleCenter(event);
        let angle = this.rectilinearCoordinatesToPolarCoordinates(mouseAt.x, mouseAt.y);
        let i = this.slices.findIndex(s => s.rotateBy > angle);
        return i < 0 ? this.slices.length - 1 : i - 1;
    }
    hoverSlice(event) {
        let i = this.mouseToIndex(event);
        return this.selectArea(this.data[i], i);
    }
    clickSlice(event) {
        let i = this.mouseToIndex(event);
        this.tooltipComponent.hideTip();
        this.drilldown.next(this.data[i]);
    }
    selectArea(d, i) {
        this.hoveringOver = i;
        this.tooltipComponent.showTip(d.key, d.values, this.yFields);
    }
    deselectArea() {
        this.hoveringOver = -1;
        this.tooltipComponent.hideTip();
    }
    onDrilldown(value) {
        if (!value)
            return;
        let item = this.data.find(d => d.key === value);
        if (!item)
            return;
        this.tooltipComponent.hideTip();
        this.drilldown.next(item);
    }
    onMouseEnterLegend(value) {
        if (!value)
            return;
        let item = this.data.find(d => d.key === value);
        if (!item)
            return;
        let i = this.slices.findIndex(x => x.fieldName === value);
        this.selectArea(item, i);
    }
    onMouseLeaveLegend(value) {
        this.deselectArea();
    }
    onFieldSelect(fieldnames) {
        this.selectedYFields = fieldnames;
        this.refresh();
    }
}
function template({ data, diameter, fullCircle, slices, radius, colors, rotateEntirePie, radiansToDegrees, hoveringOver, fontScalingFactor, chartDivElementId, yFields }) {
    return `
<div id="svgPie" class="wholeChart">
    ${slices && slices.length ? `
        <chart-legend
            chartId="${chartDivElementId}xAxis"
            [left]="10"
            [top]="20"
            [colors]="colors"
            [fields]="slices"
            [selectable]="false"
            [canMultiselect]="false"
            [hoveringOver]="hoveringOver"
            (drilldown)="onDrilldown($event)"
            (mouseenter)="onMouseEnterLegend($event)"
            (mouseleave)="onMouseLeaveLegend($event)">
        </chart-legend>
    ` : ``}
    ${data && data.length && radius && diameter ? `
        <svg height="100%" viewBox="-${diameter}, -${diameter}, ${2 * diameter}, ${2 * diameter}" preserveAspectRatio="xMinYMid meet">
            <g stroke-width="${diameter}" fill="none" transform="rotate(-${rotateEntirePie * radiansToDegrees})">
            ${slices.map((slice, i) => `
                <circle cx="0" cy="0" r="${radius}"
                        stroke="${colors[i % colors.length]}"
                        stroke-dasharray="${slice.percentInAngles} ${fullCircle}"
                        transform="rotate(${slice.rotateBy * radiansToDegrees})">
                </circle>
            `).join('')}
                ${hoveringOver > -1 && slices[hoveringOver]
        ? `
                    <circle id="fadeoutOverlay" cx="0" cy="0" r="${diameter}" fill-opacity="0.45" fill="white"></circle>
                    <circle id="highlightedSlice"
                            cx="0" cy="0" r="${radius}"
                            stroke="${colors[hoveringOver % colors.length]}"
                            stroke-dasharray="${slices[hoveringOver].percentInAngles} ${fullCircle}"
                            transform="rotate(${slices[hoveringOver].rotateBy * radiansToDegrees})">
                    </circle>
                ` : ""}
            </g>
            ${slices.map(slice => !slice.value ? "" : `<text transform="translate(${slice.labelAt}) scale(${slice.extraSmall ? fontScalingFactor / 2 : fontScalingFactor})" class="pieLabel" text-anchor="middle">${slice.value}</text>`).join('')}
            <circle id="hitbubble" cx="0" cy="0" r="${diameter}" fill-opacity="0"></circle>
            <circle id="donutHole" cx="0" cy="0" r="${radius / 2}" fill="white"></circle>
        </svg>
        ` : ''}
    ${yFields && yFields.length ? `
        <chart-legend 
            chartId="${chartDivElementId}yAxis"
            [right]="10"
            [top]="20"
            [fields]="${yFields}"
            [selectable]="true"
            [canMultiselect]="false"
            [colors]="['transparent']"
            (select)="onFieldSelect($event)">
        </chart-legend>
    ` : ``}
    ${yFields ? `<y-fields-tooltip fieldMetadata="${yFields}"></y-fields-tooltip>` : ``}
</div>
<style>
    .wholeChart {
        width: 100%;
        height: 100%;
        margin-left: 25%;
    }

    .pieLabel {
        fill: #fff;
        font-weight: bold;
        font-size: 12px;
    }

    g text {
        font: 10px sans-serif;
    }

    text.title {
        font: bold 12px sans-serif;
        text-anchor: middle;
    }
</style>`;
}
customElements.define('pie-chart', PieChart);
