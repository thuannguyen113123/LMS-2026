export default function TestimonialCard({ data, active }) {
  return (
    <div
      className={`flex flex-col md:flex-row items-center gap-8 transition-transform duration-500 
      ${active ? "scale-105 shadow-2xl" : "scale-95 opacity-70"}`}
    >
      {/* LEFT image */}
      <div className="shrink-0">
        <img
          src={
            data?.author?.avatar ||
            "https://file.hstatic.net/1000388805/article/hn_3ebd03ad40724e149828906d4925ec5f.png"
          }
          alt={data?.author?.fullname}
          className="w-64 h-80 object-cover rounded-3xl shadow-xl border-4 border-purple-200"
        />
      </div>

      {/* RIGHT quote */}
      <div className="flex-1 bg-white/90 rounded-3xl p-8 shadow-lg border border-purple-100">
        <blockquote className="text-lg md:text-xl text-gray-800">
          <span className="text-3xl font-bold text-purple-600">“</span>
          {data.content}
          <span className="text-3xl font-bold text-purple-600">”</span>
        </blockquote>
        <div className="mt-4">
          <h3 className="text-xl font-semibold">{data?.author?.fullname}</h3>
          <p className="text-gray-500">{data?.author?.role || "Student"}</p>
        </div>
      </div>
    </div>
  );
}
