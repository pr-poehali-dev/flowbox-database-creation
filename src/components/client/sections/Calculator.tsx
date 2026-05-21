import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { fmt, SectionHeader } from "../shared";

interface Product { id: string; trade_name: string; our_price: number; }
interface Props { initialProduct?: Product | null; }

const COMMISSIONS: Record<string, Record<string, number>> = {
  "Электроника":    { lt1500: 0.05, r1500: 0.07, r5000: 0.08, gt10000: 0.08 },
  "Одежда":         { lt1500: 0.10, r1500: 0.10, r5000: 0.10, gt10000: 0.10 },
  "Бытовая химия":  { lt1500: 0.06, r1500: 0.06, r5000: 0.07, gt10000: 0.07 },
  "Прочее":         { lt1500: 0.08, r1500: 0.08, r5000: 0.09, gt10000: 0.09 },
};

function getCommission(category: string, price: number): number {
  const c = COMMISSIONS[category] || COMMISSIONS["Прочее"];
  if (price < 1500)  return c.lt1500;
  if (price < 5000)  return c.r1500;
  if (price < 10000) return c.r5000;
  return c.gt10000;
}

export default function Calculator({ initialProduct }: Props) {
  const [price, setPrice] = useState(String(initialProduct?.our_price ?? ""));
  const [quantity, setQuantity] = useState("1");
  const [category, setCategory] = useState("Прочее");
  const [deliveryCost, setDeliveryCost] = useState("350");
  const [earlyPayout, setEarlyPayout] = useState(false);
  const [ozonBank, setOzonBank] = useState(false);

  const p = parseFloat(price) || 0;
  const q = parseInt(quantity) || 1;
  const d = parseFloat(deliveryCost) || 0;

  const commission = getCommission(category, p);
  const acquiring = 0.019;
  const serviceFee = 20;
  const earlyRate = earlyPayout ? (ozonBank ? 0.0339 : 0.049) : 0;

  const commissionAmt   = p * commission;
  const acquiringAmt    = p * acquiring;
  const earlyPayoutAmt  = p * earlyRate;
  const totalDeductions = commissionAmt + acquiringAmt + serviceFee + earlyPayoutAmt;
  const netPerUnit      = p - totalDeductions - d;
  const netTotal        = netPerUnit * q;
  const margin          = p > 0 ? (netPerUnit / p) * 100 : 0;

  const rows = [
    { label: "Цена продажи",          value: fmt(p),              highlight: false },
    { label: `Комиссия маркетплейса (${(commission * 100).toFixed(0)}%)`, value: `−${fmt(commissionAmt)}`, highlight: false },
    { label: `Эквайринг (1.9%)`,       value: `−${fmt(acquiringAmt)}`, highlight: false },
    { label: "Сервисный сбор",         value: `−${fmt(serviceFee)}`, highlight: false },
    ...(earlyPayout ? [{ label: `Ранняя выплата (${(earlyRate * 100).toFixed(1)}%)`, value: `−${fmt(earlyPayoutAmt)}`, highlight: false }] : []),
    { label: "Стоимость доставки",     value: `−${fmt(d)}`,        highlight: false },
    { label: "Чистая прибыль / шт.",   value: fmt(netPerUnit),     highlight: true },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      <SectionHeader
        title="Калькулятор маржинальности"
        subtitle="Рассчитайте прибыль с учётом всех комиссий маркетплейса"
      />

      {initialProduct && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border"
          style={{ background: "hsl(var(--secondary))" }}>
          <Icon name="Package" size={15} style={{ color: "hsl(var(--cyan))" }} />
          <span className="text-sm font-medium text-foreground">{initialProduct.trade_name}</span>
          <span className="ml-auto font-mono text-xs text-muted-foreground">{fmt(initialProduct.our_price)}</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-5">
        {/* Inputs */}
        <div className="space-y-4">
          <div className="rounded-lg border border-border p-5" style={{ background: "hsl(var(--card))" }}>
            <div className="text-sm font-medium text-foreground mb-4">Параметры расчёта</div>
            <div className="space-y-3">
              {[
                { label: "Цена продажи (₽)", value: price, set: setPrice, placeholder: "0" },
                { label: "Количество (шт.)", value: quantity, set: setQuantity, placeholder: "1" },
                { label: "Стоимость доставки (₽)", value: deliveryCost, set: setDeliveryCost, placeholder: "350" },
              ].map(f => (
                <div key={f.label}>
                  <label className="text-xs text-muted-foreground mb-1 block">{f.label}</label>
                  <input type="number" value={f.value} onChange={e => f.set(e.target.value)}
                    placeholder={f.placeholder}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-secondary text-foreground focus:outline-none focus:ring-1 focus:ring-ring font-mono" />
                </div>
              ))}

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Категория</label>
                <select value={category} onChange={e => setCategory(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-secondary text-foreground focus:outline-none">
                  {Object.keys(COMMISSIONS).map(c => <option key={c}>{c}</option>)}
                </select>
              </div>

              <div className="space-y-2 pt-1">
                {[
                  { label: "Ранняя выплата", checked: earlyPayout, set: setEarlyPayout },
                  { label: "Ozon Банк (скидка)", checked: ozonBank, set: setOzonBank, disabled: !earlyPayout },
                ].map(sw => (
                  <label key={sw.label} className={`flex items-center justify-between cursor-pointer ${sw.disabled ? "opacity-40" : ""}`}>
                    <span className="text-xs text-muted-foreground">{sw.label}</span>
                    <div onClick={() => !sw.disabled && sw.set((v: boolean) => !v)}
                      className={`w-8 h-4 rounded-full relative transition-all ${sw.checked ? "" : "bg-secondary border border-border"}`}
                      style={sw.checked ? { background: "hsl(var(--cyan))" } : {}}>
                      <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${sw.checked ? "left-4" : "left-0.5"}`} />
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="rounded-lg border border-border p-5 flex flex-col" style={{ background: "hsl(var(--card))" }}>
          <div className="text-sm font-medium text-foreground mb-4">Результат</div>
          <div className="space-y-2.5 flex-1">
            {rows.map(r => (
              <div key={r.label} className={`flex items-center justify-between py-1.5 ${r.highlight ? "border-t border-border mt-2 pt-3" : ""}`}>
                <span className={`text-xs ${r.highlight ? "text-foreground font-medium" : "text-muted-foreground"}`}>{r.label}</span>
                <span className={`font-mono text-xs ${r.highlight ? "text-foreground font-semibold text-sm" : "text-foreground"}`}>{r.value}</span>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg p-3 text-center"
              style={{ background: margin >= 0 ? "hsl(145,60%,42%,0.1)" : "hsl(0,72%,55%,0.1)" }}>
              <div className="font-mono text-lg font-bold"
                style={{ color: margin >= 0 ? "hsl(var(--green))" : "hsl(var(--rose))" }}>
                {margin.toFixed(1)}%
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">Маржа</div>
            </div>
            <div className="rounded-lg p-3 text-center" style={{ background: "hsla(195,90%,48%,0.08)" }}>
              <div className="font-mono text-lg font-bold" style={{ color: "hsl(var(--cyan))" }}>
                {fmt(netTotal)}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">Итого × {q}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
