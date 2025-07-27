import Link from "next/link";
import Image from "next/image";

export default function Header() {
  return (
    <header className="fixed top-2 z-30 w-full md:top-6">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="relative flex h-20 items-center justify-between gap-3 rounded-2xl backdrop-blur-sm bg-white/10 dark:bg-black/10 px-6 shadow-2xl border border-white/20 dark:border-white/10">
          {/* Site branding */}
          <div className="flex flex-1 items-center">
            <Link href="/">
              <Image
                src="/images/logoSmall.png"
                alt="SentinelHub Logo"
                width={200}
                height={60}
                priority
                className="hover:scale-105 transition-transform duration-200"
              />
            </Link>
          </div>
          
          {/* Desktop sign in links */}
          <ul className="flex flex-1 items-center justify-end gap-4">
            <li>
              <Link
                href="/signin"
                className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 text-white font-medium transition-all duration-200 backdrop-blur-sm shadow-lg hover:shadow-xl"
              >
                Login
              </Link>
            </li>
            <li>
              <Link
                href="/signup"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-medium shadow-lg shadow-cyan-500/25 hover:shadow-xl hover:shadow-cyan-500/40 transition-all duration-200"
              >
                Register
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
}