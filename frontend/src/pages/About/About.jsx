import { useEffect, useRef, useState } from "react";
import { Rocket } from "lucide-react";
import {
  FiCheckCircle,
  FiPlayCircle,
  FiShield,
  FiUsers,
  FiPauseCircle,
} from "react-icons/fi";

import useGsapReveal from "./../../hooks/useGsapReveal";
import { useDispatch, useSelector } from "react-redux";
import { selectAboutStats } from "../../features/stats/statsSlice";
import { fetchAboutStats } from "../../features/stats/statsThunks";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function About() {
  const scope = useGsapReveal();
  const dispatch = useDispatch();
  const aboutStats = useSelector(selectAboutStats);

  useEffect(() => {
    dispatch(fetchAboutStats());
  }, [dispatch]);

  const team = [
    {
      name: "Nguyen Minh Thuận",
      role: "Full Stack Developer",
      avatar:
        "https://img.meta.com.vn/Data/image/2021/09/21/anh-cho-cute-de-thuong-dang-yeu-8.jpg",
      bio: "Passionate about building modern, scalable web applications.",
      social: {
        linkedin: "#",
        github: "#",
      },
    },
  ];
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };
  const chartData = aboutStats.courseGrowth.map((item) => ({
    name: `${item._id.month}/${item._id.year}`,
    courses: item.courses,
  }));
  return (
    <div ref={scope} className="bg-app min-h-screen">
      <div className="bg-app-overlay" />

      {/* HERO */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-28 grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-12 items-center">
        {/* LEFT */}
        <div className="reveal text-center md:text-left">
          <p className="opacity-60 mb-3 text-sm sm:text-base">[Home / About]</p>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight">
            Crafting Modern <br className="hidden sm:block" />
            Learning Experience
          </h1>

          <p className="mt-5 sm:mt-6 opacity-70 max-w-xl mx-auto md:mx-0 text-sm sm:text-base">
            Our LMS platform helps learners and instructors build structured,
            scalable, and engaging learning journeys with modern tools.
          </p>

          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center md:justify-start">
            <button className="bg-primary px-5 sm:px-6 py-3 rounded-lg font-medium hover:scale-105 transition w-full sm:w-auto">
              Explore Courses
            </button>

            <button className="bg-primary-soft px-5 sm:px-6 py-3 rounded-lg border border-border w-full sm:w-auto">
              Contact Us
            </button>
          </div>
        </div>

        {/* RIGHT - IMAGE STYLE */}
        <div className="relative reveal">
          {/* Main Image */}
          <img
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f"
            alt="learning"
            className="rounded-2xl object-cover w-full h-[260px] sm:h-80 md:h-[380px] lg:h-[420px]"
          />

          {/* Small floating image */}
          <img
            src="https://images.unsplash.com/photo-1519389950473-47ba0277781c"
            alt="team"
            className="absolute  -bottom-6 -left-4 sm:-bottom-8 sm:-left-6 md:-bottom-10 md:-left-10 w-24 h-24 sm:w-28 sm:h-28 md:w-36 md:h-36 lg:w-40 lg:h-40 object-cover rounded-xl border-4 border-background shadow-lg"
          />

          {/* Overlay card */}
          <div className="absolute top-4 right-4 sm:top-5 sm:right-5 md:top-6 md:right-6 bg-card border border-border rounded-xl p-3 sm:p-4 shadow-lg max-w-40 sm:max-w-[200px]">
            <p className="text-xs sm:text-sm font-medium">Smart Learning</p>

            <p className="text-[10px] sm:text-xs opacity-60 mt-1">
              Structured & interactive courses
            </p>
          </div>
        </div>
      </section>

      {/* HISTORY */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 lg:gap-12 items-center">
        {/* LEFT - STATS CARD */}
        <div className="reveal">
          <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 md:p-7 lg:p-8 shadow-sm h-full flex flex-col justify-between">
            {/* HEADER */}
            <div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold mb-3 sm:mb-4">
                Our History
              </h2>

              <p className="opacity-70 text-sm sm:text-base mb-5 sm:mb-6">
                Starting from a small idea, we keep growing every day.
              </p>
            </div>

            {/* TOTAL */}
            <div className="mb-5 sm:mb-6">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary leading-tight">
                {aboutStats.totalCourses}
              </h3>
              <p className="opacity-60 text-xs sm:text-sm mt-1">
                Total Courses
              </p>
            </div>

            {/* CHART */}
            <div className="w-full h-[180px] sm:h-[200px] md:h-[220px] lg:h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "10px",
                      border: "1px solid #eee",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="courses"
                    stroke="#6366f1"
                    strokeWidth={3}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* RIGHT - CONTENT */}
        <div className="reveal text-center md:text-left">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold mb-4 sm:mb-6">
            Our Journey
          </h2>

          <p className="opacity-70 leading-relaxed text-sm sm:text-base max-w-xl mx-auto md:mx-0">
            Starting from a small idea, our LMS has evolved into a powerful
            platform used by thousands of learners. We continuously innovate to
            deliver better learning experiences.
          </p>

          <ul className="mt-5 sm:mt-6 space-y-3">
            <li className="flex items-start gap-3 justify-center md:justify-start">
              <FiCheckCircle className="text-primary mt-1 shrink-0" />
              <span className="opacity-70 text-sm sm:text-base">
                Built with modern technology
              </span>
            </li>

            <li className="flex items-start gap-3 justify-center md:justify-start">
              <FiCheckCircle className="text-primary mt-1 shrink-0" />
              <span className="opacity-70 text-sm sm:text-base">
                Continuous product improvement
              </span>
            </li>

            <li className="flex items-start gap-3 justify-center md:justify-start">
              <FiCheckCircle className="text-primary mt-1 shrink-0" />
              <span className="opacity-70 text-sm sm:text-base">
                Focus on learner success
              </span>
            </li>
          </ul>
        </div>
      </section>
      {/* HOW WE WORK */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24 text-center">
        {/* Heading */}
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold mb-4 sm:mb-6 reveal">
          How We Work
        </h2>

        <p className="opacity-70 max-w-md sm:max-w-xl lg:max-w-2xl mx-auto text-sm sm:text-base reveal">
          We follow a structured and transparent process to ensure high-quality
          learning experiences for all users.
        </p>

        {/* VIDEO BLOCK */}
        <div
          className="mt-8 sm:mt-10 lg:mt-12 bg-card border border-border rounded-2xl h-[220px] sm:h-[260px] md:h-80 lg:h-[400px] flex items-center justify-center relative reveal overflow-hidden cursor-pointer group"
          onClick={togglePlay}
        >
          {/* Video element */}
          <video
            ref={videoRef}
            src="https://res.cloudinary.com/dgmoeesdw/video/upload/v1775647870/Agent_video_Pippit_20260408112046_sfihrz.mp4"
            className="w-full h-full object-cover rounded-2xl"
          />

          {/* Overlay */}
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition" />

          {/* Play/Pause icon */}
          {isPlaying ? (
            <FiPauseCircle className="absolute text-white w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 opacity-90 hover:scale-110 transition-transform" />
          ) : (
            <FiPlayCircle className="absolute text-white w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 opacity-90 hover:scale-110 transition-transform" />
          )}
        </div>
      </section>

      {/* FEATURES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-28">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-center mb-10 sm:mb-12 lg:mb-14 reveal">
          Why Choose Our LMS
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
          {[
            {
              icon: FiShield,
              title: "Secure Platform",
              desc: "Enterprise-grade authentication.",
            },
            {
              icon: Rocket,
              title: "Fast Performance",
              desc: "Optimized and scalable system.",
            },
            {
              icon: FiUsers,
              title: "Collaborative Learning",
              desc: "Interactive and community-driven.",
            },
          ].map((f, i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-2xl p-6 sm:p-8 reveal flex flex-col items-center text-center hover:-translate-y-1 transition"
            >
              <f.icon className="mb-4 w-10 h-10 sm:w-12 sm:h-12 text-primary" />
              <h3 className="font-medium text-lg sm:text-xl">{f.title}</h3>
              <p className="opacity-70 mt-2 sm:mt-3 text-sm sm:text-base">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* TEAM */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
        {/* Heading */}
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-center mb-10 sm:mb-12 lg:mb-16 reveal">
          Our Team
        </h2>

        {/* Team grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 lg:gap-10">
          {team.map((member, i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-2xl p-6 sm:p-8 text-center reveal flex flex-col items-center hover:shadow-lg transition-shadow"
            >
              {/* Avatar */}
              <img
                src={member.avatar}
                alt={member.name}
                className="w-32 h-32 sm:w-36 sm:h-36 lg:w-40 lg:h-40 rounded-full mb-4 object-cover"
              />

              {/* Name & Role */}
              <p className="font-medium text-lg sm:text-xl">{member.name}</p>
              <p className="text-sm sm:text-base opacity-70 mb-2">
                {member.role}
              </p>

              {/* Bio */}
              <p className="text-xs sm:text-sm opacity-60 mb-4 max-w-[220px] sm:max-w-[260px] lg:max-w-[300px]">
                {member.bio}
              </p>

              {/* Social links */}
              <div className="flex gap-4">
                <a
                  href={member.social.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary-dark transition"
                >
                  LinkedIn
                </a>
                <a
                  href={member.social.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary-dark transition"
                >
                  GitHub
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
