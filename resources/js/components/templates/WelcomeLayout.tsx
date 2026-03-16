import { usePage } from "@inertiajs/react"
import { useState } from "react"
import Navbar from "../organism/Landing/Navbar"
import Footer from "../organism/Landing/Footer"

export default function WelcomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-screen w-full flex flex-col">
      <Navbar/>
      <main className="">
        {children}
      </main>
      <Footer/>
    </div>
  )
}