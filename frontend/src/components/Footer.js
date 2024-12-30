import React from 'react';
import { useTranslation } from 'react-i18next';

function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>{t('footer.about.title')}</h3>
          <p>{t('footer.about.description')}</p>
        </div>

        <div className="footer-section">
          <h3>{t('footer.contact.title')}</h3>
          <ul>
            <li>{t('footer.contact.email')}</li>
            <li>{t('footer.contact.phone')}</li>
          </ul>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>{t('footer.copyright', { year: currentYear })}</p>
      </div>
    </footer>
  );
}

export default Footer; 