export default function ContactMap() {
  return (
    <section className="mt-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="rounded-2xl overflow-hidden border border-border bg-card">
          <iframe
            title="map"
            src="https://maps.google.com/maps?q=Bình%20Minh%20Vĩnh%20Long&t=&z=13&ie=UTF8&iwloc=&output=embed"
            className="w-full h-[420px] border-0"
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
}
