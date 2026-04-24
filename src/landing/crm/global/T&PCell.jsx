import TopHeaderMenu from "@/landing/components/TopHeaderMenu";
import MainHeader from "@/landing/components/MainHeader";
import HeaderMenu from "@/landing/components/HeaderMenu";
import TPCell from "../T&PCell";
import Footer from "@/landing/components/Footer";

export default function TPCellGlobal() {
  return (
    <>
      <TopHeaderMenu />
      <MainHeader />
      <HeaderMenu />

          <TPCell />
          
      <Footer />
    </>
  );
}