import React from 'react';
import ReactDOM from 'react-dom/client';
import { Panel } from './components/Panel';

const rootElement = document.getElementById('panel-root');
if (!rootElement) {
  throw new Error("Could not find panel root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <Panel />
  </React.StrictMode>
);
