import { Link } from "react-router-dom";
import { ArrowRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

export default function HeroSection() {
  const { t, language } = useLanguage();
  const isEn = language === "en";

  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
      {/* Faint grid background to evoke map analysis */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="hero-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="hsl(217 91% 55%)" strokeWidth="0.8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hero-grid)" />
      </svg>

      <div className="container mx-auto px-4 max-w-5xl relative z-10">
        <div className="text-center max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-[1.2] tracking-tight mb-6">
              {isEn ? (
                <>
                  <span className="text-gradient">Map × AI</span>
                  <br />
                  Transform Your Customer Acquisition
                </>
              ) : (
                <>
                  <span className="text-gradient">地図 × AI</span> で、
                  <br />
                  集客を変える
                </>
              )}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed max-w-2xl mx-auto">
              {isEn
                ? "Trade area analysis, competitor research, ad proposals, flyer distribution — all in one platform."
                : "商圏分析、競合調査、広告提案、チラシ配布まで。すべてをひとつのプラットフォームで。"}
            </p>
          </motion.div>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Link to="/input">
              <Button size="lg" className="text-base px-8 py-6 gap-2 shadow-lg hover:shadow-xl transition-shadow">
                {isEn ? "Analyze Your Area for Free" : "無料で商圏分析する"}
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link to="/map-analysis">
              <Button size="lg" variant="outline" className="text-base px-8 py-6 gap-2">
                <Play className="w-4 h-4" />
                {isEn ? "See Demo" : "デモを見る"}
              </Button>
            </Link>
          </motion.div>
        </div>

        {/* YouTube demo video */}
        <motion.div
          className="mt-16 mx-auto max-w-[800px]"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <div className="relative w-full rounded-2xl border border-border/60 shadow-2xl overflow-hidden" style={{ paddingBottom: "56.25%" }}>
            <iframe
              className="absolute inset-0 w-full h-full"
              src="https://www.youtube.com/embed/JGuL8-pJTtQ"
              title="MapBoost AI Demo"
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
