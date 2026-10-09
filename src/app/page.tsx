import { Hero } from "@/components/home/hero";
import { CollectionGrid } from "@/components/home/collection";
import { Process } from "@/components/home/process";
import { Benefits } from "@/components/home/benefits";
import { LaunchBanner } from "@/components/landing/launch-banner";
import { ScrollProgress } from "@/components/home/scroll-progress";
import { ToTestimonialsFade } from "@/components/home/section-fade";

export default function HomePage() {
  return (
    <div className="home-lux">
      <ScrollProgress />
      {/* The hero carries the category marquee as its bottom edge. */}
      <Hero />
      <CollectionGrid />
      <Process />
      <Benefits />
      {/* Soft ink fade so the long page transitions cleanly into Testimonials. */}
      <ToTestimonialsFade />
      <LaunchBanner />
    </div>
  );
}

