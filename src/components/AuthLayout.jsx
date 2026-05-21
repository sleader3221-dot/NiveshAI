import React from "react";
import { TrendingUp } from "lucide-react";

export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" style={{ background: '#050B18' }}>
      {/* BG grid */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)`,
        backgroundSize: '60px 60px'
      }} />
      <div className="absolute top-1/4 left-1/3 w-72 h-72 rounded-full blur-[100px] opacity-15" style={{ background: 'radial-gradient(circle, #00D4FF, transparent)' }} />
      <div className="absolute bottom-1/3 right-1/3 w-72 h-72 rounded-full blur-[100px] opacity-10" style={{ background: 'radial-gradient(circle, #7B2FFF, transparent)' }} />

      <div className="w-full max-w-md relative z-10">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4" style={{ background: 'linear-gradient(135deg, #00D4FF, #7B2FFF)' }}>
            <Icon className="w-7 h-7 text-white" aria-hidden="true" />
          </div>
          <div className="flex items-baseline gap-1.5 justify-center mb-1">
            <span className="font-space font-bold text-2xl text-cyan">NIVESH</span>
            <span className="font-space font-bold text-2xl text-violet">AI</span>
          </div>
          <h1 className="text-xl font-space font-bold text-white mt-2">{title}</h1>
          {subtitle && <p className="text-white/40 mt-1.5 text-sm">{subtitle}</p>}
        </div>

        <div className="rounded-2xl p-8 border border-white/8" style={{ background: 'rgba(13,21,38,0.9)', backdropFilter: 'blur(20px)', boxShadow: '0 8px 40px rgba(0,212,255,0.06)' }}>
          {children}
        </div>

        {footer && (
          <p className="text-center text-sm text-white/30 mt-6">{footer}</p>
        )}
      </div>
    </div>
  );
}