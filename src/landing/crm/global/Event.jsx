import TopHeaderMenu from "@/landing/components/TopHeaderMenu";
import MainHeader from "@/landing/components/MainHeader";
import HeaderMenu from "@/landing/components/HeaderMenu";
import EventContent from "../Event";
import Footer from "@/landing/components/Footer";

export default function EventPage() {
  return (
    <>
      <TopHeaderMenu />
      <MainHeader />
      <HeaderMenu />

          <EventContent />
          
      <Footer />
    </>
  );
}