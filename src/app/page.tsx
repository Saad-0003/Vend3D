import { Hero } from "@/components/landing/hero";
import { PrecisionGrid } from "@/components/landing/precision-grid";
import { CollectionGrid } from "@/components/landing/collection-grid";
import { Steps } from "@/components/landing/steps";
import { Stats } from "@/components/landing/stats";
import { LaunchBanner } from "@/components/landing/launch-banner";

export default function HomePage() {
  return (
    <>
      <Hero />
      <PrecisionGrid />
      <CollectionGrid />
      <Steps />
      <Stats />
      <LaunchBanner />
    </>
  );
}
