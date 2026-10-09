import { Hero } from "@/components/home/hero";
import { CategoryStrip } from "@/components/home/category-strip";
import { PrecisionBento } from "@/components/home/precision-bento";
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
      <Hero />
      <CategoryStrip />
      <PrecisionBento />
      <CollectionGrid />
      <Process />
      <Benefits />
      {/* Soft ink fade so the long page transitions cleanly into Testimonials. */}
      <ToTestimonialsFade />
      <LaunchBanner />
    </div>
  );
}

