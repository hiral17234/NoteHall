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
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const slideLeft = {
  hidden: { opacity: 0, x: -60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6 } },
};

const slideRight = {
  hidden: { opacity: 0, x: 60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6 } },
};

const Welcome = () => {
  const navigate = useNavigate();
  const [realStats, setRealStats] = useState({ notes: 0, users: 0, subjects: 0 });

  // No redirect needed — App.tsx handles auth-based routing

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

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-x-hidden">
      <FloatingParticles />
      <ScrollProgress />
      <FloatingNav />

      {/* Hero Section */}
      <section id="hero" className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <div className="relative inline-block">
            <img src={logo} alt="NoteHall Logo" className="w-24 h-24 md:w-32 md:h-32 rounded-2xl" />
            <div
              className="absolute inset-0 rounded-2xl animate-pulse"
              style={{ boxShadow: "0 0 40px hsla(37, 92%, 50%, 0.4), 0 0 80px hsla(45, 96%, 64%, 0.2)" }}
            />
          </div>
        </motion.div>

        <AnimatedText
          text="Your Notes. Your Network. Your Success."
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight max-w-4xl"
          delay={0.3}
        />

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl"
        >
          Where students, seniors, and alumni come together to share knowledge and help each other succeed.
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.6 }}
          className="mt-3 text-sm md:text-base text-muted-foreground/70 max-w-xl"
        >
          A peer-to-peer learning space where notes, experience, and guidance flow freely across campus.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.8, duration: 0.5 }}
          className="mt-10"
        >
          <Button
            onClick={handleGetStarted}
            size="lg"
            className="text-lg px-10 py-6 rounded-full relative overflow-hidden group"
            style={{ boxShadow: "0 0 30px hsla(37, 92%, 50%, 0.4)" }}
          >
            <span className="relative z-10 flex items-center gap-2">
              Get Started <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
          </Button>
        </motion.div>

        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-10"
        >
          <ChevronDown className="w-8 h-8 text-muted-foreground/50" />
        </motion.div>
      </section>

      {/* Problem Section */}
      <section id="problem" className="relative z-10 py-20 md:py-32 px-4">
        <motion.h2
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-2xl md:text-4xl font-bold text-center mb-16"
        >
          The Problem Students Face
        </motion.h2>
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
          <motion.div
            variants={slideLeft}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="rounded-2xl border border-border bg-card p-8 shadow-md"
          >
            <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-5" style={{ background: "linear-gradient(135deg, hsl(37 92% 50% / 0.15), hsl(45 96% 64% / 0.15))" }}>
              <FolderOpen className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Scattered Study Resources</h3>
            <p className="text-muted-foreground leading-relaxed">
              Important notes are scattered across WhatsApp groups, Google Drives, Telegram channels, and random folders. Students waste hours just trying to find reliable study material.
            </p>
          </motion.div>

          <motion.div
            variants={slideRight}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="rounded-2xl border border-border bg-card p-8 shadow-md"
          >
            <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-5" style={{ background: "linear-gradient(135deg, hsl(37 92% 50% / 0.15), hsl(45 96% 64% / 0.15))" }}>
              <GraduationCap className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Disconnected Student Knowledge</h3>
            <p className="text-muted-foreground leading-relaxed">
              Every year seniors graduate with valuable insights, notes, and exam strategies. But juniors rarely get access to that knowledge.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Solution Section */}
      <section id="solution" className="relative z-10 py-20 md:py-32 px-4">
        <motion.h2
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-2xl md:text-4xl font-bold text-center mb-4"
        >
          The NoteHall Solution
        </motion.h2>
        <motion.p
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center text-muted-foreground mb-16 max-w-xl mx-auto"
        >
          Everything students need to learn smarter, in one place.
        </motion.p>
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
          {[
            { icon: BookOpen, title: "Centralized Knowledge Library", desc: "All notes organized by branch, year, and subject so students can easily discover the best study material." },
            { icon: Users, title: "Peer-to-Peer Learning Community", desc: "Students upload notes, rate resources, recommend the best materials, and help each other learn faster." },
            { icon: Sparkles, title: "AI Powered Learning", desc: "Ask AI to summarize notes, explain difficult concepts, generate quizzes, and test your understanding instantly." },
          ].map((item, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="rounded-2xl border border-border bg-card p-8 shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-5" style={{ background: "linear-gradient(135deg, hsl(37 92% 50%), hsl(45 96% 64%))" }}>
                <item.icon className="w-7 h-7 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="relative z-10 py-20 md:py-32 px-4">
        <motion.h2
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-2xl md:text-4xl font-bold text-center mb-16"
        >
          How It Works
        </motion.h2>
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-4 relative">
            {/* Connector line (desktop) */}
            <div className="hidden md:block absolute top-10 left-[12.5%] right-[12.5%] h-0.5 bg-border" />

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
                <div className="w-20 h-20 rounded-full border-2 border-primary bg-card flex items-center justify-center mb-4 relative z-10">
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                    {item.step}
                  </span>
                  <item.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground max-w-[200px]">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section id="community" className="relative z-10 py-20 md:py-32 px-4">
        <motion.h2
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-2xl md:text-4xl font-bold text-center mb-4"
        >
          Learning Beyond Your Batch
        </motion.h2>
        <motion.p
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center text-muted-foreground mb-16 max-w-xl mx-auto"
        >
          Connect with seniors, alumni, and peers across batches.
        </motion.p>
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
          {[
            { icon: UserCheck, title: "Seniors Helping Juniors", desc: "Seniors share exam tips, important questions, and proven study strategies." },
            { icon: Award, title: "Alumni Guidance", desc: "Pass-outs and alumni contribute their notes and experiences to guide future students." },
            { icon: MessageCircle, title: "Doubts and Discussions", desc: "Ask questions, clear doubts, and learn collaboratively through a supportive campus network." },
          ].map((item, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="rounded-2xl border border-border bg-card p-8 shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-5" style={{ background: "linear-gradient(135deg, hsl(37 92% 50% / 0.15), hsl(45 96% 64% / 0.15))" }}>
                <item.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="relative z-10 py-20 md:py-32 px-4">
        <motion.h2
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-2xl md:text-4xl font-bold text-center mb-4"
        >
          NoteHall in Numbers
        </motion.h2>
        <motion.p
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center text-muted-foreground mb-16 max-w-md mx-auto"
        >
          Real impact, real community.
        </motion.p>

        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {[
            { end: realStats.notes, label: "Notes Shared", icon: FileText },
            { end: realStats.users, label: "Students Connected", icon: UserPlus },
            { end: realStats.subjects, label: "Subjects Covered", icon: Layers },
          ].map((stat, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="rounded-2xl border border-border bg-card p-8 shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-5"
                style={{ background: "linear-gradient(135deg, hsl(37 92% 50% / 0.15), hsl(45 96% 64% / 0.15))" }}
              >
                <stat.icon className="w-7 h-7 text-primary" />
              </div>
              <div className="text-4xl md:text-5xl font-bold text-primary mb-2">
                <CountUp end={stat.end} suffix="+" />
              </div>
              <p className="text-muted-foreground font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Campus Community Ecosystem */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mt-20 max-w-4xl mx-auto text-center"
        >
          <h3 className="text-xl md:text-2xl font-bold mb-3">Part of the Campus Community Ecosystem</h3>
          <p className="text-muted-foreground mb-10 max-w-lg mx-auto">
            NoteHall is one of four interconnected platforms built for students, by students.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[
              { name: "CampusVoice", desc: "Share your campus experiences & feedback", url: "https://campusvoice-chi.vercel.app/", icon: MessageCircle },
              { name: "NoteHall", desc: "Your centralized knowledge library", url: "https://notehall.vercel.app", icon: BookOpen },
              { name: "CampusAssist", desc: "Get help from peers and seniors", url: "https://campusassist-five.vercel.app/", icon: Users },
              { name: "CampusBuzz", desc: "Latest campus news & events", url: "", icon: Sparkles },
            ].map((app, i) => (
              <motion.a
                key={i}
                href={app.url || undefined}
                target={app.url ? "_blank" : undefined}
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, type: "spring", stiffness: 200, damping: 15 }}
                whileHover={{ scale: 1.08, y: -8, boxShadow: "0 20px 40px -10px hsla(37, 92%, 50%, 0.3)" }}
                whileTap={{ scale: 0.95 }}
                className={`rounded-2xl border border-border bg-card p-6 shadow-md flex flex-col items-center gap-3 ${app.url ? "cursor-pointer" : "cursor-default"}`}
              >
                <motion.div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, hsl(37 92% 50%), hsl(45 96% 64%))" }}
                  whileHover={{ rotate: [0, -10, 10, 0], transition: { duration: 0.5 } }}
                >
                  <app.icon className="w-6 h-6 text-primary-foreground" />
                </motion.div>
                <span className="font-semibold text-sm md:text-base">{app.name}</span>
                <span className="text-xs text-muted-foreground leading-tight text-center">{app.desc}</span>
                {!app.url && (
                  <motion.span
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="text-[10px] text-primary/60 font-medium italic"
                  >
                    Coming Soon
                  </motion.span>
                )}
              </motion.a>
            ))}
          </div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20 md:py-32 px-4 text-center">
        <motion.h2
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-2xl md:text-4xl font-bold mb-4"
        >
          Ready to Learn Smarter Together?
        </motion.h2>
        <motion.p
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-muted-foreground mb-10 max-w-lg mx-auto"
        >
          Join a campus network where students help students succeed.
        </motion.p>
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <Button
            onClick={handleGetStarted}
            size="lg"
            className="text-lg px-10 py-6 rounded-full relative group animate-pulse"
            style={{ boxShadow: "0 0 40px hsla(37, 92%, 50%, 0.5)" }}
          >
            <span className="flex items-center gap-2">
              Get Started Now <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <img src={logo} alt="NoteHall" className="w-12 h-12 rounded-xl mx-auto mb-4" />
          <p className="text-muted-foreground mb-8">
            Built for students, powered by shared knowledge.
          </p>

          <div
            className="inline-block rounded-2xl p-[2px] mb-8"
            style={{ background: "linear-gradient(135deg, hsl(37 92% 50%), hsl(45 96% 64%), hsl(37 92% 50%))" }}
          >
            <div className="rounded-2xl bg-card px-8 py-5">
              <p className="text-sm text-muted-foreground mb-1">Developer</p>
              <p className="text-lg font-bold">HIRAL GOYAL</p>
              <p className="text-sm text-muted-foreground">Mathematics and Computing</p>
              <p className="text-sm text-muted-foreground">Madhav Institute of Technology and Science, Gwalior</p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground/60">
            © {new Date().getFullYear()} NoteHall. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Welcome;
