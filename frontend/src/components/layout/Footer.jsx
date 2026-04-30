import React from "react";
import { FiSend } from "react-icons/fi";
import AuthModal from "../modal/AuthModal";
import useModal from "../../hooks/useModal";

const Footer = () => {
  const authModal = useModal("AUTH");
  return (
    <footer className="bg-app border-t border-border pt-16 sm:pt-20 md:pt-24 lg:pt-28 pb-8 sm:pb-12 md:pb-16">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
        {/* CTA Section */}
        <div className="text-center mb-12 sm:mb-16 md:mb-20">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold text-primary mb-3 sm:mb-4">
            Empower Your Learning Journey
          </h2>

          <p className="text-sm sm:text-base md:text-lg opacity-70 max-w-xl mx-auto mb-4 sm:mb-6">
            Join thousands of learners and unlock your potential with our LMS
            platform.
          </p>

          <button
            onClick={() => authModal.open({ initialStep: "register" })}
            className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-primary rounded-lg font-medium transition hover:opacity-80 text-sm sm:text-base"
          >
            Get Started for Free
            <FiSend size={16} />
          </button>
        </div>

        {/* Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10 mb-12 sm:mb-16 md:mb-20">
          {/* Courses */}
          <div>
            <h3 className="font-semibold text-primary mb-3 sm:mb-4 text-base sm:text-lg">
              Courses
            </h3>

            <ul className="space-y-2 text-sm sm:text-base opacity-70">
              <li>
                <a href="/courses/web" className="hover:opacity-100 transition">
                  Web Development
                </a>
              </li>
              <li>
                <a
                  href="/courses/mobile"
                  className="hover:opacity-100 transition"
                >
                  Mobile Development
                </a>
              </li>
              <li>
                <a
                  href="/courses/design"
                  className="hover:opacity-100 transition"
                >
                  UI/UX Design
                </a>
              </li>
              <li>
                <a
                  href="/courses/backend"
                  className="hover:opacity-100 transition"
                >
                  Backend & APIs
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold text-primary mb-3 sm:mb-4 text-base sm:text-lg">
              Resources
            </h3>

            <ul className="space-y-2 text-sm sm:text-base opacity-70">
              <li>
                <a href="/blog" className="hover:opacity-100 transition">
                  Blog
                </a>
              </li>
              <li>
                <a href="/docs" className="hover:opacity-100 transition">
                  Documentation
                </a>
              </li>
              <li>
                <a href="/faq" className="hover:opacity-100 transition">
                  FAQ
                </a>
              </li>
              <li>
                <a href="/community" className="hover:opacity-100 transition">
                  Community
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold text-primary mb-3 sm:mb-4 text-base sm:text-lg">
              Support
            </h3>

            <ul className="space-y-2 text-sm sm:text-base opacity-70">
              <li>
                <a href="/help" className="hover:opacity-100 transition">
                  Help Center
                </a>
              </li>
              <li>
                <a href="/contact" className="hover:opacity-100 transition">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="/pricing" className="hover:opacity-100 transition">
                  Pricing
                </a>
              </li>
              <li>
                <a href="/status" className="hover:opacity-100 transition">
                  System Status
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-semibold text-primary mb-3 sm:mb-4 text-base sm:text-lg">
              Newsletter
            </h3>

            <p className="text-sm sm:text-base opacity-70 mb-3 sm:mb-4">
              Subscribe for updates and free learning resources.
            </p>

            <form className="flex flex-col sm:flex-row bg-card border border-border rounded-lg overflow-hidden">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-3 py-2 text-sm sm:text-base bg-transparent focus:outline-none"
              />

              <button
                type="submit"
                className="px-4 sm:px-6 py-2 sm:py-2.5 bg-primary text-sm sm:text-base font-medium hover:opacity-80 transition mt-2 sm:mt-0"
              >
                Join
              </button>
            </form>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-border pt-6 sm:pt-8 flex flex-col sm:flex-row justify-between items-center text-xs sm:text-sm opacity-60 gap-4 sm:gap-0">
          <p>© 2026 LMS System. All rights reserved.</p>

          <div className="flex gap-4 sm:gap-6">
            <a href="/privacy" className="hover:opacity-100 transition">
              Privacy Policy
            </a>

            <a href="/terms" className="hover:opacity-100 transition">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
      {authModal.isOpen && (
        <AuthModal
          onClose={authModal.close}
          initialStep={authModal.data?.initialStep}
        />
      )}
    </footer>
  );
};

export default Footer;
