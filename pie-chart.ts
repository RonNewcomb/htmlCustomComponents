export type DropdownFieldCodename = string;
export type AnalyzerChartIDType = string;
export type Radians = number;

export interface AnalyzerField {
    fieldName: string;
}

export interface yValuesPerXValue {
    key: DropdownFieldCodename,
    values: { [key: string]: number }[],
}

export interface PieSliceData {
    percentInAngles: Radians;
    rotateBy: Radians;

    // left-side legend
    fieldName: DropdownFieldCodename;
    label: string;

    // pie slice label
    value: number; // value shown on slice label; the raw data
    labelAt: string; // location of slice label
    extraSmall: boolean; // shrink font if slice is thin
}

export class PieChart extends HTMLElement {
    // properties (inputs)
    data: yValuesPerXValue[];
    chartDivElementId: AnalyzerChartIDType;
    yFields: AnalyzerField[];
    selectedYFields: DropdownFieldCodename[];
    colors = ["Blue ", "LimeGreen", "Red", "OrangeRed", "Indigo", "Yellow", "DarkMagenta", "Orange", "Crimson", "DeepSkyBlue", "DeepPink", "LightSeaGreen", '#4751e9', "#dc3912", '#00b862', '#ff5722', '#2196f3', '#eeeb0c', "#0e8816", "#910291", '#ff9800', '#ff4514'];

    // child component
    tooltipComponent = { hideTip: () => void 0, showTip: (...rest: any[]) => console.log(rest) };

    // events
    drilldown = { next: (yPerX: yValuesPerXValue) => this.dispatchEvent(new CustomEvent('drilldwon', { detail: yPerX })) };

    // private
    selectedYField: AnalyzerField;
    yFieldName: string;
    slices: PieSliceData[] = [];
    hoveringOver: number = -1;
    readonly fullCircle: Radians = 2 * Math.PI;
    readonly radius = this.fullCircle / (2 * Math.PI);
    readonly diameter = this.radius * 2;
    readonly radiansToDegrees = 180 / Math.PI;
    readonly degreesToRadians = Math.PI / 180;
    readonly fontScalingFactor = 0.015;         // TODO: I eyeballed this value.
    readonly rotateEntirePie: Radians = Math.PI / 2;
    readonly labelDistanceFromCenter = this.radius * 1.5;

    connectedCallback() {
        this.attachShadow({ mode: 'open' });
        this.refresh();
    }

    attributeChangedCallback() {
        this.refresh();
    }

    private refresh() {
        if (this.selectedYFields.length === 0) this.selectedYFields = this.yFields.slice(0, 3).filter(f => f).map(f => f.fieldName);
        this.selectedYField = this.yFields.find(af => this.selectedYFields.indexOf(af.fieldName) >= 0) || this.yFields[0];
        this.yFieldName = <string>this.selectedYField.fieldName;

        this.data = this.data.sort((a, b) => b.values[this.yFieldName] - a.values[this.yFieldName]); // sort values biggest first

        let sum = this.data.reduce((sum, each) => sum + each.values[this.yFieldName], 0);
        let runningSumOfAngles: Radians = 0;
        this.slices = this.data.map((datum: yValuesPerXValue) => {
            let v = datum.values[this.yFieldName] || 0;
            let percent = v / sum;
            let percentInRadians: Radians = percent * this.fullCircle;
            let angleToMiddleOfSlice: Radians = runningSumOfAngles - this.rotateEntirePie + (percentInRadians / 2);
            let percentSizeNeededForLabelLength = v.toString().length / 100;
            let s: PieSliceData = {
                percentInAngles: percentInRadians,
                rotateBy: runningSumOfAngles,
                label: datum.key,       // legend
                fieldName: datum.key,   // legend
                value: (percent > percentSizeNeededForLabelLength) ? v : null, // omit slice's label unless > 1%
                extraSmall: (percent < 0.04 + percentSizeNeededForLabelLength),
                labelAt: this.polarCoordinatesToRectilinearCoordinates(angleToMiddleOfSlice),
            };
            runningSumOfAngles += percentInRadians;
            return s;
        });
        this.innerHTML = template(this);
    }

    private polarCoordinatesToRectilinearCoordinates(angle: Radians, distanceFromCenter: number = this.labelDistanceFromCenter): string {
        return (distanceFromCenter * Math.cos(angle)) + "," + (distanceFromCenter * Math.sin(angle));
    }

    private rectilinearCoordinatesToPolarCoordinates(x: number, y: number): Radians {
        let angle = Math.atan2(y, x) + this.rotateEntirePie;
        if (angle < 0) angle += this.fullCircle;
        return angle;   // distance isn't needed so just calc the angle and return
    }

    private getMouseCoordinatesRelativeToCircleCenter(event: MouseEvent): { x: number, y: number } {
        let svgElement = <SVGSVGElement>(<HTMLElement>this).getElementsByTagName('svg')[0];
        let bbox = svgElement.getBoundingClientRect();
        let x = event.clientX - bbox.left - svgElement.clientHeight / 2; // clientHeight because aspect ratio keeps it square and IE11 is IE11
        let y = event.clientY - bbox.top - svgElement.clientHeight / 2;
        return { x: x, y: y }; // returns 0,0 when mouse cursor is at center of circle, etc.
    }

