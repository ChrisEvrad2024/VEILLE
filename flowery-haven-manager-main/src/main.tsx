// src/main.tsx
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initialize } from "./services";

// Initialiser la base de données avant de rendre l'application
initialize()
  .then(() => {
    createRoot(document.getElementById("root")!).render(<App />);
  })
  .catch((error) => {
    console.error("Failed to initialize application:", error);

    // Afficher un message d'erreur à l'utilisateur
    const root = document.getElementById("root");
    if (root) {
      root.innerHTML = `
      <div style="padding: 20px; text-align: center;">
        <h1>Erreur de démarrage</h1>
        <p>Impossible d'initialiser l'application. Veuillez réessayer.</p>
        <button onclick="window.location.reload()">Réessayer</button>
      </div>
    `;
    }
  });
