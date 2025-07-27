export const metadata = {
  title: "Home - SentinelHub",
  description: "AI-Powered DevOps Security Platform",
};

import Hero from "@/components/hero-home";
import BusinessCategories from "@/components/business-categories";
import FeaturesPlanet from "@/components/features-planet";
import LargeTestimonial from "@/components/large-testimonial";
import AnimatedBackground from "@/components/animated-background";

export default function Home() {
  return (
    <>
      {/* Add animated background to landing page */}
      <AnimatedBackground />
      
      <div className="relative z-10">
        <Hero />
        <BusinessCategories />
        <FeaturesPlanet />
        <LargeTestimonial />
      </div>
    </>
  );
}