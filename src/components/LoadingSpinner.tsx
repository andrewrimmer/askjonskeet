export default function LoadingSpinner({ message = 'Consulting the oracle...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
      <div className="w-8 h-8 border-[3px] border-gray-200 border-t-skeet-orange rounded-full animate-spin" />
      <p className="mt-3 text-sm">{message}</p>
    </div>
  )
}
