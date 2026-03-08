import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const sections = [
  { id: "hero", label: "Hero" },
  { id: "problem", label: "Problem" },
  { id: "solution", label: "Solution" },
  { id: "how-it-works", label: "How It Works" },
  { id: "community", label: "Community" },
  { id: "stats", label: "Stats" },
];

const FloatingNav = () => {
  const [visible, setVisible] = useState(false);
  const [active, setActive] = useState("hero");
  const [menuOpen, setMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const heroEl = document.getElementById("hero");
    if (!heroEl) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0.1 }
    );
    observer.observe(heroEl);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActive(id);
        },
        { threshold: 0.3 }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  const activePillStyle: React.CSSProperties = {
    background: "linear-gradient(135deg, hsl(37 92% 50%), hsl(45 96% 64%))",
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.nav
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-2 py-2 rounded-full backdrop-blur-2xl border border-primary/10"
          style={{ background: "hsla(60, 4%, 95%, 0.8)" }}
        >
          {isMobile ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 rounded-full hover:bg-accent transition-colors"
              >
                {menuOpen ? <X className="w-5 h-5 text-foreground" /> : <Menu className="w-5 h-5 text-foreground" />}
              </button>
              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="absolute top-12 left-1/2 -translate-x-1/2 rounded-2xl border border-primary/10 backdrop-blur-2xl p-3 flex flex-col gap-1 min-w-[160px]"
                    style={{ background: "hsla(60, 4%, 95%, 0.92)" }}
                  >
                    {sections.map(({ id, label }) => (
                      <button
                        key={id}
                        onClick={() => scrollTo(id)}
                        className="px-4 py-2 rounded-lg text-sm font-medium transition-colors text-left"
                        style={active === id ? { ...activePillStyle, color: "white" } : undefined}
                      >
                        {active !== id && <span className="text-foreground hover:text-foreground">{label}</span>}
                        {active === id && label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex gap-1">
              {sections.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => scrollTo(id)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                    active === id
                      ? "text-white shadow-md"
                      : "text-foreground/70 hover:text-foreground hover:bg-accent"
                  }`}
                  style={active === id ? activePillStyle : undefined}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </motion.nav>
      )}
    </AnimatePresence>
  );
};

export default FloatingNav;
