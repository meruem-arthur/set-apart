import {createFileRoute} from "@tanstack/react-router";
import {listPromotionCodes} from "@/functions/promotion-codes";
import {PromoCodesPage} from "@/components/admin/promo-codes-page";

export const Route=createFileRoute("/super-admin/_authed/promotions")({
  head:()=>({meta:[{title:"Promotions — SET APART Super Admin"},{name:"robots",content:"noindex"}]}),
  loader:()=>listPromotionCodes(),
  component:()=><PromoCodesPage rows={Route.useLoaderData() as any[]}/>,
});
