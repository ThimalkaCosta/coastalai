import { Link } from 'react-router-dom'
import { Github, Mail, ExternalLink } from 'lucide-react'

const footerLinks = {
  product: [
    { name: 'Home', href: '/' },
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Analysis', href: '/analysis' },
    { name: 'Morphological Dashboard', href: '/morphological' },
  ],
  models: [
    { name: 'Random Forest', href: '/models/random-forest' },
    { name: 'GMM', href: '/models/gmm' },
    { name: 'XGBoost', href: '/models/xgboost' },
  ],
  resources: [
    { name: 'Documentation', href: '#' },
    { name: 'API Reference', href: '#' },
    { name: 'Research Papers', href: '#' },
    { name: 'Methodology', href: '#' },
  ],
  company: [
    { name: 'About', href: '#' },
    { name: 'Contact', href: '#' },
    { name: 'Privacy Policy', href: '#' },
    { name: 'Terms of Service', href: '#' },
  ],
}

export default function Footer() {
  return (
    <footer className="bg-coastal-900 text-coastal-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-3 mb-4">
              <img 
                src="/logo_coastal.png" 
                alt="Coast Conservation & Coastal Resource Management Department" 
                className="h-12 max-w-[280px] object-contain"
              />
            </Link>
            <p className="text-sm text-coastal-400 mb-6 max-w-xs">
              AI-powered coastal erosion threshold detection framework for advanced research analysis.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-coastal-400 hover:text-white transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="text-coastal-400 hover:text-white transition-colors">
                <Mail className="w-5 h-5" />
              </a>
              <a href="#" className="text-coastal-400 hover:text-white transition-colors">
                <ExternalLink className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="font-display font-bold text-white mb-4 text-sm uppercase tracking-wider">Navigation</h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-sm text-coastal-400 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Models Links */}
          <div>
            <h3 className="font-display font-bold text-white mb-4 text-sm uppercase tracking-wider">ML Models</h3>
            <ul className="space-y-3">
              {footerLinks.models.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-sm text-coastal-400 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h3 className="font-display font-bold text-white mb-4 text-sm uppercase tracking-wider">Resources</h3>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-sm text-coastal-400 hover:text-white transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="font-display font-bold text-white mb-4 text-sm uppercase tracking-wider">Company</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-sm text-coastal-400 hover:text-white transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-coastal-800/50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-coastal-500">
            © {new Date().getFullYear()} CoastalAI Threshold Detection Framework. All rights reserved.
          </p>
          <p className="text-sm text-coastal-500">
            Built for coastal research & geomorphology analysis
          </p>
        </div>
      </div>
    </footer>
  )
}
