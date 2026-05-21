import { useEffect, useState } from "react";
import { clientFetch } from "@/lib/clientApi";
import Icon from "@/components/ui/icon";
import { CLAIM_STATUS_MAP, StatusBadge, TableCard, Th, Td, EmptyRow, Loader, ErrorMsg, SectionHeader, fmt, fmtDate } from "../shared";

const CLAIM_TYPE_LABELS: Record<string, string> = {
  delivery_refusal: "Отказ от доставки",
  return:           "Возврат",
  defect:           "Брак",
  damage:           "Повреждение",
};

interface Claim {
  id: string; claim_number: string; order_number: string; type: string;
  status: string; created_at: string; closed_at: string;
  compensation_amount: number; compensation_type: string;
  product_name: string; description: string; photos: string[] | null;
  decision: string; history: { date: string; status: string; comment: string }[] | null;
}

interface Props { companyId: string; }

export default function Claims({ companyId }: Props) {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detail, setDetail] = useState<Claim | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    clientFetch("claims", companyId)
      .then(d => setClaims(d.claims || []))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [companyId]);

  async function loadDetail(claimId: string) {
    setDetailLoading(true);
    try {
      const d = await clientFetch("claim_detail", companyId, { claim_id: claimId });
      setDetail(d.claim);
    } catch (e: Error) {
      setError((e as Error).message);
    } finally {
      setDetailLoading(false);
    }
  }

  if (detail) {
    const history = detail.history || [];
    const photos = detail.photos || [];
    const canRespond = detail.status === "decision_made";

    return (
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center gap-3">
          <button onClick={() => setDetail(null)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <Icon name="ArrowLeft" size={13} /> К списку
          </button>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm font-medium text-foreground">{detail.claim_number}</span>
          <StatusBadge map={CLAIM_STATUS_MAP} status={detail.status} />
        </div>

        {detailLoading ? <Loader /> : (
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-4">
              <div className="rounded-lg border border-border p-5" style={{ background: "hsl(var(--card))" }}>
                <div className="text-sm font-medium text-foreground mb-4">Детали рекламации</div>
                <div className="space-y-2.5">
                  {[
                    { label: "Товар",    value: detail.product_name || "—" },
                    { label: "Заказ",    value: detail.order_number || "—" },
                    { label: "Тип",      value: CLAIM_TYPE_LABELS[detail.type] || detail.type },
                    { label: "Создана",  value: fmtDate(detail.created_at) },
                    { label: "Закрыта", value: fmtDate(detail.closed_at) },
                  ].map(r => (
                    <div key={r.label} className="flex justify-between border-b border-border last:border-0 pb-2 last:pb-0">
                      <span className="text-xs text-muted-foreground">{r.label}</span>
                      <span className="text-xs font-medium text-foreground">{r.value}</span>
                    </div>
                  ))}
                </div>
                {detail.description && (
                  <div className="mt-4">
                    <div className="text-xs text-muted-foreground mb-1.5">Описание</div>
                    <p className="text-xs text-foreground leading-relaxed">{detail.description}</p>
                  </div>
                )}
              </div>

              {/* Photos */}
              {photos.length > 0 && (
                <div className="rounded-lg border border-border p-5" style={{ background: "hsl(var(--card))" }}>
                  <div className="text-sm font-medium text-foreground mb-3">Фотоматериалы</div>
                  <div className="grid grid-cols-3 gap-2">
                    {photos.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noreferrer">
                        <img src={url} alt={`Фото ${i + 1}`} className="w-full h-24 object-cover rounded-lg border border-border hover:opacity-80 transition-opacity" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Decision */}
              {detail.decision && (
                <div className="rounded-lg border border-border p-5" style={{ background: "hsl(var(--card))" }}>
                  <div className="text-sm font-medium text-foreground mb-2">Решение менеджера</div>
                  <p className="text-xs text-foreground leading-relaxed mb-3">{detail.decision}</p>
                  {detail.compensation_amount > 0 && (
                    <div className="flex items-center gap-2 text-xs text-green-400 bg-green-400/10 rounded-lg px-3 py-2">
                      <Icon name="CheckCircle" size={12} />
                      Компенсация: {fmt(detail.compensation_amount)}
                      {detail.compensation_type && ` (${detail.compensation_type})`}
                    </div>
                  )}
                  {canRespond && (
                    <div className="flex gap-3 mt-4">
                      <button className="flex-1 py-2 rounded-lg text-xs font-medium transition-all hover:opacity-90"
                        style={{ background: "hsl(var(--green))", color: "#fff" }}>
                        <Icon name="Check" size={12} className="inline mr-1" />
                        Согласен
                      </button>
                      <button className="flex-1 py-2 rounded-lg text-xs font-medium border border-rose-400/40 text-rose-400 hover:bg-rose-400/10 transition-all">
                        <Icon name="X" size={12} className="inline mr-1" />
                        Оспорить
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* History */}
            <div className="rounded-lg border border-border p-5 h-fit" style={{ background: "hsl(var(--card))" }}>
              <div className="text-sm font-medium text-foreground mb-4">История</div>
              {history.length === 0 ? (
                <p className="text-xs text-muted-foreground">Нет записей</p>
              ) : (
                <div className="space-y-3">
                  {history.map((h, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full mt-1 flex-shrink-0" style={{ background: "hsl(var(--cyan))" }} />
                        {i < history.length - 1 && <div className="w-0.5 flex-1 mt-1" style={{ background: "hsl(var(--border))" }} />}
                      </div>
                      <div className="pb-3">
                        <div className="text-[10px] text-muted-foreground">{fmtDate(h.date)}</div>
                        <div className="text-xs text-foreground font-medium mt-0.5">
                          {CLAIM_STATUS_MAP[h.status]?.label || h.status}
                        </div>
                        {h.comment && <p className="text-[10px] text-muted-foreground mt-0.5">{h.comment}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <SectionHeader title="Рекламации" subtitle={`${claims.length} обращений`} />

      {error && <ErrorMsg message={error} />}
      {loading ? <Loader /> : (
        <TableCard>
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <Th>Номер</Th><Th>Заказ</Th><Th>Тип</Th><Th>Статус</Th><Th>Дата</Th><Th>Компенсация</Th>
              </tr>
            </thead>
            <tbody>
              {claims.length === 0 && <EmptyRow cols={6} text="Рекламаций нет" />}
              {claims.map(c => (
                <tr key={c.id} onClick={() => loadDetail(c.id)}
                  className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors cursor-pointer">
                  <Td mono>{c.claim_number}</Td>
                  <Td mono>{c.order_number || "—"}</Td>
                  <Td>{CLAIM_TYPE_LABELS[c.type] || c.type}</Td>
                  <Td><StatusBadge map={CLAIM_STATUS_MAP} status={c.status} /></Td>
                  <Td>{fmtDate(c.created_at)}</Td>
                  <Td mono>{c.compensation_amount > 0 ? fmt(c.compensation_amount) : "—"}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableCard>
      )}
    </div>
  );
}
