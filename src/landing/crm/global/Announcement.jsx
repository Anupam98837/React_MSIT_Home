import TopHeaderMenu from "@/landing/components/TopHeaderMenu";
import MainHeader from "@/landing/components/MainHeader";
import HeaderMenu from "@/landing/components/HeaderMenu";
import AnnouncementContent from "../Announcement";
import Footer from "@/landing/components/Footer";

export default function AnnouncementPage() {
  return (
    <>
      <TopHeaderMenu />
      <MainHeader />
      <HeaderMenu />

          <AnnouncementContent />

      <Footer />
    </>
  );
}