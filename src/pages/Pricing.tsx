import { motion } from "motion/react";
import { Check, X, Zap, Shield, Crown } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/src/lib/utils";

const plans = [
  {
    name: "Free Tier",
    price: "0",
    description: "Perfect for small schools starting their digital journey.",
    limit: "Up to 50 Students",
    features: [
      { name: "School Profile", included: true },
      { name: "Directory Listing", included: true },
      { name: "WhatsApp Channel", included: true },
      { name: "Result Announcements", included: true },
      { name: "Finance Management", included: false },
      { name: "Teachers Portal", included: false },
      { name: "WhatsApp Bot", included: false },
      { name: "Fee Automation", included: false },
    ],
    cta: "Get Started",
    highlight: false,
    icon: Zap,
  },
  {
    name: "Standard",
    price: "50",
    description: "Essential management tools for mid-sized schools.",
    limit: "Up to 300 Students",
    features: [
      { name: "Everything in Free", included: true },
      { name: "Finance Management", included: false },
      { name: "Teachers Portal", included: true },
      { name: "WhatsApp Bot", included: true },
      { name: "Fee Automation", included: true },
      { name: "Admissions & Events", included: true },
      { name: "Resource Library", included: false },
      { name: "Custom Branding", included: false },
    ],
    cta: "Choose Standard",
    highlight: true,
    icon: Shield,
  },
  {
    name: "Professional",
    price: "40",
    description: "Full-featured package for larger institutions.",
    limit: "Above 300 Students",
    features: [
      { name: "Everything in Standard", included: true },
      { name: "Admissions & Events", included: true },
      { name: "Resource Library", included: true },
      { name: "Custom Branding", included: true },
      { name: "Priority Support", included: true },
      { name: "Advanced Analytics", included: true },
      { name: "Multi-Admin Access", included: true },
      { name: "API Integration", included: true },
    ],
    cta: "Go Professional",
    highlight: false,
    icon: Crown,
  },
];

export default function Pricing() {
  return (
    <div className="bg-slate-50 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-base font-semibold uppercase tracking-wider text-emerald-600">Pricing</h2>
          <p className="mt-2 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            Simple, Transparent <span className="text-emerald-600">Licensing</span>
          </p>
          <p className="mx-auto mt-4 max-w-2xl text-xl text-slate-600">
            Choose the plan that fits your school's needs. No hidden fees, just pure value.
          </p>
        </div>

        <div className="mt-20 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {plans.map((plan) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className={cn(
                "relative flex flex-col rounded-3xl bg-white p-8 shadow-xl ring-1 ring-black/5",
                plan.highlight && "ring-2 ring-emerald-500"
              )}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-4 py-1 text-sm font-bold text-white">
                  Most Popular
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className={cn("rounded-2xl p-3", plan.highlight ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-600")}>
                  <plan.icon className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-slate-900">Rs. {plan.price}</p>
                  <p className="text-sm font-medium text-slate-500">{plan.limit}</p>
                </div>
              </div>

              <h3 className="mt-8 text-2xl font-bold text-slate-900">{plan.name}</h3>
              <p className="mt-2 text-slate-600">{plan.description}</p>

              <ul className="mt-8 space-y-4 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature.name} className="flex items-center gap-3">
                    {feature.included ? (
                      <Check className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <X className="h-5 w-5 text-slate-300" />
                    )}
                    <span className={cn("text-sm", feature.included ? "text-slate-700" : "text-slate-400 line-through")}>
                      {feature.name}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                to="/admin"
                className={cn(
                  "mt-10 block w-full rounded-xl py-4 text-center text-base font-bold transition-transform hover:scale-[1.02] active:scale-[0.98]",
                  plan.highlight
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200"
                    : "bg-slate-900 text-white"
                )}
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="mt-20 rounded-3xl bg-emerald-900 p-8 text-white md:p-12">
          <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <h3 className="text-2xl font-bold">Need a Custom Solution?</h3>
              <p className="mt-2 text-emerald-100">
                For large school networks or government projects, we offer custom enterprise plans with dedicated support and on-premise deployment options.
              </p>
            </div>
            <a 
              href="mailto:ernestvdavid@gmail.com,abes.gujranwala@gmail.com?subject=Enterprise License Inquiry&body=Hello, I would like to inquire about an Enterprise license for my school."
              className="whitespace-nowrap rounded-full bg-white px-8 py-4 text-lg font-bold text-emerald-900 shadow-xl transition-transform hover:scale-105 text-center"
            >
              Contact Sales
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
