import ContactForm from "../../../components/contact/ContactForm";
import ContactInfo from "../../../components/contact/ContactInfo";
import ContactMap from "../../../components/contact/ContactMap";

export default function ContactPage() {
  return (
    <div className="bg-app min-h-screen">
      <div className="bg-app-overlay" />

      <section className="max-w-7xl mx-auto px-6 py-16">
        {/* HEADER */}
        <div className="mb-14 max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-semibold text-primary">
            Let’s get in touch
          </h1>

          <p className="mt-4 text-sm opacity-70">
            Don’t hesitate to contact us. We usually reply within 24 hours.
          </p>
        </div>

        {/* GRID */}
        <div className="grid lg:grid-cols-2 gap-10">
          <ContactInfo />
          <ContactForm />
        </div>
      </section>

      <ContactMap />
    </div>
  );
}
