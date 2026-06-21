import React from 'react';
import { FaExclamationTriangle, FaRedo, FaHome } from 'react-icons/fa';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMessage: error.toString() };
  }

  componentDidCatch(error, errorInfo) {
    console.error("System Crash Detected:", error, errorInfo);
  }

  resetSystem = () => {
    this.setState({ hasError: false });
    window.location.href = '/dashboard'; 
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-pearl-beige flex flex-col items-center justify-center p-4 text-pine-teal font-sans selection:bg-dark-raspberry selection:text-white">
          <div className="bg-white/70 backdrop-blur-lg border border-white p-8 md:p-10 rounded-[2.5rem] max-w-md w-full text-center shadow-[0_20px_40px_rgba(59,107,84,0.08)] relative overflow-hidden">
            
            {/* Background Glow */}
            <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-blazing-flame/10 blur-[80px] rounded-full pointer-events-none"></div>

            <div className="relative z-10">
              <div className="w-20 h-20 bg-blazing-flame/10 border border-blazing-flame/20 rounded-3xl flex items-center justify-center text-4xl text-blazing-flame mx-auto mb-6 shadow-inner">
                <FaExclamationTriangle className="animate-pulse" />
              </div>
              
              <h1 className="text-2xl font-black tracking-tight mb-2 text-pine-teal">System Malfunction</h1>
              <p className="text-dusty-lavender text-sm mb-6 leading-relaxed font-medium">
                A critical error occurred while rendering this interface. The Sahayam transmission has been interrupted.
              </p>

              {/* Developer Error Output has been disabled for production safety and clean UI */}

              <div className="flex flex-col gap-3">
                <button
                  onClick={this.resetSystem}
                  className="w-full bg-pine-teal hover:bg-[#1a3630] text-white font-black uppercase tracking-widest text-xs py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-[0_10px_25px_rgba(59,107,84,0.3)] active:scale-95"
                >
                  <FaRedo className="text-lg" /> Reboot System
                </button>
                <button
                  onClick={() => window.location.href = '/'}
                  className="w-full bg-white hover:bg-pearl-beige text-dusty-lavender hover:text-pine-teal font-black uppercase tracking-widest text-xs py-4 rounded-2xl flex items-center justify-center gap-3 transition-all border border-dusty-lavender/30 shadow-sm active:scale-95"
                >
                  <FaHome className="text-lg" /> Return to Base
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;