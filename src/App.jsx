import { Suspense, lazy } from "react";
import { Route, Routes } from "react-router";
import Home from "./landing/Home";
import Overlay from "./partials/Overlay";
import MetaTags from "./landing/components/MetaTags";

const Enquiry = lazy(() => import("./landing/crm/Enquiry"));
const ContactUs = lazy(() => import("./landing/crm/ContactUs"));
const Recruiters = lazy(() => import("./landing/crm/Recruiters"));
const Announcement = lazy(() => import("./landing/crm/global/Announcement"));
const Achievement = lazy(() => import("./landing/crm/global/Achievement"));
const Notice = lazy(() => import("./landing/crm/global/Notice"));
const Event = lazy(() => import("./landing/crm/global/Event"));
const PlacementOfficers = lazy(() => import("./landing/crm/global/PlacementOfficers"));
const TechnicalAssistant = lazy(() => import("./landing/crm/global/TechnicalAssistant"));
const Faculty = lazy(() => import("./landing/crm/global/Faculty"));
const Alumni = lazy(() => import("./landing/crm/global/Alumni"));
const PlacedStudents = lazy(() => import("./landing/crm/global/PlacedStudents"));
const ProgramToppers = lazy(() => import("./landing/crm/global/ProgramToppers"));
const TPCell = lazy(() => import("./landing/crm/global/T&PCell"));
const SuccessStories = lazy(() => import("./landing/crm/global/SuccessStories"));
const StudentActivities = lazy(() => import("./landing/crm/global/StudentActivities"));
const Courses = lazy(() => import("./landing/crm/global/Courses"));
const Gallery = lazy(() => import("./landing/crm/global/Gallery"));
const UserProfile = lazy(() => import("./landing/crm/global/UserProfile"));
const DynamicPage = lazy(() => import("./landing/DynamicPage"));

const ViewAchievement = lazy(() => import("./landing/crm/single/ViewAchievement"));
const ViewAnnouncement = lazy(() => import("./landing/crm/single/ViewAnnouncement"));
const ViewCareerNotice = lazy(() => import("./landing/crm/single/ViewCareerNotice"));
const ViewNotice = lazy(() => import("./landing/crm/single/ViewNotice"));
const ViewPlacementNotice = lazy(() => import("./landing/crm/single/ViewPlacementNotice"));
const ViewStudentActivity = lazy(() => import("./landing/crm/single/ViewStudentActivity"));
const ViewScholarship = lazy(() => import("./landing/crm/single/ViewScholarship"));
const ViewSuccessStories = lazy(() => import("./landing/crm/single/ViewSuccessStories"));
const ViewWhyUs = lazy(() => import("./landing/crm/single/ViewWhyUs"));

export default function App() {
  return (
    <Suspense fallback={<Overlay />}>
      <MetaTags />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/view/:slug" element={<DynamicPage />} />
        <Route path="/page/:slug" element={<DynamicPage />} />
        <Route path="/enquiry-form" element={<Enquiry />} />
        <Route path="/contact-us" element={<ContactUs />} />
        <Route path="/our-recruiters" element={<Recruiters />} />
        <Route path="/recruiters" element={<Recruiters />} />
        <Route path="/announcements" element={<Announcement />} />
        <Route path="/achievements" element={<Achievement />} />
        <Route path="/notices" element={<Notice />} />
        <Route path="/events" element={<Event />} />
        <Route path="/technical-assistants" element={<TechnicalAssistant />} />
        <Route path="/placement-officers" element={<PlacementOfficers />} />
        <Route path="/faculty-members" element={<Faculty />} />
        <Route path="/alumni" element={<Alumni />} />
        <Route path="/placed-students" element={<PlacedStudents />} />
        <Route path="/program-toppers" element={<ProgramToppers />} />
        <Route path="/tp-cell" element={<TPCell />} />
        <Route path="/success-stories" element={<SuccessStories />} />
        <Route path="/student-activities" element={<StudentActivities />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/user/profile/:slug" element={<UserProfile />} />
        <Route path="*" element={<DynamicPage />} />

        <Route path="/achievements/view/:slug" element={<ViewAchievement />} />
        <Route path="/announcements/view/:slug" element={<ViewAnnouncement />} />
        <Route path="/career-notices/view/:slug" element={<ViewCareerNotice />} />
        <Route path="/notices/view/:slug" element={<ViewNotice />} />
        <Route path="/placement-notices/view/:slug" element={<ViewPlacementNotice />} />
        <Route path="/student-activities/view/:slug" element={<ViewStudentActivity />} />
        <Route path="/scholarships/view/:slug" element={<ViewScholarship />} />
        <Route path="/success-stories/view/:slug" element={<ViewSuccessStories />} />
        <Route path="/why-us/view/:slug" element={<ViewWhyUs />} />
      </Routes>
    </Suspense>
  );
}
