import { X } from "@phosphor-icons/react";

interface FabProps {
    onClick: () => void;
    onDismiss: () => void;
}

export default function Fab({ onClick, onDismiss }: FabProps) {
    return (
        <div className="j-fab-wrapper">
            <button
                onClick={onClick}
                className="j-fab"
                title="Open JobOracle"
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
            </button>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onDismiss();
                }}
                className="j-fab-dismiss"
                title="Hide button"
            >
                <X size={12} weight="bold" />
            </button>
        </div>
    );
}
