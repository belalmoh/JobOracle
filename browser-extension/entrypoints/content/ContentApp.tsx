import { useState, useEffect, useCallback } from "react";
import { getSettings } from "@/lib/api";
import { GreenhouseDetector } from "@/extractors/greenhouse";
import type { ExtensionSettings, JobData } from "@/types";
import Sidebar from "./Sidebar";
import Fab from "./Fab";

const TOGGLE_EVENT = "joboracle:toggle";

export default function ContentApp() {
    const [settings, setSettings] = useState<ExtensionSettings | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isJobPage, setIsJobPage] = useState(false);
    const [currentJob, setCurrentJob] = useState<JobData | null>(null);

    useEffect(() => {
        getSettings().then((s) => {
            setSettings(s);
        });
    }, []);

    const detectJob = useCallback(async () => {
        const detector = new GreenhouseDetector();
        if (detector.isJobApplicationPage()) {
            setIsJobPage(true);
            try {
                const job = await detector.extractJobData();
                setCurrentJob(job);
                browser.runtime.sendMessage({ type: "JOB_DETECTED", data: job });
                return job;
            } catch (e) {
                console.error("Job detection failed:", e);
            }
        }
        return null;
    }, []);

    useEffect(() => {
        detectJob();
    }, [detectJob]);

    useEffect(() => {
        if (!settings || !isJobPage) return;
        if (settings.autoOpenSidebar && currentJob) {
            setSidebarOpen(true);
        }
    }, [settings, isJobPage, currentJob]);

    // listen for toggle event from background/icon click
    useEffect(() => {
        const onToggle = () => {
            setSidebarOpen((prev) => !prev);
        };
        document.addEventListener(TOGGLE_EVENT, onToggle);
        return () => document.removeEventListener(TOGGLE_EVENT, onToggle);
    }, []);

    const openSidebar = useCallback(() => {
        setSidebarOpen(true);
    }, []);

    const closeSidebar = useCallback(() => {
        setSidebarOpen(false);
    }, []);

    if (!settings) return null;

    const showFab = settings.showFloatingButton && isJobPage && !sidebarOpen;

    return (
        <>
            {showFab && <Fab onClick={openSidebar} />}
            {sidebarOpen && (
                <Sidebar onClose={closeSidebar} />
            )}
        </>
    );
}