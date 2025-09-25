// components/WebsiteContentManager.tsx
import React, { useState, useEffect, KeyboardEvent, ChangeEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Save, Image as ImageIcon } from 'lucide-react';
import { IconSelector } from "@/components/ui/icon-selector";
import { Hotel } from "@/types/hotel";
import { WebsiteContent, SEOData, RoomItem, TestimonialItem, AmenityDetailed } from "@/types/website";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ImageSelector } from "@/components/ui/image-selector";
import { ImageSelectWithPreview } from "@/components/ui/image-select-with-preview";
import { GalleryModal } from "@/components/ui/gallery-modal";
import styles from "@/styles/websiteContent.module.css";

interface LocalAmenity {
  icon: string;
  name: string;
}

// Type for backend format
interface BackendWebsiteContent extends Omit<WebsiteContent, 'amenities'> {
  amenities: string[];
}

interface WebsiteContentManagerProps {
  hotel?: Hotel;
  onSave: (content: { website: WebsiteContent; seo: SEOData }) => void;
}

// Safer type definitions
type SafeItem<T> = T extends { [key: string]: any } ? Partial<T> : T;

// Safe array handler
const ensureArray = <T extends any>(arr: T[] | undefined | null | any, defaultValue: T[] = []): T[] => {
  if (!arr || !Array.isArray(arr)) {
    console.warn('Expected array but got:', typeof arr);
    return [...defaultValue];
  }
  return [...arr];
};

const ICON_OPTIONS = [
  // Basic Amenities
  'Wifi', 'WifiOff', 'Tv', 'Phone', 'Mail',
  // Room Features
  'Bed', 'Sofa', 'Bath', 'Shower', 'Door', 'Window', 'Lamp', 'Fan', 'Snowflake', 'Thermometer',
  // Kitchen & Dining
  'Coffee', 'Utensils', 'Wine', 'Beer', 'Pizza', 'Cookie', 'Kitchen',
  // Services
  'Car', 'Parking', 'Bus', 'Taxi', 'MapPin', 'Clock', 'Bell',
  // Safety & Security
  'Shield', 'Lock', 'Key', 'Camera', 'FireExtinguisher', 'FirstAid',
  // Cleaning & Maintenance
  'Trash2', 'Wrench', 'Tool', 'Brush',
  // Wellness & Recreation
  'Dumbbell', 'Swim', 'Spa', 'Massage', 'Yoga', 'Running',
  // Business & Work
  'Briefcase', 'Printer', 'Laptop', 'Monitor',
  // Entertainment
  'Music', 'Radio', 'Gamepad2', 'Party',
  // Outdoor & Nature
  'Leaf', 'Sun', 'Cloud', 'Umbrella', 'Tree', 'Mountain',
  // Misc Comforts
  'Sparkles', 'Heart', 'Star', 'Coffee', 'Book', 'Palette'
];

// Default amenities list
const DEFAULT_AMENITIES: { name: string; icon: string }[] = [
  { name: "Free WiFi", icon: "Wifi" },
  { name: "Smart TV", icon: "Tv" },
  { name: "Air Conditioning", icon: "Snowflake" },
  { name: "Private Bathroom", icon: "Bath" },
  { name: "Room Service", icon: "Bell" },
  { name: "Coffee Maker", icon: "Coffee" }
];

