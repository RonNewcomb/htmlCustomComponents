import { Component, OnInit, Input, Output, OnChanges, EventEmitter, ElementRef, AfterViewInit, ViewChild } from '@angular/core';
import { YFieldsTooltipComponent } from "../../y-fields-tooltip/y-fields-tooltip.component";

export type DropdownFieldCodename = string;
export type AnalyzerChartIDType = string;
export type Radians = number;

export interface AnalyzerField {
    fieldName: string;
}

export interface yValuesPerXValue {
    key: DropdownFieldCodename,
    values: number[],
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

@Component({
    selector: 'pie',
    templateUrl: './pie.component.html',
    styleUrls: ['./pie.component.scss'],
})
export class PieComponent implements OnInit, OnChanges, AfterViewInit {
    @Input() data: yValuesPerXValue[];
    @Input() chartDivElementId: AnalyzerChartIDType;
    @Input() yFields: AnalyzerField[];
    @Input() selectedYFields: DropdownFieldCodename[];
    @Input() colors = ["Blue ", "LimeGreen", "Red", "OrangeRed", "Indigo", "Yellow", "DarkMagenta", "Orange", "Crimson", "DeepSkyBlue", "DeepPink", "LightSeaGreen", '#4751e9', "#dc3912", '#00b862', '#ff5722', '#2196f3', '#eeeb0c', "#0e8816", "#910291", '#ff9800', '#ff4514'];
    @ViewChild(YFieldsTooltipComponent) tooltipComponent: YFieldsTooltipComponent;
    @Output() drilldown = new EventEmitter<yValuesPerXValue>();

    selectedYField: AnalyzerField;
    yFieldName: string;
    slices: PieSliceData[] = [];
    hoveringOver: number = -1;
    readonly fullCircle: Radians = 2 * Math.PI;
    readonly radius = this.fullCircle / (2 * Math.PI);
    readonly diameter = this.radius * 2;
    readonly radiansToDegrees = 180 / Math.PI;
    readonly degreesToRadians = Math.PI / 180;
    readonly fontScalingFactor = 0.015;         // how to calc? I eyeballed this value.
    readonly rotateEntirePie: Radians = Math.PI / 2;
    readonly labelDistanceFromCenter = this.radius * 1.5;

    constructor(private el: ElementRef) {
    }

    ngOnChanges() { // runs before AND after ngOnInit
    }

    ngOnInit() {
        this.refresh();
    }

    ngAfterViewInit() {
        this.ngOnChanges = this.refresh;
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
        let svgElement = <SVGSVGElement>(<HTMLElement>this.el.nativeElement).getElementsByTagName('svg')[0];
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
