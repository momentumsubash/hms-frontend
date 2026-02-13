"use client"

import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation";

export default function Navbar({hotel, nepaliFlag}) {
    const router = useRouter();
    const handleSubmit = async () => {
        router.push("/login");
    };
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // English-only navbar
    const EnglishNav = () => (
        <>
            <a href="#home" className="text-foreground hover:text-primary transition-colors">Home</a>
            <a href="#rooms" className="text-foreground hover:text-primary transition-colors">Rooms</a>
            <a href="#amenities" className="text-foreground hover:text-primary transition-colors">Amenities</a>
            <a href="#experiences" className="text-foreground hover:text-primary transition-colors">Experiences</a>
            <a href="#contact" className="text-foreground hover:text-primary transition-colors">Contact</a>
        </>
    );

    // Nepali-only navbar
    const NepaliNav = () => (
        <>
            <a href="#home" className="text-foreground hover:text-primary transition-colors">गृहपृष्ठ</a>
            <a href="#rooms" className="text-foreground hover:text-primary transition-colors">कोठाहरू</a>
            <a href="#amenities" className="text-foreground hover:text-primary transition-colors">सुविधाहरू</a>
            <a href="#experiences" className="text-foreground hover:text-primary transition-colors">अनुभवहरू</a>
            <a href="#contact" className="text-foreground hover:text-primary transition-colors">सम्पर्क</a>
        </>
    );

    // Both navbars
    const BothNav = () => (
        <>
            <a href="#home" className="text-foreground hover:text-primary transition-colors">Home (गृहपृष्ठ)</a>
            <a href="#rooms" className="text-foreground hover:text-primary transition-colors">Rooms (कोठाहरू)</a>
            <a href="#amenities" className="text-foreground hover:text-primary transition-colors">Amenities (सुविधाहरू)</a>
            <a href="#experiences" className="text-foreground hover:text-primary transition-colors">Experiences (अनुभवहरू)</a>
            <a href="#contact" className="text-foreground hover:text-primary transition-colors">Contact (सम्पर्क)</a>
        </>
    );

    // Decide which navbar to show
    let navMode = "english";
    if (hotel?.nepaliFlag === true || nepaliFlag === true) navMode = "both";

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
            <div className="max-w-9xl mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex-shrink-0">
                        <h1 className="text-xl font-bold text-foreground">{hotel.name}</h1>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:block">
                        <div className="ml-10 flex items-baseline space-x-8">
                            {navMode === "both" && <BothNav />}
                            {navMode === "english" && <EnglishNav />}
                            {navMode === "nepali" && <NepaliNav />}
                        </div>
                    </div>

                    {/* Login Button */}
                    <div className="hidden md:block">
                        <Button variant="outline" className="mr-2 bg-transparent" onClick={() => handleSubmit()}>
                            Login
                        </Button>
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden">
                        <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-foreground hover:text-primary focus:outline-none focus:text-primary"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
            <div className="md:hidden">
                <div className="px-2 pt-2 pb-3 space-y-1 bg-background border-t border-border">
                    <div>
                        {navMode === "both" && <BothNav />}
                        {navMode === "english" && <EnglishNav />}
                        {navMode === "nepali" && <NepaliNav />}
                    </div>
                    <div className="px-3 py-2 space-y-2">
                        <Button variant="outline" className="w-full bg-transparent" onClick={() => { setIsMenuOpen(false); handleSubmit(); }}>
                            Login
                        </Button>
                        <Button className="w-full" onClick={() => { setIsMenuOpen(false); window.scrollTo({ top: document.getElementById('home').offsetTop, behavior: 'smooth' }); }}>
                            Book Now
                        </Button>
                    </div>
                </div>
            </div>
        )}
      </div>
    </nav>
  )
}