// Icon mapping for string-to-icon conversion
const ICON_MAPPING: Record<string, string> = {
  'wifi': 'Wifi',
  'tv': 'Tv',
  'air': 'Snowflake',
  'bath': 'Bath',
  'parking': 'Car',
  'restaurant': 'Utensils',
  'pool': 'Swim',
  'gym': 'Dumbbell',
  'spa': 'Sparkles',
  'bar': 'Wine',
  'coffee': 'Coffee',
  'room service': 'Bell',
  'security': 'Shield',
  'laundry': 'Brush',
  'business': 'Briefcase'
};

  const ensureWebsiteDefaults = (website?: Partial<WebsiteContent>): WebsiteContent => {
    const currentDate = new Date().toISOString();

    const processedAmenities: { name: string; icon: string }[] = (() => {
      try {
        if (!Array.isArray(website?.amenities) || website.amenities.length === 0) {
          return [...DEFAULT_AMENITIES];
        }

        if (typeof website.amenities[0] === 'object' && website.amenities[0] !== null) {
          return (website.amenities as Array<{ name?: string; icon?: string }>).map(a => {
            const name = a.name || "";
            const rawIcon = a.icon || "Star";
            // Ensure icon is in our valid options
            const icon = ICON_OPTIONS.includes(rawIcon) ? rawIcon : "Star";
            return { name, icon };
          });
        }

        if (Array.isArray(website.amenities)) {
          return (website.amenities as unknown[] as string[]).map(name => {
            const strName = String(name);
            // Find matching icon or use default
            const icon = Object.entries(ICON_MAPPING).find(([key]) => 
              strName.toLowerCase().includes(key)
            )?.[1] || 'Star';
            return { name: strName, icon };
          });
        }

        return [...DEFAULT_AMENITIES];
      } catch (error) {
        console.error('Error processing amenities:', error);
        return [...DEFAULT_AMENITIES];
      }
    })();  const websiteDefaults: WebsiteContent = {
    heroTitle: website?.heroTitle || "",
    heroSubtitle: website?.heroSubtitle || "",
    heroImage: website?.heroImage || "",
    aboutDescription: website?.aboutDescription || "",
    amenitiesDescription: website?.amenitiesDescription || "",
    experiencesDescription: website?.experiencesDescription || "",
    testimonialsDescription: website?.testimonialsDescription || "",
    footerDescription: website?.footerDescription || "",
    rooms: Array.isArray(website?.rooms) 
      ? website.rooms.map(room => ({
          ...room,
          image: room.image || ""
        })) 
      : [],
    amenities: processedAmenities,
    testimonials: Array.isArray(website?.testimonials) 
      ? website.testimonials.map(t => ({
          name: t.name || "",
          comment: t.comment || "",
          date: t.date || currentDate,
          rating: t.rating || 5,
          image: t.image || "",
          isActive: t.isActive ?? true
        })) as TestimonialItem[] 
      : [],
    contactInfo: {
      phone: website?.contactInfo?.phone || "",
      email: website?.contactInfo?.email || "",
      address: website?.contactInfo?.address || ""
    }
  };

  return websiteDefaults;
};

