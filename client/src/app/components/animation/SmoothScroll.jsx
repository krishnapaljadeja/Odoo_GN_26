import React, { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { prefersReducedMotion, registerGsap, ScrollSmoother, ScrollTrigger, useGSAP } from "../../../lib/gsap";

const SmoothScroll = ({ children }) => {
  const wrapper = useRef(null);
  const content = useRef(null);
  const location = useLocation();

  useGSAP(
    () => {
      registerGsap();

      if (prefersReducedMotion()) return undefined;

      const smoother = ScrollSmoother.create({
        wrapper: wrapper.current,
        content: content.current,
        smooth: 0.85,
        effects: true,
        normalizeScroll: true,
      });

      return () => smoother.kill();
    },
    { scope: wrapper },
  );

  useEffect(() => {
    ScrollTrigger.refresh();
    if (!prefersReducedMotion()) {
      ScrollSmoother.get()?.scrollTo(0, false);
    }
  }, [location.pathname]);

  return (
    <div ref={wrapper} id="smooth-wrapper">
      <div ref={content} id="smooth-content">
        {children}
      </div>
    </div>
  );
};

export default SmoothScroll;
