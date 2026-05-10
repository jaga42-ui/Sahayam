import Layout from "../components/Layout";
import { FaLock, FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const Privacy = () => {
  const navigate = useNavigate();

  return (
    <Layout>
      <main className="max-w-4xl mx-auto px-4 py-8 md:py-12 pb-32 font-sans">
        <button onClick={() => navigate(-1)} className="mb-6 text-dusty-lavender hover:text-pine-teal bg-white p-3 rounded-full border border-dusty-lavender/30 shadow-sm flex items-center justify-center w-max active:scale-90 transition-all">
          <FaArrowLeft className="text-sm" />
        </button>

        <div className="bg-white/80 backdrop-blur-md border border-white rounded-[2.5rem] p-6 md:p-10 shadow-[0_20px_40px_rgba(41,82,74,0.05)]">
          <div className="flex items-center gap-4 mb-8 border-b border-dusty-lavender/20 pb-6">
            <div className="w-12 h-12 bg-pine-teal/10 text-pine-teal rounded-2xl flex items-center justify-center text-2xl">
              <FaLock />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-pine-teal uppercase tracking-tight">Privacy Policy</h1>
              <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-dusty-lavender">Last Updated: May 2026</p>
            </div>
          </div>

          <div className="space-y-8 text-pine-teal/90 text-sm md:text-base leading-relaxed">
            <section>
              <h2 className="text-lg font-black text-pine-teal uppercase tracking-wider mb-3">1. Information We Collect</h2>
              <p>Sahayam collects the minimum amount of data necessary to provide our emergency and community support services. This includes your name, contact information, and approximate location when you use features like the Blood Radar or request help.</p>
            </section>

            <section>
              <h2 className="text-lg font-black text-pine-teal uppercase tracking-wider mb-3">2. How We Use Your Data</h2>
              <p className="font-medium">Your data is strictly used for platform functionality, including:</p>
              <ul className="list-disc pl-5 mt-3 space-y-2 text-sm text-dusty-lavender font-bold">
                <li>Connecting you with nearby volunteers during emergencies.</li>
                <li>Verifying identity to maintain a safe, trusted community.</li>
                <li>Sending critical notifications regarding your requests or offers.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-black text-pine-teal uppercase tracking-wider mb-3">3. Data Sharing & Security</h2>
              <p>We will never sell your personal data to third parties. We use industry-standard encryption to protect your sensitive information. Your specific location is only shared when you actively broadcast an SOS or accept a volunteer's help.</p>
            </section>

            <section>
              <h2 className="text-lg font-black text-pine-teal uppercase tracking-wider mb-3">4. Your Rights</h2>
              <p>You have the right to request the deletion of your account and all associated data at any time. For privacy concerns, please contact our support team.</p>
            </section>
          </div>
        </div>
      </main>
    </Layout>
  );
};

export default Privacy;
