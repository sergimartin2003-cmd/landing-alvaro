"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, BellOff, Download, Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";
import { createClient } from "@/lib/supabase/client";
import { ORDER_STATUSES } from "@/lib/constants";
import { formatDateTime, formatEUR } from "@/lib/utils";
import type { Order } from "@/lib/types/database";

function playBeep() {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch {
    // El navegador puede bloquear el audio hasta una interacción.
  }
}

function toCsv(orders: Order[]): string {
  const headers = [
    "nº pedido",
    "fecha",
    "cliente",
    "email",
    "teléfono",
    "dirección",
    "ciudad",
    "cp",
    "país",
    "total",
    "estado",
  ];
  const escape = (v: unknown) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = orders.map((o) =>
    [
      o.order_number,
      o.created_at,
      o.customer_name,
      o.customer_email,
      o.customer_phone ?? "",
      o.shipping_address,
      o.shipping_city,
      o.shipping_postal_code,
      o.shipping_country,
      o.total_amount,
      o.status,
    ]
      .map(escape)
      .join(",")
  );
  return [headers.join(","), ...rows].join("\n");
}

export function OrdersRealtimeTable({
  initialOrders,
}: {
  initialOrders: Order[];
}) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [search, setSearch] = useState("");
  const [soundOn, setSoundOn] = useState(true);
  const soundRef = useRef(soundOn);
  useEffect(() => {
    soundRef.current = soundOn;
  }, [soundOn]);

  // Suscripción a Supabase Realtime.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("orders-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        (payload) => {
          const nuevo = payload.new as Order;
          setOrders((prev) =>
            prev.some((o) => o.id === nuevo.id) ? prev : [nuevo, ...prev]
          );
          if (soundRef.current) playBeep();
          toast.success(`Nuevo pedido ${nuevo.order_number}`, {
            description: `${nuevo.customer_name} · ${formatEUR(
              nuevo.total_amount
            )}`,
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        (payload) => {
          const upd = payload.new as Order;
          setOrders((prev) =>
            prev.map((o) => (o.id === upd.id ? { ...o, ...upd } : o))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusFilter !== "todos" && o.status !== statusFilter) return false;
      if (!q) return true;
      return (
        o.order_number.toLowerCase().includes(q) ||
        o.customer_name.toLowerCase().includes(q)
      );
    });
  }, [orders, statusFilter, search]);

  function exportCsv() {
    const csv = toCsv(filtered);
    const blob = new Blob(["﻿" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pedidos-gtshop-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      {/* Controles */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o nº pedido"
            className="pl-8"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            {ORDER_STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSoundOn((v) => !v)}
          aria-label={soundOn ? "Silenciar avisos" : "Activar avisos"}
          title={soundOn ? "Avisos sonoros activados" : "Avisos silenciados"}
        >
          {soundOn ? <Bell className="size-4" /> : <BellOff className="size-4" />}
        </Button>
        <Button variant="outline" onClick={exportCsv}>
          <Download className="size-4" />
          Exportar CSV
        </Button>
      </div>

      {/* Tabla */}
      <div className="rounded-xl border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nº pedido</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Ciudad</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-muted-foreground"
                >
                  No hay pedidos que coincidan.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((o) => (
                <TableRow key={o.id} className="cursor-pointer">
                  <TableCell className="font-medium">
                    <Link
                      href={`/admin/pedidos/${o.id}`}
                      className="hover:underline"
                    >
                      {o.order_number}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDateTime(o.created_at)}
                  </TableCell>
                  <TableCell>{o.customer_name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {o.shipping_city}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatEUR(o.total_amount)}
                  </TableCell>
                  <TableCell>
                    <OrderStatusBadge status={o.status} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
