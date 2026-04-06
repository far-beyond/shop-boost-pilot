import { motion } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useLanguage } from "@/contexts/LanguageContext";

export default function FaqSection() {
  const { language } = useLanguage();
  const isEn = language === "en";

  const faqs = [
    {
      q: isEn ? "What industries can use this?" : "どんな業種に使えますか？",
      a: isEn
        ? "MapBoost AI works for any local business — restaurants, salons, clinics, schools, retail stores, real estate, and more."
        : "飲食店、美容院、クリニック、学習塾、小売店、不動産など、あらゆるローカルビジネスに対応しています。",
    },
    {
      q: isEn ? "Where does the data come from?" : "データはどこから取得していますか？",
      a: isEn
        ? "We integrate official census data from Japan's e-Stat, the US Census Bureau, and WorldPop for global coverage."
        : "日本の e-Stat（国勢調査）、US Census Bureau、WorldPop のデータと連携しています。",
    },
    {
      q: isEn ? "Can I use it outside Japan?" : "海外でも使えますか？",
      a: isEn
        ? "Yes! We support US Census data for the United States and WorldPop data for 200+ countries worldwide."
        : "はい！米国は US Census、世界200カ国以上は WorldPop データに対応しています。",
    },
    {
      q: isEn ? "Can I cancel anytime?" : "解約はいつでもできますか？",
      a: isEn
        ? "Absolutely. You can cancel your subscription at any time with no cancellation fees."
        : "はい、いつでも解約可能です。解約手数料はかかりません。",
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-muted/30">
      <div className="container mx-auto px-4 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-3">
            {isEn ? "Frequently Asked Questions" : "よくある質問"}
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border-border/60">
                <AccordionTrigger className="text-left text-sm font-medium hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
