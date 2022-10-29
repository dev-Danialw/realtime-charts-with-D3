import * as d3 from "d3";

import {
  collection,
  onSnapshot,
  addDoc,
  query,
  orderBy,
  limit,
} from "firebase/firestore";

import db from "./firebase";

const addButton = document.getElementById("add");
const removeButton = document.getElementById("remove");

addButton.addEventListener("click", async () => {
  const timestamp = Date.now();
  await addDoc(collection(db, "weather"), {
    // Random Temperature between 0 and 100 degrees
    temperature: Math.floor(Math.random() * 100),
    timestamp,
  });
});

// Firestore Reference
const q = query(
  collection(db, "weather"),
  orderBy("timestamp", "desc"),
  limit(10)
);

// Update Data source
// Real Time Data Stream
let unsubscribe = onSnapshot(q, (docSnap) => {
  const data = docSnap.docs.map((doc) => doc.data()).reverse();
  update(data);
});

unsubscribe;

// chart Styling

const svgWidth = 800;
const svgHeight = 600;

const svg = d3
  .select(".canvas")
  .append("svg")
  .attr("width", svgWidth)
  .attr("height", svgHeight)
  .style("border", "2px solid gray");

const margin = { top: 20, right: 20, bottom: 100, left: 100 };
const chartwidth = svgWidth - margin.left - margin.right;
const chartheight = svgHeight - margin.top - margin.bottom;

// Initialize the chart
const chart = svg
  .append("g")
  .attr("width", chartwidth)
  .attr("height", chartheight)
  .attr("transform", `translate(${margin.left}, ${margin.top})`);

// Initialize eaxh axis
const xAxisGroup = chart
  .append("g")
  .attr("transform", `translate(0, ${chartheight})`);
const yAxisGroup = chart.append("g");

// Scaling band for the x axis (timestamp)
const xScale = d3.scaleBand().range([0, chartwidth]).padding(0.2);

//  Linear Scale for the y axis (temperature)
const yScale = d3.scaleLinear().range([chartheight, 0]);

// Scale the x-axis (timestamps)
const xAxis = d3.axisBottom(xScale);

// Adds a temperature label for every 10 degrees
const yAxis = d3
  .axisLeft(yScale)
  .ticks(10)
  .tickFormat((d) => d + "°C");

// Update the chart when new data is added
const update = (data) => {
  // Handle the scaling domains
  xScale.domain(data.map((item) => item.timestamp));
  yScale.domain([0, d3.max(data, (item) => item.temperature)]);

  const rectanges = chart.selectAll("rect").data(data);

  // Remove the extra nodes form the DOM
  rectanges.exit().remove();

  // Initial chart scaling and stylling for enteries
  rectanges
    .attr("width", xScale.bandwidth)
    .attr("height", (item) => chartheight - yScale(item.temperature))
    .attr("x", (item) => xScale(item.timestamp))
    .attr("y", (item) => yScale(item.temperature))
    .attr("fill", "orange");

  // Chart Scaling and styling for new enteries
  rectanges
    .enter()
    .append("rect")
    .attr("x", (d) => xScale(d.timestamp))
    .attr("y", (d) => yScale(d.temperature))
    .attr("width", xScale.bandwidth)
    .transition()
    .duration(1000)
    .attr("height", (d) => chartheight - yScale(d.temperature))
    .style("fill", "orange");

  xAxisGroup.call(xAxis);
  yAxisGroup.call(yAxis);

  // Handle the chart label styling
  xAxisGroup
    .selectAll("text")
    .attr("text-anchor", "end")
    .attr("transform", "rotate(-40)") // tilt the timestamps by 40 degrees
    .attr("fill", "orange") // Timestamp(x-axis) color
    .attr("font-size", "0.5rem"); //  Timestamp(x-axis) font size

  yAxisGroup
    .selectAll("text")
    .attr("text-anchor", "end")
    .attr("fill", "orange") //  Temperature(y-axis) color
    .attr("font-size", "0.75rem"); // Temperature(y-axis) font size
};
