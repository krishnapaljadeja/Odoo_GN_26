import { gsap } from "gsap";
import { Draggable } from "gsap/Draggable";
import { Flip } from "gsap/Flip";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { Observer } from "gsap/Observer";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { TextPlugin } from "gsap/TextPlugin";
import { CustomEase } from "gsap/CustomEase";
import { RoughEase, ExpoScaleEase, SlowMo } from "gsap/EasePack";
import { useGSAP } from "@gsap/react";

const corePlugins = [
  Draggable,
  Flip,
  MotionPathPlugin,
  Observer,
  ScrollSmoother,
  ScrollToPlugin,
  ScrollTrigger,
  SplitText,
  TextPlugin,
  CustomEase,
  RoughEase,
  ExpoScaleEase,
  SlowMo,
  useGSAP,
];

let registered = false;

export const registerGsap = () => {
  if (registered) return;

  gsap.registerPlugin(...corePlugins);
  registered = true;
};

export const loadGsapExtras = async () => {
  const [
    { DrawSVGPlugin },
    { EaselPlugin },
    { InertiaPlugin },
    { MorphSVGPlugin },
    { Physics2DPlugin },
    { PhysicsPropsPlugin },
    { PixiPlugin },
    { ScrambleTextPlugin },
    { CustomBounce },
    { CustomWiggle },
  ] = await Promise.all([
    import("gsap/DrawSVGPlugin"),
    import("gsap/EaselPlugin"),
    import("gsap/InertiaPlugin"),
    import("gsap/MorphSVGPlugin"),
    import("gsap/Physics2DPlugin"),
    import("gsap/PhysicsPropsPlugin"),
    import("gsap/PixiPlugin"),
    import("gsap/ScrambleTextPlugin"),
    import("gsap/CustomBounce"),
    import("gsap/CustomWiggle"),
  ]);

  gsap.registerPlugin(
    DrawSVGPlugin,
    EaselPlugin,
    InertiaPlugin,
    MorphSVGPlugin,
    Physics2DPlugin,
    PhysicsPropsPlugin,
    PixiPlugin,
    ScrambleTextPlugin,
    CustomBounce,
    CustomWiggle,
  );

  return {
    DrawSVGPlugin,
    EaselPlugin,
    InertiaPlugin,
    MorphSVGPlugin,
    Physics2DPlugin,
    PhysicsPropsPlugin,
    PixiPlugin,
    ScrambleTextPlugin,
    CustomBounce,
    CustomWiggle,
  };
};

export const loadGsapDevTools = async () => {
  const [{ GSDevTools }, { MotionPathHelper }] = await Promise.all([
    import("gsap/GSDevTools"),
    import("gsap/MotionPathHelper"),
  ]);

  gsap.registerPlugin(GSDevTools, MotionPathHelper);

  return {
    GSDevTools,
    MotionPathHelper,
  };
};

export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export {
  gsap,
  useGSAP,
  Draggable,
  Flip,
  MotionPathPlugin,
  Observer,
  ScrollSmoother,
  ScrollToPlugin,
  ScrollTrigger,
  SplitText,
  TextPlugin,
  CustomEase,
  RoughEase,
  ExpoScaleEase,
  SlowMo,
};
