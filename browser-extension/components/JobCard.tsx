import type { JobData } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building, MapPin, CurrencyDollar } from '@phosphor-icons/react';

interface JobCardProps {
  job: JobData;
}

export function JobCard({ job }: JobCardProps) {
  const sourceLabel = job.source.charAt(0).toUpperCase() + job.source.slice(1);

  return (
    <Card className="border-border/50">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Building size={18} weight="duotone" className="text-primary shrink-0" />
            <span className="font-semibold text-sm truncate">{job.company}</span>
          </div>
          <Badge variant="secondary" className="shrink-0 text-[10px] px-2">
            {sourceLabel}
          </Badge>
        </div>

        <h3 className="text-base font-medium leading-snug">{job.title}</h3>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {job.location && (
            <span className="flex items-center gap-1">
              <MapPin size={13} weight="duotone" />
              {job.location}
            </span>
          )}
          {job.salary && (
            <span className="flex items-center gap-1">
              <CurrencyDollar size={13} weight="duotone" />
              {job.salary}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}