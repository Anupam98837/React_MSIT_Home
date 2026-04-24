import TopHeaderMenu from "@/landing/components/TopHeaderMenu";
import MainHeader from "@/landing/components/MainHeader";
import HeaderMenu from "@/landing/components/HeaderMenu";
import Courses from "../Courses";
import Footer from "@/landing/components/Footer";

export default function CoursesGlobal() {
  return (
    <>
      <TopHeaderMenu />
      <MainHeader />
      <HeaderMenu />

          <Courses />
          
      <Footer />
    </>
  );
}