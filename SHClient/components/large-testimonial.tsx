export default function LargeTestimonial() {
  return (
    <section className="relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse-slow"></div>
      
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-cyan-400/30 rounded-full animate-float-data"
            style={{
              left: `${10 + i * 12}%`,
              top: `${20 + (i % 3) * 25}%`,
              animationDelay: `${i * 0.8}s`,
              animationDuration: `${8 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>

      <div className="relative mx-auto max-w-4xl px-4 sm:px-6">
        <div className="py-16 md:py-24">
          <div 
            className="text-center"
            data-aos="zoom-y-out"
            data-aos-delay="100"
          >
            {/* Enhanced multi-layered icon */}
            <div className="relative inline-flex items-center justify-center mb-8">
              {/* Outer glow ring */}
              <div className="absolute inset-0 w-24 h-24 rounded-full bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-indigo-500/20 blur-xl animate-pulse-slow"></div>
              
              {/* Secondary ring */}
              <div className="absolute inset-2 w-20 h-20 rounded-full bg-gradient-to-r from-cyan-400/30 to-blue-400/30 blur-lg animate-pulse-slow delay-500"></div>
              
              {/* Main icon container */}
              <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-600 shadow-lg shadow-cyan-500/50 flex items-center justify-center group hover:scale-110 transition-transform duration-300">
                {/* Inner highlight */}
                <div className="absolute inset-1 rounded-full bg-gradient-to-br from-white/20 to-transparent"></div>
                
                {/* Shield icon with enhanced styling */}
                <svg
                  className="relative w-8 h-8 text-white drop-shadow-lg group-hover:scale-110 transition-transform duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>

                {/* Animated pulse rings */}
                <div className="absolute inset-0 rounded-full border-2 border-white/30 animate-ping"></div>
                <div className="absolute inset-0 rounded-full border border-cyan-300/50 animate-ping delay-300"></div>
              </div>
            </div>

            {/* Enhanced heading with gradient */}
            <h3 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white via-cyan-200 to-white bg-clip-text text-transparent mb-6">
              Trusted Security Intelligence
            </h3>

            {/* Enhanced description with better typography */}
            <div className="space-y-4">
              <p className="text-xl md:text-2xl text-gray-300 font-medium leading-relaxed max-w-3xl mx-auto">
                SentinelHub combines <span className="text-cyan-400 font-semibold">static code analysis</span>, 
                <span className="text-blue-400 font-semibold"> AI-powered insights</span>, 
                and <span className="text-indigo-400 font-semibold">real-time monitoring</span> to keep your applications secure.
              </p>
              
              {/* Stats or features */}
              <div 
                className="flex flex-wrap justify-center gap-8 mt-8 pt-8 border-t border-gray-700/50"
                data-aos="fade-up"
                data-aos-delay="300"
              >
                <div className="text-center">
                  <div className="text-2xl font-bold text-cyan-400">99.9%</div>
                  <div className="text-sm text-gray-400 font-medium">Threat Detection</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">24/7</div>
                  <div className="text-sm text-gray-400 font-medium">Monitoring</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-400">0.1s</div>
                  <div className="text-sm text-gray-400 font-medium">Response Time</div>
                </div>
              </div>
            </div>

            {/* Call-to-action button */}
            <div 
              className="mt-10"
              data-aos="fade-up"
              data-aos-delay="500"
            >
              <button className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold rounded-xl transform hover:scale-105 transition-all duration-300 shadow-lg shadow-cyan-500/25 hover:shadow-xl hover:shadow-cyan-500/40">
                <span>Explore Security Features</span>
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom decorative element */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>
    </section>
  );
}