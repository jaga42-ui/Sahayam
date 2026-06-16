import { FaShieldAlt, FaArrowLeft } from "react-icons/fa";
import { useNavigate, Link } from "react-router-dom";

const Section = ({ n, title, children }) => (
  <section>
    <h2 className="text-base font-black text-pine-teal uppercase tracking-wider mb-3">
      {n}. {title}
    </h2>
    <div className="space-y-2 text-pine-teal/80 leading-relaxed">{children}</div>
  </section>
);

const Terms = () => {
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
              <FaShieldAlt className="text-xl" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-pine-teal tracking-tight">Terms of Service</h1>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-dusty-lavender mt-1">
                Sahayam · Last Updated: June 2026
              </p>
              <p className="text-[12px] text-pine-teal/50 mt-2 leading-relaxed max-w-xl">
                Please read these terms carefully before using the Sahayam platform. By creating an account or using any feature, you agree to be bound by these terms.
              </p>
            </div>
          </div>

          <div className="space-y-8 text-sm md:text-[15px]">

            <Section n="1" title="About Sahayam">
              <p>
                Sahayam ("the Platform", "we", "us") is a peer-to-peer community coordination tool built to connect voluntary blood donors with people in urgent need of blood. The Platform is operated as a technology intermediary and does not directly provide any medical services, blood banking, or emergency response services.
              </p>
              <p className="mt-2">
                Sahayam operates under the Information Technology Act, 2000 (India) and its associated rules, including the IT (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021.
              </p>
            </Section>

            <Section n="2" title="Eligibility">
              <p>You must be at least 18 years of age to register as a blood donor on Sahayam, in accordance with the Drugs and Cosmetics Act, 1940 (India) and National Blood Transfusion Council (NBTC) guidelines.</p>
              <ul className="list-disc pl-5 mt-2 space-y-1.5">
                <li>Persons under 18 may use the platform only to request help, with parental consent.</li>
                <li>By registering, you confirm that any information you provide is accurate and complete.</li>
                <li>We reserve the right to refuse service or terminate accounts that provide false information.</li>
              </ul>
            </Section>

            <Section n="3" title="Medical Disclaimer — Blood Donation">
              <p className="font-semibold text-dark-raspberry">
                IMPORTANT: Sahayam is not a licensed blood bank, hospital, or medical service provider. We do not screen, test, type, or certify blood.
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1.5">
                <li>All blood collected through Sahayam-facilitated connections must be processed by a licensed blood bank or hospital before transfusion.</li>
                <li>Sahayam does not facilitate the direct transfer of blood between individuals outside of a licensed medical facility.</li>
                <li>Donors are responsible for disclosing any medical conditions that may affect blood safety (infections, medications, recent tattoos, travel history, etc.).</li>
                <li>The platform does not replace emergency services. Call 112 or your nearest hospital for life-threatening emergencies.</li>
                <li>Donors should not donate more frequently than the NBTC-recommended interval of 3 months (whole blood).</li>
              </ul>
            </Section>

            <Section n="4" title="Platform Role — Technology Intermediary">
              <p>
                Sahayam acts solely as a neutral technology intermediary that facilitates communication between users. We do not create, endorse, or verify the content posted by users. All listings, SOS alerts, and donor profiles are user-generated content.
              </p>
              <p className="mt-2">
                As an intermediary under the IT Act, Sahayam is not liable for third-party content hosted on the platform, provided it acts in accordance with applicable law and its take-down procedures.
              </p>
            </Section>

            <Section n="5" title="User Conduct & Prohibited Activities">
              <p>You agree not to use the Platform to:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1.5">
                <li>Post false, misleading, or fabricated blood emergencies.</li>
                <li>Offer or receive any monetary compensation for blood donation (prohibited under the Drugs & Cosmetics Act).</li>
                <li>Harass, threaten, or intimidate other users.</li>
                <li>Collect or harvest personal data of other users without consent.</li>
                <li>Impersonate doctors, hospitals, blood banks, or government officials.</li>
                <li>Post content that is obscene, defamatory, or violates any law in India.</li>
                <li>Abuse the SOS broadcast system for non-genuine emergencies.</li>
              </ul>
              <p className="mt-2 font-medium">
                Violations may result in immediate account suspension and reporting to relevant authorities.
              </p>
            </Section>

            <Section n="6" title="SOS Alerts & Emergency Features">
              <p>
                The SOS broadcast feature is designed exclusively for genuine blood emergencies. Misuse of this feature — including posting fake emergencies, testing the system repeatedly, or using it for non-medical purposes — is a serious violation of these Terms and may constitute an offence under the Indian Penal Code.
              </p>
              <p className="mt-2">
                Emergency alert notifications are sent to nearby registered users via push notifications and email. By registering and remaining available, you consent to receiving such alerts.
              </p>
            </Section>

            <Section n="7" title="Blood Group Data — Sensitive Personal Data">
              <p>
                Your blood group is classified as Sensitive Personal Data under the IT (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011. By providing your blood group, you explicitly consent to its use for the purpose of matching you with nearby emergency requests.
              </p>
              <p className="mt-2">
                This data is never sold to third parties and is only shared with other users when you respond to or post a request. See our <Link to="/privacy" className="text-pine-teal font-semibold underline underline-offset-2">Privacy Policy</Link> for full details.
              </p>
            </Section>

            <Section n="8" title="Location Data">
              <p>
                Location data is used to identify nearby donors and recipients. Your precise coordinates are generalized to an approximate area on the public feed. Exact coordinates are only used by the server-side matching algorithm and are not displayed to other users.
              </p>
            </Section>

            <Section n="9" title="Intellectual Property">
              <p>
                The Sahayam name, logo, design, and code are the intellectual property of the platform operators. User-generated content (posts, messages) remains the property of the respective users. By posting on Sahayam, you grant us a non-exclusive, royalty-free licence to display that content on the platform for the purpose of operating the service.
              </p>
            </Section>

            <Section n="10" title="Disclaimers & Limitation of Liability">
              <p>
                The Platform is provided "as is" and "as available". We make no warranties, express or implied, regarding the accuracy, reliability, or completeness of any content. To the maximum extent permitted by law:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1.5">
                <li>Sahayam is not responsible for the outcome of any blood donation or medical event facilitated through the Platform.</li>
                <li>We are not liable for any indirect, incidental, or consequential damages arising from the use of, or inability to use, the Platform.</li>
                <li>Our total liability in any dispute shall not exceed ₹1,000.</li>
              </ul>
            </Section>

            <Section n="11" title="Governing Law & Jurisdiction">
              <p>
                These Terms are governed by and construed in accordance with the laws of India. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the courts in Chennai, Tamil Nadu, India.
              </p>
            </Section>

            <Section n="12" title="Grievance Mechanism">
              <p>
                In compliance with the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021, we have designated a Grievance Officer:
              </p>
              <div className="mt-3 rounded-2xl border border-pine-teal/10 bg-pearl-beige/60 px-5 py-4 space-y-1">
                <p className="font-semibold text-pine-teal">Grievance Officer</p>
                <p className="text-pine-teal/70">Sahayam Platform</p>
                <p className="text-pine-teal/70">Email: <a href="mailto:grievance@sahayam.in" className="text-pine-teal underline underline-offset-2">grievance@sahayam.in</a></p>
                <p className="text-pine-teal/60 text-[12px] mt-1">We will acknowledge your grievance within 24 hours and resolve it within 15 days, as required by law.</p>
              </div>
            </Section>

            <Section n="13" title="Changes to These Terms">
              <p>
                We may update these Terms periodically. Material changes will be communicated via in-app notification. Continued use of the Platform after changes constitutes your acceptance of the revised Terms.
              </p>
            </Section>

            <Section n="14" title="Contact">
              <p>
                For general queries: <a href="mailto:support@sahayam.in" className="text-pine-teal font-semibold underline underline-offset-2">support@sahayam.in</a>
              </p>
            </Section>

          </div>

          <div className="mt-10 pt-6 border-t border-pine-teal/8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <p className="text-[11px] text-pine-teal/35 font-medium">
              © 2026 Sahayam. A platform built to save lives.
            </p>
            <Link to="/privacy" className="text-[12px] font-bold text-pine-teal/55 hover:text-pine-teal transition-colors underline underline-offset-2">
              Privacy Policy →
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Terms;
