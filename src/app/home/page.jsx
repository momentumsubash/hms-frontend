"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, Wifi, Coffee, Car, Utensils, MapPin, Phone, Mail } from "lucide-react"
import Navbar from "@/components/navbar"

const WhatsAppIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
  </svg>
)

export default function HotelLandingPage() {
  const handleExploreRooms = () => {
    // You can replace this with actual routing when you create the rooms page
    window.location.href = "/rooms"
  }
  const [hotel, setHotel] = useState(null)
  const hotelId = process.env.NEXT_PUBLIC_HOTEL_ID // Replace with actual ID or get from URL params

  useEffect(() => {

const fetchHotel = async () => {
  try {
    // Get the current domain
    const currentDomain = window.location.hostname;
    console.log('🌐 Fetching hotel for domain:', currentDomain);

    // First try: Public domain endpoint
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/hotels/public/domain?domain=${encodeURIComponent(currentDomain)}`, 
      {
        headers: {
          'Accept': 'application/json',
        },
        // signal: AbortSignal.timeout(10000) // Remove timeout for now to debug
      }
    );

    console.log('📊 Public domain response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('📦 Public domain response data:', data);
      
      if (data.success) {
        setHotel(data.data);
        console.log('✅ Hotel data loaded successfully from public endpoint');
        return data.data;
      } else {
        throw new Error(data.message || 'Public endpoint returned unsuccessful');
      }
    } else {
      // If public endpoint fails, try the authenticated endpoint
      console.log('🔄 Public endpoint failed, trying authenticated endpoint...');
      
      // Get the hotel ID from environment variable
      const hotelId = process.env.NEXT_PUBLIC_HOTEL_ID;
      
      if (!hotelId) {
        throw new Error('Hotel ID not configured in environment variables');
      }

      const authResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/hotels/${hotelId}`, 
        {
          headers: {
            'Accept': 'application/json'
          }
        }
      );

      console.log('📊 Authenticated response status:', authResponse.status);

      if (authResponse.ok) {
        const authData = await authResponse.json();
        console.log('📦 Authenticated response data:', authData);
        
        if (authData.success) {
          setHotel(authData.data);
          console.log('✅ Hotel data loaded successfully from authenticated endpoint');
          return authData.data;
        } else {
          throw new Error(authData.message || 'Authenticated endpoint returned unsuccessful');
        }
      } else {
        throw new Error(`Authenticated endpoint failed: ${authResponse.status}`);
      }
    }
    
  } catch (error) {
    console.error("❌ Error fetching hotel:", error.message);
    
    // Final fallback: Try without domain parameter
    try {
      console.log('🔄 Trying fallback method without domain parameter...');
      
      const fallbackResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/hotels/public/domain`, 
        {
          headers: {
            'Accept': 'application/json',
            'Origin': window.location.origin
          }
        }
      );
      
      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        if (fallbackData.success) {
          setHotel(fallbackData.data);
          console.log('✅ Fallback hotel data loaded');
          return fallbackData.data;
        }
      }
    } catch (fallbackError) {
      console.error("❌ Fallback also failed:", fallbackError.message);
    }
    
    // Set a default empty hotel or error state
    setHotel(null);
    return null;
  }
}
    fetchHotel()
  }, [])

  const handleWhatsAppContact = () => {
    // Clean phone number - remove spaces, dashes, and ensure proper format
    let phoneNumber = hotel?.phone || "+9779851179962"

    // Remove all non-digit characters except the leading +
    phoneNumber = phoneNumber.replace(/[^\d+]/g, '')

    // Ensure it starts with + if it doesn't already
    if (!phoneNumber.startsWith('+')) {
      phoneNumber = '+' + phoneNumber
    }

    const message = `Hello! I would like to book a room at ${hotel?.name || "Your Hotel"}.`
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`

    // Add error handling for popup blockers
    try {
      const newWindow = window.open(whatsappUrl, "_blank")
      if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
        // Popup was blocked, fallback to direct navigation
        window.location.href = whatsappUrl
      }
    } catch (error) {
      console.error('Error opening WhatsApp:', error)
      // Fallback to direct navigation
      window.location.href = whatsappUrl
    }
  }

  if (!hotel) {
    return <div className="min-h-screen flex items-center justify-center text-lg">Loading hotel details...</div>
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar hotel={hotel} />

      {/* Hero Section */}
      <section id="home" className="relative h-screen flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(/${hotel?.images?.[0] || 'https://source.unsplash.com/1600x900/?nepal,mountains'})`,
          }}
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-4">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-balance">Experience the Serenity of Nepal</h1>
          <p className="text-xl md:text-2xl mb-8 text-balance opacity-90">
            Your Home Away from Home in the Heart of the Himalayas
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
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-foreground px-8 py-3 text-lg bg-transparent"
              onClick={handleExploreRooms}
            >
              Explore Rooms
            </Button>
          </div>
        </div>
      </section>

      {/* Accommodation Showcase */}
      <section id="rooms" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">Our Accommodations</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose from our carefully designed rooms, each offering stunning mountain views and authentic Nepali
              hospitality
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Deluxe Mountain View",
                price: "$120",
                image: "luxury hotel room with mountain view through large windows in nepal style decor",
                features: ["Mountain View", "King Bed", "Private Balcony"],
              },
              {
                title: "Traditional Suite",
                price: "$180",
                image: "traditional nepali style hotel suite with wooden furniture and cultural decorations",
                features: ["Cultural Decor", "Sitting Area", "Premium Amenities"],
              },
              {
                title: "Himalayan Retreat",
                price: "$250",
                image: "luxury suite with panoramic himalayan mountain views and modern amenities",
                features: ["Panoramic Views", "Jacuzzi", "Private Terrace"],
              },
            ].map((room, index) => (
              <Card key={index} className="overflow-hidden group hover:shadow-lg transition-shadow duration-300">
                <div className="relative overflow-hidden">
                  <img
                    src={`/abstract-geometric-shapes.png?height=300&width=400&query=${room.image}`}
                    alt={room.title}
                    className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground">
                    From {room.price}/night
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
            <p className="text-xl text-muted-foreground">Everything you need for a comfortable and memorable stay</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: Wifi, title: "Free WiFi", desc: "High-speed internet throughout" },
              { icon: Coffee, title: "Restaurant", desc: "Authentic Nepali & International cuisine" },
              { icon: Car, title: "Airport Transfer", desc: "Complimentary pickup service" },
              { icon: Utensils, title: "Room Service", desc: "24/7 in-room dining" },
            ].map((amenity, index) => (
              <div key={index} className="text-center group">
                <div className="w-16 h-16 mx-auto mb-4 bg-primary rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <amenity.icon className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{amenity.title}</h3>
                <p className="text-muted-foreground text-sm">{amenity.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Local Experiences */}
      <section id="experiences" className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">Discover Nepal</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Immerse yourself in the rich culture and breathtaking landscapes of Nepal with our curated experiences
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Everest Base Camp Trek",
                image: "trekkers walking towards everest base camp with prayer flags and mountain views",
                description: "Join our guided trek to the world's most famous base camp",
              },
              {
                title: "Cultural Temple Tours",
                image: "ancient buddhist temples and stupas in kathmandu with prayer wheels and monks",
                description: "Explore ancient temples and learn about Buddhist traditions",
              },
              {
                title: "Himalayan Sunrise",
                image: "golden sunrise over himalayan peaks with dramatic clouds and mountain silhouettes",
                description: "Witness breathtaking sunrises over the world's highest peaks",
              },
            ].map((experience, index) => (
              <Card key={index} className="overflow-hidden group hover:shadow-lg transition-shadow duration-300">
                <div className="relative overflow-hidden">
                  <img
                    src={`/abstract-geometric-shapes.png?height=250&width=400&query=${experience.image}`}
                    alt={experience.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <CardHeader>
                  <CardTitle className="text-xl">{experience.title}</CardTitle>
                  <CardDescription>{experience.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground bg-transparent"
                  >
                    Learn More
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-muted">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">What Our Guests Say</h2>
            <p className="text-xl text-muted-foreground">
              Hear from travelers who have experienced the magic of Nepal with us
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah Johnson",
                location: "United States",
                rating: 5,
                review:
                  "An absolutely magical experience! The mountain views from our room were breathtaking, and the staff went above and beyond to make our stay memorable.",
              },
              {
                name: "David Chen",
                location: "Singapore",
                rating: 5,
                review:
                  "Perfect location for exploring Nepal. The cultural tours arranged by the hotel were incredible, and the traditional Nepali breakfast was delicious.",
              },
              {
                name: "Emma Wilson",
                location: "Australia",
                rating: 5,
                review:
                  "The hospitality here is unmatched. From the warm welcome to the comfortable rooms, everything exceeded our expectations. Can't wait to return!",
              },
            ].map((testimonial, index) => (
              <Card key={index} className="bg-card">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <CardTitle className="text-lg">{testimonial.name}</CardTitle>
                  <CardDescription>{testimonial.location}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground italic">"{testimonial.review}"</p>
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
              <p className="text-background/80 mb-4">
                Experience authentic Nepali hospitality in the heart of the Himalayas. Your gateway to adventure and
                tranquility.
              </p>
              <div className="flex items-center gap-2 text-background/80 mb-2">
                <MapPin className="w-4 h-4" />
                <span>{hotel?.address?.street}</span>
              </div>
              <div className="flex items-center gap-2 text-background/80 mb-2">
                <Phone className="w-4 h-4" />
                <span>{hotel?.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-background/80">
                <Mail className="w-4 h-4" />
                {/* <span>info@nepalmountainhotel.com</span> */}
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-background/80">
                <li>
                  <a href="#" className="hover:text-background transition-colors">
                    Rooms & Suites
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-background transition-colors">
                    Amenities
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-background transition-colors">
                    Local Tours
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-background transition-colors">
                    Restaurant
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-background transition-colors">
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Book Your Stay</h4>
              <p className="text-background/80 mb-4">
                Ready to experience the magic of Nepal? Book your room today and start your Himalayan adventure.
              </p>
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
            <p>&copy; 2024 {hotel?.name}. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Sticky CTA */}
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          size="lg"
          className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg flex items-center gap-2"
          onClick={handleWhatsAppContact}
        >
          <WhatsAppIcon className="w-5 h-5" />
          Book Your Stay
        </Button>
      </div>
    </div>
  )
}
