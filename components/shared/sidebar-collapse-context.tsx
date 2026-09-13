"use client"

import { createContext, useContext, type ReactNode } from "react"

type SidebarCollapseContextValue = {
    collapsed: boolean
    toggleCollapsed: () => void
}

const SidebarCollapseContext = createContext<SidebarCollapseContextValue>({
    collapsed: false,
    toggleCollapsed: () => undefined,
})

export function SidebarCollapseProvider({
    collapsed,
    toggleCollapsed,
    children,
}: SidebarCollapseContextValue & { children: ReactNode }) {
    return (
        <SidebarCollapseContext.Provider value={{ collapsed, toggleCollapsed }}>
            {children}
        </SidebarCollapseContext.Provider>
    )
}

export function useSidebarCollapse() {
    return useContext(SidebarCollapseContext)
}
