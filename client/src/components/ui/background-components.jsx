import { cn } from "@/lib/utils";

export const SoftYellowGlowBackground = ({ children, className }) => {
  return (
    <div className={cn("min-h-screen w-full relative bg-[#0b0f19] text-zinc-100", className)}>
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `
            url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 20h40M20 0v40' stroke='%231e293b' stroke-width='1'/%3E%3Cpath d='M18 20h4M20 18v4' stroke='%23334155' stroke-width='1'/%3E%3C/svg%3E")
          `,
          backgroundSize: "40px 40px",
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export const NoiseTextureBackground = ({ children, className }) => {
  return (
    <div className={cn("min-h-screen w-full relative bg-[#0b0f19] text-zinc-100", className)}>
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `
            url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 20h40M20 0v40' stroke='%231e293b' stroke-width='1'/%3E%3Cpath d='M18 20h4M20 18v4' stroke='%23334155' stroke-width='1'/%3E%3C/svg%3E")
          `,
          backgroundSize: "40px 40px",
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export const Component = SoftYellowGlowBackground;

export default SoftYellowGlowBackground;
