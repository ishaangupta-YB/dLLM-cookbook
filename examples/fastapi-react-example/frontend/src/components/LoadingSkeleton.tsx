import { Skeleton } from '@/components/ui/skeleton';

export default function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
      <div className="flex items-start gap-4 justify-end">
        <div className="flex-1 space-y-2 max-w-[75%]">
          <Skeleton className="h-4 w-2/3 ml-auto" />
          <Skeleton className="h-4 w-1/3 ml-auto" />
        </div>
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <div className="flex items-start gap-4">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    </div>
  );
} 