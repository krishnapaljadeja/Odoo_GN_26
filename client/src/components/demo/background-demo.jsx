import { Component as NoiseBackground } from "@/components/ui/background-components";
import { Component as GridBackground } from "@/components/ui/grid-background";

export const BackgroundDemo = () => {
  return (
    <GridBackground>
      <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-6">
        <NoiseBackground className="min-h-0 rounded-lg border border-slate-200 p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-950">Backgrounds are ready</h1>
          <p className="mt-3 max-w-xl text-slate-600">
            Use these wrappers for future pages, dashboards, onboarding screens, and empty states.
          </p>
        </NoiseBackground>
      </div>
    </GridBackground>
  );
};

export default BackgroundDemo;
