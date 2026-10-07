import { createFileRoute } from "@tanstack/react-router";
import { getSiteImages } from "@/functions/site-images";
import { SiteImagesManager } from "@/components/admin/site-images-manager";

export const Route = createFileRoute("/super-admin/_authed/site-images")({
  head: () => ({ meta: [{ title: "Site images — Super Admin" }, { name: "robots", content: "noindex" }] }),
  loader: async () => ({ images: await getSiteImages() }),
  component: SiteImagesPage,
});

function SiteImagesPage() {
  const { images } = Route.useLoaderData();
  return <SiteImagesManager images={images} />;
}
