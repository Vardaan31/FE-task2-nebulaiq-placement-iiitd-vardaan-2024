import * as d3 from "d3";
import "@fortawesome/fontawesome-free/css/all.min.css";
import styles from "../components/ForceGraph.module.css";



// Function to run the force graph
export function runForceGraph(
  container,
  linksData,
  nodesData,
  nodeHoverTooltip
) {
  const links = linksData.map((d) => Object.assign({}, d));
  const nodes = nodesData.map((d) => Object.assign({}, d));

  const containerRect = container.getBoundingClientRect();
  const height = containerRect.height;
  const width = containerRect.width;

  // Remove any existing SVG element to avoid duplication
  d3.select(container).selectAll("svg").remove();

  const color = (d) => {
    const errorRatio = d.errors / d.invocations;
    if (errorRatio >= 0.9) return "#D32F2F"; // Dark red for high error ratio
    if (errorRatio > 0.4) return "#FF5733"; // Orange for medium error ratio
    return "#00FF00"; // Green for low error ratio
  };

  const icon = (d) => {
    switch (d.serviceType) {
      case 'HTTP': return "\uf0ac"; // FontAwesome HTTP icon
      case 'MySQL': return "\uf1c0"; // FontAwesome MySQL icon
      case 'Redis': return "\uf1c6"; // FontAwesome Redis icon
      case 'gRPC': return "\uf1c8"; // FontAwesome gRPC icon
      default: return "\uf2b9"; // Default icon
    }
  };

  const drag = (simulation) => {
    const dragstarted = (event, d) => {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    };

    const dragged = (event, d) => {
      d.fx = event.x;
      d.fy = event.y;
    };

    const dragended = (event, d) => {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = event.x; // Keep the node fixed in the dragged position
      d.fy = event.y; // Keep the node fixed in the dragged position
    };

    return d3
      .drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
  };

  // Add the tooltip element to the graph
  const tooltip = document.querySelector("#graph-tooltip");
  if (!tooltip) {
    const tooltipDiv = document.createElement("div");
    tooltipDiv.classList.add(styles.tooltip);
    tooltipDiv.style.opacity = "0";
    tooltipDiv.id = "graph-tooltip";
    document.body.appendChild(tooltipDiv);
  }
  const div = d3.select("#graph-tooltip");

  const addTooltip = (hoverTooltip, x, y) => {
    div
      .transition()
      .duration(200)
      .style("opacity", 0.9);
    div
      .html(hoverTooltip)
      .style("left", `${x}px`)
      .style("top", `${y - 28}px`);
  };

  const removeTooltip = () => {
    div
      .transition()
      .duration(200)
      .style("opacity", 0);
  };

  const simulation = d3
    .forceSimulation(nodes)
    .force("link", d3.forceLink(links).id(d => d.id).distance(150))
    .force("charge", d3.forceManyBody().strength(-300))
    .force("x", d3.forceX().strength(0.2))
    .force("y", d3.forceY().strength(0.2))
    .alphaDecay(0.05);

  const svg = d3
    .select(container)
    .append("svg")
    .attr("viewBox", [-width / 2, -height / 2, width, height])
    .call(d3.zoom().on("zoom", (event) => {
      svg.attr("transform", event.transform);
    }));

  // Add legend
  const legendData = [
    { color: "#00FF00", label: "Low Error (Green)" },
    { color: "#FF5733", label: "Medium Error (Orange)" },
    { color: "#D32F2F", label: "High Error (Red)" }
  ];

  const legend = svg.append("g")
    .attr("class", "legend")
    .attr("transform", "translate(-490,-230)"); // Adjust based on the viewBox

  legend.selectAll("rect")
    .data(legendData)
    .enter()
    .append("rect")
    .attr("x", 10)
    .attr("y", (d, i) => 20 * i)
    .attr("width", 18)
    .attr("height", 18)
    .attr("fill", d => d.color);

  legend.selectAll("text")
    .data(legendData)
    .enter()
    .append("text")
    .attr("x", 35)
    .attr("y", (d, i) => 20 * i + 14)
    .text(d => d.label)
    .style("font-size", "12px")
    .style("fill", "#000");

  const link = svg.append("g")
    .attr("stroke", "#999")
    .attr("stroke-opacity", 0.6)
    .selectAll("line")
    .data(links)
    .join("line")
    .attr("stroke-width", d => Math.sqrt(d.invocations) * 0.5) // Adjust thickness
    .attr("stroke", d => `rgba(0, 0, 0, ${d.latency / 1000})`) // Optional color based on latency
    .on("mouseover", (event, d) => {
      addTooltip(`
        Invocations: ${d.invocations}<br>
        Latency: ${d.latency} ms
      `, event.pageX, event.pageY);
    })
    .on("mouseout", removeTooltip);

  const node = svg.append("g")
    .attr("stroke", "#fff")
    .attr("stroke-width", 2)
    .selectAll("circle")
    .data(nodes)
    .join("circle")
    .attr("r", 20)
    .attr("fill", d => color(d))
    .attr("stroke", d => color(d)) // Border color based on error/success ratio
    .attr("stroke-width", 3) // Set the border width
    .call(drag(simulation))
    .on("mouseover", (event, d) => {
      addTooltip(`
        Name: ${d.name}<br>
        Port: ${d.port}<br>
        Namespace: ${d.namespace}<br>
        Clusters: ${d.clusters}<br>
        Invocations: ${d.invocations}<br>
        Errors: ${d.errors}<br>
        Type: ${d.serviceType}
      `, event.pageX, event.pageY);
    })
    .on("mouseout", removeTooltip);

  const label = svg.append("g")
    .attr("class", "labels")
    .selectAll("text")
    .data(nodes)
    .enter()
    .append("text")
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'central')
    .attr("class", d => `fa ${styles.icon}`)
    .text(d => icon(d))
    .style("font-size", "16px")
    .style("fill", "#000");

  simulation.on("tick", () => {
    // Update link positions
    link
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y);

    // Update node positions
    node
      .attr("cx", d => d.x)
      .attr("cy", d => d.y);

    // Update label positions
    label
      .attr("x", d => d.x)
      .attr("y", d => d.y);
  });

  return {
    destroy: () => {
      simulation.stop();
    },
    nodes: () => {
      return svg.node();
    }
  };
}


