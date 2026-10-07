import {createFileRoute} from "@tanstack/react-router";
import {listPromotionCodes} from "@/functions/promotion-codes";
import {PromoCodesPage} from "@/components/admin/promo-codes-page";

export const Route=createFileRoute("/admin/_authed/promotions")({
  loader:()=>listPromotionCodes(),
  component:()=><PromoCodesPage rows={Route.useLoaderData() as any[]}/>,
});
