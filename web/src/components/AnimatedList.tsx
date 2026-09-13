"use client";

import { motion, useInView } from "motion/react";
import {
  Children,
  isValidElement,
  useRef,
  type ReactElement,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

interface AnimatedItemProps {
  children: ReactNode;
  delay?: number;
  index: number;
  className?: string;
}

function AnimatedItem({
  children,
  delay = 0,
  index,
  className,
}: AnimatedItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.15, once: true });

  return (
    <motion.div
      ref={ref}
      data-index={index}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface AnimatedListProps {
  children: ReactNode;
  className?: string;
  itemClassName?: string;
  staggerDelay?: number;
}

export default function AnimatedList({
  children,
  className = "",
  itemClassName = "",
  staggerDelay = 0.08,
}: AnimatedListProps) {
  const items = Children.toArray(children).filter(isValidElement);

  return (
    <div className={className}>
      {items.map((child, index) => (
        <AnimatedItem
          key={(child as ReactElement).key ?? index}
          index={index}
          delay={index * staggerDelay}
          className={itemClassName}
        >
          {child}
        </AnimatedItem>
      ))}
    </div>
  );
}

export function AnimatedGrid({
  children,
  className,
  itemClassName,
  staggerDelay = 0.08,
}: AnimatedListProps) {
  return (
    <AnimatedList
      className={cn("contents", className)}
      itemClassName={itemClassName}
      staggerDelay={staggerDelay}
    >
      {children}
    </AnimatedList>
  );
}
