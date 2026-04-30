import LMSLogo from "../logo/LMSLogo";

const Signature = ({ name, role }) => (
  <div className="flex flex-col items-center space-y-2 min-w-[180px]">
    {/* fake handwritten signature */}
    <p className="font-signature text-2xl text-primary leading-none">{name}</p>

    {/* line */}
    <div className="w-48 h-px bg-border" />

    {/* role */}
    <p className="text-xs tracking-widest text-muted uppercase">{role}</p>
  </div>
);

const CertificateCard = ({ data, printable = false }) => {
  const issueDate = new Date(data?.issuedAt).toLocaleDateString("vi-VN");

  return (
    <div
      className={`
        w-full max-w-6xl mx-auto
        rounded-3xl overflow-hidden
        certificate-surface certificate-border
        ${printable ? "certificate-print-mode" : "animate-fade-in"}
      `}
    >
      <div className="grid lg:grid-cols-[1fr_240px]">
        {/* ================= LEFT ================= */}
        <div className="relative p-14 flex flex-col justify-between">
          {/* watermark */}
          <div className="absolute inset-0 opacity-[0.03] flex items-center justify-center pointer-events-none">
            <LMSLogo size={220} />
          </div>

          {/* CONTENT */}
          <div className="relative space-y-8">
            <p className="text-xs tracking-widest text-muted uppercase">
              Issued • {issueDate}
            </p>

            <h1 className="text-5xl font-bold text-primary tracking-tight">
              Certificate
            </h1>

            <div className="space-y-3 text-lg">
              <p className="text-muted">This certifies that</p>

              <h2 className="text-4xl font-semibold text-primary tracking-tight">
                {data?.student?.fullname}
              </h2>

              <p className="text-muted">has successfully completed</p>

              <p className="text-xl font-semibold text-primary">
                {data?.course?.title}
              </p>

              <p className="text-muted">
                Provided by{" "}
                <span className="font-medium text-primary">
                  {data?.instructor?.fullname}
                </span>
              </p>
            </div>

            <p className="text-sm text-muted max-w-xl leading-relaxed">
              Awarded in recognition of successfully completing the training
              program and demonstrating professional competency through LMS
              Academy.
            </p>
          </div>

          {/* SIGNATURE */}
          <div className="relative flex justify-between pt-16">
            <Signature name={data?.student?.fullname} role="Student" />
            <Signature name={data?.instructor?.fullname} role="Instructor" />
          </div>
        </div>

        {/* ================= RIGHT ================= */}
        <div className="certificate-accent border-l border-border flex flex-col items-center justify-between py-12 px-8">
          <LMSLogo size={44} />

          {/* VERIFIED BADGE */}
          <div className="relative group">
            <div className="w-32 h-32 rounded-full bg-card border border-border shadow-soft flex items-center justify-center transition-all duration-300 group-hover:scale-105">
              <span className="text-xs text-center text-primary tracking-wide">
                VERIFIED
                <br />
                CERTIFICATE
              </span>
            </div>
          </div>

          <div className="text-xs text-muted tracking-wider text-center">
            #{data?.certificateNumber}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateCard;
