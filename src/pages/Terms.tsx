import Layout from "@/components/Layout";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Terms() {
  const { t } = useLanguage();

  const sections = [
    { title: t("terms.s1.title"), body: t("terms.s1.body") },
    { title: t("terms.s2.title"), body: t("terms.s2.body") },
    { title: t("terms.s3.title"), body: t("terms.s3.body") },
    { title: t("terms.s4.title"), body: t("terms.s4.body") },
    { title: t("terms.s5.title"), body: t("terms.s5.body") },
    { title: t("terms.s6.title"), body: t("terms.s6.body") },
    { title: t("terms.s7.title"), body: t("terms.s7.body") },
    { title: t("terms.s8.title"), body: t("terms.s8.body") },
  ];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-10 max-w-3xl">
        <h1 className="text-2xl font-bold text-foreground mb-2">{t("terms.title")}</h1>
        <p className="text-xs text-muted-foreground mb-8">{t("terms.lastUpdated")}</p>

        <div className="space-y-6">
          {sections.map((s, i) => (
            <section key={i}>
              <h2 className="text-base font-semibold text-foreground mb-2">
                {language === "ja" ? `第${i + 1}条` : `Article ${i + 1}`} {s.title}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {s.body}
              </p>
            </section>
          ))}
        </div>
      </div>
    </Layout>
  );
}
