export default function SmallAvatarItem({ avatar, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-16 h-16 rounded-full overflow-hidden border-2 transition-all duration-300
        ${
          active
            ? "border-purple-600 scale-110 shadow-lg"
            : "border-gray-300 hover:scale-105 hover:shadow-md"
        }`}
    >
      <img
        src={
          avatar ||
          "https://file.hstatic.net/1000388805/article/hn_3ebd03ad40724e149828906d4925ec5f.png"
        }
        alt="avatar"
        className={`w-full h-full object-cover transition-all duration-300 
          ${active ? "grayscale-0" : "grayscale"}
        `}
      />
    </button>
  );
}
