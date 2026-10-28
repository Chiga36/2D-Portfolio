// Edit the pages below to change what shows up on the PC monitor.
// Each section is one tab on the screen; the arrows (and the drawn
// keyboard's arrow keys) flip between them in this order.
//
// Each item has a heading, and optionally:
//   text - a short description
//   meta - a dimmer line underneath (tech used, dates, issuer...)
//   link - { text, href } to add a clickable link
//
// Set compact: true on a section to show each heading and its text on a
// single line, which fits more short items on the screen.
export const pcSections = [
  {
    title: "Projects",
    items: [
      {
        heading: "Bid Co-Author",
        text: "Full-stack RAG platform for bid teams to draft, evidence-check and score tender responses.",
        meta: "FastAPI, ChromaDB, Azure OpenAI, React, TypeScript",
      },
      {
        heading: "Tracker",
        text: "AI-assisted habit app with on-device webcam attention detection and OCR-verified penalty proofs.",
        meta: "Next.js, Supabase, MediaPipe, Tesseract.js",
      },
      {
        heading: "Image Caption Generator",
        text: "Combines NLP and computer vision to caption images.",
        meta: "LSTM, DenseNet",
        link: { text: "More on github.com/Chiga36", href: "https://github.com/Chiga36" },
      },
    ],
  },
  {
    title: "Experience",
    items: [
      {
        heading: "AI Intern - IISc Bangalore",
        text: "Optimizing video generation models for better performance and output quality.",
      },
      {
        heading: "GenAI Intern - KPMG",
        text: "Built an interactive mode for creating custom AI agents.",
      },
      {
        heading: "GenAI Analyst - KPMG",
        text: "Building Generative applications for the Clients.",
      },
    ],
  },
  {
    title: "Tech Stack",
    compact: true,
    items: [
      { heading: "Languages", text: "Python, TypeScript, C/C++" },
      { heading: "ML & AI", text: "PyTorch, TensorFlow, RAG, ChromaDB" },
      { heading: "Web", text: "React, Next.js, FastAPI, Supabase" },
      { heading: "Cloud & DevOps", text: "AWS, Docker, Git" },
      { heading: "MLOps", text: "DVC, MLflow" },
    ],
  },
  {
    title: "Certifications",
    items: [
      { heading: "Mathematics for Data Science" },
      { heading: "Data Science, ML, NLP and MLOps" },
    ],
  },
  {
    title: "Socials",
    compact: true,
    items: [
      {
        heading: "GitHub",
        link: { text: "Chiga36", href: "https://github.com/Chiga36" },
      },
      {
        heading: "LinkedIn",
        link: {
          text: "chiragsaha3",
          href: "https://www.linkedin.com/in/chiragsaha3",
        },
      },
      {
        heading: "Email",
        link: { text: "chigaswami@gmail.com", href: "mailto:chigaswami@gmail.com" },
      },
    ],
  },
];
