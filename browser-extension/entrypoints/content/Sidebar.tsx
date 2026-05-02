import { useState, useEffect } from "react";
import { AppContent } from "@/components/AppContent";
import { X, Gear } from "@phosphor-icons/react";

interface SidebarProps {
    onClose: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        requestAnimationFrame(() => {
            setVisible(true);
        });
    }, []);

    const handleClose = () => {
        setVisible(false);
        setTimeout(onClose, 300);
    };

    const openSettings = () => {
        browser.runtime.sendMessage({ type: "OPEN_SETTINGS" });
    };

    return (
        <div className="j-sidebar-open">
            <div
                className="sidebar-container"
                style={{
                    transform: visible ? "translateX(0)" : "translateX(100%)",
                }}
            >
                <div className="sidebar-header">
                    <div className="sidebar-brand">
                        <div className="sidebar-logo">JO</div>
                        <span className="sidebar-title">JobOracle</span>
                    </div>
                    <div className="sidebar-actions">
                        <button
                            className="sidebar-close"
                            onClick={openSettings}
                            title="Open settings"
                        >
                            <Gear size={18} weight="duotone" />
                        </button>
                        <button
                            className="sidebar-close"
                            onClick={handleClose}
                            title="Close sidebar"
                        >
                            <X size={18} weight="bold" />
                        </button>
                    </div>
                </div>
                <div className="sidebar-content">
                    <AppContent />
                </div>
            </div>
        </div>
    );
}