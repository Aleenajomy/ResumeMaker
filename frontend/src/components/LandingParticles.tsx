import React, { useEffect, useState } from 'react';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import type { ISourceOptions } from '@tsparticles/engine';
import { loadSlim } from '@tsparticles/slim';

const particleOptions: ISourceOptions = {
  background: {
    color: {
      value: 'transparent',
    },
  },
  detectRetina: true,
  fpsLimit: 60,
  fullScreen: {
    enable: false,
  },
  interactivity: {
    events: {
      resize: {
        delay: 0.4,
        enable: true,
      },
    },
  },
  particles: {
    color: {
      value: ['#d6d0d0', '#c4ecd8', '#a6c2b6'],
    },
    links: {
      color: '#e4ddd7',
      distance: 100,
      enable: true,
      opacity: 0.33,
      width: 0.99,
    },
    move: {
      direction: 'none',
      enable: true,
      outModes: {
        default: 'out',
      },
      random: false,
      speed: 0.12,
      straight: false,
    },
    number: {
      density: {
        enable: true,
        height: 800,
        width: 800,
      },
      value: 50,
    },
    opacity: {
      value: {
        min: 0.14,
        max: 0.17,
      },
    },
    shape: {
      type: 'circle',
    },
    size: {
      value: {
        min: 2,
        max: 4,
      },
    },
  },
  pauseOnBlur: true,
  pauseOnOutsideViewport: true,
};

let enginePromise: Promise<void> | undefined;

const ensureEngine = () => {
  if (!enginePromise) {
    enginePromise = initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    });
  }

  return enginePromise;
};

export const LandingParticles: React.FC = () => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    ensureEngine().then(() => {
      if (mounted) {
        setReady(true);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  if (!ready) {
    return null;
  }

  return (
    <Particles
      id="landing-particles"
      className="absolute inset-0 h-full w-full pointer-events-none"
      options={particleOptions}
    />
  );
};