// Developed by guruprasad and team
import { useState, useEffect, useContext } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import AuthContext from "../context/AuthContext";
import Layout from "../components/Layout";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  FaHeartbeat, FaSpinner, FaBullhorn, FaExclamationTriangle,
  FaRunning, FaTimes, FaMapMarkerAlt
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import axios from "axios";
import api from "../utils/api";
import EmergencyMatchModal from "../components/EmergencyMatchModal";
import AITriageModal from "../components/AITriageModal"; // 👉 Imported AI Triage
import { FaRobot } from "react-icons/fa";

// 👉 THE MASTERPIECE: Custom HTML Sonar Pulse for the User's Location
const mySonarIcon = L.divIcon({
  className: "custom-sonar-icon",
  html: `<div class="relative flex items-center justify-center w-16 h-16">
           <div class="absolute inset-0 bg-pine-teal rounded-full animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite] opacity-50"></div>
           <div class="absolute w-5 h-5 bg-pine-teal rounded-full border-2 border-white shadow-[0_0_20px_#29524a]"></div>
         </div>`,
  iconSize: [64, 64],
  iconAnchor: [32, 32],
});

// Clean custom marker for donors
const donorIcon = L.divIcon({
  className: "custom-donor-icon",
  html: `<div class="relative flex items-center justify-center w-10 h-10">
           <div class="absolute w-4 h-4 bg-dark-raspberry rounded-full border-[3px] border-white shadow-lg"></div>
         </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const RecenterAutomatically = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => { map.setView([lat, lng]); }, [lat, lng, map]);
  return null;
};

const BloodRadar = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const blastId = searchParams.get("blastId");

  const [myLocation, setMyLocation] = useState(null);
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [radius, setRadius] = useState(15000);
  const [bloodGroup, setBloodGroup] = useState("All");

  const [showBlastModal, setShowBlastModal] = useState(false);
  const [emotionalMessage, setEmotionalMessage] = useState("");
  const [isBlasting, setIsBlasting] = useState(false);
  const [activeSOS, setActiveSOS] = useState(null);
  const [myAddressText, setMyAddressText] = useState("Acquiring Target...");
  const [showTriageModal, setShowTriageModal] = useState(false); // 👉 AI Triage State

  const handleTriageData = (data) => {
    setEmotionalMessage(data.description + (data.title ? ` [${data.title}]` : ''));
    if (data.bloodGroup) setBloodGroup(data.bloodGroup);
    if (data.addressText) setMyAddressText(data.addressText);
  };

  useEffect(() => {
    if (!navigator.geolocation) return toast.error("GPS not supported.");
    setLoading(true);
    const toastId = toast.loading("Establishing satellite uplink...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        toast.dismiss(toastId);
        const { latitude, longitude } = position.coords;
        setMyLocation({ lat: latitude, lng: longitude });
        
        try {
          await api.put("/auth/location", { lat: latitude, lng: longitude });
          const apiKey = import.meta.env.VITE_MAPBOX_TOKEN;
          if(apiKey) {
            const { data } = await axios.get(`https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${apiKey}`);
            if (data && data.features && data.features.length > 0) {
              const cityFeature = data.features.find(f => f.id.startsWith("place.") || f.id.startsWith("locality.") || f.id.startsWith("neighborhood."));
              const cityString = cityFeature ? cityFeature.text : data.features[0].text;
              setMyAddressText(cityString);
            }
          }
        } catch (e) { console.error("Location update failed"); }
      },
      () => { toast.dismiss(toastId); setLoading(false); toast.error("GPS signal lost."); },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  }, [user]);

  useEffect(() => {
    if (!myLocation) return;
    const fetchDonors = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/auth/nearby-donors?lat=${myLocation.lat}&lng=${myLocation.lng}&distance=${radius}&bloodGroup=${bloodGroup}`);
        setDonors(data);
        setLoading(false);
      } catch (error) { setLoading(false); }
    };
    fetchDonors();
  }, [myLocation, radius, bloodGroup]);

  const handleEmergencyBlast = async () => {
    if (!emotionalMessage.trim()) return toast.error("Transmission cannot be empty.");
    setIsBlasting(true);
    try {
      const selectedBloodGroup = user.bloodGroup || "Blood";
      const { data } = await api.post("/auth/emergency-blast", {
        lat: myLocation.lat, lng: myLocation.lng, message: emotionalMessage, bloodGroup: selectedBloodGroup, radius: radius
      });

      const formData = new FormData();
      formData.append("listingType", "request"); formData.append("category", "blood"); formData.append("isEmergency", "true");
      formData.append("bloodGroup", selectedBloodGroup); formData.append("quantity", "Urgent Units");
      formData.append("title", `URGENT: ${selectedBloodGroup} Needed!`); formData.append("description", emotionalMessage);
      formData.append("addressText", `Radar Ping: ${myAddressText}`); formData.append("lat", myLocation.lat); formData.append("lng", myLocation.lng);
      await api.post("/donations", formData);

      toast.success(`SOS broadcasted to ${data.recipients} active nodes! 🚀`);
      setShowBlastModal(false); setEmotionalMessage("");
    } catch (error) { toast.error("Failed to send SOS."); } finally { setIsBlasting(false); }
  };

  const handleIAmComing = async () => {
    try {
      const { data } = await api.patch(`/donations/${blastId}/sos-accept`);
      toast.success("Emergency locked! Establish contact immediately.");
      setActiveSOS(data); navigate("/radar", { replace: true });
    } catch (error) { toast.error("Emergency already handled or error occurred."); }
  };

  if (!user) return null;

  return (
    <Layout>
      <div className="relative w-full h-[calc(100dvh-70px)] md:h-screen md:-mt-8 md:-ml-8 overflow-hidden bg-pearl-beige font-sans">
        
        {/* Glassmorphic Floating Top Bar */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 26, delay: 0.3 }}
          className="absolute top-4 left-4 right-4 z-[400] flex flex-wrap items-center justify-between gap-3 pointer-events-none"
        >
          <div className="glass-dark border border-white/12 px-5 py-3.5 rounded-2xl flex items-center gap-4 shadow-[0_20px_40px_rgba(8,20,16,0.4)] pointer-events-auto">
            <div className={`w-3 h-3 rounded-full ${loading ? "bg-blazing-flame animate-pulse" : "bg-pine-teal animate-pulse shadow-[0_0_12px_rgba(41,82,74,1)]"}`} />
            <div>
              <p className="text-white text-xs font-black uppercase tracking-widest leading-none">{donors.length} Members Nearby</p>
              <p className="text-white/50 text-[9px] font-bold uppercase tracking-widest mt-1 flex items-center gap-1"><FaMapMarkerAlt /> {myAddressText}</p>
            </div>
          </div>

          <div className="flex gap-2 pointer-events-auto">
            <select value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} className="glass-dark border border-white/12 rounded-2xl px-4 py-3 text-white text-[10px] uppercase tracking-widest font-black outline-none transition-all appearance-none cursor-pointer hover:bg-white/12 shadow-[0_10px_30px_rgba(8,20,16,0.4)]">
              <option value="All" className="bg-[#0f2620]">All Types</option>
              {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (<option key={bg} value={bg} className="bg-[#0f2620]">{bg}</option>))}
            </select>
            <select value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="glass-dark border border-white/12 rounded-2xl px-4 py-3 text-white text-[10px] uppercase tracking-widest font-black outline-none transition-all appearance-none cursor-pointer hover:bg-white/12 shadow-[0_10px_30px_rgba(8,20,16,0.4)]">
              <option value={5000} className="bg-[#0f2620]">5 KM Scan</option>
              <option value={15000} className="bg-[#0f2620]">15 KM Scan</option>
              <option value={50000} className="bg-[#0f2620]">50 KM Scan</option>
            </select>
          </div>
        </motion.div>

        <AnimatePresence>
          {blastId && (
            <motion.div initial={{ y: -100, x: "-50%", opacity: 0 }} animate={{ y: 90, x: "-50%", opacity: 1 }} exit={{ y: -100, x: "-50%", opacity: 0 }} className="absolute top-0 left-1/2 z-[401] bg-white/95 backdrop-blur-xl border border-blazing-flame/50 p-5 rounded-3xl shadow-[0_20px_50px_rgba(255,74,28,0.2)] flex flex-col sm:flex-row items-center gap-5 w-[90%] max-w-xl pointer-events-auto">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-dark-raspberry/10 text-dark-raspberry border border-dark-raspberry/30 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-[0_0_15px_rgba(159,17,100,0.2)]"><FaExclamationTriangle className="animate-pulse" /></div>
                <div className="flex-1 text-left">
                  <h3 className="text-pine-teal font-black tracking-tighter leading-tight text-base uppercase">Support Request Received</h3>
                  <p className="text-dusty-lavender text-[10px] uppercase tracking-[0.2em] font-bold mt-1">A neighbor needs help</p>
                </div>
              </div>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleIAmComing} className="w-full sm:w-auto bg-dark-raspberry hover:bg-[#850e53] text-white px-6 py-4 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-[0_10px_20px_rgba(159,17,100,0.4)] shrink-0 flex items-center justify-center gap-2"><FaRunning className="text-sm" /> Offer Support</motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="absolute inset-0 z-0 bg-pearl-beige">
          {!myLocation ? (
            <div className="h-full w-full flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 border-4 border-pine-teal/30 border-t-pine-teal rounded-full animate-spin"></div>
              <p className="font-black tracking-[0.3em] uppercase text-[10px] text-pine-teal animate-pulse">Scanning Grid...</p>
            </div>
          ) : (
            // 👉 THE MASTERPIECE: Light Mode Tactical Map
            <MapContainer center={[myLocation.lat, myLocation.lng]} zoom={13} zoomControl={false} style={{ height: "100%", width: "100%", background: "#e8dab2" }}>
              <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" attribution='&copy; <a href="https://carto.com/">CARTO</a>' />
              <RecenterAutomatically lat={myLocation.lat} lng={myLocation.lng} />
              
              <Circle center={[myLocation.lat, myLocation.lng]} radius={radius} pathOptions={{ color: "#29524a", fillColor: "#29524a", fillOpacity: 0.08, weight: 1, dashArray: "5, 10" }} />
              
              <Marker position={[myLocation.lat, myLocation.lng]} icon={mySonarIcon} />

              <MarkerClusterGroup chunkedLoading maxClusterRadius={60}>
                {donors.map((donor) => (
                  <Marker key={donor._id} position={[donor.location.coordinates[1], donor.location.coordinates[0]]} icon={donorIcon}>
                    <Popup className="custom-popup">
                      <div className="text-center w-48 text-pine-teal font-sans p-2">
                        <img src={donor.profilePic || `https://ui-avatars.com/api/?name=${donor.name}&background=1a3630&color=ffffff`} className="w-14 h-14 rounded-2xl mx-auto mb-3 object-cover shadow-sm" />
                        <h3 className="font-black truncate text-base leading-tight mb-1">{donor.name}</h3>
                        <p className="text-[9px] text-dusty-lavender uppercase tracking-widest font-bold mb-3">{donor.distance ? `${(donor.distance / 1000).toFixed(1)} km away` : 'Nearby'}</p>
                        
                        <div className="flex justify-center items-center gap-1.5 mb-4 bg-dark-raspberry/10 py-1.5 rounded-lg border border-dark-raspberry/20">
                          <FaHeartbeat className="text-dark-raspberry text-xs" />
                          <span className="text-dark-raspberry font-black text-[10px] tracking-widest">{donor.bloodGroup}</span>
                        </div>
                        
                        <button onClick={() => navigate(`/chat/direct_${donor._id}`, { state: { otherUserId: donor._id, otherUserName: donor.name } })} className="w-full py-3 bg-pine-teal text-white hover:bg-[#1a3630] rounded-xl text-[10px] font-black tracking-[0.2em] uppercase transition-all shadow-md shadow-pine-teal/20 active:scale-95">Message</button>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MarkerClusterGroup>
            </MapContainer>
          )}
        </div>

        {/* Floating Blast Button */}
        <div className="absolute bottom-24 md:bottom-10 left-0 right-0 z-[400] flex justify-center pointer-events-none">
          <motion.button
            whileTap={{ scale: 0.93 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            onClick={() => setShowBlastModal(true)}
            className="group relative flex items-center justify-center pointer-events-auto"
          >
            {/* Pulsing rings */}
            <span className="absolute inset-0 rounded-2xl bg-dark-raspberry animate-ping opacity-30" />
            <span className="absolute -inset-2 rounded-3xl bg-dark-raspberry/20 animate-ping opacity-20" style={{ animationDelay: "0.4s", animationDuration: "1.8s" }} />
            <div className="relative glass-dark border border-dark-raspberry/60 px-8 py-4 md:px-10 md:py-5 rounded-2xl flex items-center gap-3 shadow-[0_15px_40px_rgba(160,17,106,0.45)] transition-all overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-dark-raspberry/15 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 pointer-events-none" />
              <FaBullhorn className="text-xl text-dark-raspberry drop-shadow-[0_0_8px_rgba(160,17,106,0.9)]" />
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white">Ask for Help</span>
            </div>
          </motion.button>
        </div>

        <AnimatePresence>
          {showBlastModal && (
            <div className="fixed inset-0 z-[5000] flex items-end sm:items-center justify-center p-0 sm:p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-pine-teal/40 backdrop-blur-sm" onClick={() => setShowBlastModal(false)} />
              <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="relative w-full max-w-lg bg-white/95 backdrop-blur-2xl border-t sm:border border-white/60 rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 sm:p-8 shadow-[0_20px_60px_rgba(41,82,74,0.15)] text-pine-teal">
                <div className="w-12 h-1.5 bg-dusty-lavender/20 rounded-full mx-auto mb-6 sm:hidden" />
                <button type="button" onClick={() => setShowBlastModal(false)} className="hidden sm:block absolute top-6 right-6 text-dusty-lavender hover:text-pine-teal bg-dusty-lavender/10 p-2 rounded-full transition-colors"><FaTimes className="text-sm" /></button>

                <div className="flex justify-between items-center mb-1">
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-dark-raspberry drop-shadow-[0_0_15px_rgba(159,17,100,0.2)]">Request Support</h2>
                  <button onClick={() => setShowTriageModal(true)} className="flex items-center gap-2 bg-dark-raspberry/10 text-dark-raspberry hover:bg-dark-raspberry hover:text-white transition-colors px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest">
                    <FaRobot /> AI Auto-Fill
                  </button>
                </div>
                <p className="text-dusty-lavender text-[10px] sm:text-[11px] font-bold uppercase tracking-widest mb-8 border-b border-dusty-lavender/20 pb-4">Notify community members within {radius / 1000}km</p>

                <textarea value={emotionalMessage} onChange={(e) => setEmotionalMessage(e.target.value)} placeholder="Describe how we can help..." className="w-full h-32 sm:h-40 bg-white/50 border border-dusty-lavender/30 rounded-2xl p-5 text-pine-teal text-sm outline-none focus:border-dark-raspberry focus:bg-white transition-all resize-none mb-6 placeholder-dusty-lavender/70" />

                <div className="flex gap-3 sm:gap-4 pb-4 sm:pb-0">
                  <button onClick={() => setShowBlastModal(false)} className="flex-1 py-4 bg-transparent border border-dusty-lavender/30 hover:bg-dusty-lavender/10 rounded-2xl text-pine-teal font-black uppercase tracking-widest text-[10px] transition-colors">Cancel</button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleEmergencyBlast} disabled={isBlasting} className="flex-[2] bg-dark-raspberry hover:bg-[#850e53] text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] sm:text-[11px] flex items-center justify-center gap-2 shadow-[0_10px_20px_rgba(159,17,100,0.3)] disabled:opacity-50">
                    {isBlasting ? <FaSpinner className="animate-spin text-lg" /> : "Request Help"}
                  </motion.button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AITriageModal isOpen={showTriageModal} onClose={() => setShowTriageModal(false)} onTriageComplete={handleTriageData} />
        {activeSOS && <EmergencyMatchModal sosData={activeSOS} onClose={() => setActiveSOS(null)} />}
      </div>

      {/* Removed the inline helper CSS so the map matches global styling */}
    </Layout>
  );
};

export default BloodRadar;