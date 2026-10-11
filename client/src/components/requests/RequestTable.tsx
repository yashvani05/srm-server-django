import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createColumnHelper, tableFeatures, useTable } from '@tanstack/react-table';
import { CATEGORY_LABELS } from '../../constants/requests';
import { useAuth } from '../../hooks/useAuth';
import type { ServiceRequest } from '../../types/request';
import { cn } from '../../utils/cn';
import { formatDateTime } from '../../utils/format';
import { canEditRequest } from '../../utils/permissions';
import { timeAgo } from '../../utils/time';
import { ActionMenu, type ActionMenuItem } from '../ui/ActionMenu';
import { OverdueBadge } from './OverdueBadge';
import { PriorityBadge } from './PriorityBadge';
import { StatusBadge } from './StatusBadge';

const features = tableFeatures({});
const column = createColumnHelper<typeof features, ServiceRequest>();

interface RequestTableProps {
  items: ServiceRequest[];
  onDelete: (request: ServiceRequest) => void;
  isFetching?: boolean;
}

export function RequestTable({ items, onDelete, isFetching }: RequestTableProps) {
  const { user, hasPermission } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'ADMIN';
  const canDelete = hasPermission('requests.delete');

  const columns = useMemo(
    () =>
      column.columns([
        column.accessor('title', {
          header: 'Request',
          cell: ({ row }) => (
            <div className="max-w-xs lg:max-w-sm xl:max-w-md">
              <Link
                to={`/requests/${row.original.id}`}
                onClick={(e) => e.stopPropagation()}
                className="block truncate font-medium text-gray-900 hover:underline focus:outline-none focus-visible:underline"
              >
                {row.original.title}
              </Link>
              <span className="block truncate text-xs text-gray-500">
                {CATEGORY_LABELS[row.original.category]}
                {isAdmin && ` · ${row.original.createdBy.name}`}
              </span>
            </div>
          ),
        }),
        column.accessor('priority', { header: 'Priority', cell: ({ row }) => <PriorityBadge priority={row.original.priority} /> }),
        column.accessor('status', {
          header: 'Status',
          cell: ({ row }) => (
            <div className="flex flex-wrap items-center gap-1.5">
              <StatusBadge status={row.original.status} />
              {row.original.isOverdue && <OverdueBadge />}
            </div>
          ),
        }),
        column.accessor('createdAt', {
          header: 'Created',
          cell: ({ row }) => (
            <time dateTime={row.original.createdAt} title={formatDateTime(row.original.createdAt)} className="whitespace-nowrap text-gray-600">
              {timeAgo(row.original.createdAt)}
            </time>
          ),
        }),
        column.display({
          id: 'actions',
          header: () => <span className="block text-center">Action</span>,
          cell: ({ row }) => (
            <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
              <RowActions request={row.original} onDelete={onDelete} canDelete={canDelete} />
            </div>
          ),
        }),
      ]),
    [isAdmin, canDelete, onDelete],
  );

  const table = useTable({ features, columns, data: items });
  const rows = table.getRowModel().rows;

  return (
    <div className={cn('transition-opacity', isFetching && 'opacity-60')} aria-busy={isFetching || undefined}>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id}>
                {group.headers.map((header) => (
                  <th key={header.id} scope="col" className="px-4 py-3 font-medium">
                    {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row) => (
              <tr
                key={row.id}
                onClick={() => navigate(`/requests/${row.original.id}`)}
                className={cn('cursor-pointer transition-colors hover:bg-gray-50', row.original.isOverdue && 'shadow-[inset_3px_0_0_0_var(--color-accent-600)]')}
              >
                {row.getAllCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 align-middle text-gray-700">
                    <table.FlexRender cell={cell} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-gray-100 md:hidden">
        {rows.map((row) => {
          const r = row.original;
          return (
            <li key={row.id} className={cn('relative', r.isOverdue && 'shadow-[inset_3px_0_0_0_var(--color-accent-600)]')}>
              <Link to={`/requests/${r.id}`} className="block space-y-2 p-4 pr-14 focus:outline-none focus-visible:bg-gray-50">
                <span className="block font-medium text-gray-900">{r.title}</span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <StatusBadge status={r.status} />
                  {r.isOverdue && <OverdueBadge />}
                  <PriorityBadge priority={r.priority} />
                </div>
                <p className="text-xs text-gray-500">
                  {CATEGORY_LABELS[r.category]} · {timeAgo(r.createdAt)}
                  {isAdmin && ` · ${r.createdBy.name}`}
                </p>
              </Link>
              <div className="absolute right-3 top-3">
                <RowActions request={r} onDelete={onDelete} canDelete={canDelete} />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function RowActions({ request, onDelete, canDelete }: { request: ServiceRequest; onDelete: (r: ServiceRequest) => void; canDelete: boolean }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const items: ActionMenuItem[] = [];
  if (canEditRequest(user, request)) items.push({ label: 'Edit', icon: 'pencil', onSelect: () => navigate(`/requests/${request.id}/edit`) });
  if (canDelete) items.push({ label: 'Delete', icon: 'trash', danger: true, onSelect: () => onDelete(request) });

  return <ActionMenu items={items} label={`Actions for ${request.title}`} />;
}
