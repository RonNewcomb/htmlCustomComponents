import { PieChart } from "./pie-chart.js";
import { ChartLegend } from "./chart-legend.js";

['drilldown','piechartinit'].forEach(register);

function register (customEventType:string){
 document.addEventListener(customEventType, go);
}
function go(e:CustomEvent){
const eventType='on'+e.type;
Array.from(document.querySelectorAll('['+eventType+']'))
.forEach(element=>{
  const method= element.getAttribute(eventType)||eventType;
  if(element[method]&&typeof element[method]==='function') element[method](e);
  else console.log('missing method', method);
})
}

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
