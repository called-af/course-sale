import Navbar from "../organisms/Landing/Navbar"
import Footer from "../organisms/Landing/Footer"

export default function WelcomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-screen w-full flex flex-col bg-white dark:bg-[#0f0f0f]">
      <Navbar/>
      <main className="">
        {children}
      </main>
      <Footer/>
    </div>
  )
}
