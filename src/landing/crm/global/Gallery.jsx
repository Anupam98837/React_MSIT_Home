import TopHeaderMenu from "@/landing/components/TopHeaderMenu";
import MainHeader from "@/landing/components/MainHeader";
import HeaderMenu from "@/landing/components/HeaderMenu";
import GalleryContent from "../Gallery";
import Footer from "@/landing/components/Footer";

export default function GalleryPage() {
  return (
    <>
      <TopHeaderMenu />
      <MainHeader />
      <HeaderMenu />

      <GalleryContent />

      <Footer />
    </>
  );
}
