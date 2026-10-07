import { DeliveryZonesManager } from "@/components/admin/delivery-zones-manager";
import { ContactInfoManager } from "@/components/admin/contact-info-manager";

/** Super Admin settings: storefront contact info + per-area delivery pricing. */
export function PlatformSettings() {
  return (
    <div>
      <ContactInfoManager />
      <DeliveryZonesManager />
    </div>
  );
}
