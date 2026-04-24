import TopHeaderMenu from "@/landing/components/TopHeaderMenu";
import MainHeader from "@/landing/components/MainHeader";
import HeaderMenu from "@/landing/components/HeaderMenu";
import SuccessStories from "../SuccessStories";
import Footer from "@/landing/components/Footer";

export default function SuccessStoriesGlobal() {
  return (
    <>
      <TopHeaderMenu />
      <MainHeader />
      <HeaderMenu />

          <SuccessStories />
          
      <Footer />
    </>
  );
}