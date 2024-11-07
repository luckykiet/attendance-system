import '@/assets/fonts/inter/inter.css';

import App from '@/App';
import { createRoot } from 'react-dom/client';

const container = document.getElementById('root');
const root = createRoot(container!);

// ==============================|| MAIN - REACT DOM RENDER  ||============================== //

root.render(
  <App />
);
