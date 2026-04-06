import Layout from "@/components/Layout";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Tokushoho() {
  const { t } = useLanguage();

  const rows = [
    { label: t("legal.seller"), value: t("legal.sellerVal") },
    { label: t("legal.representative"), value: t("legal.representativeVal") },
    { label: t("legal.address"), value: t("legal.addressVal") },
    { label: t("legal.contact"), value: t("legal.contactVal") },
    { label: t("legal.price"), value: t("legal.priceVal") },
    { label: t("legal.payment"), value: t("legal.paymentVal") },
    { label: t("legal.delivery"), value: t("legal.deliveryVal") },
    { label: t("legal.cancel"), value: t("legal.cancelVal") },
    { label: t("legal.refund"), value: t("legal.refundVal") },
  ];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-10 max-w-3xl">
        <h1 className="text-2xl font-bold text-foreground mb-6">{t("legal.title")}</h1>
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-muted/30" : ""}>
                    <td className="px-4 py-3 font-medium text-foreground w-1/3 border-b border-border/40 align-top">
                      {row.label}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground border-b border-border/40 whitespace-pre-line">
                      {row.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
