import { Link } from "react-router-dom";
import { BookOpen, Hexagon, ShieldCheck } from "lucide-react";

const FEATURE_CARDS = [
  {
    title: "Privacy First",
    description:
      "Operates entirely offline. No critical business intelligence leaves your local environment.",
    icon: ShieldCheck,
    glowClass: "bg-blue-50",
    iconClass: "text-blue-600",
  },
  {
    title: "Intelligent Mapping",
    description:
      "Automated semantic chunking perfectly aligns custom policies to global standards.",
    icon: Hexagon,
    glowClass: "bg-orange-50",
    iconClass: "text-[#F29F67]",
  },
];

export function HomeHeroPanel() {
  return (
    <div className="space-y-10 pl-4">
      <div className="flex flex-wrap items-center gap-4">
        <Link
          to="/nist-policies"
          className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-white border border-slate-200 shadow-sm shadow-blue-900/5 hover:border-blue-300 hover:shadow-md transition-all text-slate-700 hover:text-blue-700 group focus:ring-2 focus:ring-blue-500/20 outline-none"
        >
          <BookOpen className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform duration-300" />
          <span className="text-xs font-bold tracking-widest uppercase">
            Browse NIST Policies
          </span>
        </Link>
      </div>

      <div className="space-y-6 relative">
        <h1 className="text-5xl lg:text-7xl font-extrabold text-slate-900 tracking-tighter leading-[1.1]">
          Intelligent <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-[#3B8FF3] to-[#F29F67]">
            Policy Audit.
          </span>
        </h1>
        <p className="text-lg lg:text-xl text-slate-500 max-w-xl font-medium leading-relaxed">
          Harness AI-driven semantics to map your organization&apos;s
          unstructured documents directly to NIST SP 800-53 controls with
          unparalleled precision.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
        {FEATURE_CARDS.map((feature) => {
          const Icon = feature.icon;
          return (
            <div
              key={feature.title}
              className="group bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden"
            >
              <div
                className={`absolute top-0 right-0 w-32 h-32 ${feature.glowClass} rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform duration-500`}
              />
              <Icon
                className={`w-8 h-8 mb-4 relative z-10 ${feature.iconClass}`}
              />
              <h3 className="text-lg font-bold text-slate-900 mb-2 relative z-10">
                {feature.title}
              </h3>
              <p className="text-sm font-medium text-slate-500 leading-relaxed relative z-10">
                {feature.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
