'use client';

// Client island: the interactive contact form + on-demand Google Map. The
// surrounding page (headings, business info) is server-rendered. `settings` is
// passed from the server page so the map embed URL / labels stay in sync.
import { useState } from 'react';
import {
  Mail, Phone, MapPin, Clock, Send, CheckCircle2, MessageSquare, Loader2,
} from 'lucide-react';
import api from '../../api/api';

export default function ContactForm({ settings = {} }) {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');
    try {
      await api.post('/contact', contactForm);
      setFormSubmitted(true);
      setContactForm({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setFormSubmitted(false), 5000);
    } catch (err) {
      setSubmitError(err.response?.data?.error || 'Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Contact Form */}
      <div className="lg:col-span-7 bg-white border border-[#E8DEC8] rounded-xl p-6 sm:p-8 space-y-5">
        <div className="space-y-1 border-b border-[#E8DEC8] pb-4">
          <h2 className="font-body font-bold text-xl text-[#3A2E1F] flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#D97706]" />
            <span>Send Us a Message</span>
          </h2>
          <p className="text-xs text-[#5C4A32]">
            Fill out the form below and our team will get back to you within 24 hours.
          </p>
        </div>

        {formSubmitted && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Thank you! Your message has been sent successfully. We will reply shortly.</span>
          </div>
        )}

        {submitError && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-bold flex items-center gap-3">
            <span>⚠️ {submitError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#3A2E1F] uppercase tracking-wider block">Your Name *</label>
              <input
                type="text"
                required
                value={contactForm.name}
                onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                placeholder="e.g. Ayesha Malik"
                className="w-full px-4 py-3 bg-white border border-[#E8DEC8] rounded-xl text-sm text-[#3A2E1F] placeholder-[#3A2E1F]/40 focus:outline-none focus:ring-2 focus:ring-[#F5A623]/40 focus:border-[#F5A623]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#3A2E1F] uppercase tracking-wider block">Email Address *</label>
              <input
                type="email"
                required
                value={contactForm.email}
                onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                placeholder="ayesha@example.com"
                className="w-full px-4 py-3 bg-white border border-[#E8DEC8] rounded-xl text-sm text-[#3A2E1F] placeholder-[#3A2E1F]/40 focus:outline-none focus:ring-2 focus:ring-[#F5A623]/40 focus:border-[#F5A623]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#3A2E1F] uppercase tracking-wider block">Subject *</label>
            <input
              type="text"
              required
              value={contactForm.subject}
              onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
              placeholder="Order inquiry, Bulk order, Feedback..."
              className="w-full px-4 py-3 bg-white border border-[#E8DEC8] rounded-xl text-sm text-[#3A2E1F] placeholder-[#3A2E1F]/40 focus:outline-none focus:ring-2 focus:ring-[#F5A623]/40 focus:border-[#F5A623]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#3A2E1F] uppercase tracking-wider block">Your Message *</label>
            <textarea
              rows="5"
              required
              value={contactForm.message}
              onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
              placeholder="Write your message details here..."
              className="w-full px-4 py-3 bg-white border border-[#E8DEC8] rounded-xl text-sm text-[#3A2E1F] placeholder-[#3A2E1F]/40 focus:outline-none focus:ring-2 focus:ring-[#F5A623]/40 focus:border-[#F5A623] resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-[#F5A623] hover:bg-[#D97706] text-[#3A2E1F] hover:text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <span>Send Message</span>
                <Send className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Business Info */}
      <div className="lg:col-span-5 space-y-5">
        <div className="bg-white border border-[#E8DEC8] rounded-xl p-6 sm:p-8 space-y-5">
          <h2 className="font-body font-bold text-xl text-[#3A2E1F] border-b border-[#E8DEC8] pb-3">
            Business Information
          </h2>
          <div className="space-y-4 text-sm text-[#5C4A32]">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-[#F5A623]/15 text-[#D97706] rounded-xl shrink-0"><MapPin className="w-5 h-5" /></div>
              <div>
                <strong className="block text-[#3A2E1F] font-bold text-sm">Store Location</strong>
                <span className="text-xs">{settings.contact_address || ''}</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-[#F5A623]/15 text-[#D97706] rounded-xl shrink-0"><Phone className="w-5 h-5" /></div>
              <div>
                <strong className="block text-[#3A2E1F] font-bold text-sm">Phone & WhatsApp</strong>
                <span className="text-xs">{settings.contact_phone || ''} {settings.social_whatsapp ? `/ ${settings.social_whatsapp}` : ''}</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-[#F5A623]/15 text-[#D97706] rounded-xl shrink-0"><Mail className="w-5 h-5" /></div>
              <div>
                <strong className="block text-[#3A2E1F] font-bold text-sm">Email</strong>
                <span className="text-xs">{settings.contact_email || 'info@example.com'}</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-[#F5A623]/15 text-[#D97706] rounded-xl shrink-0"><Clock className="w-5 h-5" /></div>
              <div>
                <strong className="block text-[#3A2E1F] font-bold text-sm">Working Hours</strong>
                <span className="text-xs">{settings.working_hours || 'Mon - Sat: 9:00 AM - 8:00 PM (PKT)'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="bg-white border border-[#E8DEC8] rounded-xl p-5 space-y-3">
          <span className="text-xs font-bold text-[#3A2E1F] uppercase tracking-wider block">Find Us On Map</span>
          <div className="w-full h-48 bg-[#F5EFE0] rounded-xl border border-[#E8DEC8] overflow-hidden">
            {mapLoaded && settings.map_embed_url ? (
              <iframe
                title={`${settings.store_name || 'North Dry Fruits'} Location`}
                src={settings.map_embed_url}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            ) : (
              <button
                type="button"
                onClick={() => setMapLoaded(true)}
                disabled={!settings.map_embed_url}
                className="w-full h-full flex flex-col items-center justify-center gap-2 text-[#5C4A32] hover:text-[#3A2E1F] hover:bg-[#F5A623]/10 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Load interactive Google map"
              >
                <MapPin className="w-6 h-6 text-[#D97706]" />
                <span className="text-xs font-bold">
                  {settings.map_embed_url ? 'Click to load map' : 'Map unavailable'}
                </span>
                {settings.map_embed_url && (
                  <span className="text-[10px] text-[#5C4A32] px-4 text-center">
                    Loads Google Maps (may set third-party cookies)
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
