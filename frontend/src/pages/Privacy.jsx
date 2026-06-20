import { FaLock, FaArrowLeft } from "react-icons/fa";
import { useNavigate, Link } from "react-router-dom";

const Section = ({ n, title, children }) => (
  <section>
    <h2 className="text-base font-black text-pine-teal uppercase tracking-wider mb-3">
      {n}. {title}
    </h2>
    <div className="space-y-2 text-pine-teal/80 leading-relaxed">{children}</div>
  </section>
);

const Privacy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-pearl-beige font-sans pb-16">
      <main className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center justify-center w-10 h-10 bg-surface rounded-full border border-pine-teal/12 text-dusty-lavender hover:text-pine-teal shadow-sm transition-all active:scale-90"
        >
          <FaArrowLeft className="text-sm" />
        </button>

        <div className="bg-surface border border-pine-teal/10 rounded-3xl p-6 md:p-10 shadow-sm">

          {/* Header */}
          <div className="flex items-start gap-4 mb-8 pb-6 border-b border-pine-teal/8">
            <div className="h-12 w-12 shrink-0 bg-pine-teal/8 text-pine-teal rounded-2xl flex items-center justify-center">
              <FaLock className="text-xl" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-pine-teal tracking-tight">Privacy Policy</h1>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-dusty-lavender mt-1">
                Sahayam · Last Updated: June 2026
              </p>
              <p className="text-[12px] text-pine-teal/50 mt-2 leading-relaxed max-w-xl">
                Sahayam is built on trust. This policy explains exactly what data we collect, why we collect it, how we protect it, and what rights you have over it — in plain language.
              </p>
            </div>
          </div>

          <div className="space-y-8 text-sm md:text-[15px]">

            <Section n="1" title="Who We Are">
              <p>
                Sahayam is a community blood-donor coordination platform. For the purpose of this Privacy Policy, "Sahayam", "we", "us", and "our" refers to the platform and its operators. We are committed to protecting your personal data in compliance with the Information Technology Act, 2000, the IT (SPDI) Rules, 2011, and India's Digital Personal Data Protection (DPDP) Act, 2023.
              </p>
            </Section>

            <Section n="2" title="Data We Collect">
              <p>We collect only what is necessary to operate the platform:</p>
              <div className="mt-3 space-y-3">
                {[
                  {
                    label: "Account Data",
                    items: ["Full name", "Email address", "Phone number", "Password (hashed — never stored as plain text)"],
                  },
                  {
                    label: "Medical Data (Sensitive Personal Data)",
                    items: ["Blood group", "Last donation date (for eligibility cooldown)"],
                  },
                  {
                    label: "Identity Verification (optional)",
                    items: ["A government ID image (Aadhaar / passport / driving licence) — only if you choose to submit KYC, stored on Cloudinary for admin review"],
                  },
                  {
                    label: "Location Data",
                    items: ["Approximate city/area (text, from profile)", "GPS coordinates (when you post an SOS or update your location for the donor radar)"],
                  },
                  {
                    label: "Platform Usage Data",
                    items: ["Donation and request history", "Notification preferences (FCM token)", "Emergency contacts (if provided by you)"],
                  },
                ].map(({ label, items }) => (
                  <div key={label} className="rounded-2xl border border-pine-teal/10 bg-pearl-beige/50 px-4 py-3.5">
                    <p className="text-[11px] font-black uppercase tracking-widest text-pine-teal mb-2">{label}</p>
                    <ul className="list-disc pl-4 space-y-1 text-pine-teal/70 text-[13px]">
                      {items.map((i) => <li key={i}>{i}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </Section>

            <Section n="3" title="Why We Process Your Data">
              <p>We process your personal data on the following legal bases under the DPDP Act, 2023:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1.5">
                <li><span className="font-semibold">Consent</span> — You explicitly consent when you register and agree to these terms. Medical/blood group data requires and receives separate explicit consent.</li>
                <li><span className="font-semibold">Contractual necessity</span> — We process your data to deliver the services you signed up for.</li>
                <li><span className="font-semibold">Legitimate interest</span> — To improve platform safety, prevent fraud, and maintain service reliability.</li>
              </ul>
              <p className="mt-2">We use your data specifically to:</p>
              <ul className="list-disc pl-5 mt-1 space-y-1.5">
                <li>Match you with blood donors or recipients nearby.</li>
                <li>Send SOS push notifications to eligible nearby donors.</li>
                <li>Maintain your donation history and donor eligibility status.</li>
                <li>Communicate service updates or policy changes.</li>
              </ul>
            </Section>

            <Section n="4" title="Blood Group — Sensitive Personal Data">
              <p className="font-semibold text-dark-raspberry">
                Your blood group is classified as Sensitive Personal Data under Indian law.
              </p>
              <p className="mt-2">
                It is processed exclusively for blood donor matching. It is displayed on the platform only in the context of your public donor listing (if you are an active donor) or your emergency request. It is never sold, rented, or shared with advertisers or third-party data brokers under any circumstances.
              </p>
            </Section>

            <Section n="5" title="Location Data">
              <p>Location data is used only for two purposes:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1.5">
                <li>Showing you blood requests nearby (read-only, server-side distance query).</li>
                <li>Notifying nearby donors when you post an SOS (radius-based, no precise coordinates shared).</li>
              </ul>
              <p className="mt-2">
                Your exact GPS coordinates are never displayed to other users. Only an approximate location text (e.g., "Whitefield, Bangalore") appears publicly. Coordinates are stored only as long as necessary for matching and are not retained after your account is deleted.
              </p>
            </Section>

            <Section n="6" title="Data Sharing">
              <p>We do not sell your personal data. We share data only in these limited cases:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1.5">
                <li><span className="font-semibold">With other users</span> — Your name, blood group, and approximate location are visible to other registered users when you are in an active donation or request flow.</li>
                <li><span className="font-semibold">Service providers</span> — We use Cloudinary (image storage), Firebase (push notifications), MongoDB Atlas (database), Render (hosting), and Google Gemini (which processes the text of an SOS to structure the request). If SMS phone verification is enabled, an SMS provider receives your number and the one-time code. Each is bound by their respective data processing terms.</li>
                <li><span className="font-semibold">Legal obligation</span> — If required by a court order or valid legal process under Indian law.</li>
              </ul>
            </Section>

            <Section n="7" title="Data Retention">
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Active account data is retained for the duration of your account.</li>
                <li>Fulfilled donation records are retained for 2 years for safety auditing.</li>
                <li>Push notification tokens are refreshed on each login and deleted when you disable notifications or delete your account.</li>
                <li>Location coordinates are overwritten each time you update your location — we do not maintain a location history.</li>
              </ul>
            </Section>

            <Section n="8" title="Data Security">
              <p>We implement the following safeguards:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1.5">
                <li>Passwords are hashed with bcrypt before storage — never stored in plain text.</li>
                <li>All API communication is over TLS (HTTPS).</li>
                <li>JWT tokens expire after 30 days and are not stored server-side.</li>
                <li>Database access is restricted to authenticated server processes only.</li>
              </ul>
              <p className="mt-2">
                In the event of a data breach that affects your personal data, we will notify affected users within 72 hours of becoming aware of the breach, as required under the DPDP Act, 2023.
              </p>
            </Section>

            <Section n="9" title="Your Rights (DPDP Act, 2023)">
              <p>Under India's Digital Personal Data Protection Act, 2023, you have the right to:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1.5">
                <li><span className="font-semibold">Access</span> — Request a copy of personal data we hold about you.</li>
                <li><span className="font-semibold">Correction</span> — Update inaccurate or incomplete data.</li>
                <li><span className="font-semibold">Erasure</span> — Delete your account and all associated personal data yourself, instantly, from <span className="font-semibold">Profile → Delete My Account</span>. We also scrub references to you from other users' records.</li>
                <li><span className="font-semibold">Grievance redressal</span> — Lodge a complaint with our Grievance Officer (see below) or with the Data Protection Board of India.</li>
                <li><span className="font-semibold">Withdraw consent</span> — Withdraw your consent for data processing at any time (which will result in account termination).</li>
              </ul>
              <p className="mt-2">To exercise any right, email: <a href="mailto:privacy@sahayam.in" className="text-pine-teal font-semibold underline underline-offset-2">privacy@sahayam.in</a></p>
            </Section>

            <Section n="10" title="Cookies & Tracking">
              <p>
                Sahayam is a Progressive Web App (PWA) and does not use tracking cookies or third-party advertising scripts. We use browser localStorage only for session management and user preferences (e.g., your blood group filter preference). We do not use Google Analytics, Meta Pixel, or any behavioural tracking technology.
              </p>
            </Section>

            <Section n="11" title="Children's Privacy">
              <p>
                The Platform is not intended for use by children under 13. Users between 13–17 may only use the platform in a request capacity (not as blood donors), consistent with NBTC donation eligibility rules. We do not knowingly collect personal data from children under 13. If you believe a child's data has been collected, contact us immediately.
              </p>
            </Section>

            <Section n="12" title="Grievance Officer">
              <p>As required under the IT (Intermediary Guidelines) Rules, 2021 and the DPDP Act, 2023:</p>
              <div className="mt-3 rounded-2xl border border-pine-teal/10 bg-pearl-beige/60 px-5 py-4 space-y-1">
                <p className="font-semibold text-pine-teal">Grievance Officer — Sahayam</p>
                <p className="text-pine-teal/70">Email: <a href="mailto:grievance@sahayam.in" className="text-pine-teal underline underline-offset-2">grievance@sahayam.in</a></p>
                <p className="text-pine-teal/60 text-[12px] mt-1">Grievances are acknowledged within 24 hours and resolved within 15 days.</p>
              </div>
            </Section>

            <Section n="13" title="Changes to This Policy">
              <p>
                We may update this Privacy Policy to reflect changes in law or platform features. We will notify you via in-app notification for material changes. The "Last Updated" date at the top of this page reflects the most recent revision.
              </p>
            </Section>

          </div>

          <div className="mt-10 pt-6 border-t border-pine-teal/8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <p className="text-[11px] text-pine-teal/35 font-medium">
              © 2026 Sahayam. Built to save lives, not to exploit data.
            </p>
            <Link to="/terms" className="text-[12px] font-bold text-pine-teal/55 hover:text-pine-teal transition-colors underline underline-offset-2">
              Terms of Service →
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Privacy;
