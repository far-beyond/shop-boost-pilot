import Layout from "@/components/Layout";
import HeroSection from "@/components/landing/HeroSection";
import StatsSection from "@/components/landing/StatsSection";
import SocialProofSection from "@/components/landing/SocialProofSection";
import UseCasesSection from "@/components/landing/UseCasesSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import ScreenshotSection from "@/components/landing/ScreenshotSection";
import StepsSection from "@/components/landing/StepsSection";
import PricingSection from "@/components/landing/PricingSection";
import FaqSection from "@/components/landing/FaqSection";
import BottomCTA from "@/components/landing/BottomCTA";

export default function Index() {
  return (
    <Layout>
      <HeroSection />
      <StatsSection />
      <SocialProofSection />
      <FeaturesSection />
      <ScreenshotSection />
      <UseCasesSection />
      <StepsSection />
      <PricingSection />
      <FaqSection />
      <BottomCTA />
    </Layout>
  );
}
