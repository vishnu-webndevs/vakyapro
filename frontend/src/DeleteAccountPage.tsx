'use client';
import { motion } from 'framer-motion'
import Footer from './components/Footer'

export default function DeleteAccountPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <main className="flex-1 pt-24 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-gradient-to-b from-slate-900/80 to-black/80 border border-slate-800/80 rounded-2xl p-8 shadow-xl"
          >
            <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Delete Your Vakyapro Account
            </h1>
            <p className="text-sm text-slate-300 mb-6">
              If you want to delete your Vakyapro account, you can do so directly from the app.
            </p>

            <div className="space-y-6 text-sm text-slate-200">
              <section>
                <h2 className="text-base font-semibold mb-2 text-slate-100">Steps:</h2>
                <ol className="list-decimal list-inside space-y-1 text-slate-300">
                  <li>Open the Vakyapro app.</li>
                  <li>Go to Settings or Profile.</li>
                  <li>Tap &quot;Delete Account&quot;.</li>
                  <li>Confirm deletion.</li>
                </ol>
                <p className="mt-3 text-xs text-amber-300/90">
                  Once confirmed, your account and all associated data will be permanently deleted immediately.
                </p>
              </section>

              <section>
                <h2 className="text-base font-semibold mb-2 text-slate-100">Data deleted includes:</h2>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                  <li>Email address</li>
                  <li>Account information</li>
                  <li>User activity and prompts</li>
                </ul>
              </section>

              <section>
                <h2 className="text-base font-semibold mb-2 text-slate-100">Need help?</h2>
                <p className="text-slate-300">
                  If you need assistance, contact us at:{' '}
                  <a
                    href="mailto:support@vakyapro.com"
                    className="text-cyan-400 hover:text-cyan-300 underline decoration-cyan-500/70"
                  >
                    support@vakyapro.com
                  </a>
                </p>
              </section>
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
