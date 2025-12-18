import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// Load Google Charts before rendering the app
(window as any).google?.charts.load('current', { 'packages': ['corechart'] });
(window as any).google?.charts.setOnLoadCallback(() => {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});