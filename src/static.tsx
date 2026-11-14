import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { getRouter } from './router';
import './styles.css';

const container = document.getElementById('root');
if (!container) throw new Error('O ponto de montagem do painel não foi encontrado.');

createRoot(container).render(
  <StrictMode><RouterProvider router={getRouter()} /></StrictMode>,
);