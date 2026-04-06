import Layout from "@/components/Layout";
import HeroSection from "@/components/landing/HeroSection";
import StatsSection from "@/components/landing/StatsSection";
import UseCasesSection from "@/components/landing/UseCasesSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import StepsSection from "@/components/landing/StepsSection";
import PricingSection from "@/components/landing/PricingSection";
import FaqSection from "@/components/landing/FaqSection";
import BottomCTA from "@/components/landing/BottomCTA";

export default function Index() {
  return (
    <Layout>
      <HeroSection />
      <StatsSection />
      <UseCasesSection />
      <FeaturesSection />
      <StepsSection />
      <PricingSection />
      <FaqSection />
      <BottomCTA />
    </Layout>
  );
}
