import React, { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowRight,
  BookOpen,
  Flame,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { PujaCatalogEntry } from "@/types/catalog.types";
import { catalogApi } from "@/api/catalog.api";

const CATEGORIES = [
  { key: "ALL", label: "All Ceremonies" },
  { key: "life-event", label: "Life Events" },
  { key: "dosha-nivaran", label: "Dosha Nivaran" },
  { key: "festival", label: "Festivals & Vrats" },
  { key: "business", label: "Business & Prosperity" },
  { key: "ancestral", label: "Ancestral & Pitru" },
];

export const FeaturedCeremoniesCarousel: React.FC = () => {
  const [allPujas, setAllPujas] = useState<PujaCatalogEntry[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchCatalog() {
      const data = await catalogApi.getCatalog();
      setAllPujas(data || []);
    }
    fetchCatalog();
  }, []);

  const filteredPujas = allPujas.filter(
    (puja) => selectedCategory === "ALL" || puja.category === selectedCategory,
  );

  // Cards to display in carousel (limit to max 12 for high quality presentation)
  const displayPujas = filteredPujas.slice(0, 12);
  const totalCards = displayPujas.length;

  const maxIndex = Math.max(0, totalCards - 1);

  // Reset current index when category changes
  const handleCategorySelect = (categoryKey: string) => {
    setSelectedCategory(categoryKey);
    setCurrentIndex(0);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ left: 0, behavior: "smooth" });
    }
  };

  const scrollToIndex = useCallback(
    (index: number) => {
      const targetIndex = Math.max(0, Math.min(index, maxIndex));
      setCurrentIndex(targetIndex);

      if (scrollContainerRef.current) {
        const cardWidth = 320; // approximate width + gap
        scrollContainerRef.current.scrollTo({
          left: targetIndex * cardWidth,
          behavior: "smooth",
        });
      }
    },
    [maxIndex],
  );

  const handlePrev = () => {
    scrollToIndex(currentIndex > 0 ? currentIndex - 1 : maxIndex);
  };

  const handleNext = () => {
    scrollToIndex(currentIndex < maxIndex ? currentIndex + 1 : 0);
  };

  // Auto-play interval (pauses on hover)
  useEffect(() => {
    if (isPaused || totalCards <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = prev + 1 > maxIndex ? 0 : prev + 1;
        if (scrollContainerRef.current) {
          const cardWidth = 320;
          scrollContainerRef.current.scrollTo({
            left: next * cardWidth,
            behavior: "smooth",
          });
        }
        return next;
      });
    }, 4500);

    return () => clearInterval(timer);
  }, [isPaused, maxIndex, totalCards]);

  return (
    <div
      className="w-full space-y-6"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Category Filter Pills & Carousel Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => handleCategorySelect(cat.key)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 border cursor-pointer ${
                  isSelected
                    ? "bg-[#780016] text-white border-[#C59A3F] shadow-sm ring-1 ring-[#C59A3F]/30"
                    : "bg-amber-50/60 text-stone-700 hover:bg-amber-100/80 border-amber-200/70"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Carousel Stepper Controls */}
        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
          <div className="text-xs font-serif text-stone-600 tracking-wider">
            <span className="font-bold text-[#780016] text-sm">
              {String(Math.min(currentIndex + 1, totalCards)).padStart(2, "0")}
            </span>{" "}
            / {String(totalCards).padStart(2, "0")}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous ceremony"
              className="w-8 h-8 rounded-full border border-stone-300 bg-white text-stone-700 hover:text-[#780016] hover:border-[#C59A3F] hover:bg-amber-50/70 shadow-xs flex items-center justify-center transition-all duration-200 active:scale-95 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next ceremony"
              className="w-8 h-8 rounded-full border border-stone-300 bg-white text-stone-700 hover:text-[#780016] hover:border-[#C59A3F] hover:bg-amber-50/70 shadow-xs flex items-center justify-center transition-all duration-200 active:scale-95 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Carousel Cards Track */}
      <div
        ref={scrollContainerRef}
        className="flex gap-5 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scroll-smooth scrollbar-none"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {displayPujas.map((puja, index) => {
          return (
            <motion.div
              key={puja.id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, delay: index * 0.04 }}
              className="snap-start shrink-0 w-71.25 sm:w-[320px] md:w-85 flex flex-col justify-between rounded-2xl border border-amber-900/10 hover:border-[#C59A3F] bg-white shadow-xs hover:shadow-xl transition-all duration-300 group overflow-hidden"
            >
              {/* Cover Image Container */}
              <div className="relative aspect-16/10 w-full overflow-hidden bg-stone-900">
                <img
                  src={puja.coverImage}
                  alt={puja.name}
                  className="w-full h-full object-cover object-center group-hover:scale-108 transition-transform duration-500 ease-out"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "/images/hero_vedic_puja.jpg";
                  }}
                />

                {/* Dark Vedic Gradient Overlay */}
                <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/25 to-transparent pointer-events-none" />

                {/* Top Category Badge */}
                <div className="absolute top-3 left-3 z-10">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-xs text-amber-300 border border-amber-400/40 shadow-sm">
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    <span>{puja.category.replace("-", " ")}</span>
                  </span>
                </div>

                {/* Top Right Sacred Indicator */}
                <div className="absolute top-3 right-3 z-10">
                  <span className="w-6 h-6 rounded-full bg-black/50 backdrop-blur-xs text-amber-300 flex items-center justify-center border border-amber-400/30 text-xs font-serif">
                    ॐ
                  </span>
                </div>

                {/* Bottom Deity Banner Overlaid on Image */}
                <div className="absolute bottom-2.5 left-3 right-3 z-10">
                  <span className="text-[11px] font-semibold text-amber-100 flex items-center gap-1 drop-shadow-md truncate">
                    <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Deity: {puja.deity}</span>
                  </span>
                </div>
              </div>

              {/* Card Body Content */}
              <div className="p-5 flex flex-col justify-between flex-1 gap-4">
                <div className="space-y-2">
                  <h3 className="font-serif text-lg font-bold text-stone-900 group-hover:text-[#780016] transition-colors line-clamp-1">
                    {puja.name}
                  </h3>

                  <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                    {puja.description}
                  </p>

                  {/* Badges for Duration, Samagri & Steps */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {puja.durationMinutes ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-amber-900 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-medium">
                        <Clock className="w-3 h-3 text-amber-700" />
                        <span>{puja.durationMinutes} mins</span>
                      </span>
                    ) : null}
                    <span className="inline-flex items-center gap-1 text-[11px] text-stone-500 bg-stone-100 px-2 py-0.5 rounded font-medium">
                      <BookOpen className="w-3 h-3 text-amber-700" />
                      <span>{puja.samagriList.length} Items</span>
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] text-stone-500 bg-stone-100 px-2 py-0.5 rounded font-medium">
                      <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                      <span>{puja.steps.length} Steps</span>
                    </span>
                  </div>
                </div>

                {/* Card Footer CTA */}
                <div className="pt-3 border-t border-stone-100">
                  <Link
                    to={`/priests?service=${encodeURIComponent(puja.name)}&catalogId=${puja.id}`}
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold text-[#780016] group-hover:text-white bg-amber-50/70 group-hover:bg-[#780016] rounded-xl transition-all duration-300 border border-amber-300/60 group-hover:border-[#780016] shadow-2xs group-hover:shadow-md cursor-pointer"
                  >
                    <span>Book Priest for Ceremony</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Progress Dots / Bar */}
      <div className="flex items-center justify-center gap-1.5 pt-2">
        {displayPujas.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => scrollToIndex(idx)}
            aria-label={`Go to slide ${idx + 1}`}
            className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
              idx === currentIndex
                ? "w-8 bg-[#780016]"
                : "w-2 bg-stone-300 hover:bg-stone-400"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default FeaturedCeremoniesCarousel;
