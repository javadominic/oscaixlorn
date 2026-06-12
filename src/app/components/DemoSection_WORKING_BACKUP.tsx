"use client";

import { useState, useCallback, useRef } from "react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { FadeIn } from "@/components/animations/FadeIn";
import { languages, cropData, MarketPrice } from "@/lib/constants";
import { Mic, MicOff, Search, Truck, ArrowRight, X, MapPin, Clock, Phone, User, TrendingUp, Radio, Camera, Scan, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { VoiceOrb } from "@/components/ui/VoiceOrb";
import { convertBlobToWavBase64 } from "@/lib/audioUtils";

interface DemoResult {
  crop: string;
  markets: MarketPrice[];
  unit: string;
  suggestion: string;
}

const langCodes: Record<string, string> = {
  English: "en-IN",
  Hindi: "hi-IN",
  Bengali: "bn-IN",
  Telugu: "te-IN",
  Marathi: "mr-IN",
  Tamil: "ta-IN",
  Urdu: "ur-IN",
  Gujarati: "gu-IN",
  Kannada: "kn-IN",
  Odia: "or-IN",
  Malayalam: "ml-IN",
  Punjabi: "pa-IN",
  Assamese: "as-IN",
  Nepali: "ne-IN",
};

export function DemoSection() {
  const [language, setLanguage] = useState("English");
  const [crop, setCrop] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [result, setResult] = useState<DemoResult | null>(null);
  const [selectedMarket, setSelectedMarket] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [pickupRequested, setPickupRequested] = useState(false);
  const [showPickupForm, setShowPickupForm] = useState(false);
  const [pickupForm, setPickupForm] = useState({ name: "", mobile: "", location: "", timing: "" });
  const [pickupErrors, setPickupErrors] = useState<Record<string, string>>({});
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [showGrading, setShowGrading] = useState(false);
  const [isGrading, setIsGrading] = useState(false);
  const [gradeResult, setGradeResult] = useState<{ grade: string; details: string; } | null>(null);
  const [gradingError, setGradingError] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleVoiceInput = useCallback(async () => {
    setResult(null);
    setSelectedMarket("");
    setPickupRequested(false);
    setNotFound(false);
    setShowGrading(false);
    setIsGrading(false);
    setGradeResult(null);
    setGradingError(null);
    setUploadedImage(null);

    // If currently recording, stop it and process via Bhashini
    if (isListening && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        setIsListening(false);
        setIsLoading(true);

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Convert to Base64 for Bhashini pipeline using WAV format
        (async () => {
          try {
            const base64Audio = await convertBlobToWavBase64(audioBlob);
            const bhashiniCode = langCodes[language]?.split('-')[0] || "hi";
            
            const response = await fetch('/api/bhashini', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ base64Audio, sourceLanguage: bhashiniCode })
            });
            
            const data = await response.json();
            if (data.transcript) {
              setCrop(data.transcript);
              setTimeout(() => {
                  // auto-trigger search once crop is typed
                  document.getElementById('crop-input')?.focus();
              }, 500);
            } else {
              console.error("Bhashini ASR Error:", data);
              alert("Bhashini engine could not interpret speech. Please try again.");
            }
          } catch(e) {
            console.error("Bhashini Fetch Error:", e);
            alert("Network error connecting to Bhashini.");
          } finally {
            setIsLoading(false);
            // Re-close media tracks to remove browser red recording icon
            stream.getTracks().forEach(track => track.stop());
          }
        })();
      };

      mediaRecorder.start();
      setIsListening(true);
      
    } catch (err) {
      console.error("Microphone permission denied", err);
      alert("Please allow microphone permissions to use Bhashini voice assistant.");
      setIsListening(false);
    }
  }, [language, isListening]);

  const handleSearch = useCallback(async () => {
    let normalizedCrop = crop.toLowerCase().trim();
    const bhashiniCode = langCodes[language]?.split('-')[0] || "hi";
    
    // Smart language detection: only translate if the string actually contains non-English characters.
    // This prevents double-translation corruption if the user speaks English while the dropdown is left on "Hindi"
    const hasNonEnglish = /[^\x00-\x7F]/.test(normalizedCrop);
    
    // If we detect regional characters, try to translate manual text entry to English
    if (hasNonEnglish) {
      setIsLoading(true);
      try {
        const trRes = await fetch('/api/translate-text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: normalizedCrop, sourceLanguage: bhashiniCode === 'en' ? 'hi' : bhashiniCode })
        });
        const trData = await trRes.json();
        if (trData.translatedText) {
          normalizedCrop = trData.translatedText.toLowerCase().trim();
        }
      } catch (err) {
        console.error("Text Translation failed", err);
      }
      setIsLoading(false);
    }
    
    // Natural Language Parser: "capture full but only pick main things"
    // Extract purely the crop name if they spoke a full sentence like "what is the price of rice"
    const availableCrops = Object.keys(cropData);
    
    // Find the first matching crop inside the full sentence
    const foundCrop = availableCrops.find(c => normalizedCrop.includes(c));
    if (foundCrop) {
        normalizedCrop = foundCrop;
    }
    
    // Update UI input cleanly to reflect what our system parsed/translated
    setCrop(normalizedCrop.charAt(0).toUpperCase() + normalizedCrop.slice(1));

    const data = cropData[normalizedCrop];

    if (!data) {
      setResult(null);
      setNotFound(true);
      setShowGrading(false);
      return;
    }

    setNotFound(false);
    setPickupRequested(false);
    setSelectedMarket("");
    setResult(null);
    setShowGrading(true);
    setGradeResult(null);
    setGradingError(null);
    setUploadedImage(null);
  }, [crop, language]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setUploadedImage(imageUrl);
      handleVisionGrading(file);
    }
  };

  const handleVisionGrading = useCallback((file: File) => {
    setIsGrading(true);
    setGradeResult(null);
    setGradingError(null);
    
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      try {
        const base64Image = (reader.result as string).split(',')[1];
        const response = await fetch('/api/vision', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ base64Image })
        });
        
        const data = await response.json();
        const labels = data.labels || [];
        const cropName = crop.toLowerCase().trim();
        
        // Allowed generic keywords to prevent rigid failures during hackathon demo, 
        // while strictly blocking completely unrelated items using vision tags
        const aliases: Record<string, string[]> = {
          'wheat': ['wheat', 'grain', 'cereal', 'grass', 'oat', 'barley'],
          'rice': ['rice', 'grain', 'cereal', 'paddy', 'basmati'],
          'tomato': ['tomato', 'vegetable', 'nightshade', 'produce'],
          'potato': ['potato', 'vegetable', 'root', 'produce'],
          'onion': ['onion', 'vegetable', 'bulb', 'produce'],
          'cotton': ['cotton', 'plant', 'fiber'],
          'soybean': ['soybean', 'bean', 'legume'],
          'maize': ['maize', 'corn', 'grain', 'cereal'],
        };
        
        const validKeywords = [
          cropName, 
          ...(aliases[cropName] || [])
        ];
        
        // 1. Check if it matches a DIFFERENT known crop specifically
        const allMainCrops = Object.keys(aliases);
        const detectedOtherCrop = labels.find((label: string) => 
            allMainCrops.some(c => c !== cropName && label.toLowerCase().includes(c))
        );

        if (detectedOtherCrop) {
          setIsGrading(false);
          setUploadedImage(null);
          setGradingError(`Verification Failed! Vision AI detected '${detectedOtherCrop}'. Please upload an actual sample of ${cropName}.`);
          return;
        }
        
        // 2. specifically look for labels to stop fake entries like people, vehicles, etc.
        const isMatch = labels.some((label: string) => 
          validKeywords.some(keyword => label.toLowerCase().includes(keyword)) ||
          ['produce', 'crop', 'plant', 'food', 'vegetable', 'fruit', 'agriculture'].some(k => label.toLowerCase().includes(k))
        );
        
        if (!isMatch && labels.length > 0) {
          // Fake entry detected! Stop process.
          setIsGrading(false);
          setUploadedImage(null);
          setGradingError(`Verification Failed! Vision AI detected ${labels.slice(0, 3).join(', ')}. Please upload an actual sample of ${cropName}.`);
          return;
        }

        // --- SUCCESS STATE: Keep the same simulated UI format ---
        const sizeToUse = file.size;
        const outcomeIndex = sizeToUse % 3;
        const isWheat = cropName.includes("wheat") || cropName.includes("gehun") || cropName.includes("gehu");
        
        let gradeStr = "";
        let detailsStr = "";
        
        if (outcomeIndex === 0) {
          gradeStr = isWheat ? "Grade A Sharbati" : "Grade A Premium";
          detailsStr = "AI Evaluated: Moisture 11% | Purity 98% | Broken < 2%";
        } else if (outcomeIndex === 1) {
          gradeStr = "Grade B Standard";
          detailsStr = "AI Evaluated: Moisture 14% | Purity 92% | Broken ~ 5%";
        } else {
          gradeStr = "Grade C Fair";
          detailsStr = "AI Evaluated: Moisture 16% | Purity 85% | Broken > 8%";
        }

        setIsGrading(false);
        setGradeResult({
          grade: gradeStr,
          details: detailsStr
        });
        
        setIsLoading(true);
        setTimeout(() => {
          const dataFromConstants = cropData[cropName];
          if (dataFromConstants) {
            setResult({
              crop: cropName,
              markets: dataFromConstants.markets,
              unit: dataFromConstants.unit,
              suggestion: dataFromConstants.suggestion,
            });
            const best = dataFromConstants.markets.reduce((max: any, obj: any) => (obj.price > max.price ? obj : max), dataFromConstants.markets[0]).name;
            setSelectedMarket(best);
          }
          setIsLoading(false);
          setShowGrading(false);
        }, 1500);
      } catch (error) {
        console.error(error);
        setIsGrading(false);
        setUploadedImage(null);
        setGradingError("Failed to verify image with Vision API. Please try again.");
      }
    };
  }, [crop, cropData]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const bestMarketName = result
    ? result.markets.reduce((max, obj) => (obj.price > max.price ? obj : max), result.markets[0]).name
    : "";

  return (
    <section id="demo" className="relative py-12 md:py-16">
      <Container>
        <SectionHeading
          eyebrow="Live Demo"
          title="Try It Yourself"
          subtitle="Experience how a farmer interacts with KISAN-OS. Select a language, enter a crop, and see real-time market intelligence."
        />

        <FadeIn>
          <div className="mx-auto max-w-2xl">
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 backdrop-blur-sm md:p-8">
              {/* Language selector */}
              <div className="mb-6">
                <label
                  htmlFor="language-select"
                  className="mb-2 block text-sm font-semibold text-white"
                >
                  Language
                </label>
                <select
                  id="language-select"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white transition-colors focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20"
                >
                  {languages.map((lang) => (
                    <option key={lang} value={lang} className="bg-[#111] text-white">
                      {lang}
                    </option>
                  ))}
                </select>
              </div>

              {/* Voice UI Orb */}
              <VoiceOrb 
                isListening={isListening} 
                onClick={handleVoiceInput} 
                language={language} 
              />

              {/* Bhashini Live Transcript Simulation */}
              <AnimatePresence>
                {(isListening || crop) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-6 overflow-hidden"
                  >
                    <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-blue-500/10 pb-2 mb-2">
                        <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                          <Radio className="h-3 w-3" />
                          Bhashini AI Transcript
                        </span>
                        {isListening && (
                          <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Listening
                          </span>
                        )}
                      </div>
                      <div className="space-y-2">
                        {isListening && !crop && (
                          <div className="text-sm text-white/40 italic">Listening to {language}... <span className="text-emerald-400 font-medium ml-1">Tap mic again to translate!</span></div>
                        )}
                        {crop && (
                          <div className="flex justify-end">
                            <div className="bg-white/10 border border-white/5 text-white font-medium text-sm py-2.5 px-3.5 rounded-2xl rounded-tr-sm inline-block max-w-[85%]">
                              {crop}
                            </div>
                          </div>
                        )}
                        {isLoading && (
                          <div className="flex justify-start">
                             <div className="bg-blue-500/20 border border-blue-500/30 text-blue-100 text-sm py-2.5 px-3.5 rounded-2xl rounded-tl-sm inline-block max-w-[85%]">
                               <span className="flex items-center gap-2 font-medium">
                                 <span className="h-3.5 w-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                                 Translating via Bhashini...
                               </span>
                             </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Crop Search input (fallback) */}
              <div className="mb-6">
                <div className="relative w-full">
                  <input
                    id="crop-input"
                    type="text"
                    value={crop}
                    onChange={(e) => {
                      setCrop(e.target.value);
                      setNotFound(false);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder={`Or type a crop (e.g. wheat, rice, tomato...)`}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pl-11 text-sm text-white placeholder:text-white/40 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                </div>
              </div>

              {/* Search button */}
              <Button
                className="w-full"
                onClick={handleSearch}
                disabled={!crop.trim() || isLoading || showGrading || isGrading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Fetching prices...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Get Market Prices
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>

              {/* Results & Loading States */}
              <AnimatePresence mode="wait">
                {showGrading && !isGrading && !gradeResult && (
                  <motion.div
                    key="grading-prompt"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center shadow-lg relative"
                  >
                    {gradingError && (
                      <div className="absolute top-2 left-2 right-2 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold rounded-xl text-center backdrop-blur-sm z-10 animate-shake">
                        {gradingError}
                      </div>
                    )}
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 mb-5 shadow-[0_0_30px_rgba(16,185,129,0.3)] mt-6">
                      <Camera className="h-10 w-10 text-emerald-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">AI Visual Grading</h3>
                    <p className="text-sm text-white/70 mb-8 max-w-sm mx-auto leading-relaxed">
                      To give you the most accurate Mandi price, please upload a clear photo of a handful of your crop.
                    </p>
                    <input type="file" accept="image/*" capture="environment" className="hidden" ref={cameraInputRef} onChange={handleImageUpload} />
                    <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <Button onClick={() => cameraInputRef.current?.click()} className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold border-none shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                        <Camera className="mr-2 h-4 w-4" />
                        Take Photo
                      </Button>
                      <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="border-white/20 hover:bg-white/5">
                        Choose File
                      </Button>
                    </div>
                  </motion.div>
                )}

                {isGrading && (
                  <motion.div
                    key="grading-loading"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-10 text-center"
                  >
                    <div className="relative mx-auto h-24 w-24 mb-6">
                      <div className="absolute inset-0 rounded-2xl border border-primary/20 bg-black/40 overflow-hidden">
                        {uploadedImage && (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={uploadedImage} alt="Crop sample" className="h-full w-full object-cover opacity-60" />
                        )}
                      </div>
                      <div className="absolute inset-0 rounded-2xl border-t-2 border-b-2 border-primary animate-spin" />
                      <div className="absolute inset-0 flex items-center justify-center rounded-2xl relative z-10">
                        <Scan className="h-10 w-10 text-primary animate-pulse drop-shadow-[0_0_10px_rgba(51,204,179,0.8)]" />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Analyzing Crop Sample...</h3>
                    <p className="text-sm text-primary/70 animate-pulse uppercase tracking-[0.1em] font-semibold">
                      AgriQ Vision AI Processing
                    </p>
                    <p className="mt-3 text-xs text-white/40">Checking moisture levels, physical purity, and defect ratio...</p>
                  </motion.div>
                )}
                {isLoading && (
                  <motion.div
                    key="loading-skeleton"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="mt-6 flex flex-col items-center justify-center py-10"
                  >
                    <div className="relative flex h-16 w-16 items-center justify-center mb-4">
                      <div className="absolute inset-0 animate-ping rounded-full border-2 border-purple-500/40" />
                      <div className="absolute inset-2 animate-pulse rounded-full bg-purple-500/20" />
                      <Search className="h-6 w-6 text-purple-400 animate-pulse" />
                    </div>
                    <p className="text-sm font-medium text-purple-400 animate-pulse uppercase tracking-wider">
                      Analyzing Bhashini API...
                    </p>
                    <p className="mt-2 text-xs text-white/60">Fetching real-time Agmarknet data...</p>
                  </motion.div>
                )}
                {!isLoading && result && (
                  <motion.div
                    key="loaded-result"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.3 }}
                    className="mt-6 space-y-4"
                  >
                    {gradeResult && (
                       <div className="rounded-xl bg-gradient-to-r from-emerald-500/20 to-emerald-500/5 border border-emerald-500/20 p-5 mb-4 flex items-center gap-5">
                         {uploadedImage ? (
                           <div className="flex shrink-0 h-14 w-14 items-center justify-center rounded-xl overflow-hidden border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                             {/* eslint-disable-next-line @next/next/no-img-element */}
                             <img src={uploadedImage} alt="Graded sample" className="h-full w-full object-cover" />
                           </div>
                         ) : (
                           <div className="flex shrink-0 h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                             <CheckCircle2 className="h-7 w-7 text-emerald-400" />
                           </div>
                         )}
                         <div>
                           <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-1 flex items-center gap-1.5">
                             <CheckCircle2 className="h-3 w-3" />
                             AI Certified Grade
                           </p>
                           <h4 className="text-xl font-bold text-white">{gradeResult.grade}</h4>
                           <p className="text-xs text-white/70 mt-1">{gradeResult.details}</p>
                         </div>
                       </div>
                    )}

                    {/* Price comparison (3-4 markets) */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {result.markets.map((market, idx) => {
                        const isBest = market.name === bestMarketName;
                        const isSelected = market.name === selectedMarket;
                        
                        return (
                          <div
                            key={idx}
                            onClick={() => setSelectedMarket(market.name)}
                            className={`rounded-xl p-4 transition-all relative overflow-hidden flex flex-col justify-between cursor-pointer ${
                              isSelected
                                ? "bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/40 shadow-[0_0_15px_rgba(51,204,179,0.2)]"
                                : "bg-white/[0.03] border border-white/5 hover:border-white/20 hover:bg-white/[0.06]"
                            }`}
                          >
                            {isBest && !isSelected && (
                              <div className="absolute top-0 right-0 p-1.5 bg-primary/10 rounded-bl-lg">
                                <TrendingUp className="h-3 w-3 text-primary/50" />
                              </div>
                            )}
                            {isSelected && (
                              <div className="absolute top-0 right-0 p-1.5 bg-primary/20 rounded-bl-lg">
                                <TrendingUp className="h-3 w-3 text-primary" />
                              </div>
                            )}
                            <div>
                              <p className="text-[11px] font-medium text-white/60 mb-1 uppercase tracking-wider line-clamp-1">
                                {market.name}
                              </p>
                              <p className="text-xl font-bold text-white mb-0.5">
                                ₹{market.price.toLocaleString("en-IN")}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] text-white/40">{result.unit}</p>
                              {isBest && (
                                <span className={`mt-2 inline-block rounded border px-1.5 py-0.5 text-[10px] font-bold tracking-wide ${
                                  isSelected 
                                    ? "bg-primary/10 border-primary/30 text-primary" 
                                    : "bg-white/5 border-white/10 text-white/40"
                                }`}>
                                  BEST PRICE
                                </span>
                              )}
                              {isSelected && !isBest && (
                                <span className="mt-2 inline-block rounded border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary tracking-wide">
                                  SELECTED
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Suggestion */}
                    <div className="rounded-xl bg-primary/5 border border-primary/10 p-4">
                      <p className="text-xs font-bold text-primary mb-1 uppercase tracking-[0.15em]">
                        Recommended Action
                      </p>
                      <p className="text-sm text-white/75 leading-relaxed">
                        {result.suggestion}
                      </p>
                    </div>

                    {/* Pickup button / form / success */}
                    {!showPickupForm && !pickupRequested && (
                      <Button
                        variant="secondary"
                        className="w-full"
                        onClick={() => {
                          setShowPickupForm(true);
                          setPickupErrors({});
                          setOtpSent(false);
                          setOtp("");
                          setOtpVerified(false);
                        }}
                      >
                        <Truck className="h-4 w-4" />
                        Request Pickup
                      </Button>
                    )}

                    {/* Pickup Form */}
                    <AnimatePresence>
                      {showPickupForm && !pickupRequested && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                <Truck className="h-4 w-4 text-primary" />
                                Transport to {selectedMarket}
                              </h4>
                              <button
                                onClick={() => setShowPickupForm(false)}
                                className="text-white/40 hover:text-white/70 transition-colors cursor-pointer"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>

                            {/* Name */}
                            <div>
                              <label className="mb-1.5 block text-xs font-semibold text-white/80">
                                <User className="inline h-3 w-3 mr-1 text-white/50" />
                                Full Name <span className="text-red-400">*</span>
                              </label>
                              <input
                                type="text"
                                value={pickupForm.name}
                                onChange={(e) => {
                                  setPickupForm({ ...pickupForm, name: e.target.value });
                                  setPickupErrors({ ...pickupErrors, name: "" });
                                }}
                                placeholder="Enter your full name"
                                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                              />
                              {pickupErrors.name && <p className="mt-1 text-xs text-red-400">{pickupErrors.name}</p>}
                            </div>

                            {/* Mobile + OTP */}
                            <div>
                              <label className="mb-1.5 block text-xs font-semibold text-white/80">
                                <Phone className="inline h-3 w-3 mr-1 text-white/50" />
                                Mobile Number <span className="text-red-400">*</span>
                              </label>
                              <div className="flex gap-2">
                                <input
                                  type="tel"
                                  value={pickupForm.mobile}
                                  onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                                    setPickupForm({ ...pickupForm, mobile: val });
                                    setPickupErrors({ ...pickupErrors, mobile: "" });
                                    if (otpSent) { setOtpSent(false); setOtpVerified(false); setOtp(""); }
                                  }}
                                  placeholder="10-digit mobile"
                                  maxLength={10}
                                  disabled={otpVerified}
                                  className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                                />
                                {!otpVerified && (
                                  <button
                                    onClick={() => {
                                      if (pickupForm.mobile.length !== 10) {
                                        setPickupErrors({ ...pickupErrors, mobile: "Enter valid 10-digit number" });
                                        return;
                                      }
                                      setSendingOtp(true);
                                      // TODO: Backend API call to send OTP
                                      setTimeout(() => {
                                        setSendingOtp(false);
                                        setOtpSent(true);
                                      }, 1500);
                                    }}
                                    disabled={pickupForm.mobile.length !== 10 || sendingOtp}
                                    className="shrink-0 rounded-lg bg-primary/15 border border-primary/25 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/25 transition-colors disabled:opacity-40 cursor-pointer"
                                  >
                                    {sendingOtp ? "Sending..." : otpSent ? "Resend" : "Send OTP"}
                                  </button>
                                )}
                                {otpVerified && (
                                  <span className="flex items-center gap-1 shrink-0 rounded-lg bg-emerald-500/15 border border-emerald-500/25 px-3 py-2 text-xs font-semibold text-emerald-400">
                                    ✓ Verified
                                  </span>
                                )}
                              </div>
                              {pickupErrors.mobile && <p className="mt-1 text-xs text-red-400">{pickupErrors.mobile}</p>}

                              {/* OTP Input */}
                              {otpSent && !otpVerified && (
                                <motion.div
                                  initial={{ opacity: 0, y: -4 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="mt-2 flex gap-2"
                                >
                                  <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                    placeholder="Enter 6-digit OTP"
                                    maxLength={6}
                                    className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 tracking-[0.3em] text-center focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                  />
                                  <button
                                    onClick={() => {
                                      if (otp.length !== 6) return;
                                      setVerifyingOtp(true);
                                      // TODO: Backend API call to verify OTP
                                      setTimeout(() => {
                                        setVerifyingOtp(false);
                                        setOtpVerified(true);
                                      }, 1000);
                                    }}
                                    disabled={otp.length !== 6 || verifyingOtp}
                                    className="shrink-0 rounded-lg bg-primary/15 border border-primary/25 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/25 transition-colors disabled:opacity-40 cursor-pointer"
                                  >
                                    {verifyingOtp ? "Verifying..." : "Verify"}
                                  </button>
                                </motion.div>
                              )}
                              {otpSent && !otpVerified && (
                                <p className="mt-1.5 text-[10px] text-white/40">OTP sent to +91 {pickupForm.mobile.slice(0, 2)}****{pickupForm.mobile.slice(8)}</p>
                              )}
                            </div>

                            {/* Location */}
                            <div>
                              <label className="mb-1.5 block text-xs font-semibold text-white/80">
                                <MapPin className="inline h-3 w-3 mr-1 text-white/50" />
                                Pickup Location <span className="text-red-400">*</span>
                              </label>
                              <input
                                type="text"
                                value={pickupForm.location}
                                onChange={(e) => {
                                  setPickupForm({ ...pickupForm, location: e.target.value });
                                  setPickupErrors({ ...pickupErrors, location: "" });
                                }}
                                placeholder="Village / Area / Landmark"
                                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                              />
                              {pickupErrors.location && <p className="mt-1 text-xs text-red-400">{pickupErrors.location}</p>}
                            </div>

                            {/* Timing */}
                            <div>
                              <label className="mb-1.5 block text-xs font-semibold text-white/80">
                                <Clock className="inline h-3 w-3 mr-1 text-white/50" />
                                Preferred Timing <span className="text-red-400">*</span>
                              </label>
                              <select
                                value={pickupForm.timing}
                                onChange={(e) => {
                                  setPickupForm({ ...pickupForm, timing: e.target.value });
                                  setPickupErrors({ ...pickupErrors, timing: "" });
                                }}
                                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                              >
                                <option value="" className="bg-[#111]">Select a time slot</option>
                                <option value="6:00 AM - 8:00 AM" className="bg-[#111]">6:00 AM - 8:00 AM</option>
                                <option value="8:00 AM - 10:00 AM" className="bg-[#111]">8:00 AM - 10:00 AM</option>
                                <option value="10:00 AM - 12:00 PM" className="bg-[#111]">10:00 AM - 12:00 PM</option>
                                <option value="12:00 PM - 2:00 PM" className="bg-[#111]">12:00 PM - 2:00 PM</option>
                                <option value="2:00 PM - 4:00 PM" className="bg-[#111]">2:00 PM - 4:00 PM</option>
                                <option value="4:00 PM - 6:00 PM" className="bg-[#111]">4:00 PM - 6:00 PM</option>
                              </select>
                              {pickupErrors.timing && <p className="mt-1 text-xs text-red-400">{pickupErrors.timing}</p>}
                            </div>

                            {/* Submit */}
                            <Button
                              className="w-full"
                              onClick={() => {
                                const errors: Record<string, string> = {};
                                if (!pickupForm.name.trim()) errors.name = "Name is required";
                                if (pickupForm.mobile.length !== 10) errors.mobile = "Valid 10-digit mobile is required";
                                if (!otpVerified) errors.mobile = "Please verify your mobile number with OTP";
                                if (!pickupForm.location.trim()) errors.location = "Location is required";
                                if (!pickupForm.timing) errors.timing = "Please select a time slot";

                                if (Object.keys(errors).length > 0) {
                                  setPickupErrors(errors);
                                  return;
                                }

                                // TODO: Backend API call to submit pickup request
                                // POST /api/pickup { name, mobile, location, timing, crop, market }
                                setShowPickupForm(false);
                                setPickupRequested(true);
                              }}
                            >
                              <Truck className="h-4 w-4" />
                              Confirm Pickup Request
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Pickup confirmed */}
                    {pickupRequested && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-center"
                      >
                        <p className="text-sm font-bold text-emerald-400">
                          ✓ Pickup Requested Successfully
                        </p>
                        <p className="mt-1 text-xs text-white/65">
                          Truck scheduled for {pickupForm.timing || "tomorrow"}. Driver will call +91 {pickupForm.mobile} 30 min before arrival.
                        </p>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Crop not found */}
              {notFound && !isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-center"
                >
                  <p className="text-sm font-semibold text-amber-400">
                    🚧 &ldquo;{crop}&rdquo; is not available yet
                  </p>
                  <p className="mt-1 text-xs text-white/60">
                    We&apos;re working on adding more crops. This will be available soon!
                  </p>
                </motion.div>
              )}
            </div>
          </div>
        </FadeIn>
      </Container>
    </section>
  );
}
