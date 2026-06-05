
import { redirect } from 'next/navigation'

export default function Home() {
  // The main app is under the (app) route group, so we redirect there.
  redirect('/dashboard');
}
