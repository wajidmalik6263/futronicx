import React from 'react';
import { Link } from 'react-router-dom';
import LazyImage from '../LazyImage';
import { normalizeCtaLink } from '../../utils/ctaLink';

export default function BannerImage({ config }) {
    const image = config?.image || '';
    const link = normalizeCtaLink(config?.link || '');
    const alt = config?.alt || 'Promotional Banner';

    if (!image) return null;

    const content = (
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
            <div className="relative overflow-hidden rounded-3xl border border-[#E8DEC8] shadow-md group">
                <LazyImage
                    src={image}
                    alt={alt}
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                    wrapperClassName="w-full aspect-[16/6] sm:aspect-[16/5]"
                    rootMargin="300px"
                    width={1400}
                    height={440}
                    crop="fill"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#3A2E1F]/20 to-transparent pointer-events-none" />
            </div>
        </div>
    );

    if (link) {
        return (
            <section>
                <Link to={link}>{content}</Link>
            </section>
        );
    }

    return <section>{content}</section>;
}
