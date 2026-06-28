# Retriqo

![Retriqo Preview](https://project-qr-xi.vercel.app/og-image.png)

**Retriqo** helps industrial teams securely store inspection reports, generate QR codes, and instantly retrieve machine history with a single scan.

Live Demo: [https://project-qr-xi.vercel.app](https://project-qr-xi.vercel.app)

---

## 🚀 Features

- **Instant QR Routing:** Generate robust QR codes linked directly to your industrial assets.
- **Secure Archives:** End-to-end PIN protection and expiry policies to prevent unauthorized access.
- **Unified Document Support:** Upload PDF, ZIP, JPG, PNG, and WEBP seamlessly.
- **Granular Analytics:** Track scan events, unique devices, and blocked attempts.
- **Dynamic Design Lab:** Craft, preview, and perfect your custom physical QR labels before printing.

## 🛠 Technology Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router, React 18)
- **Styling:** Vanilla CSS & TailwindCSS (Hybrid)
- **Database / Auth / Storage:** [Supabase](https://supabase.com/)
- **Animations:** [Framer Motion](https://www.framer.com/motion/)
- **Deployment:** [Vercel](https://vercel.com/)

## 📦 Local Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/rvkarthik579/project-qr.git
   cd project-qr
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Variables**
   Create a `.env.local` file in the root directory and add the following keys from your Supabase dashboard:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🏗 Build Instructions

To build the project for production:

```bash
npm run build
```

This ensures TypeScript validation, ESLint checks, and static page generation run cleanly.

## 🚀 Deployment

The project is pre-configured for frictionless deployment on **Vercel**. 
1. Link your GitHub repository in Vercel.
2. Add your environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
3. Deploy!

## 📂 Project Structure Overview

- `/app`: Next.js App Router (Pages, API routes, Layouts)
- `/components`: Reusable UI components and Design Lab elements
- `/lib`: Helper utilities and Supabase client configuration
- `/public`: Static assets (fonts, images)
- `/hooks`: Custom React hooks

## 📄 License

This project is licensed under the MIT License.
