"use client";

import type { SpringOptions } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";
import Image from "next/image";

import { cn } from "@/lib/utils";

interface TiltedCardProps {
  children?: ReactNode;
  imageSrc?: string;
  altText?: string;
  className?: string;
  containerClassName?: string;
  scaleOnHover?: number;
  scale?: number;
  rotateAmplitude?: number;
  tiltMaxAngle?: number;
  showMobileWarning?: boolean;
  disableOnMobile?: boolean;
}

const springValues: SpringOptions = {
  damping: 30,
  stiffness: 100,
  mass: 2,
};

export default function TiltedCard({
  children,
  imageSrc,
  altText = "Library cover",
  className = "",
  containerClassName = "",
  scaleOnHover,
  scale = 1.02,
  rotateAmplitude,
  tiltMaxAngle = 8,
  showMobileWarning = false,
  disableOnMobile = true,
}: TiltedCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const rotateX = useSpring(useMotionValue(0), springValues);
  const rotateY = useSpring(useMotionValue(0), springValues);
  const scaleSpring = useSpring(1, springValues);
  const [isMobile, setIsMobile] = useState(false);

  const hoverScale = scaleOnHover ?? scale;
  const maxAngle = rotateAmplitude ?? tiltMaxAngle;
  const tiltEnabled = !disableOnMobile || !isMobile;

  useEffect(() => {
    const media = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  function handleMouse(event: React.MouseEvent) {
    if (!tiltEnabled || !ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const offsetX = event.clientX - rect.left - rect.width / 2;
    const offsetY = event.clientY - rect.top - rect.height / 2;

    rotateX.set((offsetY / (rect.height / 2)) * -maxAngle);
    rotateY.set((offsetX / (rect.width / 2)) * maxAngle);
  }

  function handleMouseEnter() {
    if (!tiltEnabled) return;
    scaleSpring.set(hoverScale);
  }

  function handleMouseLeave() {
    scaleSpring.set(1);
    rotateX.set(0);
    rotateY.set(0);
  }

  return (
    <div className={cn("relative", containerClassName)}>
      {showMobileWarning && isMobile ? (
        <p className="mb-2 text-xs text-muted-foreground md:hidden">
          Tilt effect is disabled on mobile.
        </p>
      ) : null}

      <motion.div
        ref={ref}
        onMouseMove={handleMouse}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX: tiltEnabled ? rotateX : 0,
          rotateY: tiltEnabled ? rotateY : 0,
          scale: scaleSpring,
          transformStyle: "preserve-3d",
        }}
        className={cn("will-change-transform", className)}
      >
        {children ??
          (imageSrc ? (
            <Image
              src={imageSrc}
              alt={altText}
              width={640}
              height={360}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : null)}
      </motion.div>
    </div>
  );
}
