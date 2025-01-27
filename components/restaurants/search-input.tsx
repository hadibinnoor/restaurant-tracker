'use client'

import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { useRouter, useSearchParams } from 'next/navigation'
import { useDebounce } from '@/lib/hooks/use-debounce'

interface SearchInputProps {
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export function SearchInput({ value, onChange }: SearchInputProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Search restaurants, tags, or dishes..."
        className="pl-10"
        value={value}
        onChange={onChange}
      />
    </div>
  )
}

const SearchInputContainer = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [value, setValue] = useState(searchParams.get('search') || '')
  const debouncedValue = useDebounce(value, 500)

  useEffect(() => {
    const params = new URLSearchParams(searchParams)
    if (debouncedValue) {
      params.set('search', debouncedValue)
    } else {
      params.delete('search')
    }
    router.push(`/?${params.toString()}`)
  }, [debouncedValue, router, searchParams])

  return <SearchInput value={value} onChange={(e) => setValue(e.target.value)} />
}

export default SearchInputContainer
