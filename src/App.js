import React from 'react';
import data from './data/data.json';
import { ForceGraph } from "./components/forceGraph";
import './App.css';

function App() {
  const nodeHoverTooltip = React.useCallback((node) => {
    return `<div>
              <strong>${node.name}</strong><br />
              Namespace: ${node.k8namespace}<br />
              Cluster: ${node.k8cluster}<br />
              Invocations: ${node.invocations}<br />
              Errors: ${node.errors}
            </div>`;
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        System Service Status
      </header>
      <section className="Main">
        <ForceGraph
          linksData={data.links}
          nodesData={data.nodes}
          nodeHoverTooltip={nodeHoverTooltip}
        />
      </section>
    </div>
  );
}

export default App;