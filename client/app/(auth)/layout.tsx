import Image from "next/image";
import AuthBg from "@/public/images/auth-bg.svg";
import AnimatedBackground from "@/components/animated-background";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div suppressHydrationWarning className="relative min-h-screen">
      {/* Full-screen animated background from landing page */}
      <AnimatedBackground />
      
      {/* Content wrapper with higher z-index */}
      <div className="relative z-10">
        <header className="absolute z-30 w-full top-8 md:top-12">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="flex h-16 items-center justify-between md:h-20">
              <div className="mr-4 shrink-0">
                <Image
                  src="/images/logoSmall.png"
                  alt="SentinelHub Logo"
                  width={240}
                  height={80}
                  priority
                  className="animate-bounce-in"
                />
              </div>
            </div>
          </div>
        </header>

        <main className="relative flex grow min-h-screen">
          <div
            className="pointer-events-none absolute bottom-0 left-0 -translate-x-1/3"
            aria-hidden="true"
          >
            <div className="h-80 w-80 rounded-full bg-gradient-to-tr from-blue-500/30 via-blue-600/30 to-indigo-500/30 opacity-70 blur-[160px] animate-pulse-slow"></div>
          </div>

          <div className="w-full">
            <div className="flex h-full flex-col justify-center before:min-h-[4rem] before:flex-1 after:flex-1 md:before:min-h-[5rem]">
              <div className="px-4 sm:px-6">
                <div className="mx-auto w-full max-w-md">
                  <div className="py-16 md:py-20 animate-bounce-in-delayed backdrop-blur-sm bg-white/10 dark:bg-black/10 rounded-2xl p-8 border border-white/20 dark:border-white/10 shadow-2xl">
                    {children}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative my-6 mr-6 hidden w-[572px] shrink-0 overflow-hidden rounded-2xl lg:block animate-bounce-in-slow">
            <div
              className="pointer-events-none absolute left-1/2 top-1/2 -z-10 -ml-24 -translate-x-1/2 -translate-y-1/2 bg-blue-50/50 dark:bg-blue-900/20"
              aria-hidden="true"
            >
              <Image
                src={AuthBg}
                className="max-w-none opacity-80 dark:opacity-60"
                width={1285}
                height={1684}
                alt="Auth background"
              />
            </div>

            <div className="absolute left-20 top-1/2 w-[540px] -translate-y-1/2">
              <div className="aspect-[2/1] w-full rounded-2xl bg-gray-900/95 dark:bg-gray-900/98 px-5 py-6 shadow-2xl transition duration-300 backdrop-blur-xl border border-white/10">
                <div className="relative mb-10 flex items-center justify-between before:block before:h-[9px] before:w-[41px] before:bg-[length:16px_9px] before:[background-image:radial-gradient(circle_at_4.5px_4.5px,var(--color-gray-600)_4.5px,transparent_0)] after:w-[41px]">
                  <span className="text-[13px] font-medium text-white">
                    sentinelhub.com
                  </span>
                </div>

                <div className="font-mono text-sm text-gray-500 [&>span]:block [&>span]:mt-10 [&_span]:opacity-0">
                  <span className="animate-[code-1_14s_infinite] text-gray-200">
                    shctl login --api https://api.sentinelhub.com
                  </span>
                  <span className="animate-[code-2_14s_infinite]">
                    Authenticated as user@sentinelhub.com
                  </span>
                  <span className="animate-[code-3_14s_infinite] text-purple-400">
                    Authentication secured by Clerk
                  </span>
                  <span className="animate-[code-4_14s_infinite] text-gray-200">
                    terraform apply -var-file=devops.tfvars
                  </span>
                  <span className="animate-[code-5_14s_infinite]">
                    Infrastructure provisioned successfully
                  </span>
                  <span className="animate-[code-6_14s_infinite] text-gray-200">
                    sonar-scanner -Dproject.settings=sonar-project.properties
                  </span>
                  <span className="animate-[code-7_14s_infinite]">
                    Quality gate passed
                  </span>
                  <span className="animate-[code-8_14s_infinite] text-gray-200">
                    n8n trigger deployment-pipeline.yaml
                  </span>
                  <span className="animate-[code-9_14s_infinite] text-cyan-400">
                   Enterprise auth ready
                  </span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}