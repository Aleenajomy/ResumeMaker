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
      value: ['#ffc9d4', '#ffb3c6', '#ffd4e5', '#c7f5e8', '#b8f0dd', '#d4f1e8'],
    },
    links: {
      enable: false,
    },
    move: {
      direction: 'none',
      enable: true,
      outModes: {
        default: 'out',
      },
      random: true,
      speed: 0.3,
      straight: false,
    },
    number: {
      density: {
        enable: true,
        height: 800,
        width: 800,
      },
      value: 25,
    },
    opacity: {
      value: {
        min: 0.15,
        max: 0.35,
      },
      animation: {
        enable: true,
        speed: 0.3,
        sync: false,
      },
    },
    shape: {
      type: ['square', 'polygon'],
      options: {
        polygon: [
          {
            sides: 6,
          },
          {
            sides: 5,
          },
          {
            sides: 4,
          },
        ],
      },
    },
    size: {
      value: {
        min: 20,
        max: 60,
      },
    },
    rotate: {
      value: {
        min: 0,
        max: 360,
      },
      direction: 'random',
      animation: {
        enable: true,
        speed: 2,
        sync: false,
      },
    },
    life: {
      duration: {
        sync: false,
        value: 8,
      },
      count: 0,
      delay: {
        value: {
          min: 0,
          max: 3,
        },
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