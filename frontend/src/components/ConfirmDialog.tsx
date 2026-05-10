import React, { useEffect, useRef } from "react";
import "./ConfirmDialog.css";

interface ConfirmDialogProps {
    isOpen: boolean;
    title?: string;
    message?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    title = "Delete this recipe?",
    message = "This action cannot be undone. The recipe will be permanently removed from your collection.",
    confirmLabel = "Delete",
    cancelLabel = "Cancel",
    onConfirm,
    onCancel,
}) => {
    const confirmBtnRef = useRef<HTMLButtonElement>(null);

    // Auto-focus the confirm button when dialog opens
    useEffect(() => {
        if (isOpen) {
            confirmBtnRef.current?.focus();
        }
    }, [isOpen]);

    // Close on Escape key
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onCancel();
        };
        if (isOpen) document.addEventListener("keydown", handleKey);
        return () => document.removeEventListener("keydown", handleKey);
    }, [isOpen, onCancel]);

    if (!isOpen) return null;

    return (
        <div className="cd-overlay" onClick={onCancel} role="dialog" aria-modal="true" aria-labelledby="cd-title">
            {/* Stop clicks inside the box from closing the dialog */}
            <div className="cd-box" onClick={(e) => e.stopPropagation()}>
                <div className="cd-top">
                    <div className="cd-icon" aria-hidden="true">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            <path d="M10 11v6M14 11v6" />
                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                        </svg>
                    </div>
                    <p id="cd-title" className="cd-title">{title}</p>
                    <p className="cd-msg">{message}</p>
                </div>

                <div className="cd-actions">
                    <button className="cd-btn cd-btn-cancel" onClick={onCancel}>
                        {cancelLabel}
                    </button>
                    <button
                        className="cd-btn cd-btn-confirm"
                        ref={confirmBtnRef}
                        onClick={onConfirm}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;
