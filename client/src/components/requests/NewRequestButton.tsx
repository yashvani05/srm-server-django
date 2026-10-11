import { cn } from '../../utils/cn';
import { ButtonLink } from '../ui/ButtonLink';
import { Icon } from '../ui/Icon';

export function NewRequestButton({ className }: { className?: string }) {
  return (
    <ButtonLink to="/requests/new" className={cn('group shadow-sm transition-all hover:-translate-y-px hover:shadow-md active:translate-y-0 active:shadow-sm', className)}>
      <span
        className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-950/10 transition-all duration-200 group-hover:rotate-90 group-hover:scale-110 group-hover:bg-sky-950 group-hover:text-sky-50 group-focus-visible:bg-sky-950 group-focus-visible:text-sky-50"
        aria-hidden="true"
      >
        <Icon name="plus" className="h-3.5 w-3.5 stroke-2" />
      </span>
      New request
    </ButtonLink>
  );
}
