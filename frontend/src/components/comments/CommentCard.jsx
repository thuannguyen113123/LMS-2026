const CommentCard = ({ item }) => {
  return (
    <div className="group relative rounded-[28px] bg-card p-8 border border-border overflow-hidden transition-all duration-500 hover:-translate-y-3 hover:shadow-[0_20px_60px_rgba(0,0,0,0.12)]">
      {/* moving glow */}
      <div
        className="
          absolute -inset-1 opacity-0 blur-2xl group-hover:opacity-100 transition duration-700
      
        "
        style={{
          background:
            "radial-gradient(circle at 20% 20%, var(--color-primary-soft), transparent 60%)",
        }}
      />

      {/* glass highlight */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500"
        style={{
          background:
            "linear-gradient(120deg, transparent, rgba(255,255,255,0.05), transparent)",
        }}
      />

      {/* header */}
      <div className="relative flex items-center gap-4 mb-6">
        <div className="relative">
          <img
            src={item.author.avatar}
            className="h-12 w-12 rounded-full object-cover border border-border transition duration-300 group-hover:scale-110"
          />

          {/* avatar ring */}
          <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition ring-4 ring-primary-soft" />
        </div>

        <div className="leading-tight">
          <p className="font-medium tracking-tight">{item.author.fullname}</p>

          <p className="text-sm text-primary/50">
            {item.author.role} · {item.author.company}
          </p>
        </div>
      </div>

      {/* quote */}
      <div className="relative">
        <svg
          className="absolute -top-3 -left-2 opacity-10"
          width="40"
          height="40"
          viewBox="0 0 24 24"
        >
          <path
            fill="currentColor"
            d="M7 17h3l2-4V7H6v6h3zm8 0h3l2-4V7h-6v6h3z"
          />
        </svg>

        <p className="relative text-[15px] leading-7 text-primary/80">
          {item.content}
        </p>
      </div>

      {/* footer */}
      <div className="mt-8 flex items-center justify-between">
        <div className="text-xs text-primary/40">Trusted Partner</div>
      </div>

      {/* subtle border animation */}
      <div
        className="pointer-events-none absolute inset-0 rounded-[28px] opacity-0 group-hover:opacity-100 transition duration-500"
        style={{
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      />
    </div>
  );
};

export default CommentCard;
