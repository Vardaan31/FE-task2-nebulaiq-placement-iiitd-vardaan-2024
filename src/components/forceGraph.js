import React, { useRef, useEffect } from 'react';
import { runForceGraph } from "./ForceGraphGenerator";
import styles from "../components/ForceGraph.module.css";

export function ForceGraph({ linksData, nodesData, nodeHoverTooltip }) {
  const containerRef = useRef(null);

  useEffect(() => {
    // Ensure the previous graph instance is cleaned up
    let destroyFn = () => {};

    if (containerRef.current) {
      // Initialize the force graph
      const { destroy } = runForceGraph(containerRef.current, linksData, nodesData, nodeHoverTooltip);
      destroyFn = destroy;
    }

    // Cleanup the graph instance on unmount or when dependencies change
    return () => {
      destroyFn();
    };
  }, [linksData, nodesData, nodeHoverTooltip]);

  return <div ref={containerRef} className={styles.container} />;
}
