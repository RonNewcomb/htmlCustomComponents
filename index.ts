import { PieChart } from "./pie-chart.js";
import { ChartLegend } from "./chart-legend.js";

const xAxis = document.querySelector("chart-legend#xAxis") as ChartLegend;
document.addEventListener("drilldown", e => xAxis.propertyChangedCallback(e));
const yAxis = document.querySelector("chart-legend#yAxis") as ChartLegend;
document.addEventListener("piechartinit", e => yAxis.propertyChangedCallback(e));

(window as any).addN = (n: number = 10) => {
    const pie = document.querySelector("pie-chart") as PieChart;
    for (var i = 0; i < n; i++)
        pie.data.push({
            key: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
            values: { popularity: Math.floor(Math.random() * Math.random() * 100) },
        });
    pie.render();
};

const pie = document.querySelector("pie-chart") as PieChart;
pie.data = [];
(window as any).addN(3);
