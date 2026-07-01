import { OrdersRealtimeTable } from "@/components/admin/OrdersRealtimeTable";
import { getAdminOrders } from "@/lib/queries/admin";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const orders = await getAdminOrders();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pedidos</h1>
        <p className="text-sm text-muted-foreground">
          Terminal de ventas en tiempo real. Los nuevos pedidos aparecen solos.
        </p>
      </div>

      <OrdersRealtimeTable initialOrders={orders} />
    </div>
  );
}
