'use client';

import React from 'react';
import { cx } from '@/lib/tremor-utils';

export const Table = ({ className, children, ...props }: React.TableHTMLAttributes<HTMLTableElement>) => (
  <table className={cx('w-full text-left text-xs', className)} {...props}>{children}</table>
);

export const TableHead = ({ className, children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <thead className={cx('text-sky-200/60 font-mono text-[10px] uppercase tracking-wider', className)} {...props}>{children}</thead>
);

export const TableBody = ({ className, children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <tbody className={cx('divide-y divide-white/8', className)} {...props}>{children}</tbody>
);

export const TableRow = ({ className, children, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
  <tr className={cx('text-white/85 hover:bg-white/8 transition-colors', className)} {...props}>{children}</tr>
);

export const TableHeaderCell = ({ className, children, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) => (
  <th className={cx('px-3 py-2 font-semibold', className)} {...props}>{children}</th>
);

export const TableCell = ({ className, children, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) => (
  <td className={cx('px-3 py-2.5 font-sans', className)} {...props}>{children}</td>
);
