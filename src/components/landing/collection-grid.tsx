import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Phase 1 placeholder catalog (see D-019): images and prices are static, no
 * money is computed and nothing is read from the database until Phase 4.
 */
const products = [
  {
    id: "heavyweight-boxy-tee",
    name: "Heavyweight Boxy Tee",
    price: "$48.00",
    image: "/products/heavyweight-boxy-tee.png",
    colorways: ["#1b1b1d", "#c6f135", "#f2f0eb"],
  },
  {
    id: "luna-glazed-mug",
    name: "Luna Glazed Mug",
    price: "$28.00",
    image: "/products/luna-glazed-mug.png",
    colorways: ["#c6f135", "#1b1b1d", "#6b6a63"],
  },
  {
    id: "structured-6-panel-cap",
    name: "Structured 6-Panel Cap",
    price: "$36.00",
    image: "/products/structured-6-panel-cap.png",
    colorways: ["#1b1b1d", "#353437", "#c6f135"],
  },
  {
    id: "insulated-steel-bottle",
    name: "Insulated Steel Bottle",
    price: "$42.00",
    image: "/products/insulated-steel-bottle.png",
    colorways: ["#f2f0eb", "#c6f135", "#2a2a2c"],
  },
];

export function CollectionGrid() {
  return (
    <section className="mx-auto w-full max-w-[1400px] px-6 py-24 md:px-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-3">
          <span className="text-signal text-[11px] tracking-[0.18em] uppercase">
            Hardware collection
          </span>
          <h2 className="type-headline-lg-mobile md:type-headline-lg tracking-headline font-medium">
            Blanks engineered to endure.
          </h2>
        </div>
        <Link
          href="/products"
          className="text-signal type-title-md inline-flex items-center gap-1 transition-opacity hover:opacity-80"
        >
          Browse full archive
          <ArrowRight className="size-4" strokeWidth={1.5} />
        </Link>
      </header>

      <ul className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <li
            key={product.id}
            className="bg-card ring-foreground/10 group/card hover:ring-foreground/25 relative overflow-hidden rounded-[20px] ring-1 transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-2 hover:shadow-[0_28px_60px_-28px_rgba(0,0,0,0.95)]"
          >
            <Link href={`/products/${product.id}`} className="block">
              <div className="relative aspect-square w-full overflow-hidden">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover transition-transform duration-500 ease-out group-hover/card:scale-[1.04]"
                />
              </div>
            </Link>

            <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-[11px] text-white/90 backdrop-blur">
              <Star className="text-signal size-3 fill-current" strokeWidth={0} />
              5.0
            </span>

            <div className="flex flex-col gap-4 p-5">
              <div className="flex items-baseline justify-between gap-3">
                <span className="type-title-md truncate">{product.name}</span>
                <span className="type-title-md text-muted-foreground tabular">{product.price}</span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <ul aria-label="Colorways" className="flex items-center gap-2">
                  {product.colorways.map((color, index) => (
                    <li
                      key={color + index}
                      style={{ backgroundColor: color }}
                      className={`size-3.5 rounded-full ${
                        index === 0
                          ? "ring-signal ring-1.5 ring-offset-card ring-offset-2"
                          : "ring-foreground/20 ring-1"
                      }`}
                    />
                  ))}
                </ul>

                <Button
                  asChild
                  size="sm"
                  variant="secondary"
                  className="border-foreground/10 bg-foreground/[0.06] hover:bg-foreground/10 h-8 rounded-full px-4 text-[11px]"
                >
                  <Link href={`/products/${product.id}`}>Customize</Link>
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
