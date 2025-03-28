// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { dbService } from './services/db.service';

// Initialiser la base de données avant de rendre l'application
dbService.initDatabase()
  .then(() => {
    console.log('Database successfully initialized');
    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </React.StrictMode>
    );
  })
  .catch(error => {
    console.error('Failed to initialize database:', error);
    // Afficher un message d'erreur à l'utilisateur
    document.body.innerHTML = `
      <div style="padding: 20px; text-align: center;">
        <h1>Erreur d'initialisation</h1>
        <p>Impossible d'initialiser l'application. Veuillez rafraîchir la page ou contacter le support.</p>
      </div>
    `;
  });