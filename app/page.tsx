import { IDSDetector } from '@/components/ids-detector'
import Link from 'next/link'
import { Activity } from 'lucide-react'

export default function Home() {
  return (
    <>
      <div className="fixed top-4 right-4 z-50">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition font-medium text-sm"
        >
          <Activity className="w-4 h-4" />
          Live SOC Dashboard
        </Link>
      </div>
      <IDSDetector />
    </>
  )
}
