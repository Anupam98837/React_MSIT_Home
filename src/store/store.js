import { configureStore } from "@reduxjs/toolkit";
import headerReducer from "../redux/headerSlice";
import heroCarouselReducer from "../redux/heroCarouselSlice";
import infoBoxesReducer from "../redux/infoBoxesSlice";
import courseReducer from "../redux/courseSlice";
import statsReducer from "../redux/statsSlice";
import testimonialsReducer from "../redux/testimonialsSlice";
import noticeMarqueeReducer from "../redux/noticeMarqueeSlice";
import stickyButtonsReducer from "../redux/stickyButtonsSlice";
import homeHighlightsReducer from "../redux/homeHighlightsSlice";
import nvaRowReducer from "../redux/nvaRowSlice";
import footerReducer from "../redux/footerSlice";
import recruiters from "../redux/recruitersSlice";
import alumniReducer from "../redux/alumniSlice";
import successReducer from "../redux/successSlice";
import enquiryReducer from "../redux/enquirySlice";
import contactUsReducer from "../redux/crm/contactUsSlice";
import noticeReducer from "../redux/crm/noticeSlice";
import announcementReducer from "../redux/crm/announcementSlice";
import achievementReducer from "../redux/crm/achievementSlice";
import eventReducer from "../redux/crm/eventSlice";
import placementOfficersReducer from "../redux/crm/placementOfficersSlice";
import technicalAssistantReducer from "../redux/crm/technicalAssistantSlice";
import facultyReducer from "../redux/crm/facultySlice";
import alumniViewAllReducer from "../redux/crm/alumniViewAllSlice";
import placedStudentsReducer from "../redux/crm/placedStudentsSlice";
import programToppersReducer from "../redux/crm/programToppersSlice";
import tpCellReducer from "../redux/crm/T&PCellSlice";
import successStoriesReducer from "../redux/crm/successStoriesSlice";
import studentActivitiesReducer from "../redux/crm/studentActivitiesSlice";
import coursesViewAllReducer from "../redux/crm/coursesViewAllSlice";
import galleryReducer from "../redux/crm/gallerySlice";
import userProfileReducer from "../redux/crm/userProfileSlice";
import dynamicPageReducer from "../redux/dynamicPageSlice";
import achievementViewReducer from "../redux/crm/single/achievementViewSlice";
import announcementViewReducer from "../redux/crm/single/announcementSlice";
import careerNoticeViewReducer from "../redux/crm/single/careerNoticeViewSlice";
import noticeViewReducer from "../redux/crm/single/noticeViewSlice";
import placementNoticeViewReducer from "../redux/crm/single/placementNoticeViewSlice";
import studentActivityViewReducer from "../redux/crm/single/studentActivityViewSlice";
import scholarshipViewReducer from "../redux/crm/single/scholarshipViewSlice";
import successStoriesViewReducer from "../redux/crm/single/successStoriesViewSlice";
import whyUsViewReducer from "../redux/crm/single/whyUsViewSlice";
import metaTagsReducer from "../redux/metaTagsSlice";

const store = configureStore({
  reducer: {
    header: headerReducer,
    heroCarousel: heroCarouselReducer,
    infoBoxes: infoBoxesReducer,
    courses: courseReducer,
    stats: statsReducer,
    testimonials: testimonialsReducer,
    noticeMarquee: noticeMarqueeReducer,
    stickyButtons: stickyButtonsReducer,
    homeHighlights: homeHighlightsReducer,
    nvaRow: nvaRowReducer,
    footer: footerReducer,
    recruiters: recruiters,
    alumni: alumniReducer,
    success: successReducer,
    enquiry: enquiryReducer,
    contactUs: contactUsReducer,
    notices: noticeReducer,
    announcement: announcementReducer,
    achievements: achievementReducer,
    events: eventReducer,
    placementOfficers: placementOfficersReducer,
    technicalAssistants: technicalAssistantReducer,
    facultyMembers: facultyReducer,
    alumniViewAll: alumniViewAllReducer,
    placedStudentsViewAll: placedStudentsReducer,
    programToppersViewAll: programToppersReducer,
    tpCell: tpCellReducer,
    successStories: successStoriesReducer,
    studentActivities: studentActivitiesReducer,
    coursesViewAll: coursesViewAllReducer,
    galleryViewAll: galleryReducer,
    userProfile: userProfileReducer,
    dynamicPage: dynamicPageReducer,
    achievementView: achievementViewReducer,
    announcementView: announcementViewReducer,
    careerNoticeView: careerNoticeViewReducer,
    noticeView: noticeViewReducer,
    placementNoticeView: placementNoticeViewReducer,
    studentActivityView: studentActivityViewReducer,
    scholarshipView: scholarshipViewReducer,
    successStoriesView: successStoriesViewReducer,
    whyUsView: whyUsViewReducer,
    metaTags: metaTagsReducer,
  },
});

export default store;