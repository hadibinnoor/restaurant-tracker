import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Share, Copy, Check } from 'lucide-react'

interface ShareProfileDialogProps {
  userId: string
}

export function ShareProfileDialog({ userId }: ShareProfileDialogProps) {
  const [copied, setCopied] = useState(false)
  const profileUrl = `${window.location.origin}/${userId}`

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Share className="h-4 w-4" />
          Share Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share your public profile</DialogTitle>
        </DialogHeader>
        <div className="flex items-center space-x-2 mt-4">
          <div className="grid flex-1 gap-2">
            <Input
              readOnly
              value={profileUrl}
              className="w-full"
            />
          </div>
          <Button 
            size="sm" 
            className="px-3"
            onClick={copyToClipboard}
          >
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            <span className="sr-only">Copy</span>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Share this link with anyone to let them view your restaurant collection.
        </p>
      </DialogContent>
    </Dialog>
  )
}
