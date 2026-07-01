import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Mail, MapPin, Phone, User } from "lucide-react";

import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";
import { OrderStatusSelect } from "@/components/admin/OrderStatusSelect";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAdminOrder } from "@/lib/queries/admin";
import { formatDateTime, formatEUR } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getAdminOrder(id);
  if (!order) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/admin/pedidos"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Volver a pedidos
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{order.order_number}</h1>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            {formatDateTime(order.created_at)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-xs text-muted-foreground">Cambiar estado</span>
          <OrderStatusSelect orderId={order.id} status={order.status} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Líneas del pedido */}
        <section className="space-y-4">
          <div className="rounded-xl border bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Talla</TableHead>
                  <TableHead className="text-right">Cant.</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.product_name}
                    </TableCell>
                    <TableCell>{item.size}</TableCell>
                    <TableCell className="text-right">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatEUR(item.unit_price)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatEUR(item.unit_price * item.quantity)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex justify-end">
            <div className="w-56 space-y-1 text-sm">
              <div className="flex justify-between border-t pt-2 text-base font-bold">
                <span>Total</span>
                <span>{formatEUR(order.total_amount)}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Datos de envío */}
        <aside className="h-fit space-y-4 rounded-xl border bg-background p-5">
          <h2 className="font-semibold">Datos del comprador</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <User className="mt-0.5 size-4 text-muted-foreground" />
              <span>{order.customer_name}</span>
            </div>
            <div className="flex items-start gap-2">
              <Mail className="mt-0.5 size-4 text-muted-foreground" />
              <a
                href={`mailto:${order.customer_email}`}
                className="hover:underline"
              >
                {order.customer_email}
              </a>
            </div>
            {order.customer_phone && (
              <div className="flex items-start gap-2">
                <Phone className="mt-0.5 size-4 text-muted-foreground" />
                <a
                  href={`tel:${order.customer_phone}`}
                  className="hover:underline"
                >
                  {order.customer_phone}
                </a>
              </div>
            )}
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-4 text-muted-foreground" />
              <span>
                {order.shipping_address}
                <br />
                {order.shipping_postal_code} {order.shipping_city}
                <br />
                {order.shipping_country}
              </span>
            </div>
          </dl>
        </aside>
      </div>
    </div>
  );
}
