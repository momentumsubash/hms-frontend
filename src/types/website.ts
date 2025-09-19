export interface AmenityDetailed {
  name: string;
  description: string;
  icon: string;
  image: string;
  isActive: boolean;
}

export interface RoomItem {
  title: string;
  description: string;
  price: number;
  features: string[];
  image: string;
  isActive: boolean;
  _id?: string;
}

export interface TestimonialItem {
  name: string;
  comment: string;
  rating: number;
  date: string;
  image: string;
  isActive: boolean;
  _id?: string;
}

export interface ContactInfo {
  phone: string;
  email: string;
  address: string;
}

export interface WebsiteContent {
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  aboutDescription: string;
  amenitiesDescription: string;
  experiencesDescription: string;
  testimonialsDescription: string;
  footerDescription: string;
  rooms: RoomItem[];
  amenities: { name: string; icon: string; }[];
  testimonials: TestimonialItem[];
  contactInfo: ContactInfo;
}

export interface SEOData {
  title: string;
  description: string;
  keywords: string[];
}