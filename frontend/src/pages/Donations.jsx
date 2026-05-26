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
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import api from "../utils/api";

const springIn = { type: "spring", stiffness: 300, damping: 26 };

const Donations = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [isSubmitting,      setIsSubmitting]      = useState(false);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [imagePreview,      setImagePreview]      = useState(null);

  const [formData, setFormData] = useState({
    listingType: user?.activeRole === "donor" ? "donation" : "request",
    category: "food", title: "", description: "", quantity: "",
    addressText: user?.addressText || "", lat: null, lng: null, pickupTime: "",
    condition: "New", foodType: "Veg", expiryDate: "", bookAuthor: "", image: null,
  });

  const isRequest       = formData.listingType === "request";
  const themeAccent     = isRequest ? "text-dark-raspberry" : "text-pine-teal";
  const themeBg         = isRequest ? "bg-dark-raspberry" : "bg-pine-teal";
  const themeFocusBorder = isRequest ? "focus:border-dark-raspberry" : "focus:border-pine-teal";

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
          const { data } = await axios.get(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${apiKey}`
          );
          if (data?.features?.length > 0) {
            const cityString = data.features[0].place_name.split(",")[0];
            setFormData((prev) => ({ ...prev, addressText: cityString, lat: latitude, lng: longitude }));
            toast.success(`Location locked: ${cityString} 🚀`, { id: toastId });
          } else { throw new Error("Location unresolvable"); }
        } catch { toast.error("Could not resolve location via Mapbox.", { id: toastId }); } finally { setIsFetchingLocation(false); }
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
      } catch { setFormData({ ...formData, image: file }); }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.addressText)
      return toast.error("Please fill in all required fields.");
    if (!formData.lat || !formData.lng)
      return toast.error("Please select a valid location from the dropdown or use GPS.");
    setIsSubmitting(true);
    try {
      const submitData = new FormData();
      Object.keys(formData).forEach((key) => { if (formData[key]) submitData.append(key, formData[key]); });
      await api.post("/donations", submitData);
      toast.success(formData.listingType === "donation" ? "Offer posted!" : "Request shared!");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to post item.");
    } finally { setIsSubmitting(false); }
  };

  const categories = [
    { id: "food",    label: "Food",    icon: <FaHamburger />, activeClass: "bg-pine-teal border-pine-teal text-white shadow-lg shadow-pine-teal/30" },
    { id: "clothes", label: "Clothes", icon: <FaTshirt />,    activeClass: "bg-dark-raspberry border-dark-raspberry text-white shadow-lg shadow-dark-raspberry/30" },
    { id: "book",    label: "Book",    icon: <FaBook />,      activeClass: "bg-pine-teal border-pine-teal text-white shadow-lg shadow-pine-teal/30" },
    { id: "general", label: "General", icon: <FaCube />,      activeClass: "bg-dusty-lavender border-dusty-lavender text-white shadow-lg shadow-dusty-lavender/30" },
  ];

  if (!user) return null;

  return (
    <Layout>
      <div className="min-h-screen bg-pearl-beige font-sans pb-32 md:pb-16">

        {/* ── AURORA HEADER ── */}
        <div className="aurora-header relative px-4 pt-8 pb-20 overflow-hidden">
          <div className="dark-dot-grid absolute inset-0 opacity-20" />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 text-center"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 mb-4">
              {isRequest ? <FaBoxOpen className="text-white/60 text-xs" /> : <FaHandHoldingHeart className="text-white/60 text-xs" />}
              <span className="text-[10px] font-black uppercase tracking-widest text-white/70">
                {isRequest ? "Request Help" : "Give Support"}
              </span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight leading-tight">
              Share<br />
              <span className="gradient-text-aurora">{isRequest ? "a Request" : "Support"}</span>
            </h1>
          </motion.div>

          {/* Listing type toggle in header */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, ...springIn }}
            className="relative z-10 mt-5 flex bg-white/10 p-1 rounded-2xl border border-white/15 max-w-xs mx-auto"
          >
            <button
              type="button"
              onClick={() => setFormData({ ...formData, listingType: "donation" })}
              className={`flex-1 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                formData.listingType === "donation"
                  ? "bg-white text-pine-teal shadow-md"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Offering Support
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, listingType: "request" })}
              className={`flex-1 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                formData.listingType === "request"
                  ? "bg-white text-dark-raspberry shadow-md"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Requesting Help
            </button>
          </motion.div>
        </div>

        {/* ── FORM ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, ...springIn }}
          className="-mt-10 px-4"
        >
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Category chips */}
            <div className="bg-surface rounded-3xl border border-pine-teal/8 p-4 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-dusty-lavender mb-3">Select Category</p>
              <div className="grid grid-cols-4 gap-2">
                {categories.map((cat) => (
                  <motion.div
                    key={cat.id}
                    whileTap={{ scale: 0.9 }}
                    transition={springIn}
                    onClick={() => setFormData({ ...formData, category: cat.id })}
                    className={`cursor-pointer flex flex-col items-center justify-center py-3 rounded-2xl border transition-all ${
                      formData.category === cat.id
                        ? cat.activeClass
                        : "bg-surface-2 border-pine-teal/10 text-dusty-lavender hover:text-pine-teal"
                    }`}
                  >
                    <span className="text-xl mb-1">{cat.icon}</span>
                    <span className="font-bold text-[9px] tracking-wider uppercase">{cat.label}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Main fields */}
            <div className="bg-surface rounded-3xl border border-pine-teal/8 p-4 shadow-sm space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-dusty-lavender mb-1.5 block">Item Title *</label>
                <input
                  required type="text" placeholder="e.g. 10 Fresh Apples..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className={`w-full bg-surface-2 border border-dusty-lavender/20 rounded-2xl px-4 py-3.5 text-pine-teal text-sm font-bold placeholder-dusty-lavender/50 outline-none transition-all ${themeFocusBorder}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-dusty-lavender mb-1.5 block">Quantity</label>
                  <input
                    type="text" placeholder="e.g. 5 kgs"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className={`w-full bg-surface-2 border border-dusty-lavender/20 rounded-2xl px-4 py-3.5 text-pine-teal text-sm font-bold placeholder-dusty-lavender/50 outline-none transition-all ${themeFocusBorder}`}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-dusty-lavender mb-1.5 block">Pickup Time</label>
                  <input
                    type="time" value={formData.pickupTime}
                    onChange={(e) => setFormData({ ...formData, pickupTime: e.target.value })}
                    className={`w-full bg-surface-2 border border-dusty-lavender/20 rounded-2xl px-4 py-3.5 text-pine-teal text-sm font-bold outline-none cursor-pointer ${themeFocusBorder}`}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-dusty-lavender mb-1.5 block">Description *</label>
                <textarea
                  required rows="3" placeholder="Describe the item, specifics..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className={`w-full bg-surface-2 border border-dusty-lavender/20 rounded-2xl px-4 py-3.5 text-pine-teal text-sm placeholder-dusty-lavender/50 outline-none transition-all resize-none ${themeFocusBorder}`}
                />
              </div>
            </div>

            {/* Category-specific fields */}
            <AnimatePresence>
              {(formData.category === "food" || formData.category === "book" ||
                (!isRequest && (formData.category === "clothes" || formData.category === "book" || formData.category === "general"))) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                  className="bg-surface rounded-3xl border border-pine-teal/8 p-4 shadow-sm space-y-4 overflow-hidden"
                >
                  {formData.category === "food" && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-dusty-lavender mb-1.5 flex items-center gap-1.5"><FaLeaf className={themeAccent} /> Food Type</label>
                        <select
                          value={formData.foodType}
                          onChange={(e) => setFormData({ ...formData, foodType: e.target.value })}
                          className={`w-full bg-surface-2 border border-dusty-lavender/20 rounded-2xl px-4 py-3.5 text-pine-teal text-sm font-bold outline-none cursor-pointer appearance-none ${themeFocusBorder}`}
                        >
                          <option value="Veg">Vegetarian</option>
                          <option value="Non-Veg">Non-Vegetarian</option>
                        </select>
                      </div>
                      {!isRequest && (
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-dusty-lavender mb-1.5 flex items-center gap-1.5"><FaCalendarAlt className={themeAccent} /> Expiry</label>
                          <input
                            type="date" value={formData.expiryDate}
                            onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                            className={`w-full bg-surface-2 border border-dusty-lavender/20 rounded-2xl px-4 py-3.5 text-pine-teal text-sm font-bold outline-none ${themeFocusBorder}`}
                          />
                        </div>
                      )}
                    </div>
                  )}
                  {formData.category === "book" && (
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-dusty-lavender mb-1.5 flex items-center gap-1.5"><FaBook className={themeAccent} /> Author</label>
                      <input
                        type="text" placeholder="Author name"
                        value={formData.bookAuthor}
                        onChange={(e) => setFormData({ ...formData, bookAuthor: e.target.value })}
                        className={`w-full bg-surface-2 border border-dusty-lavender/20 rounded-2xl px-4 py-3.5 text-pine-teal text-sm font-bold outline-none placeholder-dusty-lavender/50 ${themeFocusBorder}`}
                      />
                    </div>
                  )}
                  {!isRequest && (formData.category === "clothes" || formData.category === "book" || formData.category === "general") && (
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-dusty-lavender mb-1.5 flex items-center gap-1.5"><FaTags className={themeAccent} /> Condition</label>
                      <select
                        value={formData.condition}
                        onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                        className={`w-full bg-surface-2 border border-dusty-lavender/20 rounded-2xl px-4 py-3.5 text-pine-teal text-sm font-bold outline-none cursor-pointer appearance-none ${themeFocusBorder}`}
                      >
                        <option value="New">Brand New</option>
                        <option value="Good">Gently Used</option>
                        <option value="Fair">Fair</option>
                      </select>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Location + Image */}
            <div className="bg-surface rounded-3xl border border-pine-teal/8 p-4 shadow-sm space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-dusty-lavender mb-1.5 block">Location *</label>
                <div className="flex gap-2">
                  <input
                    required readOnly type="text" placeholder="Use GPS for accurate location..."
                    value={formData.addressText}
                    className="flex-1 bg-surface-2 border border-dusty-lavender/20 rounded-2xl px-4 py-3.5 text-pine-teal text-sm font-bold placeholder-dusty-lavender/50 outline-none cursor-not-allowed opacity-80"
                  />
                  <motion.button
                    type="button" whileTap={{ scale: 0.9 }} transition={springIn}
                    onClick={handleGetLocation} disabled={isFetchingLocation}
                    className="px-4 bg-surface-2 text-pine-teal border border-dusty-lavender/20 rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center shrink-0 hover:bg-pearl-beige"
                  >
                    {isFetchingLocation ? <FaSpinner className="animate-spin text-lg" /> : <FaLocationArrow className="text-lg" />}
                  </motion.button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-dusty-lavender mb-1.5 block">Upload Image</label>
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
                <div
                  onClick={() => fileInputRef.current.click()}
                  className="w-full h-[80px] bg-surface-2 border-2 border-dashed border-dusty-lavender/30 rounded-2xl flex items-center justify-center gap-3 cursor-pointer hover:bg-pearl-beige/50 transition-all text-dusty-lavender overflow-hidden relative group"
                >
                  {imagePreview ? (
                    <>
                      <img src={imagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-30 transition-opacity" />
                      <span className="relative z-10 font-bold text-[10px] uppercase tracking-widest text-pine-teal drop-shadow-md flex items-center gap-2"><FaUpload /> Change Image</span>
                    </>
                  ) : (
                    <><FaUpload className="text-lg" /> <span className="font-bold text-[10px] uppercase tracking-widest">Select Image</span></>
                  )}
                </div>
              </div>

              <motion.button
                type="submit" whileTap={{ scale: 0.97 }} transition={springIn}
                disabled={isSubmitting}
                className={`w-full py-4 rounded-2xl font-black text-white uppercase tracking-widest text-[11px] transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 ${themeBg} ${isRequest ? "shadow-dark-raspberry/30" : "shadow-pine-teal/30"}`}
              >
                {isSubmitting
                  ? <FaSpinner className="animate-spin text-xl" />
                  : <>{formData.listingType === "donation" ? <FaHandHoldingHeart className="text-lg" /> : <FaBoxOpen className="text-lg" />} {formData.listingType === "donation" ? "Post Offer" : "Post Request"}</>
                }
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </Layout>
  );
};

export default Donations;
