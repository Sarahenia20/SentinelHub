import Image from "next/image";
import WorflowImg01 from "@/public/images/workflow-01.png";
import WorflowImg02 from "@/public/images/workflow-02.png";
import WorflowImg03 from "@/public/images/workflow-03.png";
import Spotlight from "@/components/spotlight";

export default function FeaturesPlanet() {
  return (
    <section className="relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse-slow"></div>
      
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1.5 h-1.5 bg-cyan-400/30 rounded-full animate-float-data"
            style={{
              left: `${15 + i * 15}%`,
              top: `${20 + (i % 2) * 40}%`,
              animationDelay: `${i * 1.2}s`,
              animationDuration: `${10 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="pb-12 md:pb-20">
          {/* Section header */}
          <div 
            className="mx-auto max-w-3xl pb-12 text-center md:pb-20"
            data-aos="zoom-y-out"
            data-aos-delay="100"
          >
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 mb-6 rounded-full text-sm font-medium text-cyan-400 border border-cyan-500/30 bg-gray-800/50 backdrop-blur-sm">
              DevSecOps Intelligence
            </div>

            {/* Heading */}
            <h2 className="mb-6 text-3xl font-bold md:text-4xl">
              <span className="block text-white">Security scanning</span>
              <span className="block bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-400 bg-clip-text text-transparent">
                workflow
              </span>
            </h2>

            {/* Description */}
            <p className="text-xl text-gray-300 leading-relaxed">
              Connect your <span className="text-cyan-400 font-semibold">repositories</span>, upload code, or monitor 
              <span className="text-blue-400 font-semibold"> S3 buckets</span>. 
              Get instant security insights with <span className="text-indigo-400 font-semibold">AI-powered vulnerability analysis</span> 
              and real-time monitoring.
            </p>
          </div>

          {/* Spotlight items */}
          <Spotlight className="group mx-auto grid max-w-sm items-start gap-6 lg:max-w-none lg:grid-cols-3">
            {/* Card 1 */}
            <a
              className="group/card relative h-full overflow-hidden rounded-2xl bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 p-px before:pointer-events-none before:absolute before:-left-40 before:-top-40 before:z-10 before:h-80 before:w-80 before:translate-x-[var(--mouse-x)] before:translate-y-[var(--mouse-y)] before:rounded-full before:bg-cyan-500/80 before:opacity-0 before:blur-3xl before:transition-opacity before:duration-500 after:pointer-events-none after:absolute after:-left-48 after:-top-48 after:z-30 after:h-64 after:w-64 after:translate-x-[var(--mouse-x)] after:translate-y-[var(--mouse-y)] after:rounded-full after:bg-cyan-500 after:opacity-0 after:blur-3xl after:transition-opacity after:duration-500 hover:after:opacity-20 group-hover:before:opacity-100"
              href="#0"
              data-aos="zoom-y-out"
              data-aos-delay="200"
            >
              <div className="relative z-20 h-full overflow-hidden rounded-[inherit] bg-gray-900/95 backdrop-blur-sm after:absolute after:inset-0 after:bg-gradient-to-br after:from-gray-800/50 after:via-gray-900/25 after:to-gray-900/50">
                {/* Arrow */}
                <div
                  className="absolute right-6 top-6 flex h-8 w-8 items-center justify-center rounded-full border border-gray-700/50 bg-gray-800/65 text-gray-200 opacity-0 transition-opacity group-hover/card:opacity-100"
                  aria-hidden="true"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width={9}
                    height={8}
                    fill="none"
                  >
                    <path
                      fill="#F4F4F5"
                      d="m4.92 8-.787-.763 2.733-2.68H0V3.443h6.866L4.133.767 4.92 0 9 4 4.92 8Z"
                    />
                  </svg>
                </div>
                {/* Image */}
                <Image
                  className="inline-flex"
                  src={WorflowImg01}
                  width={350}
                  height={288}
                  alt="GitHub Integration"
                />
                {/* Content */}
                <div className="p-6">
                  <div className="mb-3">
                    <span className="btn-sm relative rounded-full bg-gray-800/40 px-2.5 py-0.5 text-xs font-normal border border-cyan-500/30">
                      <span className="bg-gradient-to-r from-cyan-400 to-blue-300 bg-clip-text text-transparent">
                        GitHub Integration
                      </span>
                    </span>
                  </div>
                  <p className="text-gray-300">
                    Connect repositories directly from GitHub. Automated scanning 
                    on every push, pull request, or scheduled intervals.
                  </p>
                </div>
              </div>
            </a>

            {/* Card 2 */}
            <a
              className="group/card relative h-full overflow-hidden rounded-2xl bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 p-px before:pointer-events-none before:absolute before:-left-40 before:-top-40 before:z-10 before:h-80 before:w-80 before:translate-x-[var(--mouse-x)] before:translate-y-[var(--mouse-y)] before:rounded-full before:bg-cyan-500/80 before:opacity-0 before:blur-3xl before:transition-opacity before:duration-500 after:pointer-events-none after:absolute after:-left-48 after:-top-48 after:z-30 after:h-64 after:w-64 after:translate-x-[var(--mouse-x)] after:translate-y-[var(--mouse-y)] after:rounded-full after:bg-cyan-500 after:opacity-0 after:blur-3xl after:transition-opacity after:duration-500 hover:after:opacity-20 group-hover:before:opacity-100"
              href="#0"
              data-aos="zoom-y-out" 
              data-aos-delay="400"
            >
              <div className="relative z-20 h-full overflow-hidden rounded-[inherit] bg-gray-900/95 backdrop-blur-sm after:absolute after:inset-0 after:bg-gradient-to-br after:from-gray-800/50 after:via-gray-900/25 after:to-gray-900/50">
                {/* Arrow */}
                <div
                  className="absolute right-6 top-6 flex h-8 w-8 items-center justify-center rounded-full border border-gray-700/50 bg-gray-800/65 text-gray-200 opacity-0 transition-opacity group-hover/card:opacity-100"
                  aria-hidden="true"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width={9}
                    height={8}
                    fill="none"
                  >
                    <path
                      fill="#F4F4F5"
                      d="m4.92 8-.787-.763 2.733-2.68H0V3.443h6.866L4.133.767 4.92 0 9 4 4.92 8Z"
                    />
                  </svg>
                </div>
                {/* Image */}
                <Image
                  className="inline-flex"
                  src={WorflowImg02}
                  width={350}
                  height={288}
                  alt="AI Analysis"
                />
                {/* Content */}
                <div className="p-6">
                  <div className="mb-3">
                    <span className="btn-sm relative rounded-full bg-gray-800/40 px-2.5 py-0.5 text-xs font-normal border border-cyan-500/30">
                      <span className="bg-gradient-to-r from-cyan-400 to-blue-300 bg-clip-text text-transparent">
                        AI Analysis
                      </span>
                    </span>
                  </div>
                  <p className="text-gray-300">
                    AI-powered vulnerability detection with intelligent explanations 
                    and fix recommendations for every security issue found.
                  </p>
                </div>
              </div>
            </a>

            {/* Card 3 */}
            <a
              className="group/card relative h-full overflow-hidden rounded-2xl bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 p-px before:pointer-events-none before:absolute before:-left-40 before:-top-40 before:z-10 before:h-80 before:w-80 before:translate-x-[var(--mouse-x)] before:translate-y-[var(--mouse-y)] before:rounded-full before:bg-cyan-500/80 before:opacity-0 before:blur-3xl before:transition-opacity before:duration-500 after:pointer-events-none after:absolute after:-left-48 after:-top-48 after:z-30 after:h-64 after:w-64 after:translate-x-[var(--mouse-x)] after:translate-y-[var(--mouse-y)] after:rounded-full after:bg-cyan-500 after:opacity-0 after:blur-3xl after:transition-opacity after:duration-500 hover:after:opacity-20 group-hover:before:opacity-100"
              href="#0"
              data-aos="zoom-y-out"
              data-aos-delay="600"
            >
              <div className="relative z-20 h-full overflow-hidden rounded-[inherit] bg-gray-900/95 backdrop-blur-sm after:absolute after:inset-0 after:bg-gradient-to-br after:from-gray-800/50 after:via-gray-900/25 after:to-gray-900/50">
                {/* Arrow */}
                <div
                  className="absolute right-6 top-6 flex h-8 w-8 items-center justify-center rounded-full border border-gray-700/50 bg-gray-800/65 text-gray-200 opacity-0 transition-opacity group-hover/card:opacity-100"
                  aria-hidden="true"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width={9}
                    height={8}
                    fill="none"
                  >
                    <path
                      fill="#F4F4F5"
                      d="m4.92 8-.787-.763 2.733-2.68H0V3.443h6.866L4.133.767 4.92 0 9 4 4.92 8Z"
                    />
                  </svg>
                </div>
                {/* Image */}
                <Image
                  className="inline-flex"
                  src={WorflowImg03}
                  width={350}
                  height={288}
                  alt="Real-time Monitoring"
                />
                {/* Content */}
                <div className="p-6">
                  <div className="mb-3">
                    <span className="btn-sm relative rounded-full bg-gray-800/40 px-2.5 py-0.5 text-xs font-normal border border-cyan-500/30">
                      <span className="bg-gradient-to-r from-cyan-400 to-blue-300 bg-clip-text text-transparent">
                        Real-time Monitoring
                      </span>
                    </span>
                  </div>
                  <p className="text-gray-300">
                    Monitor S3 buckets and repositories in real-time. Get instant 
                    notifications when new vulnerabilities are detected.
                  </p>
                </div>
              </div>
            </a>
          </Spotlight>
        </div>
      </div>
    </section>
  );
}