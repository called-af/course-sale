import { Link } from "@inertiajs/react"

const links = {
  "Product": [
    { name: "Courses", href: "/courses" },
    { name: "Instructors", href: "/instructors" },
    { name: "Certification", href: "/certification" },
  ],
  "Company": [
    { name: "About Us", href: "/about" },
    { name: "Careers", href: "/careers" },
    { name: "Blog", href: "/blog" },
  ],
  "Support": [
    { name: "FAQ", href: "/faq" },
    { name: "Contact", href: "/contact" },
    { name: "Privacy Policy", href: "/privacy" },
  ],
}

export default function Footer() {
  return (
    <footer className="bg-[#1a1a1a] text-white">

      {/* Main */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">

        {/* Brand */}
        <div className="flex flex-col gap-4">
          <Link href="/" className="flex items-center gap-2">
            <img src="/images/logo.svg" alt="Logo" className="h-8 w-auto" />
          </Link>
          <p className="text-gray-500 text-sm leading-relaxed">
            The best digital learning platform to develop your skills and advance your career.
          </p>
        </div>

        {/* Links */}
        {Object.entries(links).map(([group, items]) => (
          <div key={group} className="flex flex-col gap-4">
            <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
              {group}
            </span>
            <ul className="flex flex-col gap-3">
              {items.map((item) => (
                <li key={item.name}>
                  <Link href={item.href} className="text-sm text-gray-500 hover:text-white transition-colors">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-gray-600">
            © {new Date().getFullYear()} KursusIO. All rights reserved.
          </span>
          <div className="flex items-center gap-6">
            {["Twitter", "Instagram", "LinkedIn"].map((s) => (
              <a key={s} href="#" className="text-xs text-gray-600 hover:text-white transition-colors">
                {s}
              </a>
            ))}
          </div>
        </div>
      </div>

    </footer>
  )
}
