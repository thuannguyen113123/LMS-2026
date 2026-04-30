import { useState } from "react";
import { useDispatch } from "react-redux";

import FormField from "../common/FormField";
import { createContact } from "../../features/contact/contactsThunks";

export default function ContactForm() {
  const dispatch = useDispatch();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const [submitting, setSubmitting] = useState(false);

  /*
    =============================
    HANDLERS
    =============================
  */

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (submitting) return;

    setSubmitting(true);

    const result = await dispatch(createContact(form));

    // ✅ reset form khi success
    if (createContact.fulfilled.match(result)) {
      setForm({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });
    }

    setSubmitting(false);
  };

  /*
    =============================
    UI
    =============================
  */

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-card border border-border rounded-2xl p-8 space-y-4"
    >
      <h2 className="text-xl font-semibold text-primary">Send us a message</h2>

      {/* GRID INPUT */}
      <div className="grid md:grid-cols-2 gap-4">
        <FormField
          label="Name"
          name="name"
          value={form.name}
          onChange={handleChange}
          required
          placeholder="Your name"
        />

        <FormField
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          required
          placeholder="you@email.com"
        />

        <FormField
          label="Phone"
          name="phone"
          type="phone"
          value={form.phone}
          onChange={handleChange}
          placeholder="912345678"
        />

        <FormField
          label="Subject"
          name="subject"
          value={form.subject}
          onChange={handleChange}
          placeholder="What is this about?"
        />
      </div>

      {/* MESSAGE */}
      <FormField
        label="Message"
        name="message"
        type="textarea"
        rows={5}
        value={form.message}
        onChange={handleChange}
        required
        placeholder="Write your message..."
      />

      {/* SUBMIT */}
      <button
        type="submit"
        disabled={submitting}
        className="
          w-full py-3 rounded-lg font-medium
          bg-primary text-white
          transition hover:opacity-90
          disabled:opacity-60 disabled:cursor-not-allowed
        "
      >
        {submitting ? "Sending..." : "Send Message"}
      </button>
    </form>
  );
}
