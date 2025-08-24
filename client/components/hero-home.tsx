import Image from "next/image";
import PageIllustration from "@/components/page-illustration";

export default function HeroHome() {
  return (
    <section className="relative overflow-hidden">
      <PageIllustration />
      
      {/* Subtle floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1.5 h-1.5 bg-blue-400/30 rounded-full animate-float-data"
            style={{
              left: `${10 + i * 10}%`,
              top: `${15 + (i % 3) * 25}%`,
              animationDelay: `${i * 1}s`,
              animationDuration: `${12 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="pb-12 pt-32 md:pb-20 md:pt-40">
          <div className="pb-12 text-center md:pb-16">
            {/* Hero badge */}
            <div className="inline-flex items-center px-4 py-2 mb-8 rounded-full text-sm font-medium text-cyan-400 border border-cyan-500/30 bg-gray-800/50 backdrop-blur-sm animate-hero-bounce">
              AI-Powered Security Intelligence
            </div>

            <h1
              className="mb-8 text-5xl font-bold md:text-6xl lg:text-7xl animate-hero-bounce delay-200 leading-tight"
              data-aos="zoom-y-out"
            >
              <span className="block text-white mb-2">Secure your code with</span>
              <span className="block bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-400 bg-clip-text text-transparent">
                SentinelHub Intelligence
              </span>
            </h1>

            <div className="mx-auto max-w-3xl animate-hero-bounce delay-400">
              <p
                className="mb-8 text-xl md:text-2xl text-gray-300 leading-relaxed"
                data-aos="zoom-y-out"
                data-aos-delay={300}
              >
                SentinelHub scans <span className="text-cyan-400 font-semibold">GitHub repositories</span>, 
                <span className="text-blue-400 font-semibold"> S3 buckets</span>, and uploaded code 
                for security vulnerabilities. Get <span className="text-indigo-400 font-semibold">AI-powered insights</span>, 
                real-time monitoring, and actionable security recommendations.
              </p>

              <div className="relative animate-hero-bounce delay-600">
                <div
                  className="mx-auto max-w-xs sm:flex sm:max-w-none sm:justify-center gap-4"
                  data-aos="zoom-y-out"
                  data-aos-delay={450}
                >
                  {/* Primary CTA */}
                  <a
                    className="btn group mb-4 w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-medium rounded-xl shadow-lg shadow-cyan-500/25 hover:shadow-xl hover:shadow-cyan-500/40 transform hover:scale-105 transition-all duration-300 sm:mb-0 sm:w-auto py-3 px-8"
                    href="/signup"
                  >
                    <span className="relative inline-flex items-center">
                      Start Scanning
                    </span>
                  </a>
                  
                  {/* Secondary CTA */}
                  <a
                    className="btn group w-full bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/30 backdrop-blur-sm transform hover:scale-105 transition-all duration-300 sm:w-auto py-3 px-8 rounded-xl"
                    href="#demo"
                  >
                    <span className="relative inline-flex items-center">
                      Watch Demo
                    </span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Terminal box */}
          <div
            className="mx-auto max-w-5xl animate-hero-bounce delay-800"
            data-aos="zoom-y-out"
            data-aos-delay={600}
          >
            <div className="relative aspect-[4/1.3] rounded-2xl bg-gradient-to-br from-gray-900/95 to-gray-800/95 px-12 py-10 shadow-2xl border border-gray-700/50 backdrop-blur-sm">
              {/* Terminal header */}
              <div className="relative mb-12 flex items-center justify-between">
                {/* Left side dots */}
                <div className="flex space-x-2">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                </div>
                
                {/* Center title */}
                <span className="absolute left-1/2 transform -translate-x-1/2 text-sm font-medium text-white">
                  sentinelhub.com
                </span>
                
                {/* Right side (empty for balance) */}
                <div className="w-[66px]"></div>
              </div>

              {/* Terminal content */}
              <div className="font-mono text-base text-gray-500 space-y-4 px-8">
                <div 
                  className="text-cyan-300 font-medium opacity-0 animate-[fadeIn_0.5s_ease-in-out_1s_forwards]"
                >
                  $ sentinelhub scan --repo sarahhenia20/my-app
                </div>
                <div 
                  className="text-gray-300 opacity-0 pl-4 animate-[fadeIn_0.5s_ease-in-out_2s_forwards]"
                >
                  Scanning repository for vulnerabilities...
                </div>
                <div 
                  className="text-green-400 opacity-0 pl-4 animate-[fadeIn_0.5s_ease-in-out_3s_forwards]"
                >
                  ✓ Found 247 files to analyze
                </div>
                <div 
                  className="text-cyan-300 font-medium opacity-0 animate-[fadeIn_0.5s_ease-in-out_4s_forwards]"
                >
                  $ sentinelhub analyze --ai-insights
                </div>
                <div 
                  className="text-blue-300 opacity-0 pl-4 animate-[fadeIn_0.5s_ease-in-out_5s_forwards]"
                >
                  AI Analysis: 3 critical issues found
                </div>
                <div 
                  className="text-yellow-400 opacity-0 pl-4 animate-[fadeIn_0.5s_ease-in-out_6s_forwards]"
                >
                  ⚠ SQL injection vulnerability detected
                </div>
                <div 
                  className="text-cyan-300 font-medium opacity-0 animate-[fadeIn_0.5s_ease-in-out_7s_forwards]"
                >
                  $ sentinelhub report --format json
                </div>
                <div 
                  className="text-blue-400 opacity-0 pl-4 animate-[fadeIn_0.5s_ease-in-out_8s_forwards]"
                >
                  Security report generated successfully
                </div>
                <div 
                  className="text-cyan-300 font-medium opacity-0 animate-[fadeIn_0.5s_ease-in-out_9s_forwards]"
                >
                  $ sentinelhub monitor --s3-bucket my-code-bucket
                </div>
                <div 
                  className="text-blue-400 opacity-0 pl-4 animate-[fadeIn_0.5s_ease-in-out_10s_forwards]"
                >
                  Real-time monitoring enabled
                </div>
                <div 
                  className="text-green-400 opacity-0 pl-4 animate-[fadeIn_0.5s_ease-in-out_11s_forwards]"
                >
                  ✓ Dashboard available at https://sentinelhub.com/dashboard
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}