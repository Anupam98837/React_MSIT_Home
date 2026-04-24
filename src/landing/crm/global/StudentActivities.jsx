import TopHeaderMenu from "@/landing/components/TopHeaderMenu";
import MainHeader from "@/landing/components/MainHeader";
import HeaderMenu from "@/landing/components/HeaderMenu";
import StudentActivities from "../StudentActivities";
import Footer from "@/landing/components/Footer";

export default function StudentActivitiesGlobal() {
  return (
    <>
      <TopHeaderMenu />
      <MainHeader />
      <HeaderMenu />

          <StudentActivities />
          
      <Footer />
    </>
  );
}