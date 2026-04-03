import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, Briefcase } from "lucide-react";
import heroImage from "@/assets/hero-boardroom.jpg";
import usaCities from "@/lib/usa_cities_cleaned.json";

const HERO_LOCATIONS = [
  "all",
  "Remote (US)",
  ...usaCities.slice(0, 200).map((c) => (c.state_code ? `${c.city}, ${c.state_code}` : c.city)),
];

interface HeroSectionProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  locationFilter: string;
  setLocationFilter: (value: string) => void;
  visaFilter: string;
  setVisaFilter: (value: string) => void;
  onSearch: () => void;
  heroImage?: string;
}

const HeroSection = ({
  searchTerm,
  setSearchTerm,
  locationFilter,
  setLocationFilter,
  visaFilter,
  setVisaFilter,
  onSearch,
  heroImage
}: HeroSectionProps) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onSearch();
    }
  };
  const backgroundImage = heroImage || heroImage;
  return (
    <section className="relative min-h-[75vh] flex items-center bg-background text-foreground overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      ></div>
      <div className="absolute inset-0 bg-black/35"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto text-center space-y-10">
          <div className="space-y-6 animate-fade-in">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight leading-tight text-white drop-shadow-lg">
              Unlock Your Next <br />Great Opportunity
            </h1>
            <p className="text-xl md:text-2xl lg:text-3xl text-white/95 max-w-3xl mx-auto font-light drop-shadow-md">
              Search. Apply. Grow. Your journey starts now.
            </p>
          </div>
          
          {/* Premium Search Card */}
          <div className="bg-background rounded-3xl p-8 md:p-10 shadow-2xl backdrop-blur-sm animate-scale-in max-w-4xl mx-auto">
            <div className="grid md:grid-cols-[1fr_1fr_auto] gap-4 items-end">
              <div className="relative">
                <label className="block text-sm font-semibold text-foreground mb-2 text-left">Job Title / Keyword</label>
                <Search className="absolute left-4 bottom-4 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="e.g. Software Engineer"
                  className="pl-12 h-14 border-border/50 focus:border-primary transition-colors text-base"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
              </div>
              <div className="relative">
                <label className="block text-sm font-semibold text-foreground mb-2 text-left">Location</label>
                <Select
                  value={locationFilter || "all"}
                  onValueChange={(value) => setLocationFilter(value === "all" ? "" : value)}
                >
                  <SelectTrigger className="h-14 border-border/50 focus:border-primary transition-colors text-base">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                      <SelectValue placeholder="Select location" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {HERO_LOCATIONS.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location === "all" ? "Any Location" : location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                className="h-14 px-10 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity text-lg font-semibold shadow-lg rounded-xl" 
                onClick={onSearch}
              >
                Search
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
