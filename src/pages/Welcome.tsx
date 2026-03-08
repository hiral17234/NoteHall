import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BookOpen, Users, Sparkles, Upload, Search, BookMarked, Trophy,
  FolderOpen, GraduationCap, MessageCircle, ChevronDown, ArrowRight,
  UserCheck, Award, FileText, UserPlus, Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import FloatingParticles from "@/components/welcome/FloatingParticles";
import ScrollProgress from "@/components/welcome/ScrollProgress";
import FloatingNav from "@/components/welcome/FloatingNav";
import AnimatedText from "@/components/welcome/AnimatedText";
import CountUp from "@/components/welcome/CountUp";
import logo from "@/assets/logo.png";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.25, 0.4, 0.25, 1] } },
};

const slideLeft = {
  hidden: { opacity: 0, x: -60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.25, 0.4, 0.25, 1] } },
};

const slideRight = {
  hidden: { opacity: 0, x: 60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.25, 0.4, 0.25, 1] } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const Welcome = () => {
  const navigate = useNavigate();
  const [realStats, setRealStats] = useState({ notes: 0, users: 0, subjects: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [notesSnap, usersSnap] = await Promise.all([
          getDocs(collection(db, "notes")),
          getDocs(collection(db, "users")),
        ]);
        const subjects = new Set<string>();
        notesSnap.docs.forEach((d) => {
          const s = d.data().subject;
          if (s) subjects.add(s);
        });
        setRealStats({
          notes: notesSnap.size,
          users: usersSnap.size,
          subjects: subjects.size,
        });
      } catch {
        setRealStats({ notes: 0, users: 0, subjects: 0 });
      }
    };
    fetchStats();
  }, []);

  const handleGetStarted = () => {
    localStorage.setItem("notehall_intro_done", "true");
    navigate("/signup");
  };

  const glassCard = "rounded-3xl border border-primary/10 bg-card/70 backdrop-blur-sm p-8 transition-all duration-400 hover:shadow-[0_12px_30px_hsla(37,92%,50%,0.12)] hover:-translate-y-1";
  const iconBox = "w-14 h-14 rounded-2xl flex items-center justify-center mb-5";
  const iconBoxGradient = "linear-gradient(135deg, hsl(37 92% 50%), hsl(45 96% 64%))";
  const iconBoxSubtle = "linear-gradient(135deg, hsl(37 92% 50% / 0.12), hsl(45 96% 64% / 0.12))";
  const gradientText: React.CSSProperties = {
    background: "linear-gradient(135deg, hsl(37 92% 50%), hsl(45 96% 64%), hsl(37 92% 50%))",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-x-hidden">
      <FloatingParticles />
      <ScrollProgress />
      <FloatingNav />

      {/* ── Hero Section ── */}
      <section id="hero" className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 text-center">
        {/* Golden glow behind logo */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, hsla(37, 92%, 50%, 0.12) 0%, hsla(45, 96%, 64%, 0.06) 40%, transparent 70%)",
          }}
        />

        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.9, ease: [0.25, 0.4, 0.25, 1] }}
          className="mb-10 relative"
        >
          <img src={logo} alt="NoteHall Logo" className="w-28 h-28 md:w-36 md:h-36 rounded-3xl relative z-10" />
          <div
            className="absolute -inset-4 rounded-3xl animate-pulse opacity-60"
            style={{ boxShadow: "0 0 50px hsla(37, 92%, 50%, 0.35), 0 0 100px hsla(45, 96%, 64%, 0.15)" }}
          />
        </motion.div>

        <AnimatedText
          text="Your Notes. Your Network."
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] max-w-5xl tracking-tight"
          delay={0.3}
        />
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.7 }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] max-w-5xl tracking-tight mt-2"
          style={gradientText}
        >
          Your Success.
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4, duration: 0.6 }}
          className="mt-8 text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed"
        >
          Where students, seniors, and alumni come together to share knowledge and help each other succeed.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.8, duration: 0.5 }}
          className="mt-12"
        >
          <Button
            onClick={handleGetStarted}
            size="lg"
            className="text-lg px-12 py-7 rounded-full relative overflow-hidden group"
            style={{
              background: "linear-gradient(135deg, hsl(37 92% 50%), hsl(45 96% 64%))",
              boxShadow: "0 8px 30px hsla(37, 92%, 50%, 0.35), 0 0 60px hsla(45, 96%, 64%, 0.15)",
            }}
          >
            <span className="relative z-10 flex items-center gap-2 text-white font-semibold">
              Get Started <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
          </Button>
        </motion.div>

        <motion.div
          animate={{ y: [0, 12, 0] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
          className="absolute bottom-10"
        >
          <ChevronDown className="w-8 h-8 text-muted-foreground/40" />
        </motion.div>
      </section>

      {/* ── Problem Section ── */}
      <section id="problem" className="relative z-10 py-16 md:py-24 px-4">
        <motion.h2
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
         className="text-3xl md:text-5xl font-bold text-center mb-14"
        >
          The Problem Students Face
        </motion.h2>
        <div className="max-w-5xl mx-auto space-y-12">
          {[
            { icon: FolderOpen, title: "Scattered Study Resources", desc: "Important notes are scattered across WhatsApp groups, Google Drives, Telegram channels, and random folders. Students waste hours just trying to find reliable study material.", variant: slideLeft },
            { icon: GraduationCap, title: "Disconnected Student Knowledge", desc: "Every year seniors graduate with valuable insights, notes, and exam strategies. But juniors rarely get access to that knowledge.", variant: slideRight },
          ].map((item, i) => (
            <motion.div
              key={i}
              variants={item.variant}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className={`flex flex-col md:flex-row items-center gap-8 ${glassCard} ${i % 2 !== 0 ? "md:flex-row-reverse" : ""}`}
            >
              <div className="flex-shrink-0">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ background: iconBoxSubtle }}>
                  <item.icon className="w-10 h-10 text-primary" />
                </div>
              </div>
              <div className={i % 2 !== 0 ? "md:text-right" : ""}>
                <h3 className="text-2xl font-semibold mb-3">{item.title}</h3>
                <p className="text-base text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Solution Section ── */}
      <section id="solution" className="relative z-10 py-16 md:py-24 px-4">
        <motion.h2
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-3xl md:text-5xl font-bold text-center mb-5"
        >
          The{" "}
          <span style={gradientText}>NoteHall</span>{" "}
          Solution
        </motion.h2>
        <motion.p
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center text-lg text-muted-foreground mb-14 max-w-xl mx-auto"
        >
          Everything students need to learn smarter, in one place.
        </motion.p>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="max-w-6xl mx-auto grid md:grid-cols-3 gap-10"
        >
          {[
            { icon: BookOpen, title: "Centralized Knowledge Library", desc: "All notes organized by branch, year, and subject so students can easily discover the best study material." },
            { icon: Users, title: "Peer-to-Peer Learning Community", desc: "Students upload notes, rate resources, recommend the best materials, and help each other learn faster." },
            { icon: Sparkles, title: "AI Powered Learning", desc: "Ask AI to summarize notes, explain difficult concepts, generate quizzes, and test your understanding instantly." },
          ].map((item, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              className={glassCard}
            >
              <div className={iconBox} style={{ background: iconBoxGradient }}>
                <item.icon className="w-7 h-7 text-primary-foreground" />
              </div>
              <h3 className="text-2xl font-semibold mb-3">{item.title}</h3>
              <p className="text-base text-muted-foreground leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── How It Works Section ── */}
      <section id="how-it-works" className="relative z-10 py-16 md:py-24 px-4">
        <motion.h2
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-3xl md:text-5xl font-bold text-center mb-14"
        >
          How It Works
        </motion.h2>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-6 relative">
            {/* Gradient connector line (desktop) */}
            <div
              className="hidden md:block absolute top-10 left-[12.5%] right-[12.5%] h-0.5"
              style={{ background: "linear-gradient(90deg, hsl(37 92% 50%), hsl(45 96% 64%))" }}
            />

            {[
              { icon: Upload, title: "Upload", desc: "Share your notes and help other students learn.", step: 1 },
              { icon: Search, title: "Discover", desc: "Browse and search notes by subject, branch, and year.", step: 2 },
              { icon: BookMarked, title: "Learn", desc: "Read notes, bookmark resources, and ask AI for explanations.", step: 3 },
              { icon: Trophy, title: "Succeed", desc: "Prepare smarter and ace exams using the best shared knowledge.", step: 4 },
            ].map((item, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="flex flex-col items-center text-center relative"
              >
                <div
                  className="w-20 h-20 rounded-full bg-card flex items-center justify-center mb-4 relative z-10"
                  style={{
                    border: "2px solid transparent",
                    backgroundImage: "linear-gradient(hsl(60 9% 97%), hsl(60 9% 97%)), linear-gradient(135deg, hsl(37 92% 50%), hsl(45 96% 64%))",
                    backgroundOrigin: "border-box",
                    backgroundClip: "padding-box, border-box",
                    boxShadow: "0 0 20px hsla(37, 92%, 50%, 0.12)",
                  }}
                >
                  <span
                    className="absolute -top-2 -right-2 w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center text-white"
                    style={{ background: "linear-gradient(135deg, hsl(37 92% 50%), hsl(45 96% 64%))" }}
                  >
                    {item.step}
                  </span>
                  <item.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-base text-muted-foreground max-w-[220px]">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Community Section ── */}
      <section id="community" className="relative z-10 py-16 md:py-24 px-4">
        <motion.h2
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-3xl md:text-5xl font-bold text-center mb-5"
        >
          Learning Beyond Your Batch
        </motion.h2>
        <motion.p
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center text-lg text-muted-foreground mb-14 max-w-xl mx-auto"
        >
          Connect with seniors, alumni, and peers across batches.
        </motion.p>
        <div className="max-w-5xl mx-auto space-y-10">
          {[
            { icon: UserCheck, title: "Seniors Helping Juniors", desc: "Seniors share exam tips, important questions, and proven study strategies." },
            { icon: Award, title: "Alumni Guidance", desc: "Pass-outs and alumni contribute their notes and experiences to guide future students." },
            { icon: MessageCircle, title: "Doubts and Discussions", desc: "Ask questions, clear doubts, and learn collaboratively through a supportive campus network." },
          ].map((item, i) => (
            <motion.div
              key={i}
              variants={i % 2 === 0 ? slideLeft : slideRight}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className={`flex flex-col md:flex-row items-center gap-8 ${glassCard} ${i % 2 !== 0 ? "md:flex-row-reverse" : ""}`}
            >
              <div className="flex-shrink-0">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ background: iconBoxSubtle }}>
                  <item.icon className="w-10 h-10 text-primary" />
                </div>
              </div>
              <div className={i % 2 !== 0 ? "md:text-right" : ""}>
                <h3 className="text-2xl font-semibold mb-3">{item.title}</h3>
                <p className="text-base text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Stats Section ── */}
      <section id="stats" className="relative z-10 py-16 md:py-24 px-4">
        <motion.h2
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-3xl md:text-5xl font-bold text-center mb-5"
        >
          NoteHall in <span style={gradientText}>Numbers</span>
        </motion.h2>
        <motion.p
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center text-lg text-muted-foreground mb-14 max-w-md mx-auto"
        >
          Real impact, real community.
        </motion.p>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 text-center"
        >
          {[
            { end: Math.max(realStats.notes, 50), label: "Notes Shared", icon: FileText },
            { end: Math.max(realStats.users, 120), label: "Students Connected", icon: UserPlus },
            { end: Math.max(realStats.subjects, 15), label: "Subjects Covered", icon: Layers },
          ].map((stat, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              className={glassCard + " flex flex-col items-center"}
            >
              <div className={iconBox + " mx-auto"} style={{ background: iconBoxSubtle }}>
                <stat.icon className="w-7 h-7 text-primary" />
              </div>
              <div className="text-5xl md:text-6xl font-bold mb-3" style={gradientText}>
                <CountUp end={stat.end} suffix="+" />
              </div>
              <p className="text-lg text-muted-foreground font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Campus Community Ecosystem */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mt-24 max-w-4xl mx-auto text-center"
        >
          <h3 className="text-2xl md:text-4xl font-bold mb-4">
            Part of the <span style={gradientText}>Campus Community</span> Ecosystem
          </h3>
          <p className="text-lg text-muted-foreground mb-14 max-w-lg mx-auto">
            NoteHall is one of four interconnected platforms built for students, by students.
          </p>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8"
          >
            {[
              { name: "CampusVoice", desc: "Share your campus experiences & feedback anonymously", url: "https://campusvoice-chi.vercel.app/", icon: MessageCircle },
              { name: "NoteHall", desc: "Your centralized knowledge library for notes & resources", url: "https://notehall.vercel.app", icon: BookOpen },
              { name: "CampusAssist", desc: "Get help from peers and seniors when you need it", url: "https://campusassist-five.vercel.app/", icon: Users },
              { name: "CampusBuzz", desc: "Latest campus news, events & announcements", url: "", icon: Sparkles },
            ].map((app, i) => (
              <motion.a
                key={i}
                href={app.url || undefined}
                target={app.url ? "_blank" : undefined}
                rel="noopener noreferrer"
                variants={fadeUp}
                whileHover={{ scale: 1.05, y: -6 }}
                whileTap={{ scale: 0.97 }}
                className={`rounded-3xl border border-primary/10 bg-card/70 backdrop-blur-sm p-6 flex flex-col items-center gap-3 transition-all duration-300 ${app.url ? "cursor-pointer hover:shadow-[0_16px_40px_hsla(37,92%,50%,0.18)]" : "cursor-default"}`}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: iconBoxGradient }}
                >
                  <app.icon className="w-7 h-7 text-white" />
                </div>
                <span className="font-semibold text-base md:text-lg">{app.name}</span>
                <span className="text-sm text-muted-foreground leading-tight text-center">{app.desc}</span>
                {app.url && (
                  <span className="text-[11px] text-primary font-medium flex items-center gap-1 mt-1">
                    Visit <ArrowRight className="w-3 h-3" />
                  </span>
                )}
                {!app.url && (
                  <motion.span
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="text-[11px] text-primary/60 font-medium italic"
                  >
                    Coming Soon
                  </motion.span>
                )}
              </motion.a>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ── CTA Section ── */}
      <section className="relative z-10 py-16 md:py-24 px-4 text-center">
        {/* Warm radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at center, hsla(37, 92%, 50%, 0.06) 0%, transparent 60%)",
          }}
        />
        <motion.h2
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-3xl md:text-5xl font-bold mb-6 relative z-10"
        >
          Ready to Learn Smarter Together?
        </motion.h2>
        <motion.p
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-lg text-muted-foreground mb-12 max-w-lg mx-auto relative z-10"
        >
          Join a campus network where students help students succeed.
        </motion.p>
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="relative z-10"
        >
          <Button
            onClick={handleGetStarted}
            size="lg"
            className="text-lg px-12 py-7 rounded-full relative group"
            style={{
              background: "linear-gradient(135deg, hsl(37 92% 50%), hsl(45 96% 64%))",
              boxShadow: "0 8px 40px hsla(37, 92%, 50%, 0.4)",
            }}
          >
            <span className="flex items-center gap-2 text-white font-semibold">
              Get Started Now <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
          </Button>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 py-16 px-4">
        <div
          className="h-px max-w-4xl mx-auto mb-12"
          style={{ background: "linear-gradient(90deg, transparent, hsl(37 92% 50% / 0.4), hsl(45 96% 64% / 0.4), transparent)" }}
        />
        <div className="max-w-4xl mx-auto text-center">
          <img src={logo} alt="NoteHall" className="w-12 h-12 rounded-xl mx-auto mb-4" />
          <p className="text-lg text-muted-foreground mb-10">
            Built for students, powered by shared knowledge.
          </p>

          <motion.div
            className="w-full max-w-3xl mx-auto rounded-2xl mb-10 overflow-hidden"
            style={{ background: "linear-gradient(135deg, hsl(45 96% 64%), hsl(37 92% 50%), hsl(43 96% 56%))" }}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="px-10 md:px-16 py-10 md:py-14 text-center">
              <div className="flex items-center justify-center gap-3 mb-5">
                <span className="text-xl" style={{ color: "hsl(24 9% 10%)" }}>{"</>"}</span>
                <p className="text-xs font-bold tracking-[0.3em] uppercase" style={{ color: "hsl(24 9% 10% / 0.7)" }}>DEVELOPER</p>
              </div>
              <h3
                className="text-3xl md:text-4xl font-bold mb-6 tracking-wide"
                style={{ color: "hsl(24 9% 10%)" }}
              >
                HIRAL GOYAL
              </h3>
              <p className="text-base flex items-center justify-center gap-3 mb-3" style={{ color: "hsl(24 9% 10% / 0.8)" }}>
                <span>🎓</span> Mathematics and Computing
              </p>
              <p className="text-base flex items-center justify-center gap-3" style={{ color: "hsl(24 9% 10% / 0.8)" }}>
                <span>📍</span> Madhav Institute of Technology and Science, Gwalior
              </p>
            </div>
          </motion.div>

          <p className="text-sm text-muted-foreground/60">
            © {new Date().getFullYear()} NoteHall. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Welcome;
