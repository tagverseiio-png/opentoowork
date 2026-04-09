import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, ChevronsUpDown, Check } from "lucide-react";
import heroImage from "@/assets/hero-boardroom.jpg";
import usaCities from "@/lib/usa_cities_cleaned.json";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

const HERO_LOCATIONS = [
  "all",
  "Remote (US)",
  ...usaCities.map((c) => (c.state_code ? `${c.city}, ${c.state_code}` : c.city)),
];

// Helper to abbreviate location display
const getDisplayLocation = (location: string): string => {
  if (!location || location === "all") return "Any Location";
  // Extract just the city name (before the comma)
  const parts = location.split(",");
  return parts[0].trim();
};

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
  const [locationOpen, setLocationOpen] = useState(false);
  const [locationSearch, setLocationSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const searchTimeoutRef = useRef<NodeJS.Timeout>(null);

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(locationSearch);
    }, 150);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [locationSearch]);

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
                <Popover open={locationOpen} onOpenChange={setLocationOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={locationOpen}
                      className="h-14 w-full justify-between border-border/50 focus:border-primary transition-colors text-base font-normal"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <MapPin className="h-5 w-5 text-muted-foreground shrink-0" />
                        <span className={`truncate ${!locationFilter && "text-muted-foreground"}`}>
                          {getDisplayLocation(locationFilter)}
                        </span>
                      </div>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0" align="start" style={{ width: 'var(--radix-popover-trigger-width)' }}>
                    <Command shouldFilter={false}>
                      <CommandInput
                        placeholder="Search locations..."
                        value={locationSearch}
                        onValueChange={setLocationSearch}
                      />
                      <CommandList className="max-h-60">
                        {debouncedSearch.length < 2 ? (
                          <div className="p-2 text-center text-sm text-muted-foreground">
                            Type to search locations...
                          </div>
                        ) : (
                          <>
                            <CommandEmpty>No location found.</CommandEmpty>
                            <CommandGroup>
                              {HERO_LOCATIONS.filter((location) =>
                                location.toLowerCase().includes(debouncedSearch.toLowerCase())
                              )
                              .slice(0, 50)
                              .map((location) => (
                                <CommandItem
                                  key={location}
                                  value={location}
                                  onSelect={() => {
                                    setLocationFilter(location === "all" ? "" : location);
                                    setLocationOpen(false);
                                  }}
                                >
                                  <Check className={`mr-2 h-4 w-4 ${((location === "all" && !locationFilter) || locationFilter === location) ? "opacity-100" : "opacity-0"}`} />
                                  {location === "all" ? "Any Location" : location}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </>
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
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
