import React from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "./lib/auth";
import App from "./App";
import "./index.css";

// Material Icons stylesheet from Google CDN
const materialIconsLink = document.createElement("link");
materialIconsLink.href = "https://fonts.googleapis.com/icon?family=Material+Icons";
materialIconsLink.rel = "stylesheet";
document.head.appendChild(materialIconsLink);

// Inter font from Google Fonts
const interFontLink = document.createElement("link");
interFontLink.href = "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap";
interFontLink.rel = "stylesheet";
document.head.appendChild(interFontLink);

// Update document title
document.title = "Smart Academic Management System (SAMS)";

// Create app with pure React.createElement approach
createRoot(document.getElementById("root")!).render(
  React.createElement(
    QueryClientProvider, 
    { client: queryClient },
    React.createElement(
      AuthProvider, 
      null, 
      React.createElement(App, null)
    )
  )
);
