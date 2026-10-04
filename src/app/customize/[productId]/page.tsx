import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/shared/page-placeholder";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Customize" };

export default async function CustomizePage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;

  return (
    <PagePlaceholder
      eyebrow="Studio"
      title="3D customizer"
      description={`The live viewer for “${productId}” loads its model lazily, with WebGL, timeout and error fallbacks. Phases 5 and 6 build it.`}
    >
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className="text-muted-foreground">
          dpr [1, 1.75]
        </Badge>
        <Badge variant="outline" className="text-muted-foreground">
          WebGL probe fallback
        </Badge>
        <Badge variant="outline" className="text-muted-foreground">
          20s model timeout
        </Badge>
        <Badge variant="outline" className="text-muted-foreground">
          lazy chunk (next/dynamic, ssr:false)
        </Badge>
      </div>
    </PagePlaceholder>
  );
}
