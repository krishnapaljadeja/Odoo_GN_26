import React, { useRef } from "react";
import { gsap, prefersReducedMotion, registerGsap, useGSAP } from "../../../lib/gsap";

const Reveal = ({ as: Component = "div", children, className = "", delay = 0, y = 24, ...props }) => {
  const element = useRef(null);

  useGSAP(
    () => {
      registerGsap();

      if (prefersReducedMotion()) return;

      gsap.fromTo(
        element.current,
        { autoAlpha: 0, y },
        {
          autoAlpha: 1,
          y: 0,
          delay,
          duration: 0.65,
          ease: "power3.out",
          scrollTrigger: {
            trigger: element.current,
            start: "top 85%",
            once: true,
          },
        },
      );
    },
    { scope: element, dependencies: [delay, y] },
  );

  return (
    <Component ref={element} className={className} {...props}>
      {children}
    </Component>
  );
};

export default Reveal;
