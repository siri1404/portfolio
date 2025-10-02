"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

export default function Home() {
  const nameRef = useRef<HTMLDivElement>(null);
  const imagesRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const [isRevealComplete, setIsRevealComplete] = useState(false);
  const [isNavSticky, setIsNavSticky] = useState(false);
  const wheelHandlerRef = useRef<((e: WheelEvent) => void) | null>(null);
  const navOriginalTopRef = useRef<number>(0);

  useEffect(() => {
    // Initial name animation setup - starts hidden
    if (nameRef.current) {
      gsap.set(nameRef.current, {
        clipPath: "inset(0 0 100% 0)", // Hidden from bottom
        opacity: 0,
        scale: 0.8,
      });
    }

    // Initial images setup - start hidden from top
    if (imagesRef.current) {
      gsap.set(imagesRef.current, {
        y: -window.innerHeight * 0.6, // Start above viewport
        opacity: 0,
      });
    }

    // Initial navigation setup - start hidden
    if (navRef.current) {
      gsap.set(navRef.current, {
        opacity: 0,
      });
    }

    // Create timeline for sequential animations
    const tl = gsap.timeline();

    // First: Animate the name sliding down from top to bottom
    tl.to(nameRef.current, {
      opacity: 1, // Fade in
      clipPath: "inset(0 0 0% 0)", // Fully revealed
      scale: 1,
      duration: 0.8,
      ease: "power2.out",
      delay: 0.2,
    });

    // Second: Move name to left corner and make larger (responsive)
    tl.to(nameRef.current, {
      x: () => {
        const viewportWidth = window.innerWidth;
        if (viewportWidth < 640) return -viewportWidth * 0.35;
        if (viewportWidth < 1024) return -viewportWidth * 0.38;
        return -420;
      },
      y: () => {
        const viewportHeight = window.innerHeight;
        if (window.innerWidth < 640) return viewportHeight * 0.45;
        if (window.innerWidth < 1024) return viewportHeight * 0.48;
        return 315;
      },
      scale: () => window.innerWidth < 640 ? 1.2 : window.innerWidth < 1024 ? 1.3 : 1.5,
      duration: 1.2,
      ease: "power2.out",
    }, "-=0.2");

    // Third: Reveal images after name reaches final position
    tl.to(imagesRef.current, {
      y: 0, // Move to final position
      opacity: 1, // Fade in
      duration: 1.2,
      ease: "power2.out",
    }, "-=0.4") // Start after name is mostly in place
    .to(navRef.current, {
      opacity: 1, // Fade in navigation
      duration: 0.8,
      ease: "power2.out",
    }, "-=0.4"); // Start after images are mostly in place

    // Global scroll handler - prevents page scroll and handles image reveal with smooth transitions
    let accumulatedScroll = 0;
    const maxScroll = 1500; // Total scroll needed for full reveal (increased for smoother animation)

    const handleWheel = (e: WheelEvent) => {
      // If reveal is already complete, allow normal page scrolling
      if (isRevealComplete) {
        return; // Allow normal page scrolling
      }

      // Calculate current reveal progress
      const progress = Math.min(accumulatedScroll / maxScroll, 1);
      const rightReveal = Math.min(Math.max((progress - 0.625) * (8/3), 0), 1);

      // If third column is not completely revealed, prevent page scroll and handle image reveal
      if (rightReveal < 1) {
        e.preventDefault(); // Prevent page scrolling
        e.stopPropagation();

        // Accumulate scroll delta
        accumulatedScroll += e.deltaY;
        accumulatedScroll = Math.max(0, Math.min(accumulatedScroll, maxScroll));

        const newProgress = Math.min(accumulatedScroll / maxScroll, 1);

        // Calculate reveal percentages for each panel
        const leftReveal = Math.min(Math.max(newProgress * (4/3), 0), 1);
        const middleReveal = Math.min(Math.max((newProgress - 0.375) * 2, 0), 1);
        const rightReveal = Math.min(Math.max((newProgress - 0.625) * (8/3), 0), 1);

        // Apply clip-path reveals with smooth transitions
        const revealLayers = document.querySelectorAll('[data-reveal-layer]');
        if (revealLayers.length >= 3) {
          // Left panel
          (revealLayers[0] as HTMLElement).style.transition = 'clip-path 0.1s ease-out';
          (revealLayers[0] as HTMLElement).style.clipPath = `inset(${100 - (leftReveal * 100)}% 0 0 0)`;
          // Middle panel
          (revealLayers[1] as HTMLElement).style.transition = 'clip-path 0.1s ease-out';
          (revealLayers[1] as HTMLElement).style.clipPath = `inset(${100 - (middleReveal * 100)}% 0 0 0)`;
          // Right panel
          (revealLayers[2] as HTMLElement).style.transition = 'clip-path 0.1s ease-out';
          (revealLayers[2] as HTMLElement).style.clipPath = `inset(${100 - (rightReveal * 100)}% 0 0 0)`;
        }

        // Check if reveal is complete
        if (rightReveal >= 1 && !isRevealComplete) {
          setIsRevealComplete(true);
        }
      } else {
        // Third column is complete, allow normal page scrolling
        setIsRevealComplete(true);
      }
    };

    // Store the handler in ref
    wheelHandlerRef.current = handleWheel;

    // Add global wheel event listener
    window.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      if (wheelHandlerRef.current) {
        window.removeEventListener('wheel', wheelHandlerRef.current);
      }
    };
  }, []);

  // Remove event listener when reveal is complete
  useEffect(() => {
    if (isRevealComplete && wheelHandlerRef.current) {
      window.removeEventListener('wheel', wheelHandlerRef.current);
      wheelHandlerRef.current = null;
    }
  }, [isRevealComplete]);

  // Handle sticky navigation when scrolling after reveal is complete
  useEffect(() => {
    if (!isRevealComplete || !navRef.current) return;

    // Store original position on first reveal
    if (navOriginalTopRef.current === 0 && navRef.current) {
      const rect = navRef.current.getBoundingClientRect();
      navOriginalTopRef.current = rect.top + window.scrollY;
    }

    const handleScroll = () => {
      const navElement = navRef.current;
      if (!navElement) return;

      const scrollY = window.scrollY;
      const originalTop = navOriginalTopRef.current;

      // Make nav sticky when scrolling past original position
      if (scrollY >= originalTop - 10) {
        setIsNavSticky(true);
      } else {
        setIsNavSticky(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial state
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isRevealComplete]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-pink-50 to-rose-100 relative">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-pink-200 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-rose-200 rounded-full opacity-15 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-300 rounded-full opacity-10 blur-3xl"></div>
      </div>
      
      {/* Three images at the top */}
      <div ref={imagesRef} className="absolute top-0 left-0 w-full h-[65vh] flex">
        <div className="w-1/3 h-full relative overflow-hidden">
          {/* Base layer - always visible */}
          <div className="absolute inset-0">
            <img 
              src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop" 
              alt="Mountain landscape" 
              className="w-full h-full object-cover"
            />
          </div>
          {/* Reveal layer - clips based on scroll */}
          <div 
            className="absolute inset-0 overflow-hidden"
            data-reveal-layer
            style={{
              clipPath: "inset(100% 0 0 0)", // Hidden from top initially
            }}
          >
            <img 
              src="https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&h=600&fit=crop" 
              alt="City skyline" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        <div className="w-1/3 h-full relative overflow-hidden">
          {/* Base layer */}
          <div className="absolute inset-0">
            <img 
              src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop" 
              alt="Forest path" 
              className="w-full h-full object-cover"
            />
          </div>
          {/* Reveal layer */}
          <div 
            className="absolute inset-0 overflow-hidden"
            data-reveal-layer
            style={{
              clipPath: "inset(100% 0 0 0)", // Hidden from top initially
            }}
          >
            <img 
              src="https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&h=600&fit=crop" 
              alt="Desert landscape" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        <div className="w-1/3 h-full relative overflow-hidden">
          {/* Base layer */}
          <div className="absolute inset-0">
            <img 
              src="https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=800&h=600&fit=crop" 
              alt="Ocean waves" 
              className="w-full h-full object-cover"
            />
          </div>
          {/* Reveal layer */}
          <div 
            className="absolute inset-0 overflow-hidden"
            data-reveal-layer
            style={{
              clipPath: "inset(100% 0 0 0)", // Hidden from top initially
            }}
          >
            <img 
              src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop" 
              alt="Snow mountains" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* Navigation - becomes sticky when scrolling */}
      <div
        ref={navRef}
        style={{
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        className={`${
          isNavSticky
            ? 'fixed top-0 left-0 bg-gradient-to-r from-pink-50/90 via-rose-50/90 to-pink-50/90 backdrop-blur-md shadow-md'
            : 'absolute top-[67vh] left-0'
        } w-full py-4 z-50`}
      >
        {/* Home text in left corner below images */}
        <div className="absolute left-4 sm:left-8 text-pink-600 text-sm sm:text-base font-bold">
          home
        </div>

        {/* Navigation items below center image */}
        <div className="absolute left-1/2 -translate-x-1/2 text-pink-600 text-xs sm:text-sm md:text-base font-bold flex flex-wrap gap-2 sm:gap-4 items-center justify-center">
          <span className="whitespace-nowrap">projects</span>
          <span className="whitespace-nowrap">work</span>
          <span className="whitespace-nowrap">resume</span>
          <span className="whitespace-nowrap">contact</span>
          <span className="whitespace-nowrap ml-4 sm:ml-8">dark/light</span>
        </div>

        {/* Menu text in right corner */}
        <div className="absolute right-4 sm:right-8 text-pink-600 text-sm sm:text-base font-bold">
          menu
        </div>
      </div>


      {/* Main content */}
      <div className="relative z-20 flex items-center justify-center min-h-screen px-4">
        <div
          ref={nameRef}
          className="relative"
          style={{ opacity: 0 }}
        >
          <h1
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-pink-600 tracking-tight space-grotesk-bold whitespace-nowrap"
          >
            Pooja Kanala
          </h1>
        </div>
      </div>

      {/* Next Page - only accessible after image reveal is complete */}
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-4xl md:text-6xl text-blue-600 tracking-tight space-grotesk-bold mb-8">
            Projects
          </h2>
          <p className="text-lg text-blue-500 max-w-2xl mx-auto">
            This page is only accessible after all images are completely revealed. Scroll up to see the image reveal system in action.
          </p>
        </div>
      </div>
    </div>
  );
}
