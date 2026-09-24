import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { loadSiteConfig } from './utils/siteConfig';

const root = ReactDOM.createRoot(document.getElementById('root'));
// Contact details / social links come from the server's .env; wait for them
// briefly (max 1.5s) so the first paint already shows the right numbers.
loadSiteConfig().finally(() => {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
