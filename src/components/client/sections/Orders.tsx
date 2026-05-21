import { useEffect, useState, useCallback } from "react";
import { clientFetch } from "@/lib/clientApi";
import Icon from "@/components/ui/icon";
import { ORDER_STATUS_MAP, StatusBadge, TableCard, Th, Td, EmptyRow, Loader, ErrorMsg, SectionHeader, fmt, fmtDate } from "../shared";

interface Order {
  id: string; order_number: string; product_name: string; quantity: number;
  total_amount: number; order_status: string; created_at: string;
  confirmed_at: string; tracking_number: string; delivery_status: string;
  unit_price: number; delivery_cost: number; payment_status: string;
  fulfillment_scheme: string; cancel_reason: string; invoice_number: string;
  invoice_status: string; supplier_article: string;
}

interface Props { companyId: string; initialOrderId?: string; }

export default function Orders({ companyId, initialOrderId }: Props) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [offset, setOffset] = useState(0);
  const [detail, setDetail] = useState<Order | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const LIMIT = 15;

  const load = useCallback(() => {
    setLoading(true);
    const extra: Record<string, string> = { limit: String(LIMIT), offset: String(offset) };
    if (statusFilter) extra.status = statusFilter;
    if (dateFrom) extra.date_from = dateFrom;
    if (dateTo) extra.date_to = dateTo;
    clientFetch("orders", companyId, extra)
      .then(d => { setOrders(d.orders || []); setTotal(d.total || 0); })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [companyId, statusFilter, dateFrom, dateTo, offset]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (initialOrderId) loadDetail(initialOrderId);
  }, [initialOrderId]);

  async function loadDetail(orderId: string) {
    setDetailLoading(true);
    try {
      const d = await clientFetch("order_detail", companyId, { order_id: orderId });
      setDetail(d.order);
    } catch (e: Error) {
      setError((e as Error).message);
    } finally {
      setDetailLoading(false);
    }
  }

  const pages = Math.ceil(total / LIMIT);
  const page = Math.floor(offset / LIMIT);

  if (detail) {
    const s = ORDER_STATUS_MAP[detail.order_status] || { label: detail.order_status, color: "text-muted-foreground", bg: "" };
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center gap-3">
          <button onClick={() => setDetail(null)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <Icon name="ArrowLeft" size={13} /> К списку
          </button>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm font-medium text-foreground">{detail.order_number}</span>
        </div>

        {detailLoading ? <Loader /> : (
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-4">
              <div className="rounded-lg border border-border p-5" style={{ background: "hsl(var(--card))" }}>
                <div className="text-sm font-medium text-foreground mb-4">Детали заказа</div>
                <div className="space-y-2.5">
                  {[
                    { label: "Товар",            value: detail.product_name || "—" },
                    { label: "Артикул",          value: detail.supplier_article || "—" },
                    { label: "Количество",       value: String(detail.quantity) },
                    { label: "Цена за шт.",      value: fmt(detail.unit_price) },
                    { label: "Доставка",         value: fmt(detail.delivery_cost) },
                    { label: "Итого",            value: fmt(detail.total_amount) },
                    { label: "Оплата",           value: detail.payment_status === "paid" ? "Оплачен" : "Не оплачен" },
                    { label: "Схема",            value: detail.fulfillment_scheme || "—" },
                    { label: "Счёт",             value: detail.invoice_number || "—" },
                  ].map(r => (
                    <div key={r.label} className="flex justify-between border-b border-border last:border-0 pb-2 last:pb-0">
                      <span className="text-xs text-muted-foreground">{r.label}</span>
                      <span className="text-xs font-medium text-foreground font-mono">{r.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {detail.tracking_number && (
                <div className="rounded-lg border border-border p-5" style={{ background: "hsl(var(--card))" }}>
                  <div className="text-sm font-medium text-foreground mb-3">Отслеживание</div>
                  <div className="flex items-center gap-3">
                    <Icon name="Truck" size={15} style={{ color: "hsl(var(--cyan))" }} />
                    <div>
                      <div className="text-xs text-muted-foreground">Трек-номер</div>
                      <div className="font-mono text-sm text-foreground">{detail.tracking_number}</div>
                    </div>
                    {detail.delivery_status && (
                      <span className="ml-auto text-xs text-muted-foreground">{detail.delivery_status}</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="rounded-lg border border-border p-5" style={{ background: "hsl(var(--card))" }}>
                <div className="text-sm font-medium text-foreground mb-3">Статус</div>
                <span className={`text-sm font-medium px-3 py-1.5 rounded-full ${s.color} ${"bg" in s ? (s as typeof s & { bg: string }).bg : ""}`}>
                  {s.label}
                </span>
                {detail.cancel_reason && (
                  <div className="mt-3 text-xs text-rose-400 bg-rose-400/10 rounded-lg p-3">{detail.cancel_reason}</div>
                )}
              </div>
              <div className="rounded-lg border border-border p-5" style={{ background: "hsl(var(--card))" }}>
                <div className="text-sm font-medium text-foreground mb-3">Даты</div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Создан:</span>
                    <span className="text-foreground">{fmtDate(detail.created_at)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Подтверждён:</span>
                    <span className="text-foreground">{fmtDate(detail.confirmed_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <SectionHeader title="Мои заказы" subtitle={`Всего: ${total}`} />

      <div className="flex items-center gap-3 flex-wrap">
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setOffset(0); }}
          className="text-xs px-3 py-2 rounded-lg border border-border bg-secondary text-muted-foreground focus:outline-none">
          <option value="">Все статусы</option>
          {Object.entries(ORDER_STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setOffset(0); }}
          className="text-xs px-3 py-2 rounded-lg border border-border bg-secondary text-muted-foreground focus:outline-none" />
        <span className="text-xs text-muted-foreground">—</span>
        <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setOffset(0); }}
          className="text-xs px-3 py-2 rounded-lg border border-border bg-secondary text-muted-foreground focus:outline-none" />
      </div>

      {error && <ErrorMsg message={error} />}

      {loading ? <Loader /> : (
        <>
          <TableCard>
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <Th>Номер</Th><Th>Товар</Th><Th>Кол-во</Th>
                  <Th>Сумма</Th><Th>Статус</Th><Th>Дата</Th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 && <EmptyRow cols={6} text="Заказов не найдено" />}
                {orders.map(o => (
                  <tr key={o.id} onClick={() => loadDetail(o.id)}
                    className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors cursor-pointer">
                    <Td mono>{o.order_number}</Td>
                    <Td>{o.product_name || "—"}</Td>
                    <Td mono>{o.quantity}</Td>
                    <Td mono>{fmt(o.total_amount)}</Td>
                    <Td><StatusBadge map={ORDER_STATUS_MAP} status={o.order_status} /></Td>
                    <Td>{fmtDate(o.created_at)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableCard>

          {pages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button disabled={page === 0} onClick={() => setOffset(o => Math.max(0, o - LIMIT))}
                className="px-3 py-1.5 text-xs rounded border border-border text-muted-foreground hover:text-foreground disabled:opacity-40">
                ← Назад
              </button>
              <span className="text-xs text-muted-foreground">{page + 1} / {pages}</span>
              <button disabled={page >= pages - 1} onClick={() => setOffset(o => o + LIMIT)}
                className="px-3 py-1.5 text-xs rounded border border-border text-muted-foreground hover:text-foreground disabled:opacity-40">
                Вперёд →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
