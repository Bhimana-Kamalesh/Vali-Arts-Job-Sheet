import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeColors {
    background: string;
    card: string;
    text: string;
    subText: string;
    border: string;
    hover: string;
}

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    colors: ThemeColors;
}

const lightTheme: ThemeColors = {
    background: "#f1f5f9",
    card: "#ffffff",
    text: "#0f172a",
    subText: "#64748b",
    border: "#e2e8f0",
    hover: "#f8fafc",
};

const darkTheme: ThemeColors = {
    background: "#000000",
    card: "#121212",
    text: "#ffffff",
    subText: "#a1a1aa",
    border: "#27272a",
    hover: "#27272a",
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const [theme, setTheme] = useState<Theme>(() => {
        const saved = localStorage.getItem("theme");
        return (saved as Theme) || "light";
    });

    useEffect(() => {
        localStorage.setItem("theme", theme);
        document.body.style.backgroundColor = theme === "light" ? lightTheme.background : darkTheme.background;
        document.body.style.color = theme === "light" ? lightTheme.text : darkTheme.text;
    }, [theme]);

    const toggleTheme = () => {
        setTheme((prev) => (prev === "light" ? "dark" : "light"));
    };

    const colors = theme === "light" ? lightTheme : darkTheme;

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, colors }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
};
