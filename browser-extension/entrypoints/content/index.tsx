import ReactDOM from "react-dom/client";
import ContentApp from "./ContentApp";
import "./style.css";

const TOGGLE_EVENT = "joboracle:toggle";

export default defineContentScript({
    matches: [
        "*://*.greenhouse.io/*",
        "*://*.lever.co/*",
        "*://*.workday.com/*",
        "*://*.myworkdayjobs.com/*",
    ],
    main() {
        if ((document as any).__jobOracleLoaded) return;
        (document as any).__jobOracleLoaded = true;

        const host = document.createElement("div");
        host.id = "joboracle-extension-root";
        document.body.appendChild(host);

        const root = ReactDOM.createRoot(host);
        root.render(<ContentApp />);

        const messageListener = (message: { type: string }) => {
            if (message.type === "TOGGLE_SIDEBAR") {
                document.dispatchEvent(new CustomEvent(TOGGLE_EVENT));
            }
        };
        browser.runtime.onMessage.addListener(messageListener);

        return () => {
            root.unmount();
            host.remove();
            browser.runtime.onMessage.removeListener(messageListener);
        };
    },
});