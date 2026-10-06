import { Clock, Globe, Infinity as InfinityIcon, Truck } from "lucide-react";
import { BlurFade } from "@/components/ui/blur-fade";

const stats = [
  {
    icon: InfinityIcon,
    title: "Zero minimums",
    body: "True DTC single-piece drops with the per-unit economics of high-volume runs.",
  },
  {
    icon: Clock,
    title: "Sub-millimeter print",
    body: "Precision industrial dye-sub and vector UV printing calibrated up to 4000 DPI.",
  },
  {
    icon: Globe,
    title: "Real-time proofing",
    body: "Photorealistic physics based rendering ensures the physical blank matches the viewport.",
  },
  {
    icon: Truck,
    title: "Carbon neutral dispatch",
    body: "Eco-certified automated fulfillment centers powered 100% by renewable energy.",
  },
];

export function Stats() {
  return (
    <section className="mx-auto w-full max-w-[1400px] px-6 md:px-8">
      <BlurFade inView direction="up">
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <li
              key={stat.title}
              className="bg-card ring-foreground/10 flex flex-col gap-3 rounded-[20px] p-6 ring-1"
            >
              <stat.icon className="text-signal size-5" strokeWidth={1.5} />
              <h3 className="type-title-md">{stat.title}</h3>
              <p className="type-body-md text-muted-foreground">{stat.body}</p>
            </li>
          ))}
        </ul>
      </BlurFade>
    </section>
  );
}
