import TopHeaderMenu from "@/landing/components/TopHeaderMenu";
import MainHeader from "@/landing/components/MainHeader";
import HeaderMenu from "@/landing/components/HeaderMenu";
import PlacedStudents from "../PlacedStudents";
import Footer from "@/landing/components/Footer";

export default function PlacedStudentsGlobal() {
  return (
    <>
      <TopHeaderMenu />
      <MainHeader />
      <HeaderMenu />

          <PlacedStudents />
          
      <Footer />
    </>
  );
}