const WebsiteContentManager: React.FC<WebsiteContentManagerProps> = ({ hotel, onSave }) => {
  // Importing required components at the top
  const { Dialog, DialogContent, DialogHeader, DialogTitle } = require("@/components/ui/dialog");
  const GalleryModal = require("@/components/ui/gallery-modal").GalleryModal;
  const [websiteContent, setWebsiteContent] = useState<WebsiteContent>(() => {
    try {
      console.log('Initializing websiteContent state');
      // Ensure we have a valid initial state even if hotel is undefined
      const defaultContent = ensureWebsiteDefaults();
      const content = hotel?.website ? ensureWebsiteDefaults(hotel.website) : defaultContent;
      
      // Create safe initial state with strict typing
      const safeContent: WebsiteContent = {
        ...content,
        amenities: ensureArray(content.amenities, DEFAULT_AMENITIES).map(a => ({
          name: a.name || '',
          icon: a.icon || 'Star'
        })),
        rooms: ensureArray<RoomItem>(content.rooms, []),
        testimonials: ensureArray<TestimonialItem>(content.testimonials, []),
        contactInfo: content.contactInfo || { phone: '', email: '', address: '' }
      };
      
      console.log('Initial websiteContent:', safeContent);
      return safeContent;
    } catch (error) {
      console.error('Error initializing website content:', error);
      // Return a safe default state
      const fallbackState = {
        heroTitle: '',
        heroSubtitle: '',
        heroImage: '',
        aboutDescription: '',
        amenitiesDescription: '',
        experiencesDescription: '',
        testimonialsDescription: '',
        footerDescription: '',
        rooms: [],
        amenities: [...DEFAULT_AMENITIES],
        testimonials: [],
        contactInfo: { phone: '', email: '', address: '' }
      };
      console.log('Using fallback state:', fallbackState);
      return fallbackState;
    }
  });
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [showIconModal, setShowIconModal] = useState(false);
  const [currentImageField, setCurrentImageField] = useState<{
    type: 'hero' | 'room' | 'amenity' | 'testimonial';
    index?: number;
  } | null>(null);
  const [currentAmenityIndex, setCurrentAmenityIndex] = useState<number | null>(null);
  
  const [seo, setSeo] = useState<SEOData>(() => ({
    title: hotel?.seo?.title || "",
    description: hotel?.seo?.description || "",
    keywords: Array.isArray(hotel?.seo?.keywords) ? hotel.seo.keywords : []
  }));

  const openImageSelector = (type: 'hero' | 'room' | 'amenity' | 'testimonial', index?: number) => {
    setCurrentImageField({ type, index });
    setShowGalleryModal(true);
  };
  
  const handleIconSelect = (iconName: string) => {
    try {
      if (currentAmenityIndex === null) return;
      
      setWebsiteContent((prev: WebsiteContent) => {
        const amenities = ensureArray(prev.amenities, DEFAULT_AMENITIES);
        console.log('Updating icon for amenity:', { currentAmenityIndex, amenities });
        
        // Ensure the icon name is from our valid options
        const validIcon = ICON_OPTIONS.includes(iconName) ? iconName : 'Star';
        
        return {
          ...prev,
          amenities: amenities.map((amenity, idx) =>
            idx === currentAmenityIndex ? { ...amenity, icon: validIcon } : amenity
          )
        };
      });
    } catch (error) {
      console.error('Error in handleIconSelect:', error);
    }
  };

  const addAmenity = () => {
    const amenityName = (newAmenity || '').trim();
    if (!amenityName) return;

    setWebsiteContent((prev: WebsiteContent) => {
      const currentAmenities = ensureArray(prev.amenities, DEFAULT_AMENITIES);
      const newAmenityObj = {
        name: amenityName,
        icon: newAmenityIcon || 'Star'
      };
      
      console.log('Adding new amenity:', newAmenityObj);
      console.log('Current amenities before add:', currentAmenities);
      
      const updatedAmenities = [...currentAmenities, newAmenityObj];
      console.log('Updated amenities:', updatedAmenities);
      
      return {
        ...prev,
        amenities: updatedAmenities
      };
    });
    setNewAmenity("");
    setNewAmenityIcon(ICON_OPTIONS[0]);
  };

  const handleImageSelect = (imageUrl: string) => {
    if (!currentImageField) return;
    
    switch (currentImageField.type) {
      case 'hero':
        setWebsiteContent(prev => ({
          ...prev,
          heroImage: imageUrl
        }));
        break;
      case 'room':
        if (typeof currentImageField.index === 'number') {
          setWebsiteContent(prev => ({
            ...prev,
            rooms: prev.rooms.map((room, idx) =>
              idx === currentImageField.index ? { ...room, image: imageUrl } : room
            )
          }));
        }
        break;
      case 'testimonial':
        if (typeof currentImageField.index === 'number') {
          setWebsiteContent(prev => ({
            ...prev,
            testimonials: prev.testimonials.map((testimonial, idx) =>
              idx === currentImageField.index ? { ...testimonial, image: imageUrl } : testimonial
            )
          }));
        }
        break;
    }
    setShowGalleryModal(false);
    setCurrentImageField(null);
  };
  
  const [activeTab, setActiveTab] = useState("general");
  const [newAmenity, setNewAmenity] = useState("");
  const [newAmenityIcon, setNewAmenityIcon] = useState(ICON_OPTIONS[0]);

  useEffect(() => {
    try {
      console.log('useEffect triggered with hotel:', hotel);
      
      if (hotel) {
        const content = ensureWebsiteDefaults(hotel.website);
        const safeContent = {
          ...content,
          amenities: ensureArray(content.amenities, DEFAULT_AMENITIES),
          rooms: ensureArray(content.rooms, []),
          testimonials: ensureArray(content.testimonials, []),
          contactInfo: content.contactInfo || { phone: '', email: '', address: '' }
        };
        
        console.log('Setting websiteContent from hotel:', safeContent);
        setWebsiteContent(safeContent);
        
        setSeo(hotel.seo || {
          title: "",
          description: "",
          keywords: []
        });
      } else {
        const content = ensureWebsiteDefaults();
        const safeContent = {
          ...content,
          amenities: [...DEFAULT_AMENITIES],
          rooms: [],
          testimonials: [],
          contactInfo: { phone: '', email: '', address: '' }
        };
        
        console.log('Setting default websiteContent:', safeContent);
        setWebsiteContent(safeContent);
        
        setSeo({
          title: "",
          description: "",
          keywords: []
        });
      }
    } catch (error) {
      console.error('Error in useEffect:', error);
    }
  }, [hotel]);

  const handleSave = () => {
    console.log('Saving website content...');
    console.log('Current amenities before processing:', websiteContent.amenities);
    
    // Send amenities as objects with both name and icon, and filter out empty names
    const processedAmenities = ensureArray(websiteContent.amenities, DEFAULT_AMENITIES)
      .map(a => ({
        name: (a.name || '').trim(),
        icon: a.icon || 'Star'
      }))
      .filter(a => a.name !== ''); // Remove amenities with empty names

    console.log('Processed amenities:', processedAmenities);

    // Ensure we have at least one amenity to avoid validation errors
    const finalAmenities = processedAmenities.length > 0
      ? processedAmenities
      : [{ name: "WiFi", icon: "Wifi" }];

    console.log('Final amenities to save:', finalAmenities);

    const backendWebsite = {
      ...websiteContent,
      amenities: finalAmenities
    } as unknown as WebsiteContent;
    
    console.log('Full website content to save:', backendWebsite);
    onSave({ website: backendWebsite, seo });
  };

  const updateField = <T extends keyof WebsiteContent>(field: T, value: WebsiteContent[T]) => {
    setWebsiteContent((prev: WebsiteContent) => ({
      ...prev,
      [field]: value
    }));
  };

  // Ensure amenities are always initialized
  useEffect(() => {
    setWebsiteContent(prev => ({
      ...prev,
      amenities: prev.amenities || DEFAULT_AMENITIES
    }));
  }, []);

  const updateSeoField = <T extends keyof SEOData>(field: T, value: SEOData[T]) => {
    setSeo((prev: SEOData) => ({
      ...prev,
      [field]: value
    }));
  };

  const addRoom = () => {
    setWebsiteContent((prev: WebsiteContent) => ({
      ...prev,
      rooms: [
        ...prev.rooms,
        {
          title: "New Room",
          description: "",
          price: 0,
          features: [],
          image: "",
          isActive: true
        } as RoomItem
      ]
    }));
  };

  const updateRoom = <T extends keyof RoomItem>(index: number, field: T, value: RoomItem[T]) => {
    setWebsiteContent((prev: WebsiteContent) => ({
      ...prev,
      rooms: prev.rooms.map((room, i) => 
        i === index ? { ...room, [field]: value } : room
      )
    }));
  };

  const removeRoom = (index: number) => {
    setWebsiteContent(prev => ({
      ...prev,
      rooms: prev.rooms.filter((_, i) => i !== index)
    }));
  };

  const toggleRoom = (index: number) => {
    setWebsiteContent(prev => ({
      ...prev,
      rooms: prev.rooms.map((room, i) => 
        i === index ? { ...room, isActive: !room.isActive } : room
      )
    }));
  };



  const removeAmenity = (index: number) => {
    setWebsiteContent((prev: WebsiteContent) => {
      const currentAmenities = prev.amenities || DEFAULT_AMENITIES;
      const updatedAmenities = currentAmenities.filter((_, i: number) => i !== index);
      // Ensure we always have at least one amenity
      return {
        ...prev,
        amenities: updatedAmenities.length > 0 ? updatedAmenities : [{ name: "WiFi", icon: "Wifi" }]
      };
    });
  };

  const addTestimonial = () => {
    setWebsiteContent(prev => ({
      ...prev,
      testimonials: [
        ...prev.testimonials,
        {
          name: "New Customer",
          comment: "",
          rating: 5,
          date: new Date().toISOString().split('T')[0],
          image: "",
          isActive: true,
          _id: undefined
        } as TestimonialItem
      ]
    }));
  };

  const updateTestimonial = <T extends keyof TestimonialItem>(
    index: number,
    field: T,
    value: TestimonialItem[T]
  ) => {
    setWebsiteContent((prev: WebsiteContent) => ({
      ...prev,
      testimonials: prev.testimonials.map((testimonial, i) => 
        i === index ? { ...testimonial, [field]: value } : testimonial
      )
    }));
  };

  const removeTestimonial = (index: number) => {
    setWebsiteContent(prev => ({
      ...prev,
      testimonials: prev.testimonials.filter((_, i) => i !== index)
    }));
  };

  const toggleTestimonial = (index: number) => {
    setWebsiteContent(prev => ({
      ...prev,
      testimonials: prev.testimonials.map((testimonial, i) => 
        i === index ? { ...testimonial, isActive: !testimonial.isActive } : testimonial
      )
    }));
  };

  const availableImages = Array.from(new Set([...(hotel?.images || []), ...(hotel?.gallery || [])])).filter(Boolean);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Website Content Management</h2>
        <Button onClick={handleSave} className="flex items-center gap-2">
          <Save size={16} />
          Save Changes
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
        <TabsList className="flex flex-wrap gap-2 mb-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="rooms">Rooms</TabsTrigger>
          <TabsTrigger value="amenities">Amenities</TabsTrigger>
          <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>
        <ScrollArea className="h-[calc(100vh-20rem)]">

        {/* General Settings */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Hero Section</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Hero Title</Label>
                <Input
                  value={websiteContent.heroTitle}
                  onChange={(e) => updateField('heroTitle', e.target.value)}
                  placeholder="Enter hero title"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Hero Subtitle</Label>
                <Textarea
                  value={websiteContent.heroSubtitle}
                  onChange={(e) => updateField('heroSubtitle', e.target.value)}
                  placeholder="Enter hero subtitle"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Hero Image</Label>
                <ImageSelectWithPreview
  value={websiteContent.heroImage || ''}
  onValueChange={(val) => updateField('heroImage', val)}
  availableImages={availableImages}
  label="Select Hero Image"
/>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Section Descriptions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>About Description</Label>
                <Textarea
                  value={websiteContent.aboutDescription}
                  onChange={(e) => updateField('aboutDescription', e.target.value)}
                  placeholder="Enter about section description"
                />
              </div>
              <div className="space-y-2">
                <Label>Amenities Description</Label>
                <Textarea
                  value={websiteContent.amenitiesDescription}
                  onChange={(e) => updateField('amenitiesDescription', e.target.value)}
                  placeholder="Enter amenities section description"
                />
              </div>
              <div className="space-y-2">
                <Label>Experiences Description</Label>
                <Textarea
                  value={websiteContent.experiencesDescription}
                  onChange={(e) => updateField('experiencesDescription', e.target.value)}
                  placeholder="Enter experiences section description"
                />
              </div>
              <div className="space-y-2">
                <Label>Testimonials Description</Label>
                <Textarea
                  value={websiteContent.testimonialsDescription}
                  onChange={(e) => updateField('testimonialsDescription', e.target.value)}
                  placeholder="Enter testimonials section description"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Footer Description</Label>
                <Textarea
                  value={websiteContent.footerDescription}
                  onChange={(e) => updateField('footerDescription', e.target.value)}
                  placeholder="Enter footer description"
                />
              </div>
            </CardContent>
          </Card>

        </TabsContent>

        {/* Rooms Management */}
        <TabsContent value="rooms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Room Showcase</span>
                <Button onClick={addRoom} size="sm">
                  <Plus size={16} className="mr-2" />
                  Add Room
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {ensureArray<RoomItem>(websiteContent.rooms, []).map((room, index) => (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={room.isActive}
                          onCheckedChange={() => toggleRoom(index)}
                        />
                        <Label>Active</Label>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeRoom(index)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Room Title</Label>
                        <Input
                          value={room.title}
                          onChange={(e) => updateRoom(index, 'title', e.target.value)}
                          placeholder="Room title"
                        />
                      </div>
                      <div>
                        <Label>Price ($ per night)</Label>
                        <Input
                          type="number"
                          value={room.price}
                          onChange={(e) => updateRoom(index, 'price', parseFloat(e.target.value) || 0)}
                          placeholder="Price"
                        />
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <Label>Description</Label>
                      <Textarea
                        value={room.description}
                        onChange={(e) => updateRoom(index, 'description', e.target.value)}
                        placeholder="Room description"
                      />
                    </div>
                    
                    <div className="mt-4">
                      <Label>Room Image</Label>
                      <ImageSelectWithPreview
                        value={room.image || ''}
                        onValueChange={(val) => updateRoom(index, 'image', val)}
                        availableImages={availableImages}
                        label="Select Room Image"
                      />
                    </div>
                    
                    <div className="mt-4">
                      <Label>Features (comma separated)</Label>
                      <Input
                        value={room.features.join(", ")}
                        onChange={(e) => updateRoom(index, 'features', e.target.value.split(",").map(f => f.trim()))}
                        placeholder="Feature 1, Feature 2, Feature 3"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Amenities Management */}
        <TabsContent value="amenities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Amenities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Amenities Description</Label>
                <Textarea
                  value={websiteContent.amenitiesDescription}
                  onChange={(e) => updateField('amenitiesDescription', e.target.value)}
                  placeholder="Enter amenities description"
                />
              </div>
              
              <div>
                <Label className="mb-2 block">Amenities List</Label>
                <div className="grid gap-4 md:grid-cols-2">
                  {ensureArray(websiteContent.amenities, DEFAULT_AMENITIES).map((amenity, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 border rounded">
                      <div className="flex items-center gap-2">
                        <IconSelector
                          value={amenity.icon}
                          onValueChange={(icon) => {
                            const updatedAmenities = [...websiteContent.amenities];
                            updatedAmenities[index] = { ...amenity, icon };
                            updateField('amenities', updatedAmenities);
                          }}
                        />
                        <div className="font-medium">{amenity.name}</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAmenity(index)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 flex space-x-2">
                  <IconSelector
                    value={newAmenityIcon}
                    onValueChange={setNewAmenityIcon}
                  />
                  <Input
                    placeholder="New amenity name"
                    value={newAmenity}
                    onChange={(e) => setNewAmenity(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addAmenity()}
                  />
                  <Button onClick={addAmenity}>
                    Add Amenity
                  </Button>
                </div>
                
                {/* Debug info */}
                <div className="mt-4 text-xs text-gray-500">
                  <div>Debug: {websiteContent.amenities.length} amenities</div>
                  <div>New amenity: "{newAmenity}" with icon "{newAmenityIcon}"</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Testimonials Management */}
        <TabsContent value="testimonials" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Testimonials</span>
                <Button onClick={addTestimonial} size="sm">
                  <Plus size={16} className="mr-2" />
                  Add Testimonial
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Testimonials Description</Label>
                <Textarea
                  value={websiteContent.testimonialsDescription}
                  onChange={(e) => updateField('testimonialsDescription', e.target.value)}
                  placeholder="Enter testimonials description"
                />
              </div>
              
              {ensureArray<TestimonialItem>(websiteContent.testimonials, []).map((testimonial, index) => (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={testimonial.isActive}
                          onCheckedChange={() => toggleTestimonial(index)}
                        />
                        <Label>Active</Label>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeTestimonial(index)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label>Customer Name</Label>
                        <Input
                          value={testimonial.name}
                          onChange={(e) => updateTestimonial(index, 'name', e.target.value)}
                          placeholder="Customer name"
                        />
                      </div>
                      <div>
                        <Label>Rating (1-5)</Label>
                        <Input
                          type="number"
                          min="1"
                          max="5"
                          value={testimonial.rating}
                          onChange={(e) => updateTestimonial(index, 'rating', parseInt(e.target.value) || 5)}
                          placeholder="Rating"
                        />
                      </div>
                      <div>
                        <Label>Guest Image</Label>
                        <ImageSelectWithPreview
                          value={testimonial.image || ''}
                          onValueChange={(val) => updateTestimonial(index, 'image', val)}
                          availableImages={availableImages}
                          label="Select Guest Image"
                        />
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <Label>Comment</Label>
                      <Textarea
                        value={testimonial.comment}
                        onChange={(e) => updateTestimonial(index, 'comment', e.target.value)}
                        placeholder="Customer comment"
                      />
                    </div>
                    
                    <div className="mt-4">
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={testimonial.date}
                        onChange={(e) => updateTestimonial(index, 'date', e.target.value)}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contact Information */}
        <TabsContent value="contact" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Phone</Label>
                <Input
                 value={websiteContent.contactInfo?.phone || ""}
                  onChange={(e) => updateField('contactInfo', {
                    ...websiteContent.contactInfo,
                    phone: e.target.value
                  })}
                  placeholder="Phone number"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={websiteContent.contactInfo?.email || ""}
                  onChange={(e) => updateField('contactInfo', {
                    ...(websiteContent.contactInfo || { phone: '', email: '', address: '' }),
                    email: e.target.value
                  })}
                  placeholder="Email address"
                />
              </div>
              <div>
                <Label>Address</Label>
                <Textarea
                  value={websiteContent.contactInfo?.address || ""}
                  onChange={(e) => updateField('contactInfo', {
                    ...(websiteContent.contactInfo || { phone: '', email: '', address: '' }),
                    address: e.target.value
                  })}
                  placeholder="Full address"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEO Settings */}
        <TabsContent value="seo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Page Title</Label>
                <Input
                  value={seo.title}
                  onChange={(e) => updateSeoField('title', e.target.value)}
                  placeholder="Page title for SEO"
                />
              </div>
              <div>
                <Label>Meta Description</Label>
                <Textarea
                  value={seo.description}
                  onChange={(e) => updateSeoField('description', e.target.value)}
                  placeholder="Meta description for search engines"
                />
              </div>
              <div>
                <Label>Keywords</Label>
                <Input
                  value={seo.keywords.join(', ')}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => updateSeoField('keywords', e.target.value.split(',').map(k => k.trim()))}
                  placeholder="Comma-separated keywords"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
};

export default WebsiteContentManager;