import { usePage } from "@inertiajs/react"
import { useState } from "react"

export default function WelcomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-screen w-full flex">
      <main className="">
        {children}
      </main>
    </div>
  )
}