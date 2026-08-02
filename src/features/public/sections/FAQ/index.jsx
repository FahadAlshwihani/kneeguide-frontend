import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FaChevronDown } from "react-icons/fa6";
import Reveal from "../../components/Reveal";
import "./FAQ.css";

const QUESTIONS = [
  {
    question: "Is KneeGuide a replacement for physical therapy?",
    answer:
      "No. KneeGuide is designed to complement your care team's treatment plan by keeping them informed between visits, not to replace clinical guidance.",
  },
  {
    question: "How does my doctor see my daily logs?",
    answer:
      "Everything you log — pain levels, mobility and exercises — syncs to your care team's dashboard in real time.",
  },
  {
    question: "Is my health data secure?",
    answer:
      "Yes. All data is encrypted end-to-end and handled to clinical-grade privacy standards.",
  },
  {
    question: "Do I need special equipment to use KneeGuide?",
    answer:
      "No. Just your phone or a browser. The 3D model and tracking tools run directly, with no extra hardware required.",
  },
  {
    question: "Can I use KneeGuide without a referring doctor?",
    answer:
      "Yes. You can create a patient account directly. Connecting with a clinician is optional, though recommended for the full experience.",
  },
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="faq-root" id="faq">
      <div className="faq-container">
        <Reveal className="faq-header">
          <span className="faq-badge">Common Questions</span>
          <h2 className="faq-title">Frequently asked questions.</h2>
        </Reveal>

        <div className="faq-list">
          {QUESTIONS.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <Reveal as="div" key={item.question} delay={index * 0.05} className="faq-item">
                <button
                  type="button"
                  className="faq-question"
                  aria-expanded={isOpen}
                  onClick={() => setOpenIndex(isOpen ? -1 : index)}
                >
                  <span>{item.question}</span>
                  <motion.span
                    className="faq-icon"
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <FaChevronDown aria-hidden="true" />
                  </motion.span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      className="faq-answer-wrapper"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                    >
                      <p className="faq-answer">{item.answer}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
