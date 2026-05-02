import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ExtensionSettings, AIProvider } from "@/types";
import { getSettings, saveSettings } from "@/lib/api";
import { Check, ArrowLeft, FloppyDisk } from "@phosphor-icons/react";

interface SettingsPanelProps {
    onBack?: () => void;
    standalone?: boolean;
}

const AI_PROVIDERS: { value: AIProvider; label: string }[] = [
    { value: "ollama", label: "Ollama (Local)" },
    { value: "openai", label: "OpenAI" },
    { value: "claude", label: "Claude (Anthropic)" },
    { value: "custom", label: "Custom Provider" },
];

export function SettingsPanel({ onBack, standalone = false }: SettingsPanelProps) {
    const [settings, setSettings] = useState<ExtensionSettings | null>(null);
    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getSettings().then((s) => {
            setSettings(s);
            setLoading(false);
        });
    }, []);

    const update = <K extends keyof ExtensionSettings>(key: K, value: ExtensionSettings[K]) => {
        setSettings((prev) => (prev ? { ...prev, [key]: value } : null));
        setSaved(false);
    };

    const handleSave = async () => {
        if (!settings) return;
        await saveSettings(settings);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    if (loading || !settings) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {!standalone && onBack && (
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="gap-1" onClick={onBack}>
                        <ArrowLeft size={16} weight="duotone" />
                        Back
                    </Button>
                </div>
            )}

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">General</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">Theme</label>
                        <select
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={settings.theme}
                            onChange={(e) => update("theme", e.target.value as ExtensionSettings["theme"])}
                        >
                            <option value="system">System</option>
                            <option value="light">Light</option>
                            <option value="dark">Dark</option>
                        </select>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">AI Provider</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">Provider</label>
                        <select
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={settings.aiProvider}
                            onChange={(e) => update("aiProvider", e.target.value as AIProvider)}
                        >
                            {AI_PROVIDERS.map((p) => (
                                <option key={p.value} value={p.value}>
                                    {p.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {settings.aiProvider === "ollama" && (
                        <>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Ollama URL</label>
                                <input
                                    type="text"
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={settings.ollamaUrl}
                                    onChange={(e) => update("ollamaUrl", e.target.value)}
                                    placeholder="http://localhost:11434"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Model</label>
                                <input
                                    type="text"
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={settings.ollamaModel}
                                    onChange={(e) => update("ollamaModel", e.target.value)}
                                    placeholder="llama3"
                                />
                            </div>
                        </>
                    )}

                    {settings.aiProvider !== "ollama" && (
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">API Key</label>
                            <input
                                type="password"
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={settings.apiKey || ""}
                                onChange={(e) => update("apiKey", e.target.value)}
                                placeholder="Enter your API key"
                            />
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Behavior</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <ToggleRow
                        label="Auto-open sidebar on job pages"
                        description="Automatically show the sidebar when you visit a job posting"
                        checked={settings.autoOpenSidebar}
                        onChange={(v) => update("autoOpenSidebar", v)}
                    />
                    <ToggleRow
                        label="Show floating button"
                        description="Display a floating action button on job pages"
                        checked={settings.showFloatingButton}
                        onChange={(v) => update("showFloatingButton", v)}
                    />
                    <ToggleRow
                        label="Auto-detect application forms"
                        description="Automatically detect and highlight job application form fields"
                        checked={settings.autoDetectForms}
                        onChange={(v) => update("autoDetectForms", v)}
                    />
                    <ToggleRow
                        label="Smart field matching"
                        description="Intelligently match resume fields to form fields"
                        checked={settings.smartFieldMatching}
                        onChange={(v) => update("smartFieldMatching", v)}
                    />
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Backend</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">Backend URL</label>
                        <input
                            type="text"
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={settings.backendUrl}
                            onChange={(e) => update("backendUrl", e.target.value)}
                            placeholder="http://localhost:3000/api"
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="flex items-center justify-end gap-3 pt-2">
                {saved && (
                    <span className="text-xs text-green-500 flex items-center gap-1">
                        <Check size={14} weight="bold" />
                        Saved
                    </span>
                )}
                <Button onClick={handleSave} className="gap-1.5">
                    <FloppyDisk size={16} weight="duotone" />
                    Save Settings
                </Button>
            </div>
        </div>
    );
}

function ToggleRow({
    label,
    description,
    checked,
    onChange,
}: {
    label: string;
    description: string;
    checked: boolean;
    onChange: (v: boolean) => void;
}) {
    return (
        <div className="flex items-start justify-between gap-4 py-2">
            <div className="space-y-0.5">
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
            </div>
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                onClick={() => onChange(!checked)}
                className={`
                    relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200
                    ${checked ? "bg-primary" : "bg-input"}
                `}
            >
                <span
                    className={`
                        inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200
                        ${checked ? "translate-x-6" : "translate-x-1"}
                    `}
                    style={{ marginTop: 4 }}
                />
            </button>
        </div>
    );
}