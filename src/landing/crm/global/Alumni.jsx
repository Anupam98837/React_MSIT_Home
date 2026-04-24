import TopHeaderMenu from "@/landing/components/TopHeaderMenu";
import MainHeader from "@/landing/components/MainHeader";
import HeaderMenu from "@/landing/components/HeaderMenu";
import Alumni from "../Alumni";
import Footer from "@/landing/components/Footer";

export default function AlumniGlobal() {
  return (
    <>
      <TopHeaderMenu />
      <MainHeader />
      <HeaderMenu />

          <Alumni />
          
      <Footer />
    </>
  );
}