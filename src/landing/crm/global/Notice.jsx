import TopHeaderMenu from "@/landing/components/TopHeaderMenu";
import MainHeader from "@/landing/components/MainHeader";
import HeaderMenu from "@/landing/components/HeaderMenu";
import NoticeContent from "../Notice";
import Footer from "@/landing/components/Footer";

export default function NoticePage() {
  return (
    <>
      <TopHeaderMenu />
      <MainHeader />
      <HeaderMenu />

          <NoticeContent />
          
      <Footer />
    </>
  );
}