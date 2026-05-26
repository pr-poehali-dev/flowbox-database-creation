import { useEffect, useState, useCallback, useRef } from "react";
import { mgrGet, mgrPost, claimsApiGet, claimsApiPost } from "@/lib/managerApi";
import {
  Loader, ErrMsg, SectionHdr, Card, Th, Td, EmptyRow,
  Badge, CLAIM_STATUS, CLAIM_TYPE, fmt, fmtDate, Select,
} from "../shared";
import Icon from "@/components/ui/icon";

const COMP_TYPES = ["money", "part_replacement", "back_to_stock", "write_off", "return_to_supplier"];
const COMP_LABELS: Record<string, string> = {
  money: "Денежная", part_replacement: "Замена детали",
  back_to_stock: "Возврат на склад", write_off: "Списание",
  return_to_supplier: "Возврат поставщику",
};
const CLAIM_TYPES_CREATE = ["defect", "damage", "return", "delivery_refusal"];
const WAREHOUSE_STATUS: Record<string, { l: string; c: string }> = {
  in_warehouse:      { l: "На складе",          c: "text-amber-400" },
  ready_for_sale:    { l: "Готов к продаже",     c: "text-green-400" },
  ready_for_return:  { l: "К возврату поставщику", c: "text-violet-400" },
  written_off:       { l: "Списан",              c: "text-muted-foreground" },
};

interface Props { initialClaimId?: string; }

