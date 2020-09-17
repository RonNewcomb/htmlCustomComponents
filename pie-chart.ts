export type DropdownFieldCodename = string;
export type AnalyzerChartIDType = string;
export type Radians = number;

export interface AnalyzerField {
    fieldName: string;
}

export interface yValuesPerXValue {
    key: DropdownFieldCodename,
    values: { [key: string]: number },
}

export interface PieSliceData {
    percentInAngles: Radians;
    rotateBy: Radians;

    // left-side legend
    fieldName: DropdownFieldCodename;
    label: string;

    // pie slice label
    value: number | null; // value shown on slice label; the raw data
    labelAt: string; // location of slice label
    extraSmall: boolean; // shrink font if slice is thin
}

export interface DrilldownArgs {
    yPerX: yValuesPerXValue;
    fields: PieSliceData[];
    colors: string[];
}

export interface TooltipInfo {
    yPerX: yValuesPerXValue;
    fields: AnalyzerField[];
    event: MouseEvent;
}

// events
const hideTip = (el: PieChart) =>
    el.dispatchEvent(new CustomEvent('hideTip'));

const showTip = (el: PieChart, yPerX: yValuesPerXValue, event: MouseEvent) =>
    el.dispatchEvent(new CustomEvent<TooltipInfo>('showTip', { detail: { yPerX, event, fields: el.yFields } }));

const drilldown = (el: PieChart, yPerX: yValuesPerXValue) =>
    el.dispatchEvent(new CustomEvent<DrilldownArgs>('drilldown', { detail: { yPerX, colors: el.colors, fields: el.slices } }));

const pieChartRender = (el: PieChart) =>
    el.dispatchEvent(new CustomEvent('pieChartInit', { detail: { fields: el.yFields, colors: ['transparent'] } }));

// trigonometry 
const fullCircle: Radians = 2 * Math.PI;
const radius = fullCircle / (2 * Math.PI);
const diameter = radius * 2;
const radiansToDegrees = 180 / Math.PI;
const degreesToRadians = Math.PI / 180;
const fontScalingFactor = 0.015;         // TODO: I eyeballed this value.
const rotateEntirePie: Radians = Math.PI / 2;
const labelDistanceFromCenter = radius * 1.5;

function polarCoordinatesToRectilinearCoordinates(angle: Radians, distanceFromCenter: number = labelDistanceFromCenter): string {
    return (distanceFromCenter * Math.cos(angle)) + "," + (distanceFromCenter * Math.sin(angle));
}

function rectilinearCoordinatesToPolarCoordinates(x: number, y: number): Radians {
    let angle = Math.atan2(y, x) + rotateEntirePie;
    if (angle < 0) angle += fullCircle;
    return angle;   // distance isn't needed so just calc the angle and return
}

function getMouseCoordinatesRelativeToCircleCenter(event: MouseEvent, svgElement: SVGSVGElement): { x: number, y: number } {
    let bbox = svgElement.getBoundingClientRect();
    let x = event.clientX - bbox.left - svgElement.clientHeight / 2; // clientHeight because aspect ratio keeps it square and IE11 is IE11
    let y = event.clientY - bbox.top - svgElement.clientHeight / 2;
    return { x, y }; // returns 0,0 when mouse cursor is at center of circle, etc.
}


// class /////////////////////////////////////

export class PieChart extends HTMLElement {
    static observedAttributes = ['size'];

    // required inputs
    yFields: AnalyzerField[] = [{ fieldName: 'popularity' }];
    data: yValuesPerXValue[] = [
        { key: 'Angular', values: { popularity: 5 } },
        { key: 'React', values: { popularity: 8 } },
        { key: 'HTML Custom Elements', values: { popularity: 2 } },
    ];

    // optional inputs
    size = '50px';
    colors = ["DeepPink", "LightSeaGreen", '#4751e9', "#dc3912", '#00b862', '#ff5722', '#2196f3', '#eeeb0c', "#0e8816", "#910291", '#ff9800', '#ff4514', "Blue", "LimeGreen", "Red", "OrangeRed", "Indigo", "Yellow", "DarkMagenta", "Orange", "Crimson", "DeepSkyBlue",];
    selectedYFields: DropdownFieldCodename[] = [];
    chartDivElementId: AnalyzerChartIDType = new Date().getTime().toString();

    // private
    selectedYField: AnalyzerField;
    yFieldName: string;
    slices: PieSliceData[] = [];
    hoveringOver: number = -1;

    connectedCallback() {
        this.size = this.getAttribute('size') || '50px';
        this.render();
    }

    attributeChangedCallback() {
        this.size = this.getAttribute('size') || '50px';
        this.render();
    }

