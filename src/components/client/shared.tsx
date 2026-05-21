import Icon from "@/components/ui/icon";

export function MetricCard({ label, value, sub, icon, color = "var(--cyan)", trend }: {
  label: string; value: string | number; sub?: string; icon: string;
  color?: string; trend?: { up: boolean; text: string };
}) {
  return (
    <div className="rounded-lg border border-border p-4 animate-fade-in" style={{ background: "hsl(var(--card))" }}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs text-muted-foreground leading-tight">{label}</span>
        <div className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0"
          style={{ background: `hsla(195,90%,48%,0.1)` }}>
          <Icon name={icon} size={13} style={{ color: `hsl(${color})` }} />
        </div>
      </div>
      <div className="font-mono font-semibold text-lg text-foreground leading-tight">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
      {trend && (
        <div className={`text-xs mt-1 flex items-center gap-1 ${trend.up ? "text-green-400" : "text-rose-400"}`}>
          <Icon name={trend.up ? "ArrowUpRight" : "ArrowDownRight"} size={11} />
          {trend.text}
        </div>
      )}
    </div>
  );
}

export const ORDER_STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  new:        { label: "Новый",       color: "text-muted-foreground", bg: "bg-secondary" },
  confirmed:  { label: "Подтверждён", color: "text-blue-400",         bg: "bg-blue-400/10" },
  picked_up:  { label: "Забран",      color: "text-violet-400",       bg: "bg-violet-400/10" },
  in_transit: { label: "В пути",      color: "text-amber-400",        bg: "bg-amber-400/10" },
  delivered:  { label: "Доставлен",   color: "text-green-400",        bg: "bg-green-400/10" },
  cancelled:  { label: "Отменён",     color: "text-rose-400",         bg: "bg-rose-400/10" },
};

export const CLAIM_STATUS_MAP: Record<string, { label: string; color: string }> = {
  new:            { label: "Новая",                color: "text-muted-foreground" },
  reviewing:      { label: "На рассмотрении",      color: "text-blue-400" },
  decision_made:  { label: "Решение предложено",   color: "text-amber-400" },
  agreed:         { label: "Согласована",          color: "text-green-400" },
  disputed:       { label: "Оспорена",             color: "text-rose-400" },
  procedural:     { label: "Процессуальная",       color: "text-violet-400" },
  closed:         { label: "Закрыта",              color: "text-muted-foreground" },
};

export const INVOICE_STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending:   { label: "К оплате",  color: "text-amber-400" },
  paid:      { label: "Оплачен",   color: "text-green-400" },
  overdue:   { label: "Просрочен", color: "text-rose-400" },
  cancelled: { label: "Отменён",   color: "text-muted-foreground" },
};

export function StatusBadge({ map, status }: { map: Record<string, { label: string; color: string; bg?: string }>; status: string }) {
  const s = map[status] || { label: status, color: "text-muted-foreground", bg: "" };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${s.color} ${"bg" in s ? (s as { label: string; color: string; bg: string }).bg : ""}`}>
      {s.label}
    </span>
  );
}

export function SectionHeader({ title, subtitle, action }: {
  title: string; subtitle?: string; action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-5">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function TableCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border overflow-hidden" style={{ background: "hsl(var(--card))" }}>
      {children}
    </div>
  );
}

export function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground px-5 py-3 whitespace-nowrap">
      {children}
    </th>
  );
}

export function Td({ children, mono }: { children: React.ReactNode; mono?: boolean }) {
  return (
    <td className={`px-5 py-3 text-xs text-foreground ${mono ? "font-mono" : ""}`}>
      {children}
    </td>
  );
}

export function EmptyRow({ cols, text = "Нет данных" }: { cols: number; text?: string }) {
  return (
    <tr>
      <td colSpan={cols} className="px-5 py-10 text-center text-sm text-muted-foreground">{text}</td>
    </tr>
  );
}

export function Loader() {
  return (
    <div className="flex items-center justify-center py-20">
      <Icon name="Loader2" size={20} className="animate-spin text-muted-foreground" />
    </div>
  );
}

export function ErrorMsg({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-rose-400 bg-rose-400/10 border border-rose-400/20 rounded-lg px-4 py-3">
      <Icon name="AlertCircle" size={15} />
      {message}
    </div>
  );
}

export function fmt(n: number | null | undefined, currency = true): string {
  if (n == null) return "—";
  const formatted = Number(n).toLocaleString("ru", { maximumFractionDigits: 0 });
  return currency ? `₽ ${formatted}` : formatted;
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ru", { day: "2-digit", month: "2-digit", year: "numeric" });
}
