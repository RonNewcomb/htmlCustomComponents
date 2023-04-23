import "./pie-chart.js";
import "./chart-legend.js";
import "./pop-over.js";
import { PieChart } from "./pie-chart.js";
import "./flex-row.js";

["drilldown", "pieChartInit", "showTip", "hideTip"].forEach(et =>
  document.addEventListener(
    et,
    ev => document.querySelectorAll(`[${ev.type}]`).forEach((el: any) => el?.[el.getAttribute(ev.type) || ev.type]?.bind(el)(ev)),
    true
  )
);

(window as any).addN = (n: number = 10) => {
  const pie = document.querySelector("pie-chart") as PieChart;
  for (let i = 0; i < n; i++)
    pie.data.push({
      key: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
      values: { popularity: Math.floor(Math.random() * Math.random() * 100) + 1 },
    });
  pie.render();
};

const pie = document.querySelector("pie-chart") as PieChart;
pie.data = [];
(window as any).addN(3);
