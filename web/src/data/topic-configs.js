export const TOPICS_BY_AGE = {
  4: [
    { id: "all", label: "All Stories", icon: "" },
    { id: "bedtime", label: "🌙 Bedtime", icon: "🌙" },
    { id: "emotions", label: "😊 Happy & Sad", icon: "😊" },
    { id: "friendship", label: "🤝 Making Friends", icon: "🤝" },
    { id: "creativity", label: "🎨 Colors & Art", icon: "🎨" }
  ],
  5: [
    { id: "all", label: "All Stories", icon: "" },
    { id: "bedtime", label: "🌙 Bedtime", icon: "🌙" },
    { id: "emotions", label: "😊 Feelings", icon: "😊" },
    { id: "friendship", label: "🤝 Sharing", icon: "🤝" },
    { id: "problem-solving", label: "🧩 Puzzles", icon: "🧩" },
    { id: "creativity", label: "🎨 Art & Music", icon: "🎨" }
  ],
  6: [
    { id: "all", label: "All Stories", icon: "" },
    { id: "bedtime", label: "🌙 Sleep Routine", icon: "🌙" },
    { id: "emotions", label: "💭 Understanding Feelings", icon: "💭" },
    { id: "friendship", label: "🤝 Teamwork", icon: "🤝" },
    { id: "problem-solving", label: "🧩 Problem Solving", icon: "🧩" },
    { id: "creativity", label: "🎨 Creating Things", icon: "🎨" }
  ],
  7: [
    { id: "all", label: "All Stories", icon: "" },
    { id: "bedtime", label: "🌙 Relaxation", icon: "🌙" },
    { id: "emotions", label: "🧠 Managing Emotions", icon: "🧠" },
    { id: "friendship", label: "💬 Communication", icon: "💬" },
    { id: "problem-solving", label: "🔍 Critical Thinking", icon: "🔍" },
    { id: "creativity", label: "🚀 Innovation", icon: "🚀" }
  ],
  8: [
    { id: "all", label: "All Stories", icon: "" },
    { id: "bedtime", label: "🌙 Mindfulness", icon: "🌙" },
    { id: "emotions", label: "🎭 Emotional Intelligence", icon: "🎭" },
    { id: "friendship", label: "🌍 Leadership & Empathy", icon: "🌍" },
    { id: "problem-solving", label: "🧪 Logic & Strategy", icon: "🧪" },
    { id: "creativity", label: "💡 Creative Expression", icon: "💡" }
  ]
};

// Fallback for ages not specified
export const DEFAULT_TOPICS = TOPICS_BY_AGE[4];