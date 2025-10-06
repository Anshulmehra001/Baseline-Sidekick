# 🎯 Baseline Sidekick
### 🤖 The AI-Powered Co-pilot for Baseline Web Compatibility

Baseline Sidekick is a revolutionary VS Code extension built for the **Google Baseline Tooling Hackathon 2025**. It transforms how developers handle cross-browser compatibility by integrating real-time analysis, gamified scoring, and a powerful AI modernization assistant directly into the editor.

<div align="center">

![VS Code Extension](https://img.shields.io/badge/VS%20Code-Extension-007ACC?style=for-the-badge&logo=visual-studio-code)
![AI Powered](https://img.shields.io/badge/AI%20Powered-Google%20Gemini-4285F4?style=for-the-badge&logo=google)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)
![Version](https://img.shields.io/badge/Version-1.0.0-blue?style=for-the-badge)

</div>

---

<div align="center">

**See Baseline Sidekick in Action!**

*A quick demonstration of real-time analysis and one-click AI code modernization.*

![Baseline Sidekick Demo GIF](https://i.imgur.com/your-demo-link.gif)
*<p>(Replace this link with your actual demo GIF)</p>*

</div>

---

## 💡 The Problem: The "Compatibility Tax"

Every web developer constantly asks: **"Is this feature safe to use yet?"** This leads to a frustrating cycle of context-switching between the IDE, MDN, and CanIUse.com, wasting valuable time and introducing project risk. This "compatibility tax" slows down innovation and makes adopting modern web standards a chore.

## 🚀 Our Solution: An Intelligent Co-pilot

Baseline Sidekick eliminates this tax. It's not just a linter that finds problems; it's an **AI-powered co-pilot that helps you solve them.** It makes writing modern, compatible code the easiest and most intuitive path, turning a tedious task into a satisfying experience.

---

## ✨ Core Features

| Feature                          | Description                                                                                                                                     |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| ⚡ **Real-Time Analysis**         | Instantly flags non-Baseline CSS, JavaScript, and HTML features with clear diagnostics and rich hover info as you type.                         |
| 🤖 **AI Modernization Assistant**  | Uses **Google Gemini** to generate intelligent fixes, from creating production-ready polyfills to refactoring entire legacy code blocks.         |
| 🎮 **Gamified "Baseline Score"** | Calculates a real-time compatibility score (A+ to F) for every file, gamifying the process of writing high-quality, modern code.                |
| 🔍 **Workspace Audit**           | Performs a comprehensive analysis of your entire project, generating a detailed report to help manage technical debt.                             |
| 🌐 **Multi-Language Support**    | Provides deep analysis for **CSS, JavaScript, TypeScript, and HTML** using a robust, multi-parser engine.                                       |
| 🛠️ **Intelligent Build Integration** | The AI can suggest optimized configurations for your build tools like Babel or PostCSS to handle modern features automatically.                 |

---

## 🚀 Getting Started in 60 Seconds

### 1. Installation

You can install Baseline Sidekick directly from the VS Code Marketplace.

1.  Open the **Extensions** view (`Ctrl+Shift+X`).
2.  Search for `Baseline Sidekick`.
3.  Click **Install**.

### 2. See it in Action

Once installed, open any CSS, JS, or HTML file. The extension will start working immediately.

**Try this CSS snippet:**

```css
.legacy-container {
  /* ❌ 'float' is a legacy property and will be flagged instantly */
  float: left;
  clear: both;
}

.modern-container {
  /* ✅ 'display: grid' is Baseline and will have no warnings */
  display: grid;
  gap: 1rem;
} ```


Hover over float to see compatibility details, and click the lightbulb icon (💡) to see the AI-powered Quick Fixes!


🤖 The Dual-AI Advantage


Baseline Sidekick uses a unique dual-engine approach for the best balance of speed and intelligence.
⚡ Local Pattern Engine (For Speed)

A lightning-fast, offline engine that performs real-time analysis (<100ms) by matching code against a local database of over 30,000 web features. It provides instant diagnostics as you type.

### 🧠 Google Gemini API (For Intelligence)
When you need a solution, we call the Google Gemini API. Its advanced reasoning capabilities allow it to generate context-aware polyfills, refactor complex code, and provide deep, actionable insights that a simple pattern-matcher cannot.

This hybrid model ensures your editor remains responsive while giving you access to state-of-the-art AI power when you need it most.

---

## 🔑 Unlock Full AI Power (Optional)

The core analysis works out-of-the-box. To enable the generative AI features:

1.  Get a free Google Gemini API key from [Makersuite](https://makersuite.google.com/app/apikey).
2.  Open VS Code settings (`Ctrl+,`), search for `Baseline Sidekick`, and paste your API key into the `baselineSidekick.ai.geminiApiKey` field.

---

## 🛠️ Built With

This project was made possible by these incredible technologies:

*   **Core:** TypeScript, VS Code Extension API, Node.js
*   **AI Engine:** Google Gemini API
*   **Data Source:** `@web-platform-dx/web-features`
*   **Parsers:** PostCSS (for CSS), Babel (for JS/TS), parse5 (for HTML)
*   **Testing:** Vitest

---

## 🤝 Contributing

Baseline Sidekick is proudly open-source and community-driven. Contributions are welcome! Whether it's reporting a bug, suggesting a feature, or submitting a pull request, your help is greatly appreciated.

1.  **Fork the repository.**
2.  **Create a new branch:** `git checkout -b feature/YourAmazingFeature`
3.  **Install dependencies:** `npm install`
4.  **Make your changes and run tests:** `npm test`
5.  **Submit a Pull Request!**

---

## 🙏 Acknowledgments

*   A huge thank you to the **Google Baseline Team** for creating and maintaining the `web-features` dataset.
*   To the organizers of the **Baseline Tooling Hackathon 2025** for inspiring this project.
*   To the **VS Code team** for providing such a powerful and extensible platform.

---

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.

---

<div align="center">
    <p><strong>Developed by Aniket Mehra & Apoorv Bhargava for the Baseline Tooling Hackathon 2025.</strong></p>
</div>