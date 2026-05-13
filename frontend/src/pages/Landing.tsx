import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, Video, Megaphone, MessageSquare, Sparkles, ArrowRight, GraduationCap, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Easing } from "framer-motion";
import ThemeToggle from "@/components/ThemeToggle";

const features = [
  {
    icon: BookOpen,
    title: "Structured Notes",
    description: "Access well-organized study materials by subject, semester, and topic.",
  },
  {
    icon: Video,
    title: "Video Lectures",
    description: "Watch curated video content from top educators, anytime, anywhere.",
  },
  {
    icon: Megaphone,
    title: "Circulars & Updates",
    description: "Stay informed with real-time announcements and important notices.",
  },
  {
    icon: MessageSquare,
    title: "Community Forum",
    description: "Engage in discussions, ask questions, and collaborate with peers.",
  },
  {
    icon: Users,
    title: "Mentorship",
    description: "Connect with experienced mentors for guidance and career advice.",
  },
  {
    icon: GraduationCap,
    title: "Dashboard Analytics",
    description: "Track your progress with insightful stats and performance metrics.",
  },
];

const ease: Easing = [0.25, 0.1, 0.25, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const Landing = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* Ambient background */}
      <div className="ambient-orb left-[-5%] top-[-10%] h-[500px] w-[500px]" />
      <div className="ambient-orb bottom-[-10%] right-[-5%] h-[400px] w-[400px] opacity-60" />

      {/* Navbar */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-20 flex items-center justify-between px-6 py-4 md:px-12"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-display text-sm font-bold shadow-soft">
            TL
          </div>
          <span className="font-display text-lg font-semibold">TeachLearn</span>
        </div>

        {/* Desktop nav */}
        <div className="hidden items-center gap-3 sm:flex">
          <ThemeToggle />
          <Link to="/login">
            <Button variant="ghost" size="sm">Sign In</Button>
          </Link>
          <Link to="/register">
            <Button size="sm">Get Started</Button>
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:hidden"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </motion.header>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="relative z-20 overflow-hidden border-b border-border/50 bg-background/90 backdrop-blur-xl sm:hidden"
          >
            <div className="flex flex-col gap-2 px-6 pb-4">
              <ThemeToggle />
              <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" size="sm" className="w-full justify-start">Sign In</Button>
              </Link>
              <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                <Button size="sm" className="w-full">Get Started</Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <motion.section
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-6 pb-16 pt-16 text-center md:pt-24"
      >
        <motion.div variants={fadeUp} className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-secondary/80 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-muted-foreground backdrop-blur-sm">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Your Academic Hub
        </motion.div>
        <motion.h1 variants={fadeUp} className="mt-6 font-display text-4xl font-bold leading-tight tracking-tight md:text-6xl">
          Learn Smarter,{" "}
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Grow Together
          </span>
        </motion.h1>
        <motion.p variants={fadeUp} className="mt-5 max-w-2xl text-lg text-muted-foreground">
          A unified platform for notes, video lectures, circulars, community discussions, and mentorship — designed to make education seamless and collaborative.
        </motion.p>
        <motion.div variants={fadeUp} className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link to="/register">
            <Button size="lg" className="gap-2 px-8 text-base">
              Get Started Free <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="outline" size="lg" className="px-8 text-base">
              Sign In
            </Button>
          </Link>
        </motion.div>
      </motion.section>

      {/* Features Section */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={staggerContainer}
        className="relative z-10 mx-auto max-w-6xl px-6 pb-24"
      >
        <motion.div variants={fadeUp} className="mb-12 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">Features</p>
          <h2 className="mt-2 font-display text-3xl font-semibold">Everything you need to succeed</h2>
          <p className="mt-3 text-muted-foreground">
            All the tools students and educators need, in one beautiful platform.
          </p>
        </motion.div>
        <motion.div variants={staggerContainer} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <motion.div
              key={f.title}
              variants={fadeUp}
              className="group rounded-2xl border border-border/50 bg-card p-6 shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-card-hover"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={fadeUp}
        className="relative z-10 mx-auto max-w-4xl px-6 pb-24 text-center"
      >
        <div className="rounded-2xl border border-border/50 bg-card p-10 shadow-elevated md:p-16">
          <h2 className="font-display text-3xl font-bold md:text-4xl">Ready to get started?</h2>
          <p className="mt-4 text-muted-foreground">
            Join thousands of students and educators already using TeachLearn.
          </p>
          <div className="mt-8">
            <Link to="/register">
              <Button size="lg" className="gap-2 px-10 text-base">
                Create Your Account <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </motion.section>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="relative z-10 border-t border-border/50 bg-background/60 px-6 py-6 text-center text-sm text-muted-foreground backdrop-blur-xl"
      >
        © {new Date().getFullYear()} TeachLearn. Built for better learning.
      </motion.footer>
    </div>
  );
};

export default Landing;
