"use client";

import type { Transition } from "motion/react";
import { useReducedMotion } from "motion/react";

/** Spring that collapses to instant when user prefers reduced motion */
export function useSpringTap() {
    const reduce = useReducedMotion();
    return reduce
        ? ({ scale: 1 } as const)
        : { scale: 0.94 };
}

export function useSpringHover() {
    const reduce = useReducedMotion();
    return reduce ? 1 : 1.03;
}

export function usePopoverSpring(): Transition {
    const reduce = useReducedMotion();
    return reduce
        ? { type: "tween", duration: 0.16, ease: "easeOut" }
        : { type: "spring", stiffness: 420, damping: 32, mass: 0.85 };
}

export function usePopoverMotion() {
    const reduce = useReducedMotion();
    if (reduce) {
        return {
            initial: { opacity: 0 },
            animate: { opacity: 1 },
            exit: { opacity: 0 },
        } as const;
    }
    return {
        initial: { opacity: 0, y: -10, scale: 0.96 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: -6, scale: 0.98 },
    } as const;
}
