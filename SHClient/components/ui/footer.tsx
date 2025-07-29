import Link from "next/link";
import Image from "next/image";

export default function Footer({ border = false }: { border?: boolean }) {
  return (
    <footer className="relative">
      {/* Big text */}
      <div
        className="absolute inset-0 -z-10 flex items-center justify-center opacity-10"
        aria-hidden="true"
      >
  <div className="pointer-events-none text-center text-[200px] font-bold leading-none text-white/10">
          SENTINELHUB
        </div>
        {/* Glow */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-2/3"
          aria-hidden="true"
        >
          <div className="h-56 w-56 rounded-full border-[20px] border-cyan-700/50 blur-[80px]"></div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 relative z-10">
        {/* Top area: Blocks */}
        <div
          className={`grid gap-10 py-8 sm:grid-cols-12 md:py-12 relative ${border ? "border-t border-gray-700/50" : ""}`}
        >
          {/* 1st block */}
          <div className="space-y-2 sm:col-span-12 lg:col-span-4">
            <div>
              <Image
                src="/images/logoSmall.png"
                alt="SentinelHub Logo"
                width={160}
                height={80}
                priority
              />
            </div>
            <div className="text-sm text-gray-400">
              &copy; SentinelHub - Built by Sarah Henia for The SamurAI
            </div>
          </div>

          {/* 2nd block */}
          <div className="space-y-2 sm:col-span-6 md:col-span-3 lg:col-span-2">
            <h3 className="text-sm font-medium text-white">Platform</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  className="text-gray-400 transition hover:text-cyan-400"
                  href="#0"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  className="text-gray-400 transition hover:text-cyan-400"
                  href="#0"
                >
                  Security Scanning
                </Link>
              </li>
              <li>
                <Link
                  className="text-gray-400 transition hover:text-cyan-400"
                  href="#0"
                >
                  AI Analysis
                </Link>
              </li>
            </ul>
          </div>

          {/* 3rd block */}
          <div className="space-y-2 sm:col-span-6 md:col-span-3 lg:col-span-2">
            <h3 className="text-sm font-medium text-white">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  className="text-gray-400 transition hover:text-cyan-400"
                  href="#0"
                >
                  GitHub
                </Link>
              </li>
              <li>
                <Link
                  className="text-gray-400 transition hover:text-cyan-400"
                  href="#0"
                >
                  API Documentation
                </Link>
              </li>
              <li>
                <Link
                  className="text-gray-400 transition hover:text-cyan-400"
                  href="#0"
                >
                  Report Issue
                </Link>
              </li>
            </ul>
          </div>

          {/* 4th block with SamurAI credit */}
          <div className="space-y-2 sm:col-span-6 md:col-span-3 lg:col-span-4 relative">
            <h3 className="text-sm font-medium text-white">Connect</h3>
            <ul className="flex gap-1">
              <li>
                <Link
                  className="flex items-center justify-center text-cyan-400 transition hover:text-cyan-300"
                  href="https://github.com/sarahhenia20"
                  aria-label="GitHub"
                >
                  <svg
                    className="h-8 w-8 fill-current"
                    viewBox="0 0 32 32"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M16 8.2c-4.4 0-8 3.6-8 8 0 3.5 2.3 6.5 5.5 7.6.4.1.5-.2.5-.4V22c-2.2.5-2.7-1-2.7-1-.4-.9-.9-1.2-.9-1.2-.7-.5.1-.5.1-.5.8.1 1.2.8 1.2.8.7 1.3 1.9.9 2.3.7.1-.5.3-.9.5-1.1-1.8-.2-3.6-.9-3.6-4 0-.9.3-1.6.8-2.1-.1-.2-.4-1 .1-2.1 0 0 .7-.2 2.2.8.6-.2 1.3-.3 2-.3s1.4.1 2 .3c1.5-1 2.2-.8 2.2-.8.4 1.1.2 1.9.1 2.1.5.6.8 1.3.8 2.1 0 3.1-1.9 3.7-3.7 3.9.3.4.6.9.6 1.6v2.2c0 .2.1.5.6.4 3.2-1.1 5.5-4.1 5.5-7.6-.1-4.4-3.7-8-8.1-8z"></path>
                  </svg>
                </Link>
              </li>
            </ul>
            
            {/* SamurAI Credit - Bottom Right */}
            <div className="absolute bottom-0 right-0 flex items-center gap-2 text-xs text-gray-400 hover:text-gray-300 transition-colors">
              <span>Powered by</span>
              <Image
                src="/images/swhite.png"
                alt="SamurAI Logo"
                width={25}
                height={25}
                className="opacity-60 hover:opacity-80 transition-opacity"
              />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}