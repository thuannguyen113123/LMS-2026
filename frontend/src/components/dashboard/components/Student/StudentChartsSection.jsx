import React from "react";
import StudentProgressChart from "./StudentProgressChart";

const StudentChartsSection = ({ data }) => {
  return (
    <div className="grid md:grid-cols-1 gap-6">
      <StudentProgressChart data={data?.progressChart || []} />
    </div>
  );
};

export default StudentChartsSection;
