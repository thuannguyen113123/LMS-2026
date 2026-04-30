import React from "react";
import CoursePurchaseBox from "../lesson/CoursePurchaseBox";
import OverviewInstructor from "./OverviewInstructor";
import OverviewFAQ from "./OverviewFAQ";

const OverviewSidebar = ({ course, addItem }) => {
  return (
    <div className="flex flex-col gap-4 rounded-2xl shadow p-4 sm:p-6 md:p-8 lg:p-10">
      <CoursePurchaseBox course={course} addItem={addItem} />

      {/* FAQ */}
      <OverviewFAQ />
    </div>
  );
};

export default OverviewSidebar;
