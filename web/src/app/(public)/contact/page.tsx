"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Clock,
  HelpCircle,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Send,
  Sparkles,
} from "lucide-react";

import AnimatedContent from "@/components/AnimatedContent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "booking_help",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 600);
  };

  return (
    <main className="min-h-screen bg-sand-100/50 pb-20 pt-10 sm:pt-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <AnimatedContent distance={25} duration={0.5} threshold={0}>
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-forest-700/20 bg-forest-700/10 px-3.5 py-1 text-xs font-semibold text-forest-700">
              <Sparkles className="size-3.5" />
              Get in Touch
            </div>
            <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-forest-900 sm:text-5xl">
              We&apos;re Here to Help You Focus
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-base text-forest-900/70 sm:text-lg">
              Have questions regarding seat reservations, library partnerships, or technical support?
              Our friendly team is available 7 days a week.
            </p>
          </div>
        </AnimatedContent>

        <div className="mt-12 grid gap-8 lg:grid-cols-3">
          {/* Direct Channels */}
          <AnimatedContent distance={20} duration={0.5} threshold={0} delay={0.06} className="space-y-4">
            <div className="rounded-2xl border border-line bg-white p-6 shadow-soft">
              <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-50 text-[#16a34a]">
                <Mail className="size-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold text-forest-900">
                Email Support
              </h3>
              <p className="mt-1 text-xs text-forest-900/60">
                Guaranteed response within 2 business hours.
              </p>
              <a
                href="mailto:support@scholarshub.in"
                className="mt-3 inline-block font-semibold text-forest-700 hover:text-forest-900 hover:underline text-sm"
              >
                support@scholarshub.in
              </a>
            </div>

            <div className="rounded-2xl border border-line bg-white p-6 shadow-soft">
              <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-50 text-[#16a34a]">
                <Clock className="size-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold text-forest-900">
                Support Hours
              </h3>
              <p className="mt-1 text-xs text-forest-900/60">
                Live team assistance during student study hours.
              </p>
              <p className="mt-2 text-sm font-semibold text-forest-900">
                Monday – Sunday: 8:00 AM – 10:00 PM
              </p>
            </div>

            <div className="rounded-2xl border border-line bg-white p-6 shadow-soft">
              <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-50 text-[#16a34a]">
                <HelpCircle className="size-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold text-forest-900">
                Frequently Asked Questions
              </h3>
              <p className="mt-1 text-xs text-forest-900/60">
                Instant answers to cancellations, fees, and pass verification.
              </p>
              <Link
                href="/#faqs"
                className="mt-3 inline-block font-semibold text-[#16a34a] hover:underline text-sm"
              >
                View common FAQs →
              </Link>
            </div>
          </AnimatedContent>

          {/* Interactive Contact Form */}
          <AnimatedContent distance={20} duration={0.5} threshold={0} delay={0.1} className="lg:col-span-2">
            <div className="rounded-3xl border border-line bg-white p-8 shadow-soft sm:p-10">
              {submitted ? (
                <div className="py-12 text-center">
                  <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-50 text-[#16a34a]">
                    <Sparkles className="size-7" />
                  </div>
                  <h3 className="mt-4 font-display text-2xl font-bold text-forest-900">
                    Message Sent Successfully!
                  </h3>
                  <p className="mx-auto mt-2 max-w-md text-sm text-forest-900/70">
                    Thank you for contacting Scholar&apos;s Hub. A support representative has received
                    your inquiry and will respond to <span className="font-semibold">{form.email}</span> shortly.
                  </p>
                  <Button
                    onClick={() => {
                      setSubmitted(false);
                      setForm({ name: "", email: "", subject: "booking_help", message: "" });
                    }}
                    className="mt-6 rounded-full bg-forest-700 text-white"
                  >
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <h3 className="font-display text-xl font-bold text-forest-900">
                    Send Us a Direct Message
                  </h3>
                  <p className="text-xs text-forest-900/60">
                    Fill out the fields below and our support coordinators will get right back to you.
                  </p>

                  <div className="grid gap-4 sm:grid-cols-2 pt-2">
                    <div>
                      <label className="text-xs font-medium text-forest-900/80">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <Input
                        required
                        placeholder="e.g. Priya Sharma"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-forest-900/80">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <Input
                        required
                        type="email"
                        placeholder="e.g. priya@gmail.com"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-forest-900/80">
                      Inquiry Category
                    </label>
                    <select
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      className="mt-1 flex h-10 w-full rounded-xl border border-line bg-white px-3 text-sm text-forest-900 outline-none transition focus:border-forest-700"
                    >
                      <option value="booking_help">Booking / Pass Questions</option>
                      <option value="refund">Cancellation &amp; Refund Request</option>
                      <option value="library_partner">Listing a New Library (Owner)</option>
                      <option value="technical">Technical Feedback / Issue</option>
                      <option value="other">Other Inquiry</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-forest-900/80">
                      Message Details <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={5}
                      placeholder="Please explain how we can help. If you have an existing booking ID, please include it."
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-line bg-white p-3 text-sm text-forest-900 outline-none transition focus:border-forest-700 placeholder:text-forest-900/40"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="h-11 w-full rounded-xl bg-forest-700 text-sm font-semibold text-white shadow-xs transition hover:bg-forest-800"
                  >
                    {loading ? "Sending Message…" : "Send Message"}
                  </Button>
                </form>
              )}
            </div>
          </AnimatedContent>
        </div>
      </div>
    </main>
  );
}
