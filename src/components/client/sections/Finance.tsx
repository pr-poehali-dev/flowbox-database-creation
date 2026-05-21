import { useEffect, useState } from "react";
import { clientFetch } from "@/lib/clientApi";
import Icon from "@/components/ui/icon";
import { INVOICE_STATUS_MAP, StatusBadge, TableCard, Th, Td, EmptyRow, Loader, ErrorMsg, SectionHeader, MetricCard, fmt, fmtDate } from "../shared";

interface Props { companyId: string; }

export default function Finance({ companyId }: Props) {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    clientFetch("finance", companyId)
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [companyId]);

  if (loading) return <Loader />;
  if (error) return <ErrorMsg message={error} />;
  if (!data) return null;

  const invoices = (data.invoices as Record<string, unknown>[]) || [];
  const transactions = (data.transactions as Record<string, unknown>[]) || [];
  const limit = Number(data.purchase_limit) || 0;
  const used = Number(data.limit_used) || 0;
  const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;

  const TX_LABELS: Record<string, string> = {
    invoice_issued:        "Выставлен счёт",
    payment_received:      "Поступление оплаты",
    compensation_accrued:  "Начислена компенсация",
    compensation_paid:     "Выплата компенсации",
    balance_used:          "Списание с баланса",
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <SectionHeader
        title="Финансы"
        subtitle="Счета, транзакции и лимиты"
        action={
          <button className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors">
            <Icon name="FileText" size={12} />
            Запросить акт сверки
          </button>
        }
      />

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-4">
        <MetricCard label="Баланс"            value={fmt(data.balance as number)}         icon="Wallet"   color="var(--green)" />
        <MetricCard label="К оплате"          value={fmt(data.pending_amount as number)}  icon="Clock"    color="var(--amber)" />
        <MetricCard label="Оплачено за месяц" value={fmt(data.paid_this_month as number)} icon="CheckCircle" color="var(--cyan)" />
      </div>

      {/* Limit block */}
      <div className="rounded-lg border border-border p-5" style={{ background: "hsl(var(--card))" }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm font-medium text-foreground">Лимит закупки</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {limit === 0 ? "Лимит не установлен" : `Использовано ${fmt(used)} из ${fmt(limit)}`}
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-lg font-semibold text-foreground">{pct.toFixed(0)}%</div>
            <div className="text-xs text-muted-foreground">занято</div>
          </div>
        </div>
        {limit > 0 && (
          <div className="h-2 rounded-full bg-secondary overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, background: pct > 90 ? "hsl(var(--rose))" : pct > 70 ? "hsl(var(--amber))" : "hsl(var(--cyan))" }} />
          </div>
        )}
      </div>

      {/* Invoices */}
      <TableCard>
        <div className="px-5 py-4 border-b border-border">
          <span className="text-sm font-medium text-foreground">Счета</span>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <Th>Номер</Th><Th>Дата</Th><Th>Срок оплаты</Th><Th>Сумма</Th><Th>Статус</Th><Th>PDF</Th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 && <EmptyRow cols={6} text="Счетов пока нет" />}
            {invoices.map(inv => (
              <tr key={inv.id as string} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                <Td mono>{inv.invoice_number as string}</Td>
                <Td>{fmtDate(inv.created_at as string)}</Td>
                <Td>{fmtDate(inv.due_date as string)}</Td>
                <Td mono>{fmt(inv.amount as number)}</Td>
                <Td><StatusBadge map={INVOICE_STATUS_MAP} status={inv.status as string} /></Td>
                <Td>
                  {inv.pdf_url
                    ? <a href={inv.pdf_url as string} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1 text-xs hover:opacity-80 transition-opacity"
                        style={{ color: "hsl(var(--cyan))" }}>
                        <Icon name="Download" size={12} /> Скачать
                      </a>
                    : <span className="text-xs text-muted-foreground">—</span>
                  }
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>

      {/* Transactions */}
      <TableCard>
        <div className="px-5 py-4 border-b border-border">
          <span className="text-sm font-medium text-foreground">Транзакции</span>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <Th>Дата</Th><Th>Тип</Th><Th>Сумма</Th><Th>Баланс после</Th><Th>Комментарий</Th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 && <EmptyRow cols={5} text="Транзакций нет" />}
            {transactions.map(tx => {
              const isPlus = (tx.type as string).includes("received") || (tx.type as string).includes("accrued");
              return (
                <tr key={tx.id as string} className="border-b border-border last:border-0">
                  <Td>{fmtDate(tx.created_at as string)}</Td>
                  <Td>{TX_LABELS[tx.type as string] || (tx.type as string)}</Td>
                  <Td>
                    <span className={`font-mono text-xs ${isPlus ? "text-green-400" : "text-rose-400"}`}>
                      {isPlus ? "+" : "−"}{fmt(tx.amount as number)}
                    </span>
                  </Td>
                  <Td mono>{fmt(tx.balance_after as number)}</Td>
                  <Td>{(tx.comment as string) || "—"}</Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableCard>
    </div>
  );
}
