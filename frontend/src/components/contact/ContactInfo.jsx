import { Mail, Phone, MapPin } from "lucide-react";

export default function ContactInfo() {
  return (
    <div className="bg-card border border-border rounded-2xl p-8 space-y-8 animate-fade-in">
      <h2 className="text-xl font-semibold text-primary">
        Contact Information
      </h2>

      {/* Email */}
      <div className="flex gap-4">
        <Mail className="opacity-70" />
        <div>
          <p className="text-sm opacity-60">Email</p>
          <p className="font-medium">nguyenminhthuann5@gmail.com</p>
        </div>
      </div>

      {/* Phone */}
      <div className="flex gap-4">
        <Phone className="opacity-70" />
        <div>
          <p className="text-sm opacity-60">Phone</p>
          <p className="font-medium">0813147442</p>
        </div>
      </div>

      {/* Address */}
      <div className="flex gap-4">
        <MapPin className="opacity-70" />
        <div>
          <p className="text-sm opacity-60">Address</p>
          <p className="font-medium">Bình Minh, Vĩnh Long, Việt Nam</p>
        </div>
      </div>

      <div className="pt-4 border-t border-border text-sm opacity-60">
        We’re excited to hear your idea and collaborate together.
      </div>
    </div>
  );
}
