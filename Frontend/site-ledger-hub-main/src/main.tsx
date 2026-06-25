import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { PostHogProvider } from "@posthog/react";

const options = {
    api_host: "https://us.i.posthog.com",
    defaults: "2026-05-30",
} as const;

createRoot(document.getElementById("root")!).render(
    <PostHogProvider
        apiKey="phc_qrj87ktgHeXhzJKCb9v9qoQryFdnAUrhvKwEgK7BS6Bq"
        options={options}
    >
        <App />
    </PostHogProvider>
);