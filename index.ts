import "./pie-chart.js";
import "./chart-legend.js";
import { PieChart } from "./pie-chart.js";

export const register = (customEventType: string) => document.addEventListener(customEventType, go);

function go(e: Event | CustomEvent) {
    const eventType = 'on' + e.type;
    document.querySelectorAll('[' + eventType + ']').forEach(element => {
        const methodName = element.getAttribute(eventType) || eventType;
        const method = (element as any)[methodName];
        if (method && typeof method === 'function') method.bind(element)(e);
        else console.log('missing method', methodName);
    })
}

['drilldown', 'piechartinit'].forEach(register);


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
