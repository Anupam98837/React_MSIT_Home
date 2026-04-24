import { useEffect } from "react";
import { useDispatch } from "react-redux";
import Footer from "../components/Footer";
import HeaderMenu from "../components/HeaderMenu";
import MainHeader from "../components/MainHeader";
import TopHeaderMenu from "../components/TopHeaderMenu";
import EnquiryForm from "../home/Enquiry";
import { clearEnquiryToast } from "../../redux/enquirySlice";

export default function EnquiryPage() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(clearEnquiryToast());
  }, [dispatch]);

  return (
    <>
      <TopHeaderMenu />
      <MainHeader />
      <HeaderMenu />

      <main className="bg-[#f6f7fb] py-6 sm:py-8">
        <div className="mx-auto w-full max-w-[1180px] px-3 sm:px-4 lg:px-5">

          <EnquiryForm isOpen={true} useGlobalToast={false} />
        </div>
      </main>

      <Footer />
    </>
  );
}