import { useEffect, useState } from "react";
import { clientFetch } from "@/lib/clientApi";
import Icon from "@/components/ui/icon";
import { Loader, ErrorMsg, SectionHeader } from "../shared";

const MARKETPLACE_LABELS: Record<string, string> = { ozon: "Ozon", yandex_market: "Яндекс Маркет", both: "Ozon + Яндекс Маркет" };
const EDO_LABELS: Record<string, string> = { diadoc: "Диадок (Контур)", sbis: "СБИС", "1c_edo": "1С-ЭДО", other: "Другой" };
const DELIVERY_LABELS: Record<string, string> = { ozon_partners: "Партнёры Ozon", our_service: "Наша служба доставки" };

interface Company {
  id: string; name: string; short_name: string; full_name: string;
  inn: string; kpp: string; ogrn: string; legal_address: string;
  director_name: string; email: string; phone: string; contact_person: string;
  marketplace: string; ozon_api_key_masked: string; edo_operator: string;
  delivery_method: string; status: string;
}

interface Props { companyId: string; }

export default function Settings({ companyId }: Props) {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [twofa, setTwofa] = useState(false);

  useEffect(() => {
    clientFetch("settings", companyId)
      .then(d => {
        setCompany(d.company);
        setEditEmail(d.company.email || "");
        setEditPhone(d.company.phone || "");
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [companyId]);

  function handleSave() {
    setSaved(true);
    setEditing(false);
    setTimeout(() => setSaved(false), 3000);
  }

  if (loading) return <Loader />;
  if (error) return <ErrorMsg message={error} />;
  if (!company) return null;

  const reqs = [
    { label: "Полное наименование", value: company.full_name || company.name },
    { label: "Краткое наименование", value: company.short_name || company.name },
    { label: "ИНН", value: company.inn },
    { label: "КПП", value: company.kpp || "—" },
    { label: "ОГРН", value: company.ogrn || "—" },
    { label: "Юридический адрес", value: company.legal_address || "—" },
    { label: "Руководитель", value: company.director_name || "—" },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      <SectionHeader title="Настройки" subtitle="Данные компании и параметры кабинета" />

      {/* Requisites */}
      <div className="rounded-lg border border-border p-5" style={{ background: "hsl(var(--card))" }}>
        <div className="flex items-center gap-2 mb-4">
          <div className="text-sm font-medium text-foreground">Реквизиты компании</div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-secondary text-muted-foreground">Только просмотр</span>
        </div>
        <div className="space-y-2.5">
          {reqs.map(r => (
            <div key={r.label} className="flex gap-4 border-b border-border last:border-0 pb-2 last:pb-0">
              <span className="text-xs text-muted-foreground w-48 flex-shrink-0">{r.label}</span>
              <span className="text-xs text-foreground">{r.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Contact */}
      <div className="rounded-lg border border-border p-5" style={{ background: "hsl(var(--card))" }}>
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-medium text-foreground">Контакты</div>
          {!editing && (
            <button onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded border border-border text-muted-foreground hover:text-foreground transition-colors">
              <Icon name="Pencil" size={11} /> Изменить
            </button>
          )}
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Email</label>
            {editing
              ? <input value={editEmail} onChange={e => setEditEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-secondary text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
              : <div className="text-sm text-foreground">{editEmail || "—"}</div>
            }
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Телефон</label>
            {editing
              ? <input value={editPhone} onChange={e => setEditPhone(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-secondary text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
              : <div className="text-sm text-foreground">{editPhone || "—"}</div>
            }
          </div>
          {editing && (
            <div className="flex gap-2 pt-1">
              <button onClick={handleSave}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all"
                style={{ background: "hsl(var(--cyan))", color: "hsl(var(--primary-foreground))" }}>
                <Icon name="Check" size={12} /> Сохранить
              </button>
              <button onClick={() => setEditing(false)}
                className="px-4 py-2 rounded-lg text-xs border border-border text-muted-foreground hover:text-foreground transition-colors">
                Отмена
              </button>
            </div>
          )}
          {saved && (
            <div className="flex items-center gap-2 text-xs text-green-400">
              <Icon name="CheckCircle" size={12} /> Сохранено
            </div>
          )}
        </div>
      </div>

      {/* Marketplace & EDO */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-border p-5" style={{ background: "hsl(var(--card))" }}>
          <div className="text-sm font-medium text-foreground mb-4">Маркетплейс</div>
          <div className="space-y-3">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Площадка</div>
              <div className="text-sm text-foreground">{MARKETPLACE_LABELS[company.marketplace] || "—"}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">API-ключ</div>
              <div className="flex items-center gap-2">
                <code className="text-xs font-mono text-foreground bg-secondary px-2 py-1 rounded">{company.ozon_api_key_masked || "—"}</code>
                <button onClick={() => setShowKeyModal(true)}
                  className="text-xs px-2 py-1 rounded border border-border text-muted-foreground hover:text-foreground transition-colors">
                  Заменить
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border p-5" style={{ background: "hsl(var(--card))" }}>
          <div className="text-sm font-medium text-foreground mb-4">ЭДО и доставка</div>
          <div className="space-y-3">
            <div>
              <div className="text-xs text-muted-foreground mb-1">ЭДО-оператор</div>
              <div className="text-sm text-foreground">{EDO_LABELS[company.edo_operator] || "Не выбран"}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Способ доставки</div>
              <div className="text-sm text-foreground">{DELIVERY_LABELS[company.delivery_method] || "—"}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2FA */}
      <div className="rounded-lg border border-border p-5" style={{ background: "hsl(var(--card))" }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-foreground">Двухфакторная аутентификация</div>
            <div className="text-xs text-muted-foreground mt-0.5">Дополнительная защита аккаунта</div>
          </div>
          <div onClick={() => setTwofa(v => !v)}
            className={`w-10 h-5 rounded-full relative cursor-pointer transition-all ${twofa ? "" : "bg-secondary border border-border"}`}
            style={twofa ? { background: "hsl(var(--cyan))" } : {}}>
            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${twofa ? "left-5" : "left-0.5"}`} />
          </div>
        </div>
        {twofa && (
          <div className="mt-3 text-xs text-amber-400 bg-amber-400/10 rounded-lg px-3 py-2 flex items-center gap-2">
            <Icon name="Info" size={12} /> Функция в разработке. Мы уведомим вас о запуске.
          </div>
        )}
      </div>

      {/* Key modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowKeyModal(false)}>
          <div className="rounded-xl border border-border p-6 w-full max-w-md animate-fade-in" style={{ background: "hsl(var(--card))" }}
            onClick={e => e.stopPropagation()}>
            <div className="text-sm font-medium text-foreground mb-4">Заменить API-ключ</div>
            <input placeholder="Новый API-ключ Ozon"
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-secondary text-foreground focus:outline-none focus:ring-1 focus:ring-ring mb-3" />
            <div className="flex gap-2">
              <button className="flex-1 py-2 rounded-lg text-xs font-medium"
                style={{ background: "hsl(var(--cyan))", color: "hsl(var(--primary-foreground))" }}>
                Сохранить
              </button>
              <button onClick={() => setShowKeyModal(false)}
                className="flex-1 py-2 rounded-lg text-xs border border-border text-muted-foreground hover:text-foreground">
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
