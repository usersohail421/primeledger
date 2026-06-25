import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { PostHogProvider } from "@posthog/react";

const options = {
    api_host: import.meta.env.VITE_POSTHOG_HOST,
    defaults: "2026-05-30",
} as const;

createRoot(document.getElementById("root")!).render(
    <PostHogProvider
        apiKey={import.meta.env.VITE_POSTHOG_PROJECT_TOKEN}
        options={options}
    >
        <App />
    </PostHogProvider>
);