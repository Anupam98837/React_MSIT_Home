import TopHeaderMenu from "@/landing/components/TopHeaderMenu";
import MainHeader from "@/landing/components/MainHeader";
import HeaderMenu from "@/landing/components/HeaderMenu";
import PlacementOfficersContent from "../PlacementOfficers";
import Footer from "@/landing/components/Footer";

export default function PlacementOfficersPage() {
  return (
    <>
      <TopHeaderMenu />
      <MainHeader />
      <HeaderMenu />

          <PlacementOfficersContent />
          
      <Footer />
    </>
  );
}