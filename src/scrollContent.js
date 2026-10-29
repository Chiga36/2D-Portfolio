// Edit the sections below to change what shows up on the resume scroll.
// Each section is one "page" of the scroll; the arrows under it flip
// between them in this order.
//
// A line can be plain text, or { text, href } to make it a link.
//
// Note: the scroll font (Knights Quest) has no glyphs for < > # | (they'll
// fall back to a plain serif font), but + % / \ - – — • & all render fine.
// Keep lines short: the parchment only fits about a dozen lines before it
// needs scrolling.
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
        heading: "Skills",
        lines: ["Python, TypeScript, PyTorch, React, RAG"],
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
        heading: "Contact",
        lines: [
          { text: "chigaswami@gmail.com", href: "mailto:chigaswami@gmail.com" },
          { text: "GitHub: Chiga36", href: "https://github.com/Chiga36" },
          {
            text: "LinkedIn: chiragsaha3",
            href: "https://www.linkedin.com/in/chiragsaha3",
          },
        ],
      },
    ],
  },
  {
    title: "Research Papers",
    blocks: [{ lines: ["Coming Soon..."] }],
  },
];
