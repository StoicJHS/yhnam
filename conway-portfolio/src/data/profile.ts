export const profile = {
  name: 'Yoonhak Nam',
  role: 'Research Lead @ SPEQTRA Investment Research',
  introduction:
    'I studied physics at Tokyo Institute of Technology, completing my bachelor’s degree six months ahead of schedule. I continued with a master’s degree in physics at the Institute of Science Tokyo (formerly Tokyo Institute of Technology), specializing in nuclear theory and neutron-star cooling, and completed the degree three months ahead of schedule. I now work as Research Lead at SPEQTRA Investment Research, where I conduct systematic and quantitative research.',
  email: 'yh.nam.stoic@gmail.com',
  links: {
    github: 'https://github.com/StoicJHS',
    linkedin: 'https://linkedin.com/in/yoonhak-nam',
    cv: '/cv/Yoonhak_Nam_CV.pdf',
  },
} as const;

export const publicationGroups = [
  {
    label: 'Journal Article',
    publications: [
      {
        title:
          'Data-driven exploration of the neutron ³P₂ pairing gap using Cassiopeia A neutron star observational data: Direct χ² minimization',
        authors: ['Yoonhak Nam', 'Kazuyuki Sekizawa'],
        venue: 'Physical Review C 113, 045807',
        year: '2026',
        status: 'Published 29 April 2026',
        image: '/images/publications/cassiopeia-a.webp',
        imageAlt:
          'One thousand neutron-star cooling curves sampled during TPE optimization, with the best fit and Cassiopeia A observations highlighted.',
        links: [
          {
            label: 'Journal',
            href: 'https://journals.aps.org/prc/abstract/10.1103/PhysRevC.113.045807',
          },
          {
            label: 'arXiv',
            href: 'https://arxiv.org/abs/2510.20353',
          },
        ],
      },
    ],
  },
  {
    label: 'Conference Proceedings',
    publications: [
      {
        title:
          'Vortex Creep Heating in Neutron Star Cooling: New Insights into Thermal Evolution of Heavy Neutron Stars',
        authors: ['Yoonhak Nam', 'Kazuyuki Sekizawa'],
        venue: 'Proceedings of the 29th International Nuclear Physics Conference (INPC2025)',
        year: '2025',
        status: '4 pages · 2 figures',
        image: '/images/publications/inpc-vortex-creep.webp',
        imageAlt:
          'Cooling curves of a two-solar-mass neutron star with vortex creep heating.',
        links: [
          {
            label: 'arXiv',
            href: 'https://arxiv.org/abs/2510.24167',
          },
          {
            label: 'PDF',
            href: 'https://arxiv.org/pdf/2510.24167',
          },
        ],
      },
    ],
  },
  {
    label: 'Preprints',
    publications: [
      {
        title:
          'Impact of hyperon mixing on neutron star structure based on Skyrme-type equations of state: Systematic analysis of ΛNN and ΛΛN three-body forces with Bayesisan inference',
        authors: ['Taeho Lee', 'Yoonhak Nam', 'Kazuyuki Sekizawa'],
        venue: 'arXiv:2605.28727 · Nuclear Theory',
        year: '2026',
        status: '23 pages · 11 figures',
        image: '/images/publications/hyperon-mixing.webp',
        imageAlt:
          'Posterior neutron-star mass-radius curves and SHAP feature-value distributions.',
        links: [
          {
            label: 'arXiv',
            href: 'https://arxiv.org/abs/2605.28727',
          },
          {
            label: 'PDF',
            href: 'https://arxiv.org/pdf/2605.28727',
          },
        ],
      },
      {
        title:
          'Vortex creep heating in neutron star cooling with direct Urca processes in heavy neutron stars',
        authors: ['Yoonhak Nam', 'Kazuyuki Sekizawa'],
        venue: 'arXiv:2511.13263 · High Energy Astrophysical Phenomena',
        year: '2025',
        status: '20 pages · 14 figures',
        image: '/images/publications/vortex-creep-3d.webp',
        imageAlt:
          'Three-dimensional neutron-star cooling surfaces across age, temperature, and magnetic field.',
        links: [
          {
            label: 'arXiv',
            href: 'https://arxiv.org/abs/2511.13263',
          },
          {
            label: 'PDF',
            href: 'https://arxiv.org/pdf/2511.13263',
          },
        ],
      },
    ],
  },
] as const;
