import CertificateCard from "./CertificateCard";

const mockCertificate = {
  certificateNumber: "LMS-2024-000812",
  status: "issued",
  issuedAt: "2024-05-29T10:00:00Z",
  certificateUrl: "",
  course: {
    title: "Advanced Cyber Security Awareness",
    category: "Security Training",
  },
  student: {
    fullname: "Nguyễn Minh Thuận",
  },
  instructor: {
    fullname: "LMS Academy",
  },
};

export default function CertificatePreview() {
  return (
    <div className="bg-app min-h-screen flex items-center justify-center p-10">
      <CertificateCard data={mockCertificate} />
    </div>
  );
}
