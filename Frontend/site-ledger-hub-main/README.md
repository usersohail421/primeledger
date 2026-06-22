# PrimeLedger - Frontend Application

This is the React-based frontend for the **PrimeLedger** project. It provides a modern, responsive user interface for managing site projects, expenses, and analytics.

## 🚀 Features

- **Project Dashboard**: Real-time overview of all construction projects.
- **Interactive Bill Builder**: Seamless interface for creating itemized site bills.
- **Advanced Data Visualization**: Charts and graphs for weekly spending and item-wise breakdowns.
- **Document Management**: UI for triggering PDF and Excel report generation.
- **Company Branding**: Profile management to customize headers on generated documents.

## 🛠️ Tech Stack

- **Framework**: [React 18](https://reactjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **API Communication**: [Axios](https://axios-http.com/)
- **Icons**: [Lucide React](https://lucide.dev/)

## ⚙️ Environment Variables

Create a `.env` file in the project root directory:

```env
VITE_API_BASE_URL=http://localhost:7887
VITE_API_WITH_CREDENTIALS=true
```

## 📦 Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

## 🔗 Connection to Backend

Ensure the backend server is running on `http://localhost:7887`. The API configurations are managed in `src/api/axiosInstance.ts`.

---

*For full project documentation including backend setup, please refer to the [Root README](../../README.md).*
