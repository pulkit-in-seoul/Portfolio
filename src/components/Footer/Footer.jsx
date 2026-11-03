import React from 'react';
import { ArrowUp, Heart, Github, Linkedin, Instagram, Mail } from 'lucide-react';
import { personalData } from '../../data/personal.js';
import logoImg from '../../assets/images/logo.png';
import './Footer.scss';

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const getIcon = (name) => {
    switch (name.toLowerCase()) {
      case 'github':
        return <Github size={18} />;
      case 'linkedin':
        return <Linkedin size={18} />;
      case 'instagram':
        return <Instagram size={18} />;
      default:
        return <Mail size={18} />;
    }
  };

  return (
    <footer className="footer">
      <div className="container footer__container">
        <div className="footer__top">
          <div className="footer__brand">
            <div className="footer__logo">
              <span className="footer__logo-mark" aria-hidden="true">
                <img src={logoImg} alt="" className="footer__logo-image" />
              </span>
              <span className="footer__logo-name">Pulkit Mittal</span>
            </div>
            <p className="footer__tagline">
              Crafting modern, scalable, and delightful digital interfaces. Always learning, building, and evolving.
            </p>
          </div>

          <div className="footer__links-group">
            <div className="footer__socials">
              {personalData.socials.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer__social-link"
                  aria-label={social.name}
                >
                  {getIcon(social.name)}
                </a>
              ))}
            </div>

            <button
              onClick={scrollToTop}
              className="footer__back-to-top"
              aria-label="Back to top"
            >
              <span>Back to Top</span>
              <ArrowUp size={16} />
            </button>
          </div>
        </div>

        <div className="footer__bottom">
          <p className="footer__copyright">
            &copy; {new Date().getFullYear()} {personalData.name}. All rights reserved.
          </p>
          <p className="footer__made-with">
            Designed &amp; built with <Heart size={14} className="footer__heart-icon" /> using React, Sass &amp; Vite.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
