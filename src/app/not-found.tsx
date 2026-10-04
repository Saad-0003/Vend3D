import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-[90rem] flex-col items-start justify-center gap-6 px-6 py-20 md:px-8">
      <span className="type-label-sm text-muted-foreground">Error 404</span>
      <h1 className="type-headline-lg-mobile md:type-headline-lg tracking-headline max-w-xl font-medium">
        This page does not exist.
      </h1>
      <p className="type-body-lg text-muted-foreground max-w-lg">
        The product may have been retired, or the link may be mistyped. Everything else is still
        where you left it.
      </p>
      <div className="flex flex-wrap gap-3">
        <Button asChild className="h-11 rounded-full px-8">
          <Link href="/products">Browse products</Link>
        </Button>
        <Button asChild variant="secondary" className="h-11 rounded-full px-8">
          <Link href="/">Back home</Link>
        </Button>
      </div>
    </div>
  );
}
