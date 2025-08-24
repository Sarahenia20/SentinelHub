"use client";

import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import Header from "@/components/ui/header";
import Footer from "@/components/ui/footer";
import AnimatedBackground from "@/components/animated-background";

export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    AOS.init({
      once: true,
      disable: "phone",
      duration: 700,
      easing: "ease-out-cubic",
    });
  });

  return (
    <div className="min-h-screen bg-gray-900 relative">
      {/* Same animated background as auth pages */}
      <AnimatedBackground />
      
      {/* Content with proper z-index */}
      <div className="relative z-10">
        <Header />
        <main className="grow">{children}</main>
        <Footer border={true} />
      </div>
    </div>
  );
}