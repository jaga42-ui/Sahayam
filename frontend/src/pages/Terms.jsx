import { FaShieldAlt, FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const Terms = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#e8dab2] font-sans selection:bg-[#9f1164] selection:text-white pb-10">
      <main className="max-w-4xl mx-auto px-4 py-8 md:py-12 pb-32 font-sans">
        <button onClick={() => navigate(-1)} className="mb-6 text-dusty-lavender hover:text-pine-teal bg-white p-3 rounded-full border border-dusty-lavender/30 shadow-sm flex items-center justify-center w-max active:scale-90 transition-all">
          <FaArrowLeft className="text-sm" />
        </button>

        <div className="bg-white/80 backdrop-blur-md border border-white rounded-[2.5rem] p-6 md:p-10 shadow-[0_20px_40px_rgba(41,82,74,0.05)]">
          <div className="flex items-center gap-4 mb-8 border-b border-dusty-lavender/20 pb-6">
            <div className="w-12 h-12 bg-pine-teal/10 text-pine-teal rounded-2xl flex items-center justify-center text-2xl">
              <FaShieldAlt />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-pine-teal uppercase tracking-tight">Terms of Service</h1>
              <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-dusty-lavender">Last Updated: April 2026</p>
            </div>
          </div>

          <div className="space-y-8 text-pine-teal/90 text-sm md:text-base leading-relaxed">
            <section>
              <h2 className="text-lg font-black text-pine-teal uppercase tracking-wider mb-3">1. Community Guidelines</h2>
              <p>Sahayam is a decentralized grid for humanitarian aid and community sharing. Users must treat all members with respect. Any misuse of the SOS Emergency system, harassment in secure channels, or posting of prohibited items will result in an immediate and permanent ban.</p>
            </section>

            <section>
              <h2 className="text-lg font-black text-pine-teal uppercase tracking-wider mb-3">2. No Liability on Items</h2>
              <p className="font-medium">Sahayam acts strictly as a communication platform to connect donors and receivers. We do not verify, inspect, or guarantee the quality, safety, or legality of any items listed, including food, clothing, and medical supplies.</p>
              <ul className="list-disc pl-5 mt-3 space-y-2 text-sm text-dusty-lavender font-bold">
                <li>Receivers consume or use donated items entirely at their own risk.</li>
                <li>Donors are expected to act in good faith and honestly report expiry dates and conditions.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-black text-pine-teal uppercase tracking-wider mb-3">3. Data & Location Privacy</h2>
              <p>To enable the "Blood Radar" and nearby feeds, Sahayam securely processes your GPS coordinates. This data is dynamically updated and never sold to third parties. Emergency SOS blasts will expose your approximate radius to active donors to facilitate rapid assistance.</p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Terms;