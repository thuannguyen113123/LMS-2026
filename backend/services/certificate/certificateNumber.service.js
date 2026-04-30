import Counter from "../../models/system/counter.model.js";

export async function generateCertificateNumber() {
  const year = new Date().getFullYear();

  // counter theo năm → tránh hot document
  const counter = await Counter.findOneAndUpdate(
    { name: `certificate_${year}` },
    { $inc: { value: 1 } },
    {
      new: true,
      upsert: true,
    }
  );

  return `CERT-${year}-${String(counter.value).padStart(6, "0")}`;
}
