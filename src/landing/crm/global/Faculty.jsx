import TopHeaderMenu from "@/landing/components/TopHeaderMenu";
import MainHeader from "@/landing/components/MainHeader";
import HeaderMenu from "@/landing/components/HeaderMenu";
import FacultyContent from "../Faculty";
import Footer from "@/landing/components/Footer";

export default function FacultyPage() {
  return (
    <>
      <TopHeaderMenu />
      <MainHeader />
      <HeaderMenu />

          <FacultyContent />
          
      <Footer />
    </>
  );
}