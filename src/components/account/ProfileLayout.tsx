"use client";

import React from 'react'
import { AccountSidebar } from './account-sidebar'

// `title` used to also render this component's own mobile header bar, but
// every caller already renders <PageBreadcrumb title={...} .../> right above
// this, which has the identical back-arrow-plus-title mobile bar — that was
// stacking two headers on every profile page. This component only lays out
// the sidebar + content now.
const ProfileLayout = ({ children }: { children: React.ReactNode; title?: string }) => {
    return (
        <>
            <div className="container flex flex-col items-start gap-6 py-6 xl:py-16 xl:flex-row xl:justify-center">
                <div className="hidden xl:block">
                    <AccountSidebar />
                </div>
                <div className="w-full flex-1">
                    {children}
                </div>
            </div>
        </>
    )
}

export default ProfileLayout