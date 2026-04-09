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
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto rounded-3xl p-10 md:p-14 text-center relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, hsl(217 91% 55%) 0%, hsl(250 80% 55%) 100%)" }}
        >
          {/* Subtle grid overlay */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="cta-grid" width="32" height="32" patternUnits="userSpaceOnUse">
                <path d="M 32 0 L 0 0 0 32" fill="none" stroke="white" strokeWidth="0.6" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#cta-grid)" />
          </svg>

          <div className="relative z-10">
            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-4">
              {isEn
                ? "Ready to analyze your area?"
                : "まずは無料で、あなたのエリアを分析してみませんか？"}
            </h2>
            <p className="text-white/80 mb-4 text-sm">
              {isEn
                ? "Enter your address and get instant insights powered by real census data and AI."
                : "住所を入力するだけで、国勢調査データとAIによる分析結果が手に入ります。"}
            </p>
            <div className="flex items-center justify-center gap-3 text-white/70 text-xs mb-8 flex-wrap">
              <span>{isEn ? "Done in 3 min" : "3分で完了"}</span>
              <span className="w-1 h-1 rounded-full bg-white/40" />
              <span>{isEn ? "No credit card" : "クレジットカード不要"}</span>
              <span className="w-1 h-1 rounded-full bg-white/40" />
              <span>{isEn ? "3 free/month" : "月3回無料"}</span>
            </div>
            <Link to="/free-analysis">
              <Button
                size="lg"
                className="text-base px-10 py-6 gap-2 shadow-lg hover:shadow-xl transition-shadow bg-white text-primary hover:bg-white/90"
              >
                {isEn ? "Analyze Your Area for Free" : "無料で商圏分析する"}
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
