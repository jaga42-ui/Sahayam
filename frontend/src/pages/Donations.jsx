import { useState, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import imageCompression from "browser-image-compression";
import AuthContext from "../context/AuthContext";
import Layout from "../components/Layout";
import {
  FaBoxOpen, FaUpload, FaSpinner, FaLeaf, FaBook, FaTags, FaClock,
  FaCalendarAlt, FaLocationArrow, FaHamburger, FaTshirt, FaCube, FaHandHoldingHeart,
} from "react-icons/fa";
import toast from "react-hot-toast";

import api from "../utils/api";

const Donations = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  const [formData, setFormData] = useState({
    listingType: user?.activeRole === "donor" ? "donation" : "request",
    category: "food", title: "", description: "", quantity: "",
    addressText: user?.addressText || "", lat: null, lng: null, pickupTime: "",
    condition: "New", foodType: "Veg", expiryDate: "", bookAuthor: "", image: null,
  });

  const [suggestions, setSuggestions] = useState([]);
  const typingTimeoutRef = useRef(null);

  const isRequest = formData.listingType === "request";
  const themeAccent = isRequest ? "text-dark-raspberry" : "text-pine-teal";
  const themeBg = isRequest ? "bg-dark-raspberry hover:bg-[#850e53]" : "bg-pine-teal hover:bg-[#1a3630]";
  const themeFocusBorder = isRequest ? "focus:border-dark-raspberry" : "focus:border-pine-teal";
  const themeContainerBorder = "border-white";

  // Removed handleLocationType and handleSelectSuggestion as manual typing is disabled

  const handleGetLocation = () => {
    if (!navigator.geolocation) return toast.error("GPS not supported");
    setIsFetchingLocation(true);
    const toastId = toast.loading("Locking onto GPS via Mapbox...");
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const apiKey = import.meta.env.VITE_MAPBOX_TOKEN;
          if (!apiKey) throw new Error("Mapbox Token Missing");

          const { data } = await axios.get(`https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${apiKey}`);
          
          if (data && data.features && data.features.length > 0) {
            const cityString = data.features[0].place_name.split(",")[0];
            setFormData((prev) => ({ ...prev, addressText: cityString, lat: latitude, lng: longitude }));
            toast.success(`Location locked: ${cityString} 🚀`, { id: toastId });
          } else { throw new Error("Location unresolvable"); }
        } catch (error) { toast.error("Could not resolve location via Mapbox.", { id: toastId }); } finally { setIsFetchingLocation(false); }
      },
      () => { setIsFetchingLocation(false); toast.error("Please allow location permissions.", { id: toastId }); },
      { enableHighAccuracy: true },
    );
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setImagePreview(URL.createObjectURL(file));
      try {
        const options = { maxSizeMB: 0.3, maxWidthOrHeight: 1024, useWebWorker: true };
        const compressedFile = await imageCompression(file, options);
        setFormData({ ...formData, image: compressedFile });
      } catch (error) { setFormData({ ...formData, image: file }); }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.addressText) return toast.error("Please fill in all required fields.");
    if (!formData.lat || !formData.lng) return toast.error("Please select a valid location from the dropdown or use GPS.");

    setIsSubmitting(true);
    try {
      const submitData = new FormData();
      Object.keys(formData).forEach((key) => { if (formData[key]) submitData.append(key, formData[key]); });
      await api.post("/donations", submitData);
      toast.success(formData.listingType === "donation" ? "Offer posted!" : "Request shared!");
      navigate("/dashboard");
    } catch (error) { toast.error(error.response?.data?.message || "Failed to post item."); } finally { setIsSubmitting(false); }
  };

  const categories = [
    { id: "food", label: "Food", icon: <FaHamburger />, inactive: "text-dusty-lavender hover:text-pine-teal hover:bg-white hover:border-pine-teal/30", active: "bg-pine-teal border-pine-teal text-white shadow-lg shadow-pine-teal/30" },
    { id: "clothes", label: "Clothes", icon: <FaTshirt />, inactive: "text-dusty-lavender hover:text-dark-raspberry hover:bg-white hover:border-dark-raspberry/30", active: "bg-dark-raspberry border-dark-raspberry text-white shadow-lg shadow-dark-raspberry/30" },
    { id: "book", label: "Book", icon: <FaBook />, inactive: "text-dusty-lavender hover:text-pine-teal hover:bg-white hover:border-pine-teal/30", active: "bg-pine-teal border-pine-teal text-white shadow-lg shadow-pine-teal/30" },
    { id: "general", label: "General", icon: <FaCube />, inactive: "text-dusty-lavender hover:text-dusty-lavender hover:bg-white hover:border-dusty-lavender/50", active: "bg-dusty-lavender border-dusty-lavender text-white shadow-lg shadow-dusty-lavender/30" },
  ];

  if (!user) return null;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 pb-32 md:pb-24 relative text-pine-teal min-h-screen font-sans">
        <header className="mb-6 md:mb-8 text-center pt-6">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-white/80 border border-white rounded-2xl flex items-center justify-center text-3xl md:text-4xl text-pine-teal mx-auto mb-4 shadow-[0_10px_30px_rgba(41,82,74,0.05)] backdrop-blur-md">
            {formData.listingType === "donation" ? <FaHandHoldingHeart className="text-pine-teal" /> : <FaBoxOpen className="text-dark-raspberry" />}
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-pine-teal tracking-tight">
            Share <span className={themeAccent}>Support</span>
          </h1>
          <p className="text-dusty-lavender text-[10px] md:text-sm font-bold mt-2 tracking-widest uppercase md:normal-case">Share details to make an impact in your community.</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
          <div className="bg-white/50 backdrop-blur-md p-1.5 md:p-2 rounded-2xl border border-dusty-lavender/30 flex shadow-sm">
            <button type="button" onClick={() => setFormData({ ...formData, listingType: "donation" })} className={`flex-1 py-3 md:py-3.5 rounded-xl font-black text-[10px] md:text-xs uppercase tracking-widest transition-all ${formData.listingType === "donation" ? "bg-pine-teal text-white shadow-md" : "text-dusty-lavender hover:bg-white hover:text-pine-teal"}`}>Offering Support</button>
            <button type="button" onClick={() => setFormData({ ...formData, listingType: "request" })} className={`flex-1 py-3 md:py-3.5 rounded-xl font-black text-[10px] md:text-xs uppercase tracking-widest transition-all ${formData.listingType === "request" ? "bg-dark-raspberry text-white shadow-md" : "text-dusty-lavender hover:bg-white hover:text-dark-raspberry"}`}>Requesting Help</button>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-dusty-lavender ml-2 mb-2 block">1. Select Category</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {categories.map((cat) => (
                <div key={cat.id} onClick={() => setFormData({ ...formData, category: cat.id })} className={`cursor-pointer flex flex-col items-center justify-center p-4 md:p-6 rounded-2xl md:rounded-3xl border transition-all duration-300 active:scale-95 ${formData.category === cat.id ? cat.active : `bg-white/60 border-white/50 ${cat.inactive}`}`}>
                  <div className="text-2xl md:text-3xl mb-2">{cat.icon}</div>
                  <span className="font-bold text-[10px] md:text-xs tracking-wider uppercase">{cat.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={`bg-white/70 backdrop-blur-lg border rounded-3xl md:rounded-[2.5rem] p-5 md:p-8 shadow-[0_20px_40px_rgba(41,82,74,0.08)] space-y-6 md:space-y-8 transition-colors duration-500 ${themeContainerBorder}`}>
            <div className="space-y-5 md:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-dusty-lavender ml-2 md:ml-4 mb-1.5 block">Item Title *</label>
                  <input required type="text" placeholder="e.g. 10 Fresh Apples..." value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className={`w-full bg-pearl-beige/30 border border-dusty-lavender/40 rounded-2xl px-4 md:px-6 py-3.5 md:py-4 text-pine-teal text-base md:text-sm font-bold placeholder-dusty-lavender/70 outline-none transition-all shadow-inner focus:bg-white ${themeFocusBorder}`} />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-dusty-lavender ml-2 md:ml-4 mb-1.5 block">Quantity</label>
                  <input type="text" placeholder="e.g. 5 kgs" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} className={`w-full bg-pearl-beige/30 border border-dusty-lavender/40 rounded-2xl px-4 md:px-6 py-3.5 md:py-4 text-pine-teal text-base md:text-sm font-bold placeholder-dusty-lavender/70 outline-none transition-all shadow-inner focus:bg-white ${themeFocusBorder}`} />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-dusty-lavender ml-2 md:ml-4 mb-1.5 block">Description *</label>
                <textarea required rows="3" placeholder="Describe the item, specifics..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className={`w-full bg-pearl-beige/30 border border-dusty-lavender/40 rounded-2xl px-4 md:px-6 py-3.5 md:py-4 text-pine-teal text-base md:text-sm placeholder-dusty-lavender/70 outline-none transition-all resize-none shadow-inner focus:bg-white ${themeFocusBorder}`}></textarea>
              </div>
            </div>

            <div className="bg-white/60 p-5 md:p-6 rounded-3xl border border-white shadow-sm grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
              {formData.category === "food" && (
                <>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-dusty-lavender ml-2 md:ml-4 mb-1.5 flex items-center gap-2"><FaLeaf className={themeAccent} /> Food Type</label>
                    <select value={formData.foodType} onChange={(e) => setFormData({ ...formData, foodType: e.target.value })} className={`w-full bg-pearl-beige/30 border border-dusty-lavender/40 rounded-2xl px-4 md:px-6 py-3.5 md:py-4 text-pine-teal text-base md:text-sm font-bold outline-none cursor-pointer appearance-none focus:bg-white ${themeFocusBorder}`}>
                      <option value="Veg">Vegetarian</option><option value="Non-Veg">Non-Vegetarian</option>
                    </select>
                  </div>
                  {/* 👉 THE FIX: Requesters don't set expiration dates for items they don't own */}
                  {!isRequest && (
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-dusty-lavender ml-2 md:ml-4 mb-1.5 flex items-center gap-2"><FaCalendarAlt className={themeAccent} /> Expiry</label>
                      <input type="date" value={formData.expiryDate} onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })} className={`w-full bg-pearl-beige/30 border border-dusty-lavender/40 rounded-2xl px-4 md:px-6 py-3.5 md:py-4 text-pine-teal text-base md:text-sm font-bold outline-none focus:bg-white ${themeFocusBorder}`} />
                    </div>
                  )}
                </>
              )}
              {formData.category === "book" && (
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-dusty-lavender ml-2 md:ml-4 mb-1.5 flex items-center gap-2"><FaBook className={themeAccent} /> Author</label>
                  <input type="text" placeholder="Author name" value={formData.bookAuthor} onChange={(e) => setFormData({ ...formData, bookAuthor: e.target.value })} className={`w-full bg-pearl-beige/30 border border-dusty-lavender/40 rounded-2xl px-4 md:px-6 py-3.5 md:py-4 text-pine-teal text-base md:text-sm font-bold outline-none placeholder-dusty-lavender/70 focus:bg-white ${themeFocusBorder}`} />
                </div>
              )}
              {/* 👉 THE FIX: Requesters don't set conditions for items they don't own */}
              {!isRequest && (formData.category === "clothes" || formData.category === "book" || formData.category === "general") && (
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-dusty-lavender ml-2 md:ml-4 mb-1.5 flex items-center gap-2"><FaTags className={themeAccent} /> Condition</label>
                  <select value={formData.condition} onChange={(e) => setFormData({ ...formData, condition: e.target.value })} className={`w-full bg-pearl-beige/30 border border-dusty-lavender/40 rounded-2xl px-4 md:px-6 py-3.5 md:py-4 text-pine-teal text-base md:text-sm font-bold outline-none cursor-pointer appearance-none focus:bg-white ${themeFocusBorder}`}>
                    <option value="New">Brand New</option><option value="Good">Gently Used</option><option value="Fair">Fair</option>
                  </select>
                </div>
              )}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-dusty-lavender ml-2 md:ml-4 mb-1.5 flex items-center gap-2"><FaClock className={themeAccent} /> Preferred Time</label>
                <input type="time" value={formData.pickupTime} onChange={(e) => setFormData({ ...formData, pickupTime: e.target.value })} className={`w-full bg-pearl-beige/30 border border-dusty-lavender/40 rounded-2xl px-4 md:px-6 py-3.5 md:py-4 text-pine-teal text-base md:text-sm font-bold outline-none cursor-pointer focus:bg-white ${themeFocusBorder}`} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 items-end">
              <div className="relative">
                <label className="text-[10px] font-black uppercase tracking-widest text-dusty-lavender ml-2 md:ml-4 mb-1.5 block">Location *</label>
                <div className="flex gap-2">
                  <input required readOnly type="text" placeholder="Use GPS for accurate location..." value={formData.addressText} className={`flex-1 w-full bg-pearl-beige/30 border border-dusty-lavender/40 rounded-2xl px-4 md:px-5 py-3.5 md:py-4 text-pine-teal text-base md:text-sm font-bold placeholder-dusty-lavender/70 outline-none transition-all shadow-inner cursor-not-allowed opacity-80`} />
                  <button type="button" onClick={handleGetLocation} disabled={isFetchingLocation} className="px-4 md:px-5 bg-white text-pine-teal border border-dusty-lavender/40 rounded-2xl active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center shrink-0 shadow-sm hover:shadow-md">
                    {isFetchingLocation ? <FaSpinner className="animate-spin text-lg" /> : <FaLocationArrow className="text-lg" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-dusty-lavender ml-2 md:ml-4 mb-1.5 block">Upload Image</label>
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
                <div onClick={() => fileInputRef.current.click()} className={`w-full h-[120px] md:h-[58px] bg-white border-2 border-dashed border-dusty-lavender/50 rounded-2xl flex flex-col md:flex-row items-center justify-center gap-2 md:gap-3 cursor-pointer hover:bg-pearl-beige/50 transition-all text-dusty-lavender overflow-hidden relative group shadow-sm ${themeFocusBorder.replace("focus:", "hover:")}`}>
                  {imagePreview ? (
                    <>
                      <img src={imagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
                      <span className="relative z-10 font-bold text-[10px] md:text-xs uppercase tracking-widest text-pine-teal drop-shadow-md flex flex-col md:flex-row items-center gap-1 md:gap-2"><FaUpload /> Change Image</span>
                    </>
                  ) : (
                    <><FaUpload className={`text-2xl md:text-lg transition-colors group-hover:${themeAccent}`} /> <span className="font-bold text-[10px] md:text-xs uppercase tracking-widest text-center mt-1 md:mt-0">Select Image</span></>
                  )}
                </div>
              </div>
            </div>

            <button type="submit" disabled={isSubmitting} className={`w-full mt-4 py-4 md:py-5 rounded-2xl font-black text-white uppercase tracking-[0.1em] md:tracking-[0.2em] text-xs md:text-sm transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 md:gap-3 ${themeBg} ${isRequest ? "shadow-dark-raspberry/30" : "shadow-pine-teal/30"}`}>
              {isSubmitting ? <FaSpinner className="animate-spin text-xl" /> : <>{formData.listingType === "donation" ? <FaHandHoldingHeart className="text-lg" /> : <FaBoxOpen className="text-lg" />}{formData.listingType === "donation" ? "Post Offer" : "Post Request"}</>}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default Donations;