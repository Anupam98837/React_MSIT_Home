import TopHeaderMenu from "@/landing/components/TopHeaderMenu";
import MainHeader from "@/landing/components/MainHeader";
import HeaderMenu from "@/landing/components/HeaderMenu";
import AchievementContent from "../Achievement";
import Footer from "@/landing/components/Footer";

export default function AchievementPage() {
  return (
    <>
      <TopHeaderMenu />
      <MainHeader />
      <HeaderMenu />

          <AchievementContent />
          
      <Footer />
    </>
  );
}