"use client"

import * as React from "react"
import { Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "next-themes"

export function ThemeToggle() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        // Render a placeholder or nothing during SSR to avoid mismatch
        return <div className="w-[88px] h-[32px] bg-neutral/10 rounded-full animate-pulse opacity-50" />
    }

    return (
        <div className="flex items-center gap-1 p-1 bg-neutral/10 rounded-full border border-neutral/20">
            <button
                onClick={() => setTheme("light")}
                className={`p-1.5 rounded-full transition-all ${theme === "light" ? "bg-card text-primary shadow-sm" : "text-neutral hover:text-foreground"
                    }`}
                aria-label="Light Mode"
            >
                <Sun size={14} />
            </button>
            <button
                onClick={() => setTheme("system")}
                className={`p-1.5 rounded-full transition-all ${theme === "system" ? "bg-card text-primary shadow-sm" : "text-neutral hover:text-foreground"
                    }`}
                aria-label="System Preference"
            >
                <Monitor size={14} />
            </button>
            <button
                onClick={() => setTheme("dark")}
                className={`p-1.5 rounded-full transition-all ${theme === "dark" ? "bg-card text-primary shadow-sm" : "text-neutral hover:text-foreground"
                    }`}
                aria-label="Dark Mode"
            >
                <Moon size={14} />
            </button>
        </div>
    )
}
