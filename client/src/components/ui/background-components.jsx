import { cn } from "@/lib/utils";

export const SoftYellowGlowBackground = ({ children, className }) => {
  return (
    <div className={cn("min-h-screen w-full relative bg-white", className)}>
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `
            radial-gradient(circle at center, #FFF991 0%, transparent 70%)
          `,
          opacity: 0.6,
          mixBlendMode: "multiply",
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export const NoiseTextureBackground = ({ children, className }) => {
  return (
    <div className={cn("min-h-screen w-full bg-white relative", className)}>
      <div
        className="absolute inset-0 z-0"
        style={{
          background: "#ffffff",
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(0, 0, 0, 0.35) 1px, transparent 0)",
          backgroundSize: "20px 20px",
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export const Component = SoftYellowGlowBackground;

export default SoftYellowGlowBackground;
