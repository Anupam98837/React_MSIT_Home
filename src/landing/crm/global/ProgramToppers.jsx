import TopHeaderMenu from "@/landing/components/TopHeaderMenu";
import MainHeader from "@/landing/components/MainHeader";
import HeaderMenu from "@/landing/components/HeaderMenu";
import ProgramToppers from "../ProgramToppers";
import Footer from "@/landing/components/Footer";

export default function ProgramToppersGlobal() {
  return (
    <>
      <TopHeaderMenu />
      <MainHeader />
      <HeaderMenu />

          <ProgramToppers />
          
      <Footer />
    </>
  );
}