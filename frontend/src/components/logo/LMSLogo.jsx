import { HiAcademicCap } from "react-icons/hi2";

const LMSLogo = ({ size = 48 }) => {
  return (
    <div className="flex gap-1">
      {" "}
      <div className="flex items-center justify-center">
        <HiAcademicCap size={size} className="text-indigo-600 drop-shadow-sm" />
      </div>
      <div className="flex flex-col leading-tight">
        <span className="text-2xl font-bold text-indigo-600 tracking-tight">
          LMS
        </span>
        <span className="text-sm text-gray-500 -mt-1">Academy</span>
      </div>
    </div>
  );
};

export default LMSLogo;
