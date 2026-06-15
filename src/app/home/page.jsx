"use client"

import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import * as lucideIcons from "lucide-react"
import { MapPin, Phone, Mail, Star, ChevronRight, Sparkles, Quote, ArrowRight, Wifi, Coffee, Dumbbell, Car, Shield, Clock, Camera, Play, Expand, Grid3x3, ChevronLeft, X } from "lucide-react"
import Navbar from "@/components/navbar"
import { API_URL } from "@/lib/api"

const WhatsAppIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
  </svg>
)

const getImageUrl = (primaryUrl, fallbackUrl, defaultImage = "/abstract-geometric-shapes.png") => {
  if (primaryUrl) return primaryUrl;
  if (fallbackUrl) return fallbackUrl;
  return defaultImage;
};

function GalleryCarousel({ images }) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState('carousel');
  const [loaded, setLoaded] = useState({});
  const containerRef = useRef(null);
  const touchStartRef = useRef(null);

  const goTo = (idx) => {
    setDirection(idx > current ? 1 : -1);
    setCurrent(idx);
  };
  const next = () => goTo((current + 1) % images.length);
  const prev = () => goTo((current - 1 + images.length) % images.length);

  // Auto-advance
  useEffect(() => {
    if (isFullscreen) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [current, images.length, isFullscreen]);

  // Keyboard
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowLeft') { prev(); e.preventDefault(); }
      if (e.key === 'ArrowRight') { next(); e.preventDefault(); }
      if (e.key === 'Escape' && isFullscreen) { setIsFullscreen(false); e.preventDefault(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [current, images.length, isFullscreen]);

  // Touch
  const onTouchStart = (e) => { touchStartRef.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (!touchStartRef.current) return;
    const diff = e.changedTouches[0].clientX - touchStartRef.current;
    if (Math.abs(diff) > 50) diff > 0 ? prev() : next();
    touchStartRef.current = null;
  };

  const onImgLoad = (idx) => setLoaded(p => ({ ...p, [idx]: true }));

  if (viewMode === 'grid') {
    return (
      <section id="gallery" className="relative py-28 px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-background pointer-events-none" />
        <div className="max-w-7xl mx-auto relative">
          <div className="flex items-end justify-between mb-12">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-primary/10 to-accent/10 text-primary text-xs font-medium mb-4 border border-primary/10">
                <Camera className="w-3.5 h-3.5" /> Gallery
              </div>
              <h2 className="text-4xl md:text-5xl font-bold">Our Gallery</h2>
              <p className="text-muted-foreground mt-2 max-w-xl">A glimpse into the beauty and comfort that awaits you</p>
            </div>
            <button onClick={() => setViewMode('carousel')} className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/5 hover:bg-primary/10 text-primary text-sm transition-all border border-primary/10">
              <Play className="w-4 h-4" /> Slideshow
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((url, idx) => (
              <div
                key={idx}
                className={`relative group cursor-pointer rounded-2xl overflow-hidden animate-fade-in-up ${idx === 0 ? 'md:col-span-2 md:row-span-2' : ''}`}
                style={{ animationDelay: `${idx * 0.05}s`, animationFillMode: 'backwards' }}
                onClick={() => { setCurrent(idx); setViewMode('carousel'); }}
              >
                <div className={`relative ${idx === 0 ? 'aspect-[4/3] md:aspect-auto md:h-full' : 'aspect-[4/3]'}`}>
                  {!loaded[idx] && <div className="absolute inset-0 bg-muted animate-pulse" />}
                  <img src={url} alt={`Gallery ${idx + 1}`} className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-110 ${loaded[idx] ? 'opacity-100' : 'opacity-0'}`} onLoad={() => onImgLoad(idx)} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center">
                      <Expand className="w-4 h-4 text-gray-800" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => setViewMode('carousel')} className="md:hidden mt-6 w-full py-3 rounded-xl bg-primary/5 hover:bg-primary/10 text-primary text-sm transition-all border border-primary/10 flex items-center justify-center gap-2">
            <Play className="w-4 h-4" /> View Slideshow
          </button>
        </div>
      </section>
    );
  }

  return (
    <section id="gallery" className="relative py-28 px-4 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/5 to-background pointer-events-none" />

      {/* Decorative blurs */}
      <div className="absolute top-1/3 left-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto relative">
        <div className="flex items-end justify-between mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-primary/10 to-accent/10 text-primary text-xs font-medium mb-4 border border-primary/10">
              <Camera className="w-3.5 h-3.5" /> Gallery
            </div>
            <h2 className="text-4xl md:text-5xl font-bold">Our Gallery</h2>
            <p className="text-muted-foreground mt-2 max-w-xl">A glimpse into the beauty and comfort that awaits you</p>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <button onClick={() => setViewMode('grid')} className="px-4 py-2 rounded-xl bg-primary/5 hover:bg-primary/10 text-primary text-sm transition-all border border-primary/10 flex items-center gap-2">
              <Grid3x3 className="w-4 h-4" /> Grid View
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-background/80 backdrop-blur-sm border text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{current + 1}</span>
              <span>/</span>
              <span>{images.length}</span>
            </div>
          </div>
        </div>

        <div className="relative max-w-5xl mx-auto" ref={containerRef} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          {/* Main image container */}
          <div className="relative aspect-[16/9] rounded-3xl overflow-hidden shadow-2xl shadow-black/20 group bg-muted cursor-pointer" onClick={() => setIsFullscreen(true)}>
            {/* Slide */}
            {images.map((url, idx) => (
              <div
                key={idx}
                className={`absolute inset-0 transition-all duration-700 ease-out ${idx === current ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`}
                style={{ zIndex: idx === current ? 1 : 0 }}
              >
                {!loaded[idx] && <div className="absolute inset-0 bg-muted animate-pulse" />}
                <img src={url} alt={`Gallery ${idx + 1}`} className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-105 ${loaded[idx] ? 'opacity-100' : 'opacity-0'}`} onLoad={() => onImgLoad(idx)} />
              </div>
            ))}

            {/* Gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10 pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />

            {/* Image counter (mobile) */}
            <div className="absolute top-4 right-4 md:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-sm text-white text-xs">
              <span className="font-semibold">{current + 1}</span>
              <span className="opacity-60">/</span>
              <span className="opacity-60">{images.length}</span>
            </div>

            {/* Nav arrows */}
            <button onClick={(e) => { e.stopPropagation(); prev(); }} className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/25 border border-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 shadow-lg">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); next(); }} className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/25 border border-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 shadow-lg">
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Click hint */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 text-white/60 text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Expand className="w-3.5 h-3.5" />
              <span>Click to expand</span>
            </div>
          </div>

          {/* Thumbnails */}
          <div className="mt-6">
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin" style={{ scrollbarWidth: 'thin' }}>
              {images.map((url, idx) => (
                <button
                  key={idx}
                  onClick={() => goTo(idx)}
                  className={`relative shrink-0 w-20 h-14 rounded-xl overflow-hidden transition-all duration-300 border-2 ${idx === current ? 'border-primary ring-2 ring-primary/30 scale-105' : 'border-transparent hover:border-white/30 opacity-60 hover:opacity-100'}`}
                >
                  <img src={url} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Dot indicators (mobile) */}
          <div className="md:hidden flex justify-center gap-1.5 mt-4">
            {images.map((_, idx) => (
              <button key={idx} onClick={() => goTo(idx)} className={`h-1.5 rounded-full transition-all duration-300 ${idx === current ? 'w-8 bg-primary' : 'w-1.5 bg-primary/30 hover:bg-primary/50'}`} />
            ))}
          </div>
        </div>
      </div>

      {/* Fullscreen Lightbox */}
      {isFullscreen && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center" onClick={() => setIsFullscreen(false)}>
          <button onClick={() => setIsFullscreen(false)} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all z-10">
            <X className="w-5 h-5" />
          </button>
          <div className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white text-sm z-10">
            <Camera className="w-4 h-4" />
            <span>{current + 1} / {images.length}</span>
          </div>
          <button onClick={(e) => { e.stopPropagation(); prev(); }} className="absolute left-6 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all z-10 hover:scale-110 backdrop-blur-sm">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); next(); }} className="absolute right-6 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all z-10 hover:scale-110 backdrop-blur-sm">
            <ChevronRight className="w-6 h-6" />
          </button>
          <div className="max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <img src={images[current]} alt={`Gallery ${current + 1}`} className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl" />
          </div>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {images.map((_, idx) => (
              <button key={idx} onClick={(e) => { e.stopPropagation(); goTo(idx); }} className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === current ? 'bg-white w-8' : 'bg-white/40 hover:bg-white/70'}`} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export default function HotelLandingPage() {
  const [hotel, setHotel] = useState(null);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('hotel');
      if (stored) setHotel(JSON.parse(stored));
    }
  }, []);
  const [websiteContent, setWebsiteContent] = useState(null);
  const [seo, setSeo] = useState(null);

  const ensureWebsiteDefaults = (website) => {
    const w = website || {};
    return {
      aboutDescription: w.aboutDescription || "",
      amenitiesDescription: w.amenitiesDescription || "",
      experiencesDescription: w.experiencesDescription || "",
      testimonialsDescription: w.testimonialsDescription || "",
      footerDescription: w.footerDescription || "",
      heroImage: w.heroImage || null,
      heroVideo: w.heroVideo || '',
      rooms: Array.isArray(w.rooms) ? w.rooms : [],
      amenities: Array.isArray(w.amenities) ? w.amenities : [],
      amenitiesDetailed: Array.isArray(w.amenitiesDetailed) ? w.amenitiesDetailed : [],
      experiences: Array.isArray(w.experiences) ? w.experiences : [],
      testimonials: Array.isArray(w.testimonials) ? w.testimonials : [],
      contactInfo: {
        phone: w.contactInfo?.phone || "",
        email: w.contactInfo?.email || "",
        address: w.contactInfo?.address || "",
        reception: w.contactInfo?.reception || "",
        website: w.contactInfo?.website || "",
      },
    };
  };

  useEffect(() => {
    const fetchHotel = async () => {
      try {
        const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
        const res = await fetch(`${API_URL}/hotels/public/domain?domain=${encodeURIComponent(host)}`);
        if (!res.ok) throw new Error(`Failed to load hotel (${res.status})`);
        const data = await res.json();
        if (data?.success && data.data) {
          const hotelData = data.data;
          setHotel(hotelData);
          setWebsiteContent(ensureWebsiteDefaults(hotelData.website));

          setSeo({
            title: hotelData.seo?.title || hotelData.seo?.metaTitle || hotelData.name || "",
            description: hotelData.seo?.description || hotelData.seo?.metaDescription || hotelData.description || "",
            keywords: hotelData.seo?.keywords || [],
            ogImage: hotelData.seo?.ogImage || hotelData.images?.[0] || ""
          });

          if (typeof window !== 'undefined' && document) {
            document.title = hotelData.seo?.title || hotelData.seo?.metaTitle || hotelData.name || "Hotel";

            let metaDescription = document.querySelector('meta[name="description"]');
            if (!metaDescription) {
              metaDescription = document.createElement('meta');
              metaDescription.name = 'description';
              document.head.appendChild(metaDescription);
            }
            metaDescription.content = hotelData.seo?.description || hotelData.seo?.metaDescription || hotelData.description || "";

            if (hotelData.seo?.keywords?.length > 0) {
              let metaKeywords = document.querySelector('meta[name="keywords"]');
              if (!metaKeywords) {
                metaKeywords = document.createElement('meta');
                metaKeywords.name = 'keywords';
                document.head.appendChild(metaKeywords);
              }
              metaKeywords.content = hotelData.seo.keywords.join(', ');
            }

            if (hotelData.seo?.ogImage) {
              let ogImage = document.querySelector('meta[property="og:image"]');
              if (!ogImage) {
                ogImage = document.createElement('meta');
                ogImage.setAttribute('property', 'og:image');
                document.head.appendChild(ogImage);
              }
              ogImage.content = hotelData.seo.ogImage;
            }
          }
        } else {
          setHotel(null);
          setWebsiteContent(null);
        }
      } catch (error) {
        console.error("Error fetching hotel:", error);
      }
    };
    fetchHotel();
  }, []);

  const handleWhatsAppContact = () => {
    const phone = websiteContent?.contactInfo?.phone || hotel?.contact?.phone || '';
    if (!phone) return;
    const url = `https://wa.me/${phone.replace(/[^\d+]/g, '')}`;
    window.open(url, '_blank');
  };

  if (!hotel || !websiteContent) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-secondary/30 to-background">
        <div className="w-16 h-16 rounded-2xl bg-gradient-brand flex items-center justify-center animate-scale-pulse mb-6">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <div className="text-xl font-medium text-foreground/80">Loading your experience...</div>
        <div className="mt-4 text-sm text-muted-foreground">Please wait while we prepare something special</div>
      </div>
    );
  }

  const nepaliFlag = hotel?.nepaliFlag === true;
  const activeRooms = (websiteContent.rooms || []).filter(r => r.isActive);
  const amenitiesDetailed = websiteContent.amenitiesDetailed || [];
  const simpleAmenities = websiteContent.amenities || [];
  const activeDetailedAmenities = amenitiesDetailed.filter(a => a.isActive !== false);
  const activeAmenities = activeDetailedAmenities.length > 0 ? activeDetailedAmenities : simpleAmenities.filter(a => a && (a.isActive !== false || !('isActive' in a)));
  const activeTestimonials = (websiteContent.testimonials || []).filter(t => t.isActive);

  const amenityName = (a) => a.name || a.title || '';
  const amenityIcon = (a) => a.icon || 'Star';
  const amenityDesc = (a) => a.description || '';
  const amenityImage = (a) => a.image || '';

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <Navbar hotel={hotel} nepaliFlag={nepaliFlag} />

      {/* ==================== HERO SECTION ==================== */}
      <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {websiteContent.heroVideo ? (
          <div className="absolute inset-0">
            <video
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 w-full h-full object-cover scale-110"
              poster={websiteContent.heroImage || hotel?.images?.[0] || ''}
            >
              <source src={websiteContent.heroVideo} type="video/mp4" />
            </video>
          </div>
        ) : websiteContent.heroImage || hotel?.images?.[0] ? (
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-110"
            style={{
              backgroundImage: `url(${getImageUrl(websiteContent.heroImage, hotel?.images?.[0])})`,
            }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-deep-navy via-[oklch(0.18_0.05_280)] to-[oklch(0.12_0.04_260)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-deep-navy/80 via-deep-navy/60 to-deep-navy/90" />

        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-96 h-96 rounded-full bg-primary/10 blur-3xl animate-float-slow" />
          <div className="absolute bottom-40 right-10 w-[500px] h-[500px] rounded-full bg-accent/10 blur-3xl animate-float-slow" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/3 right-1/4 w-64 h-64 rounded-full bg-white/5 blur-2xl" />
          <div className="absolute bottom-1/4 left-1/4 w-48 h-48 rounded-full bg-primary/5 blur-xl" />
          
          {/* Floating geometric shapes */}
          <div className="absolute top-32 left-[15%] w-4 h-4 bg-primary/30 rounded-full animate-float-slow" />
          <div className="absolute top-48 right-[20%] w-6 h-6 bg-accent/20 rounded-lg rotate-45 animate-float-slow" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-48 left-[25%] w-3 h-3 bg-white/20 rounded-full animate-float-slow" style={{ animationDelay: '3s' }} />
          <div className="absolute top-1/2 right-[15%] w-5 h-5 bg-primary/20 rounded-full animate-float-slow" style={{ animationDelay: '4s' }} />
        </div>

        <div className="relative z-10 text-center max-w-5xl mx-auto px-6 py-20">
          <div className="animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-glass text-white/90 text-sm mb-8 backdrop-blur-sm border border-white/10">
              <Sparkles className="w-4 h-4 text-accent" />
              <span>Welcome to {hotel?.name || 'Luxury Stay'}</span>
            </div>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 text-balance tracking-tight animate-fade-in-up-delay-1 leading-[1.1]">
            {websiteContent.heroTitle || "Experience the Serenity of Nepal"}
          </h1>
          <p className="text-lg md:text-xl lg:text-2xl text-white/70 mb-10 max-w-3xl mx-auto text-balance animate-fade-in-up-delay-2 leading-relaxed">
            {websiteContent.heroSubtitle || "Your Home Away from Home in the Heart of the Himalayas"}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up-delay-3">
            <Button
              size="lg"
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground px-10 py-7 text-lg flex items-center gap-3 w-full sm:w-auto rounded-2xl shadow-2xl shadow-primary/30 hover:shadow-primary/40 transition-all duration-300 hover:scale-105"
              onClick={handleWhatsAppContact}
              tabIndex={0}
            >
              <WhatsAppIcon className="w-6 h-6" />
              <span>Book Your Stay</span>
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Stats bar */}
          <div className="mt-16 grid grid-cols-3 gap-6 max-w-lg mx-auto animate-fade-in-up-delay-3">
            {[
              { value: activeRooms.length, label: "Rooms", icon: "BedDouble" },
              { value: activeAmenities.length, label: "Amenities", icon: "Sparkles" },
              { value: activeTestimonials.length, label: "Reviews", icon: "Star" },
            ].map((stat, i) => {
              const StatIcon = lucideIcons[stat.icon] || Star;
              return (
                <div key={i} className="text-center p-4 rounded-2xl bg-glass backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300">
                  <StatIcon className="w-5 h-5 text-accent mx-auto mb-2" />
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-white/50">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-1">
            <div className="w-1.5 h-3 bg-white/60 rounded-full animate-float" />
          </div>
        </div>
      </section>

      {/* ==================== GALLERY SECTION ==================== */}
      {(() => {
        const galleryImages = websiteContent?.galleryImages?.length > 0
          ? websiteContent.galleryImages
          : (hotel?.images || []).filter(u => typeof u === 'string' && u.startsWith('http'));
        if (galleryImages.length === 0) return null;
        return <GalleryCarousel images={galleryImages} />;
      })()}

      {/* ==================== ROOMS SECTION ==================== */}
      <section id="rooms" className="relative py-28 px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/20 to-background pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-9xl mx-auto">
          <div className="text-center mb-16 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              <span>Premium Stays</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">Our Accommodations</h2>
            <div className="w-20 h-1 bg-gradient-to-r from-primary to-accent rounded-full mx-auto mb-6" />
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {websiteContent.aboutDescription || "Choose from our carefully designed rooms, each offering stunning mountain views and authentic Nepali hospitality"}
            </p>
          </div>

          <div className={`grid gap-8 ${activeRooms.length === 1 ? 'grid-cols-1 max-w-md mx-auto' : activeRooms.length === 2 ? 'grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto' : 'md:grid-cols-2 lg:grid-cols-3'}`}>
            {activeRooms.map((room, index) => (
              <Card key={index} className="group overflow-hidden border-0 bg-card/80 backdrop-blur-sm shadow-card hover:shadow-card-hover transition-all duration-500 hover:-translate-y-2 rounded-2xl">
                <div className="relative overflow-hidden aspect-[4/3] bg-gradient-to-br from-primary/20 to-accent/20">
                  {room.image ? (
                    <img
                      src={room.image}
                      alt={room.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
                        {lucideIcons['BedDouble'] ? <lucideIcons.BedDouble className="w-10 h-10 text-primary" /> : null}
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <Badge className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-foreground border-0 px-3 py-1.5 text-sm font-semibold rounded-xl shadow-lg">
                    From रु{room.price}
                    <span className="text-xs text-muted-foreground font-normal ml-1">/night</span>
                  </Badge>
                  {index === 0 && activeRooms.length > 1 && (
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white border-0 px-3 py-1.5 rounded-xl shadow-lg text-xs font-semibold">
                        Popular
                      </Badge>
                    </div>
                  )}
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">{room.title}</CardTitle>
                  <CardDescription>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {room.features.map((feature, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs rounded-lg px-2.5 py-1 bg-secondary/50 border-0">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground flex items-center justify-center gap-2 rounded-xl py-6 transition-all duration-300 group/btn"
                    onClick={handleWhatsAppContact}
                  >
                    <WhatsAppIcon className="w-4 h-4" />
                    <span>Book Now</span>
                    <ArrowRight className="w-4 h-4 opacity-0 -ml-4 group-hover/btn:opacity-100 group-hover/btn:ml-0 transition-all duration-300" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== AMENITIES SECTION ==================== */}
      <section id="amenities" className="relative py-28 px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/[0.02] to-background pointer-events-none" />
        <div className="absolute top-1/2 left-0 w-72 h-72 bg-primary/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/3 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-9xl mx-auto">
          <div className="text-center mb-16 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              <span>Premium Facilities</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">Hotel Amenities</h2>
            <div className="w-20 h-1 bg-gradient-to-r from-accent to-primary rounded-full mx-auto mb-6" />
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{websiteContent.amenitiesDescription || 'Everything you need for a comfortable and memorable stay'}</p>
          </div>

          <div className="flex flex-wrap justify-center gap-6">
            {activeAmenities.map((a, idx) => {
              const name = amenityName(a);
              const icon = amenityIcon(a);
              const desc = amenityDesc(a);
              const img = amenityImage(a);
              const IconComponent = lucideIcons[icon] || Star;
              const isDetailed = icon !== 'Star' || desc || img;
              return (
                <div
                  key={idx}
                  className="group w-[180px] flex-shrink-0 border-0 bg-card/60 backdrop-blur-sm hover:bg-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 rounded-2xl overflow-hidden"
                >
                  {img && (
                    <div className="relative overflow-hidden h-20">
                      <img
                        src={img}
                        alt={name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
                    </div>
                  )}
                  <div className={`text-center ${img ? 'pt-2' : 'pt-5'} pb-4 px-3`}>
                    <div className={`${isDetailed ? 'w-14 h-14' : 'w-12 h-12'} rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                      {IconComponent ? <IconComponent className={`${isDetailed ? 'w-7 h-7' : 'w-6 h-6'} text-primary`} /> : null}
                    </div>
                    <h3 className="text-sm font-semibold text-foreground leading-tight">{name}</h3>
                    {desc && (
                      <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed line-clamp-2">{desc}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ==================== TESTIMONIALS SECTION ==================== */}
      {activeTestimonials.length > 0 && (
        <section id="testimonials" className="relative py-28 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/30 to-background pointer-events-none" />
          <div className="absolute top-10 right-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-10 left-10 w-80 h-80 bg-accent/8 rounded-full blur-3xl pointer-events-none" />

          <div className="relative max-w-6xl mx-auto">
            <div className="text-center mb-16 animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                <Quote className="w-4 h-4" />
                <span>Guest Stories</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">What Our Guests Say</h2>
              <div className="w-20 h-1 bg-gradient-to-r from-primary to-accent rounded-full mx-auto mb-6" />
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{websiteContent.testimonialsDescription || 'Hear from travelers who have experienced the magic of Nepal with us'}</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {activeTestimonials.map((testimonial, index) => (
                <Card key={index} className="group border-0 bg-card/70 backdrop-blur-sm shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 rounded-2xl relative overflow-hidden">
                  {/* Gradient accent line */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary/50" />

                  <CardHeader>
                    <div className="flex items-center gap-3 mb-3">
                      {testimonial.image ? (
                        <div className="relative">
                          <img
                            src={getImageUrl(testimonial.image, hotel?.images?.[0])}
                            alt={testimonial.name}
                            className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/20"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(testimonial.name)}&background=7c3aed&color=fff`;
                            }}
                          />
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                            <Quote className="w-2.5 h-2.5 text-primary-foreground" />
                          </div>
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center ring-2 ring-primary/20">
                          <span className="text-primary-foreground font-bold text-lg">{testimonial.name?.charAt(0)}</span>
                        </div>
                      )}
                      <div>
                        <CardTitle className="text-base font-semibold">{testimonial.name}</CardTitle>
                        <div className="flex gap-0.5 mt-0.5">
                          {Array.from({ length: testimonial.rating || 5 }).map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="relative">
                      <Quote className="w-6 h-6 text-primary/20 absolute -top-2 -left-1" />
                      <p className="text-muted-foreground italic leading-relaxed pl-5">
                        &ldquo;{testimonial.comment}&rdquo;
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ==================== CTA SECTION ==================== */}
      <section className="relative py-28 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 pointer-events-none" />
        <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none animate-float-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent/10 rounded-full blur-3xl pointer-events-none animate-float-slow" style={{ animationDelay: '2s' }} />
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-3xl p-12 md:p-16 border border-primary/10 shadow-xl backdrop-blur-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary/50" />
            <div className="w-16 h-16 rounded-2xl bg-gradient-brand flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/20 animate-scale-pulse">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {activeRooms.length > 0
                ? `Ready for an Unforgettable Stay at ${hotel?.name || 'Our Hotel'}?`
                : 'Ready for an Unforgettable Experience?'}
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              {activeRooms.length > 0
                ? `Choose from our ${activeRooms.length} premium accommodation${activeRooms.length > 1 ? 's' : ''} and immerse yourself in the beauty, culture, and hospitality that make ${hotel?.name || 'our hotel'} truly special.`
                : 'Book your stay today and immerse yourself in the beauty, culture, and hospitality that make our hotel truly special.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                size="lg"
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground px-10 py-7 text-lg flex items-center gap-3 rounded-2xl shadow-2xl shadow-primary/30 hover:shadow-primary/40 transition-all duration-300 hover:scale-105"
                onClick={handleWhatsAppContact}
              >
                <WhatsAppIcon className="w-6 h-6" />
                <span>Reserve Your Room Now</span>
                <ArrowRight className="w-5 h-5" />
              </Button>
              {activeRooms.length > 0 && (
                <Button
                  variant="outline"
                  size="lg"
                  className="px-8 py-7 text-lg flex items-center gap-2 rounded-2xl border-primary/30 hover:border-primary transition-all duration-300 hover:scale-105"
                  onClick={() => document.getElementById('rooms')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  <span>View Rooms</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ==================== FOOTER ==================== */}
      <footer id="contact" className="relative bg-gradient-to-br from-deep-navy via-[oklch(0.15_0.04_280)] to-deep-navy text-white py-20">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <div className="absolute top-1/3 right-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/3 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            <div className="lg:col-span-1">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center shadow-lg shadow-primary/20">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold">{hotel?.name}</h3>
              </div>
              <p className="text-white/60 mb-6 text-sm leading-relaxed">
                {websiteContent.footerDescription || 'Experience authentic Nepali hospitality in the heart of the Himalayas. Your gateway to adventure and tranquility.'}
              </p>
              <div className="space-y-3 text-sm">
                {(websiteContent.contactInfo?.address || hotel?.address) && (
                  <div className="flex items-start gap-3 text-white/60 hover:text-white/80 transition-colors">
                    <MapPin className="w-4 h-4 mt-0.5 text-accent shrink-0" />
                    <span>{websiteContent.contactInfo.address || `${hotel?.address?.street || ''}${hotel?.address?.city ? ', ' + hotel.address.city : ''}`}</span>
                  </div>
                )}
                {(websiteContent.contactInfo?.phone || hotel?.contact?.phone) && (
                  <div className="flex items-center gap-3 text-white/60 hover:text-white/80 transition-colors">
                    <Phone className="w-4 h-4 text-accent shrink-0" />
                    <a href={`tel:${websiteContent.contactInfo.phone || hotel?.contact?.phone}`} className="hover:text-white transition-colors">
                      {websiteContent.contactInfo.phone || hotel?.contact?.phone}
                    </a>
                  </div>
                )}
                {(websiteContent.contactInfo?.email || hotel?.contact?.email) && (
                  <div className="flex items-center gap-3 text-white/60 hover:text-white/80 transition-colors">
                    <Mail className="w-4 h-4 text-accent shrink-0" />
                    <a href={`mailto:${websiteContent.contactInfo.email || hotel?.contact?.email}`} className="hover:text-white transition-colors">
                      {websiteContent.contactInfo.email || hotel?.contact?.email}
                    </a>
                  </div>
                )}
                {hotel?.contact?.reception && (
                  <div className="flex items-center gap-3 text-white/60">
                    <Phone className="w-4 h-4 text-accent shrink-0" />
                    <span>{hotel.contact.reception}</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white/90 uppercase tracking-wider mb-5">Quick Links</h4>
              <ul className="space-y-3">
                {[
                  { href: "#home", label: "Home" },
                  { href: "#rooms", label: "Rooms & Suites" },
                  { href: "#amenities", label: "Amenities" },
                  ...(activeTestimonials.length > 0 ? [{ href: "#testimonials", label: "Guest Reviews" }] : []),
                  { href: "#contact", label: "Contact Us" },
                ].map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="text-white/50 hover:text-white transition-colors flex items-center gap-2 text-sm group"
                    >
                      <ChevronRight className="w-3 h-3 text-accent opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200" />
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white/90 uppercase tracking-wider mb-5">Services</h4>
              <ul className="space-y-3">
                {(activeAmenities.length > 0 ? activeAmenities.slice(0, 6) : [
                  { icon: 'BedDouble', name: 'Premium Rooms' },
                  { icon: 'UtensilsCrossed', name: 'Restaurant' },
                  { icon: 'Shield', name: '24/7 Security' },
                  { icon: 'Wifi', name: 'Free WiFi' },
                  { icon: 'Clock', name: 'Room Service' },
                  { icon: 'Car', name: 'Parking' },
                ]).map((service) => {
                  const svgIcon = amenityIcon(service);
                  const svgName = amenityName(service);
                  const SvcIcon = lucideIcons[svgIcon] || Star;
                  return (
                    <li key={svgName} className="flex items-center gap-3 text-white/50 text-sm">
                      <SvcIcon className="w-3.5 h-3.5 text-accent shrink-0" />
                      {svgName}
                    </li>
                  );
                })}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white/90 uppercase tracking-wider mb-5">Book Your Stay</h4>
              <p className="text-white/50 text-sm mb-6 leading-relaxed">
                {activeRooms.length > 0
                  ? `Choose from ${activeRooms.length} premium room${activeRooms.length > 1 ? 's' : ''} and experience the best of ${hotel?.name || 'Nepali hospitality'}.`
                  : 'Ready to experience the magic? Book your room today and start your adventure.'}
              </p>
              <Button
                size="lg"
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground flex items-center gap-2 rounded-xl w-full shadow-lg shadow-primary/25 transition-all duration-300 hover:scale-105"
                onClick={handleWhatsAppContact}
              >
                <WhatsAppIcon className="w-4 h-4" />
                Reserve Now
              </Button>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-white/40 text-sm">
              &copy; {new Date().getFullYear()} {hotel?.name}. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-white/30 text-xs">
              <span>{activeRooms.length} Rooms · {activeAmenities.length} Amenities · {activeTestimonials.length} Reviews</span>
              {seo?.keywords?.length > 0 && (
                <span className="hidden md:inline">{seo.keywords.slice(0, 3).join(' · ')}</span>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
