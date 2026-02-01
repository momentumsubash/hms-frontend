"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import * as lucideIcons from "lucide-react"
import { MapPin, Phone, Mail } from "lucide-react"
import Navbar from "@/components/navbar"
import { API_URL } from "@/lib/api"

const WhatsAppIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
  </svg>
)

// Function to safely get an image URL with fallbacks
const getImageUrl = (primaryUrl, fallbackUrl, defaultImage = "/abstract-geometric-shapes.png") => {
  if (primaryUrl) return primaryUrl;
  if (fallbackUrl) return fallbackUrl;
  return defaultImage;
};

// Replace static content with dynamic content from the API
export default function HotelLandingPage() {
  const [hotel, setHotel] = useState(null);
  const [websiteContent, setWebsiteContent] = useState(null);
  const [seo, setSeo] = useState(null);
  
  const ensureWebsiteDefaults = (website) => {
    const w = website || {};
    return {
      heroTitle: w.heroTitle || "",
      heroSubtitle: w.heroSubtitle || "",
      aboutDescription: w.aboutDescription || "",
      amenitiesDescription: w.amenitiesDescription || "",
      experiencesDescription: w.experiencesDescription || "",
      testimonialsDescription: w.testimonialsDescription || "",
      footerDescription: w.footerDescription || "",
      heroImage: w.heroImage || null,
      rooms: Array.isArray(w.rooms) ? w.rooms : [],
      amenities: Array.isArray(w.amenities) ? w.amenities : [],
      amenitiesDetailed: Array.isArray(w.amenitiesDetailed) ? w.amenitiesDetailed : [],
      testimonials: Array.isArray(w.testimonials) ? w.testimonials : [],
      contactInfo: {
        phone: w.contactInfo?.phone || "",
        email: w.contactInfo?.email || "",
        address: w.contactInfo?.address || "",
      },
    };
  };
  
  useEffect(() => {
    const fetchHotel = async () => {
      try {
        // Determine domain from browser
        const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
        const res = await fetch(`${API_URL}/hotels/public/domain?domain=${encodeURIComponent(host)}`);
        if (!res.ok) throw new Error(`Failed to load hotel (${res.status})`);
        const data = await res.json();
        if (data?.success && data.data) {
          const hotelData = data.data;
          setHotel(hotelData);
          setWebsiteContent(ensureWebsiteDefaults(hotelData.website));
          
          // Store SEO data - support both naming conventions (title/description or metaTitle/metaDescription)
          setSeo({
            title: hotelData.seo?.title || hotelData.seo?.metaTitle || hotelData.name || "",
            description: hotelData.seo?.description || hotelData.seo?.metaDescription || hotelData.description || "",
            keywords: hotelData.seo?.keywords || [],
            ogImage: hotelData.seo?.ogImage || hotelData.images?.[0] || ""
          });
          
          // Update page title and meta tags dynamically
          if (typeof window !== 'undefined' && document) {
            document.title = hotelData.seo?.title || hotelData.seo?.metaTitle || hotelData.name || "Hotel";
            
            // Update or create meta description
            let metaDescription = document.querySelector('meta[name="description"]');
            if (!metaDescription) {
              metaDescription = document.createElement('meta');
              metaDescription.name = 'description';
              document.head.appendChild(metaDescription);
            }
            metaDescription.content = hotelData.seo?.description || hotelData.seo?.metaDescription || hotelData.description || "";
            
            // Update keywords if available
            if (hotelData.seo?.keywords?.length > 0) {
              let metaKeywords = document.querySelector('meta[name="keywords"]');
              if (!metaKeywords) {
                metaKeywords = document.createElement('meta');
                metaKeywords.name = 'keywords';
                document.head.appendChild(metaKeywords);
              }
              metaKeywords.content = hotelData.seo.keywords.join(', ');
            }
            
            // Update OG image if available
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
    return <div className="min-h-screen flex items-center justify-center text-lg">Loading hotel details...</div>;
  }
  
  return (
    <div className="min-h-screen bg-background">
      <Navbar hotel={hotel} />
      {/* Hero Section with dynamic content */}
      <section id="home" className="relative h-screen flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${getImageUrl(websiteContent.heroImage, hotel?.images?.[0])})`,
          }}
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-4">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-balance">
            {websiteContent.heroTitle || "Experience the Serenity of Nepal"}
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-balance opacity-90">
            {websiteContent.heroSubtitle || "Your Home Away from Home in the Heart of the Himalayas"}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 text-lg flex items-center gap-2"
              onClick={handleWhatsAppContact}
            >
              <WhatsAppIcon className="w-5 h-5" />
              Book Your Stay
            </Button>
          </div>
        </div>
      </section>
      
      {/* Accommodation Showcase with dynamic rooms */}
      <section id="rooms" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">Our Accommodations</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {websiteContent.aboutDescription || "Choose from our carefully designed rooms, each offering stunning mountain views and authentic Nepali hospitality"}
            </p>
          </div>
          
          <div className={`grid gap-8 ${((websiteContent.rooms || []).filter(r=>r.isActive).length === 1) ? 'grid-cols-1' : ((websiteContent.rooms || []).filter(r=>r.isActive).length === 2) ? 'grid-cols-1 md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3'}`}>
            {(websiteContent.rooms || []).filter(room => room.isActive).map((room, index) => (
              <Card key={index} className="overflow-hidden group hover:shadow-lg transition-shadow duration-300">
                <div className="relative overflow-hidden">
                  <img
                    src={getImageUrl(room.image, hotel?.images?.[0])}
                    alt={room.title}
                    className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/abstract-geometric-shapes.png";
                    }}
                  />
                  <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground">
                    From रु{room.price}/night
                  </Badge>
                </div>
                <CardHeader>
                  <CardTitle className="text-xl">{room.title}</CardTitle>
                  <CardDescription>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {room.features.map((feature, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    className="w-full bg-accent hover:bg-accent/90 text-accent-foreground flex items-center justify-center gap-2"
                    onClick={handleWhatsAppContact}
                  >
                    <WhatsAppIcon className="w-4 h-4" />
                    Book Now
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      
      {/* Amenities Section */}
      <section id="amenities" className="py-20 bg-muted">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">Hotel Amenities</h2>
            <p className="text-xl text-muted-foreground">{websiteContent.amenitiesDescription || 'Everything you need for a comfortable and memorable stay'}</p>
          </div>
          {Array.isArray(websiteContent.amenitiesDetailed) && websiteContent.amenitiesDetailed.length > 0 ? (
            <div className={`grid gap-8 ${websiteContent.amenitiesDetailed.length <= 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-2 md:grid-cols-4'}`}>
              {websiteContent.amenitiesDetailed.filter(a=>a.isActive !== false).map((a, idx) => (
                <Card key={idx} className="group hover:shadow-lg transition-shadow duration-300">
                  <div className="relative overflow-hidden">
                    {a.image && (
                      <img
                        src={getImageUrl(a.image, hotel?.images?.[0])}
                        alt={a.name}
                        className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "/abstract-geometric-shapes.png";
                        }}
                      />
                    )}
                    <div className={`${a.image ? 'absolute bottom-2 right-2' : 'mx-auto mt-4'} w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      {(() => {
                        const IconComponent = lucideIcons[a.icon || 'Star'];
                        return IconComponent ? <IconComponent className="w-6 h-6 text-primary-foreground" /> : null;
                      })()}
                    </div>
                  </div>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-foreground">{a.name}</CardTitle>
                    {a.description && (<CardDescription className="text-muted-foreground">{a.description}</CardDescription>)}
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {(websiteContent.amenities || []).map((amenity, idx) => {
                // Handle both string and object formats
                const amenityName = typeof amenity === 'string' ? amenity : amenity.name;
                const amenityIcon = typeof amenity === 'object' ? amenity.icon : 'Star';
                
                return (
                  <Card key={idx} className="group hover:shadow-lg transition-shadow duration-300 text-center p-4">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg group-hover:scale-110 transition-transform duration-300">
                      {(() => {
                        const IconComponent = lucideIcons[amenityIcon];
                        return IconComponent ? <IconComponent className="w-6 h-6 text-primary-foreground" /> : null;
                      })()}
                    </div>
                    <CardTitle className="text-sm font-semibold text-foreground">{amenityName}</CardTitle>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-muted/50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">What Our Guests Say</h2>
            <p className="text-xl text-muted-foreground">{websiteContent.testimonialsDescription || 'Hear from travelers who have experienced the magic of Nepal with us'}</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {(websiteContent.testimonials || []).filter(t => t.isActive).map((testimonial, index) => (
              <Card key={index} className="bg-card">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    {testimonial.image ? (
                      <img
                        src={getImageUrl(testimonial.image, hotel?.images?.[0])}
                        alt={testimonial.name}
                        className="w-8 h-8 rounded-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(testimonial.name)}&background=random`;
                        }}
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-primary-foreground text-sm">{testimonial.name?.charAt(0)}</span>
                      </div>
                    )}
                    {Array.from({ length: testimonial.rating || 5 }).map((_, i) => (
                      <lucideIcons.Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <CardTitle className="text-lg">{testimonial.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground italic">"{testimonial.comment}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact & Footer */}
      <footer id="contact" className="bg-foreground text-background py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-2xl font-bold mb-4">{hotel?.name}</h3>
              <p className="text-background/80 mb-4">{websiteContent.footerDescription || 'Experience authentic Nepali hospitality in the heart of the Himalayas. Your gateway to adventure and tranquility.'}</p>
              {websiteContent.contactInfo?.address && (
                <div className="flex items-start gap-2 text-background/80 mb-2">
                  <MapPin className="w-4 h-4 mt-1 flex-shrink-0" />
                  <span>{websiteContent.contactInfo.address}</span>
                </div>
              )}
              {websiteContent.contactInfo?.phone && (
                <div className="flex items-center gap-2 text-background/80 mb-2">
                  <Phone className="w-4 h-4" />
                  <a href={`tel:${websiteContent.contactInfo.phone}`} className="hover:text-background transition-colors">
                    {websiteContent.contactInfo.phone}
                  </a>
                </div>
              )}
              {websiteContent.contactInfo?.email && (
                <div className="flex items-center gap-2 text-background/80 mb-2">
                  <Mail className="w-4 h-4" />
                  <a href={`mailto:${websiteContent.contactInfo.email}`} className="hover:text-background transition-colors">
                    {websiteContent.contactInfo.email}
                  </a>
                </div>
              )}
              {hotel?.contact?.phone && !websiteContent.contactInfo?.phone && (
                <div className="flex items-center gap-2 text-background/80 mb-2">
                  <Phone className="w-4 h-4" />
                  <a href={`tel:${hotel.contact.phone}`} className="hover:text-background transition-colors">
                    {hotel.contact.phone}
                  </a>
                </div>
              )}
              {hotel?.contact?.reception && (
                <div className="flex items-center gap-2 text-background/80 mb-2">
                  <Phone className="w-4 h-4" />
                  <span>{hotel.contact.reception}</span>
                </div>
              )}
              {hotel?.contact?.email && !websiteContent.contactInfo?.email && (
                <div className="flex items-center gap-2 text-background/80">
                  <Mail className="w-4 h-4" />
                  <a href={`mailto:${hotel.contact.email}`} className="hover:text-background transition-colors">
                    {hotel.contact.email}
                  </a>
                </div>
              )}
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-background/80">
                <li><a href="#rooms" className="hover:text-background transition-colors">Rooms & Suites</a></li>
                <li><a href="#amenities" className="hover:text-background transition-colors">Amenities</a></li>
                <li><a href="#contact" className="hover:text-background transition-colors">Contact Us</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Book Your Stay</h4>
              <p className="text-background/80 mb-4">Ready to experience the magic of Nepal? Book your room today and start your Himalayan adventure.</p>
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2"
                onClick={handleWhatsAppContact}
              >
                <WhatsAppIcon className="w-4 h-4" />
                Reserve Now
              </Button>
            </div>
          </div>
          <div className="border-t border-background/20 pt-8 text-center text-background/60">
            <p>&copy; {new Date().getFullYear()} {hotel?.name}. All rights reserved.</p>
            {seo && (
              <div className="mt-4 text-xs text-background/40">
                <p>SEO: {seo.title}</p>
                {seo.keywords?.length > 0 && <p>Keywords: {seo.keywords.slice(0, 3).join(', ')}</p>}
              </div>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}