export default function MgrClaims({ initialClaimId }: Props) {
  // Список
  const [claims, setClaims]       = useState<Record<string, unknown>[]>([]);
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading]     = useState(true);
  const [err, setErr]             = useState("");
  const [stFilter, setStFilter]   = useState("");
  const [cFilter, setCFilter]     = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  // Детали
  const [detail, setDetail]             = useState<Record<string, unknown> | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Решение
  const [decision, setDecision]   = useState("");
  const [compAmount, setCompAmount] = useState("0");
  const [compType, setCompType]   = useState("money");
  const [saving, setSaving]       = useState(false);

  // Создание вручную
  const [createMode, setCreateMode] = useState(false);
  const [createCompany, setCreateCompany] = useState("");
  const [createType, setCreateType] = useState("defect");
  const [createDesc, setCreateDesc] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  // Фото
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadLoading, setUploadLoading] = useState(false);

  // Склад
  const [tab, setTab] = useState<"claims" | "warehouse">("claims");
  const [warehouseItems, setWarehouseItems] = useState<Record<string, unknown>[]>([]);
  const [whLoading, setWhLoading] = useState(false);
  const [whFilter, setWhFilter]   = useState("in_warehouse");
  const [whActionLoading, setWhActionLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    const extra: Record<string, string> = {};
    if (stFilter) extra.status = stFilter;
    if (cFilter)  extra.company_id = cFilter;
    if (typeFilter) extra.type = typeFilter;
    mgrGet("claims", extra)
      .then(d => { setClaims(d.claims || []); setCompanies(d.companies || []); })
      .catch((e: Error) => setErr(e.message))
      .finally(() => setLoading(false));
  }, [stFilter, cFilter, typeFilter]);

  const loadWarehouse = useCallback(() => {
    setWhLoading(true);
    claimsApiGet("warehouse", { stock_status: whFilter, ...(cFilter ? { company_id: cFilter } : {}) })
      .then(d => setWarehouseItems(d.items || []))
      .catch((e: Error) => setErr(e.message))
      .finally(() => setWhLoading(false));
  }, [whFilter, cFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (tab === "warehouse") loadWarehouse(); }, [tab, loadWarehouse]);
  useEffect(() => { if (initialClaimId) loadDetail(initialClaimId); }, [initialClaimId]);

  async function loadDetail(id: string) {
    setDetailLoading(true);
    try {
      const d = await mgrGet("claim_detail", { claim_id: id });
      setDetail(d.claim);
      setDecision(d.claim.decision || "");
      setCompAmount(String(d.claim.compensation_amount || 0));
      setCompType(d.claim.compensation_type || "money");
    } catch (e: Error) { setErr((e as Error).message); }
    finally { setDetailLoading(false); }
  }

  async function sendDecision() {
    if (!detail) return;
    setSaving(true);
    try {
      await claimsApiPost("mgr_update", {
        action: "send_decision", claim_id: detail.id,
        decision, compensation_amount: parseFloat(compAmount) || 0, compensation_type: compType,
      });
      loadDetail(detail.id as string); load();
    } catch (e: Error) { setErr((e as Error).message); }
    finally { setSaving(false); }
  }

  async function doAction(action: string) {
    if (!detail) return;
    await claimsApiPost("mgr_update", { action, claim_id: detail.id });
    loadDetail(detail.id as string); load();
  }

  async function handleFileUpload(files: FileList | null) {
    if (!files || !detail) return;
    setUploadLoading(true);
    setErr("");
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const reader = new FileReader();
        const b64 = await new Promise<string>((res, rej) => {
          reader.onload = () => res((reader.result as string).split(",")[1]);
          reader.onerror = rej;
          reader.readAsDataURL(file);
        });
        urls.push(`data:${file.type};base64,${b64}`);
      }
      await claimsApiPost("mgr_photos", { claim_id: detail.id, photos: urls });
      await loadDetail(detail.id as string);
    } catch (e: Error) { setErr((e as Error).message); }
    finally { setUploadLoading(false); }
  }

  async function createClaim() {
    if (!createCompany || !createDesc.trim()) { setErr("Заполните компанию и описание"); return; }
    setCreateLoading(true);
    try {
      await claimsApiPost("mgr_create", {
        company_id: createCompany, type: createType, description: createDesc,
      });
      setCreateMode(false); setCreateDesc(""); load();
    } catch (e: Error) { setErr((e as Error).message); }
    finally { setCreateLoading(false); }
  }

  async function warehouseAction(itemId: string, action: string) {
    setWhActionLoading(true);
    try {
      await claimsApiPost("warehouse_action", { item_id: itemId, action });
      loadWarehouse();
    } catch (e: Error) { setErr((e as Error).message); }
    finally { setWhActionLoading(false); }
  }

  // ── ДЕТАЛЬНЫЙ ВИД ──────────────────────────────────────────────────────────
  if (detail) {
    const history = (detail.history as { date: string; status: string; comment: string }[]) || [];
    const photos  = (detail.photos  as string[]) || [];
    const canSend = !["closed", "agreed"].includes(detail.status as string);
    const isDisputed = detail.status === "disputed";

    return (
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center gap-3">
          <button onClick={() => setDetail(null)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
            <Icon name="ArrowLeft" size={13} /> К списку
          </button>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm font-medium text-foreground">{detail.claim_number as string}</span>
          <Badge map={CLAIM_STATUS} k={detail.status as string} />
        </div>

        {err && <ErrMsg msg={err} />}

        {detailLoading ? <Loader /> : (
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-4">

              {/* Данные рекламации */}
              <Card className="p-5">
                <div className="text-sm font-medium text-foreground mb-4">Данные рекламации</div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 mb-4">
                  {([
                    ["Клиент",   detail.company_name],
                    ["Заказ",    detail.order_number],
                    ["Товар",    detail.product_name],
                    ["Тип",      CLAIM_TYPE[detail.type as string] || detail.type],
                    ["Источник", detail.source],
                    ["Создана",  fmtDate(detail.created_at as string)],
                  ] as [string, unknown][]).map(([l, v]) => (
                    <div key={l} className="flex gap-2">
                      <span className="text-xs text-muted-foreground w-20 flex-shrink-0">{l}:</span>
                      <span className="text-xs text-foreground">{(v as string) || "—"}</span>
                    </div>
                  ))}
                </div>
                {detail.description && (
                  <p className="text-xs text-foreground bg-secondary rounded-lg p-3 leading-relaxed">
                    {detail.description as string}
                  </p>
                )}
                {/* Комментарий клиента при споре */}
                {isDisputed && detail.client_comment && (
                  <div className="mt-3 flex items-start gap-2 text-xs text-rose-400 bg-rose-400/10 border border-rose-400/20 rounded-lg p-3">
                    <Icon name="MessageSquare" size={13} className="flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium mb-0.5">Комментарий клиента к спору:</div>
                      <div>{detail.client_comment as string}</div>
                    </div>
                  </div>
                )}
              </Card>

              {/* Фотоматериалы */}
              <Card className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-medium text-foreground">Фотоматериалы</div>
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={uploadLoading}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border hover:border-ring px-2.5 py-1 rounded-lg transition-all disabled:opacity-40"
                  >
                    {uploadLoading
                      ? <Icon name="Loader2" size={12} className="animate-spin" />
                      : <Icon name="ImagePlus" size={12} />}
                    Добавить фото
                  </button>
                </div>
                <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
                  onChange={e => handleFileUpload(e.target.files)} />
                {photos.length > 0 ? (
                  <div className="grid grid-cols-4 gap-2">
                    {photos.map((u, i) => (
                      <a key={i} href={u} target="_blank" rel="noreferrer">
                        <img src={u} alt="" className="w-full h-20 object-cover rounded-lg border border-border hover:opacity-80 transition-opacity" />
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Нет фото</p>
                )}
              </Card>

              {/* Решение */}
              {canSend && (
                <Card className="p-5">
                  <div className="text-sm font-medium text-foreground mb-4">Решение менеджера</div>

                  {/* Кнопка "Принять в работу" */}
                  {detail.status === "new" && (
                    <button onClick={() => doAction("reviewing")}
                      className="mb-4 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border border-blue-400/30 text-blue-400 hover:bg-blue-400/10 transition-all">
                      <Icon name="Play" size={13} /> Принять в работу
                    </button>
                  )}

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Текст решения *</label>
                      <textarea value={decision} onChange={e => setDecision(e.target.value)} rows={4}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-secondary text-foreground focus:outline-none resize-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Сумма компенсации (₽)</label>
                        <input type="number" value={compAmount} onChange={e => setCompAmount(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-secondary text-foreground focus:outline-none font-mono" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Тип компенсации</label>
                        <select value={compType} onChange={e => setCompType(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-secondary text-muted-foreground focus:outline-none">
                          {COMP_TYPES.map(t => <option key={t} value={t}>{COMP_LABELS[t]}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1 flex-wrap">
                      <button onClick={sendDecision} disabled={!decision.trim() || saving}
                        className="flex items-center gap-2 px-4 py-2 text-xs rounded-lg font-medium disabled:opacity-40"
                        style={{ background: "hsl(var(--cyan))", color: "hsl(var(--primary-foreground))" }}>
                        {saving ? <Icon name="Loader2" size={13} className="animate-spin" /> : <Icon name="Send" size={13} />}
                        Отправить решение клиенту
                      </button>
                      {isDisputed && (
                        <button onClick={() => doAction("procedural")}
                          className="px-4 py-2 text-xs rounded-lg border border-violet-400/30 text-violet-400 hover:bg-violet-400/10 font-medium">
                          Процессуальная
                        </button>
                      )}
                      <button onClick={() => doAction("close")}
                        className="px-4 py-2 text-xs rounded-lg border border-border text-muted-foreground hover:text-foreground">
                        Закрыть
                      </button>
                    </div>
                  </div>
                </Card>
              )}
            </div>

            {/* Правая колонка: история */}
            <div className="space-y-4">
              <Card className="p-5">
                <div className="text-sm font-medium text-foreground mb-4">История</div>
                {history.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Нет записей</p>
                ) : (
                  <div className="space-y-3">
                    {[...history].reverse().map((h, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-2 h-2 rounded-full mt-1 flex-shrink-0"
                            style={{ background: "hsl(var(--cyan))" }} />
                          {i < history.length - 1 && <div className="w-0.5 flex-1 mt-1" style={{ background: "hsl(var(--border))" }} />}
                        </div>
                        <div className="pb-3 min-w-0">
                          <div className="text-[10px] text-muted-foreground">{fmtDate(h.date)}</div>
                          <div className="text-xs text-foreground font-medium mt-0.5">
                            {CLAIM_STATUS[h.status]?.l || h.status}
                          </div>
                          {h.comment && <p className="text-[10px] text-muted-foreground mt-0.5">{h.comment}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── СПИСОК / СКЛАД ─────────────────────────────────────────────────────────
  return (
    <div className="space-y-4 animate-fade-in">
      <SectionHdr
        title="Рекламации"
        sub={tab === "claims" ? `${claims.length} обращений` : `Физический товар на складе`}
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCreateMode(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{ background: "hsl(var(--cyan))", color: "hsl(var(--primary-foreground))" }}
            >
              <Icon name="Plus" size={13} />
              Создать
            </button>
          </div>
        }
      />

      {err && <ErrMsg msg={err} />}

      {/* Табы */}
      <div className="flex gap-1 border-b border-border">
        {(["claims", "warehouse"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-xs font-medium transition-colors border-b-2 -mb-px ${
              tab === t ? "border-ring text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}>
            {t === "claims" ? "Рекламации" : "Складские возвраты"}
          </button>
        ))}
      </div>

      {/* Создание вручную */}
      {createMode && (
        <Card className="p-5 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-medium text-foreground">Создать рекламацию</div>
            <button onClick={() => setCreateMode(false)} className="text-muted-foreground hover:text-foreground">
              <Icon name="X" size={15} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Клиент *</label>
              <select value={createCompany} onChange={e => setCreateCompany(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-secondary text-foreground focus:outline-none">
                <option value="">— Выберите —</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Тип</label>
              <select value={createType} onChange={e => setCreateType(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-secondary text-foreground focus:outline-none">
                {CLAIM_TYPES_CREATE.map(t => <option key={t} value={t}>{CLAIM_TYPE[t] || t}</option>)}
              </select>
            </div>
          </div>
          <div className="mb-3">
            <label className="text-xs text-muted-foreground mb-1 block">Описание *</label>
            <textarea value={createDesc} onChange={e => setCreateDesc(e.target.value)} rows={3}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-secondary text-foreground focus:outline-none resize-none" />
          </div>
          <div className="flex gap-2">
            <button onClick={createClaim} disabled={createLoading || !createCompany || !createDesc.trim()}
              className="flex items-center gap-2 px-4 py-2 text-xs rounded-lg font-medium disabled:opacity-40"
              style={{ background: "hsl(var(--cyan))", color: "hsl(var(--primary-foreground))" }}>
              {createLoading ? <Icon name="Loader2" size={13} className="animate-spin" /> : <Icon name="Plus" size={13} />}
              Создать
            </button>
            <button onClick={() => setCreateMode(false)}
              className="px-4 py-2 text-xs rounded-lg border border-border text-muted-foreground hover:text-foreground">
              Отмена
            </button>
          </div>
        </Card>
      )}

      {/* Рекламации */}
      {tab === "claims" && (
        <>
          {/* Фильтры */}
          <div className="flex gap-2 flex-wrap">
            <Select value={stFilter} onChange={setStFilter} className="text-xs">
              <option value="">Все статусы</option>
              {Object.entries(CLAIM_STATUS).map(([v, s]) => <option key={v} value={v}>{s.l}</option>)}
            </Select>
            <Select value={typeFilter} onChange={setTypeFilter} className="text-xs">
              <option value="">Все типы</option>
              {Object.entries(CLAIM_TYPE).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select>
            <Select value={cFilter} onChange={setCFilter} className="text-xs">
              <option value="">Все клиенты</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </div>

          {loading ? <Loader /> : (
            <Card>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <Th c="Номер" /><Th c="Клиент" /><Th c="Тип" /><Th c="Статус" /><Th c="Дата" /><Th c="Компенсация" />
                  </tr>
                </thead>
                <tbody>
                  {claims.length === 0 && <EmptyRow cols={6} text="Рекламаций нет" />}
                  {claims.map(c => (
                    <tr key={c.id as string} onClick={() => loadDetail(c.id as string)}
                      className="border-b border-border last:border-0 hover:bg-secondary/40 cursor-pointer transition-colors">
                      <Td c={<span className="font-mono text-[11px]">{c.claim_number as string}</span>} />
                      <Td c={c.company_name as string} />
                      <Td c={CLAIM_TYPE[c.type as string] || c.type as string} />
                      <Td c={<Badge map={CLAIM_STATUS} k={c.status as string} />} />
                      <Td c={fmtDate(c.created_at as string)} />
                      <Td c={
                        (c.compensation_amount as number) > 0
                          ? <span className="text-green-400 font-mono">{fmt(c.compensation_amount as number)}</span>
                          : <span className="text-muted-foreground">—</span>
                      } />
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </>
      )}

      {/* Складские возвраты */}
      {tab === "warehouse" && (
        <>
          <div className="flex gap-2 flex-wrap">
            <Select value={whFilter} onChange={setWhFilter} className="text-xs">
              <option value="all">Все статусы</option>
              {Object.entries(WAREHOUSE_STATUS).map(([v, s]) => <option key={v} value={v}>{s.l}</option>)}
            </Select>
            <Select value={cFilter} onChange={setCFilter} className="text-xs">
              <option value="">Все клиенты</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </div>

          {whLoading ? <Loader /> : (
            <Card>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <Th c="Товар" /><Th c="Клиент" /><Th c="Рекламация" /><Th c="Состояние" /><Th c="Статус" /><Th c="Действия" />
                  </tr>
                </thead>
                <tbody>
                  {warehouseItems.length === 0 && <EmptyRow cols={6} text="Нет товаров на складе" />}
                  {warehouseItems.map(item => {
                    const st = WAREHOUSE_STATUS[item.stock_status as string] || { l: item.stock_status as string, c: "text-muted-foreground" };
                    const isActionable = (item.stock_status as string) === "in_warehouse";
                    return (
                      <tr key={item.id as string} className="border-b border-border last:border-0">
                        <Td c={
                          <div>
                            <div className="font-medium">{item.trade_name as string}</div>
                            <div className="text-[10px] text-muted-foreground font-mono">{item.supplier_article as string}</div>
                          </div>
                        } />
                        <Td c={item.company_name as string || "—"} />
                        <Td c={<span className="font-mono text-[11px]">{item.claim_number as string || "—"}</span>} />
                        <Td c={
                          <span className={`text-xs ${(item.condition as string) === "damaged" ? "text-rose-400" : "text-green-400"}`}>
                            {(item.condition as string) === "whole" ? "Целый" :
                             (item.condition as string) === "damaged" ? "Повреждён" : "Неизвестно"}
                          </span>
                        } />
                        <Td c={<span className={`text-xs font-medium ${st.c}`}>{st.l}</span>} />
                        <Td c={
                          isActionable ? (
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => warehouseAction(item.id as string, "return_to_sale")}
                                disabled={whActionLoading}
                                className="px-2.5 py-1 text-[11px] rounded border border-green-400/30 text-green-400 hover:bg-green-400/10 transition-all disabled:opacity-40"
                              >
                                В продажу
                              </button>
                              <button
                                onClick={() => warehouseAction(item.id as string, "return_to_supplier")}
                                disabled={whActionLoading}
                                className="px-2.5 py-1 text-[11px] rounded border border-violet-400/30 text-violet-400 hover:bg-violet-400/10 transition-all disabled:opacity-40"
                              >
                                Поставщику
                              </button>
                              <button
                                onClick={() => warehouseAction(item.id as string, "write_off")}
                                disabled={whActionLoading}
                                className="px-2.5 py-1 text-[11px] rounded border border-border text-muted-foreground hover:text-foreground transition-all disabled:opacity-40"
                              >
                                Списать
                              </button>
                            </div>
                          ) : <span className="text-xs text-muted-foreground">—</span>
                        } />
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
