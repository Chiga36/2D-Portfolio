// Edit the sections below to change what shows up on the resume scroll.
// Each section is one "page" of the scroll; the arrows under it flip
// between them in this order.
//
// A line can be plain text, or { text, href } to make it a link.
//
// Note: the scroll font (Kingthings Embroidery) has no glyphs for
// + < > # % | or fancy dashes/bullets, and its "/" looks like a backslash,
// so stick to plain hyphens and "&". Keep lines short: the parchment only
// fits about a dozen lines before it needs scrolling.
export const scrollSections = [
  {
    title: "Resume",
    blocks: [
      {
        heading: "Education",
        lines: [
          "MS Ramaiah Institute of Technology",
          "Computer Science, 2022 - 2026, CGPA 8.3",
        ],
      },
      {
        heading: "Experience",
        lines: ["AI Intern - IISc Bangalore", "GenAI Intern - KPMG"],
      },
      {
        heading: "Projects",
        lines: [
          "Bid Co-Author - RAG for tenders",
          "Tracker - AI-assisted habit app",
          "Image Caption Generator",
        ],
      },
      {
        heading: "Skills",
        lines: ["Python, TypeScript, PyTorch, React, RAG"],
      },
      {
        heading: "Contact",
        lines: [
          { text: "chigaswami@gmail.com", href: "mailto:chigaswami@gmail.com" },
          { text: "GitHub: Chiga36", href: "https://github.com/Chiga36" },
          "LinkedIn: chiragsaha3",
        ],
      },
    ],
  },
  {
    title: "Research Papers",
    blocks: [{ lines: ["None as of now."] }],
  },
];