    // returned index is for this.data and for this.slices
    private mouseToIndex(event: MouseEvent): number {
        let mouseAt = this.getMouseCoordinatesRelativeToCircleCenter(event);
        let angle: Radians = this.rectilinearCoordinatesToPolarCoordinates(mouseAt.x, mouseAt.y);
        let i = this.slices.findIndex(s => s.rotateBy > angle);
        return i < 0 ? this.slices.length - 1 : i - 1;
    }

    hoverSlice(event: MouseEvent) {
        let i = this.mouseToIndex(event);
        return this.selectArea(this.data[i], i);
    }

    clickSlice(event: MouseEvent) {
        let i = this.mouseToIndex(event);
        this.tooltipComponent.hideTip();
        this.drilldown.next(this.data[i]);
    }

    private selectArea(d: yValuesPerXValue, i: number) {
        this.hoveringOver = i;
        this.tooltipComponent.showTip(d.key, d.values, this.yFields);
    }

    deselectArea() {
        this.hoveringOver = -1;
        this.tooltipComponent.hideTip();
    }

    // Legend for x-axis /////////////

    onDrilldown(value: string) {
        if (!value) return;
        let item = this.data.find(d => d.key === value);
        if (!item) return;
        this.tooltipComponent.hideTip();
        this.drilldown.next(item);
    }

    onMouseEnterLegend(value: string) {
        if (!value) return;
        let item = this.data.find(d => d.key === value);
        if (!item) return;
        let i = this.slices.findIndex(x => x.fieldName === value);
        this.selectArea(item, i);
    }

    onMouseLeaveLegend(value: string) {
        this.deselectArea();
    }

    // Legend for y-axis /////////////

    onFieldSelect(fieldnames: DropdownFieldCodename[]) {
        this.selectedYFields = fieldnames;
        this.refresh();
    }
}


function template({ diameter, fullCircle, slices, radius, colors, rotateEntirePie, radiansToDegrees, hoveringOver, fontScalingFactor, chartDivElementId, yFields }: PieChart) {
    return /*html*/`
        <template>
            <div id="svgPie" class="wholeChart">
                <!--<chart-legend *ngIf="slices && slices.length"
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
                </chart-legend>-->
                <ng-container *ngIf="data && data.length && radius && diameter">
                    <svg height="100%" attr.viewBox="-${diameter}, -${diameter}, ${2 * diameter}, ${2 * diameter}" preserveAspectRatio="xMinYMid meet">
                        <g attr.stroke-width="${diameter}" fill="none" attr.transform="rotate(-${rotateEntirePie * radiansToDegrees})">
                            <circle *ngFor="let slice of slices; let i = index;"
                                    cx="0" cy="0" attr.r="${radius}"
                                    attr.stroke="${colors[i % colors.length]}"
                                    attr.stroke-dasharray="${slice.percentInAngles} ${fullCircle}"
                                    attr.transform="rotate(${slice.rotateBy * radiansToDegrees})">
                            </circle>
                            <ng-container *ngIf="hoveringOver > -1 && slices[hoveringOver]">
                                <circle id="fadeoutOverlay" cx="0" cy="0" attr.r="${diameter}" fill-opacity="0.45" fill="white"></circle>
                                <circle id="highlightedSlice"
                                        cx="0" cy="0" attr.r="${radius}"
                                        attr.stroke="${colors[hoveringOver % colors.length]}"
                                        attr.stroke-dasharray="${slices[hoveringOver].percentInAngles} ${fullCircle}"
                                        attr.transform="rotate(${slices[hoveringOver].rotateBy * radiansToDegrees})">
                                </circle>
                            </ng-container>
                        </g>
                        <ng-container *ngFor="let slice of slices">
                            <text *ngIf="slice.value"
                                attr.transform="translate(${slice.labelAt}) scale(${slice.extraSmall ? fontScalingFactor / 2 : fontScalingFactor})"
                                class="pieLabel" text-anchor="middle">{{slice.value}}</text>
                        </ng-container>
                        <circle id="hitbubble" cx="0" cy="0" attr.r="${diameter}" fill-opacity="0" (mousemove)="hoverSlice($event)" (mouseleave)="deselectArea()" (click)="clickSlice($event)"></circle>
                        <circle id="donutHole" cx="0" cy="0" attr.r="${radius / 2}" fill="white"></circle>
                    </svg>
                </ng-container>
                <!--<chart-legend *ngIf="yFields && yFields.length"
                        chartId="${chartDivElementId}yAxis"
                        [right]="10"
                        [top]="20"
                        [fields]="${yFields}"
                        [selectable]="true"
                        [canMultiselect]="false"
                        [colors]="['transparent']"
                        (select)="onFieldSelect($event)">
                </chart-legend>-->
                <!--<y-fields-tooltip [hidden]="${!yFields}" [fieldMetadata]="${yFields}"></y-fields-tooltip>-->
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
            </style>
        </template>
    `;
}

customElements.define('pie-chart', PieChart);

