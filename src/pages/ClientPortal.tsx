import { useState } from "react";
import ClientLayout, { type ClientSection } from "@/components/client/ClientLayout";
import Overview from "@/components/client/sections/Overview";
import Catalog from "@/components/client/sections/Catalog";
import Calculator from "@/components/client/sections/Calculator";
import Orders from "@/components/client/sections/Orders";
import Finance from "@/components/client/sections/Finance";
import Claims from "@/components/client/sections/Claims";
import Settings from "@/components/client/sections/Settings";
import Support from "@/components/client/sections/Support";

// В реальном приложении company_id берётся из сессии/токена
// Сейчас подставляем первую найденную компанию через URL-параметр или demo
const getCompanyId = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get("company_id") || "demo";
};

interface CalcProduct { id: string; trade_name: string; our_price: number; }

export default function ClientPortal() {
  const [section, setSection] = useState<ClientSection>("overview");
  const [pendingOrderId, setPendingOrderId] = useState<string | undefined>();
  const [calcProduct, setCalcProduct] = useState<CalcProduct | null>(null);
  const companyId = getCompanyId();

  function goToOrder(orderId: string) {
    setPendingOrderId(orderId);
    setSection("orders");
  }

  function goToCalc(product: CalcProduct) {
    setCalcProduct(product);
    setSection("calculator");
  }

  function handleSection(s: ClientSection) {
    setSection(s);
    if (s !== "orders") setPendingOrderId(undefined);
    if (s !== "calculator") setCalcProduct(null);
  }

  return (
    <ClientLayout
      section={section}
      onSection={handleSection}
      companyName="Моя компания"
    >
      {section === "overview" && (
        <Overview companyId={companyId} onOrderClick={goToOrder} />
      )}
      {section === "catalog" && (
        <Catalog companyId={companyId} onCalculator={goToCalc} />
      )}
      {section === "calculator" && (
        <Calculator initialProduct={calcProduct} />
      )}
      {section === "orders" && (
        <Orders companyId={companyId} initialOrderId={pendingOrderId} />
      )}
      {section === "finance" && (
        <Finance companyId={companyId} />
      )}
      {section === "claims" && (
        <Claims companyId={companyId} />
      )}
      {section === "settings" && (
        <Settings companyId={companyId} />
      )}
      {section === "support" && (
        <Support companyId={companyId} />
      )}
    </ClientLayout>
  );
}
