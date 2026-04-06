import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

export default function BottomCTA() {
  const { language } = useLanguage();
  const isEn = language === "en";

  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-xl mx-auto"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-4">
            {isEn
              ? "Ready to analyze your area?"
              : "まずは無料で、あなたのエリアを分析してみませんか？"}
          </h2>
          <p className="text-muted-foreground mb-8 text-sm">
            {isEn
              ? "No credit card required. Start analyzing in under 3 minutes."
              : "クレジットカード不要。3分で分析を開始できます。"}
          </p>
          <Link to="/input">
            <Button size="lg" className="text-base px-10 py-6 gap-2 shadow-lg hover:shadow-xl transition-shadow">
              {isEn ? "Analyze Your Area for Free" : "無料で商圏分析する"}
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
