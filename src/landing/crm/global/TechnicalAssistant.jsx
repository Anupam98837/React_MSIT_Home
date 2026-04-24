import TopHeaderMenu from "@/landing/components/TopHeaderMenu";
import MainHeader from "@/landing/components/MainHeader";
import HeaderMenu from "@/landing/components/HeaderMenu";
import TechnicalAssistantContent from "../TechnicalAssistant";
import Footer from "@/landing/components/Footer";

export default function TechnicalAssistantPage() {
  return (
    <>
      <TopHeaderMenu />
      <MainHeader />
      <HeaderMenu />

          <TechnicalAssistantContent />
          
      <Footer />
    </>
  );
}