


import Image from "next/image";


export default function PageIllustration() {
  return (
    <>
      {/* Stripes illustration */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 -z-10 -translate-x-1/2 transform"
        aria-hidden="true"
      >
  <div className="relative -mt-16 h-60 w-full flex items-center justify-center" aria-hidden="true">
  <div className="pointer-events-none text-center text-[200px] font-bold leading-none text-white/10">
          SENTINELHUB
        </div>
  {/* Glow */}
  <div
    className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-2/3"
    aria-hidden="true"
  >
    <div className="h-56 w-56 rounded-full border-[20px] border-blue-700 blur-[80px]"></div>
  </div>
</div>
      </div>
      {/* Circles */}
      <div
        className="pointer-events-none absolute -top-32 left-1/2 ml-[580px] -translate-x-1/2"
        aria-hidden="true"
      >
        <div className="h-80 w-80 rounded-full bg-linear-to-tr from-blue-500 opacity-50 blur-[160px]" />
      </div>
      <div
        className="pointer-events-none absolute left-1/2 top-[420px] ml-[380px] -translate-x-1/2"
        aria-hidden="true"
      >
        <div className="h-80 w-80 rounded-full bg-linear-to-tr from-blue-500 to-gray-900 opacity-50 blur-[160px]" />
      </div>
      <div
        className="pointer-events-none absolute left-1/2 top-[640px] -ml-[300px] -translate-x-1/2"
        aria-hidden="true"
      >
        <div className="h-80 w-80 rounded-full bg-linear-to-tr from-blue-500 to-gray-900 opacity-50 blur-[160px]" />
      </div>
    </>
  );
}
