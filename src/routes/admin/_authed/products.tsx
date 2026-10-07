import {createFileRoute} from "@tanstack/react-router";
import {getProducts} from "@/functions/products";
import {ProductsPage} from "@/components/admin/products-page";

export const Route=createFileRoute("/admin/_authed/products")({
  loader:()=>getProducts({data:{sort:"newest",limit:100}}),
  component:()=><ProductsPage ps={Route.useLoaderData() as any[]}/>,
});