    render() {
        if (this.selectedYFields.length === 0) this.selectedYFields = this.yFields.slice(0, 3).filter(f => f).map(f => f.fieldName);
        this.selectedYField = this.yFields.find(af => this.selectedYFields.indexOf(af.fieldName) >= 0) || this.yFields[0];
        this.yFieldName = <string>this.selectedYField.fieldName;

        this.data = this.data.sort((a, b) => b.values[this.yFieldName] - a.values[this.yFieldName]); // sort values biggest first

        let sum = this.data.reduce((sum, each) => sum + each.values[this.yFieldName], 0);
        let runningSumOfAngles: Radians = 0;
        this.slices = this.data.map((datum: yValuesPerXValue) => {
            let v = datum.values[this.yFieldName] || 0;
            let percent = v / sum;
            let percentInRadians: Radians = percent * fullCircle;
            let angleToMiddleOfSlice: Radians = runningSumOfAngles - rotateEntirePie + (percentInRadians / 2);
            let percentSizeNeededForLabelLength = v.toString().length / 100;
            let s: PieSliceData = {
                percentInAngles: percentInRadians,
                rotateBy: runningSumOfAngles,
                label: datum.key,       // legend
                fieldName: datum.key,   // legend
                value: (percent > percentSizeNeededForLabelLength) ? v : null, // omit slice's label unless > 1%
                extraSmall: (percent < 0.04 + percentSizeNeededForLabelLength),
                labelAt: polarCoordinatesToRectilinearCoordinates(angleToMiddleOfSlice),
            };
            runningSumOfAngles += percentInRadians;
            return s;
        });
        this.innerHTML = template(this);
        const hitbubble = this.querySelector('#hitbubble');
        hitbubble?.addEventListener('mousemove', e => this.onMouseMove.bind(this)(e as MouseEvent));
        hitbubble?.addEventListener('mouseleave', this.onMouseLeave.bind(this));
        hitbubble?.addEventListener('click', e => this.onClickSlice.bind(this)(e as MouseEvent));
        pieChartRender(this);
    }

    // returned index is for this.data and for this.slices
    private mouseToIndex(event: MouseEvent): number {
        let svgElement = this.getElementsByTagName('svg')[0];
        let mouseAt = getMouseCoordinatesRelativeToCircleCenter(event, svgElement);
        let angle: Radians = rectilinearCoordinatesToPolarCoordinates(mouseAt.x, mouseAt.y);
        let i = this.slices.findIndex(s => s.rotateBy > angle);
        return i < 0 ? this.slices.length - 1 : i - 1;
    }

    onMouseMove(event: MouseEvent) {
        let i = this.mouseToIndex(event);
        return this.selectArea(this.data[i], i, event);
    }

    onClickSlice(event: MouseEvent) {
        let i = this.mouseToIndex(event);
        hideTip(this);
        drilldown(this, this.data[i]);
    }

    private selectArea(d: yValuesPerXValue, i: number, event: MouseEvent) {
        this.hoveringOver = i;
        showTip(this, d, event);
    }

    onMouseLeave() {
        this.hoveringOver = -1;
        hideTip(this);
    }

    // Legend for x-axis /////////////

    onDrilldown(value: string) {
        if (!value) return;
        let item = this.data.find(d => d.key === value);
        if (!item) return;
        hideTip(this);
        drilldown(this, item);
    }

    onMouseEnterLegend(value: string, event: MouseEvent) {
        if (!value) return;
        let item = this.data.find(d => d.key === value);
        if (!item) return;
        let i = this.slices.findIndex(x => x.fieldName === value);
        this.selectArea(item, i, event);
    }

    onMouseLeaveLegend(value: string) {
        this.onMouseLeave();
    }

    // Legend for y-axis /////////////

    onFieldSelect(fieldnames: DropdownFieldCodename[]) {
        this.selectedYFields = fieldnames;
        this.render();
    }
}

function template({ size, data, slices, colors, hoveringOver }: PieChart) {
    return /*html*/`
<div id="svgPie" class="wholeChart">
    ${data && data.length && radius && diameter ? `
        <svg height="100%" viewBox="-${diameter}, -${diameter}, ${2 * diameter}, ${2 * diameter}" preserveAspectRatio="xMinYMid meet">
            <g stroke-width="${diameter}" fill="none" transform="rotate(-${rotateEntirePie * radiansToDegrees})">
            ${slices.map((slice, i) => /*html*/`
                <circle cx="0" cy="0" r="${radius}"
                        stroke="${colors[i % colors.length]}"
                        stroke-dasharray="${slice.percentInAngles} ${fullCircle}"
                        transform="rotate(${slice.rotateBy * radiansToDegrees})">
                </circle>
            `).join('')}
                ${hoveringOver > -1 && slices[hoveringOver]
                ? /*html*/`
                    <circle id="fadeoutOverlay" cx="0" cy="0" r="${diameter}" fill-opacity="0.45" fill="white"></circle>
                    <circle id="highlightedSlice"
                            cx="0" cy="0" r="${radius}"
                            stroke="${colors[hoveringOver % colors.length]}"
                            stroke-dasharray="${slices[hoveringOver].percentInAngles} ${fullCircle}"
                            transform="rotate(${slices[hoveringOver].rotateBy * radiansToDegrees})">
                    </circle>
                ` : ""}
            </g>
            ${slices.map(slice => !slice.value ? "" : /*html*/`<text transform="translate(${slice.labelAt}) scale(${slice.extraSmall ? fontScalingFactor / 2 : fontScalingFactor})" class="pieLabel" text-anchor="middle">${slice.value}</text>`).join('')}
            <circle id="hitbubble" cx="0" cy="0" r="${diameter}" fill-opacity="0"></circle>
            <circle id="donutHole" cx="0" cy="0" r="${radius / 2}" fill="white"></circle>
        </svg>
        `: ''}
</div>
<style>
    :host, pie-chart {
        display: block;
    }

    .wholeChart { 
         width: ${size}; 
        height: ${size};
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
