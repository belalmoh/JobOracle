import { SettingsPanel } from "@/components/SettingsPanel";
import { Header } from "@/components/Header";
import { useState, useEffect } from "react";
import type { ConnectionStatus } from "@/types";
import { getSettings } from "@/lib/api";

export default function App() {
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("checking");

    useEffect(() => {
        getSettings().then(() => {
            setConnectionStatus("connected");
        }).catch(() => {
            setConnectionStatus("disconnected");
        });
    }, []);

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <div className="border-b border-border/50">
                <div className="flex items-center justify-between px-6 py-4 max-w-3xl mx-auto w-full">
                    <div className="flex items-center gap-2.5">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground">
                            <span className="text-xs font-bold">JO</span>
                        </div>
                        <span className="font-semibold">JobOracle Settings</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 px-6 py-8 max-w-3xl mx-auto w-full">
                <SettingsPanel standalone />
            </div>
        </div>
    );
}