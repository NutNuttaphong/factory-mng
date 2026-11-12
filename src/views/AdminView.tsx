import React, { useMemo } from 'react';
import { AuditLog } from '../types';
import { DataTable } from '../components/shared/Table';

interface AdminViewProps {
  auditLogs: AuditLog[];
}

export const AdminView: React.FC<AdminViewProps> = ({ auditLogs }) => {
  const actionOptions = useMemo(() => {
    const set = new Set<string>();
    auditLogs.forEach((l) => {
      if (l.action) set.add(l.action);
    });
    return ['ALL', ...Array.from(set)];
  }, [auditLogs]);

  return (
    <div>
      <div className="card">
        <div className="card-title">Security & Action Audit Logs (Read-Only DB Log)</div>
        <DataTable
          data={auditLogs}
          headers={['Time', 'User Email', 'Action', 'Entity', 'Entity ID', 'Before State', 'After State', 'IP Address']}
          searchPlaceholder="Search email, action, entity, or IP address..."
          searchFilter={(log, q) =>
            (log.userEmail || '').toLowerCase().includes(q.toLowerCase()) ||
            (log.action || '').toLowerCase().includes(q.toLowerCase()) ||
            (log.entityName || '').toLowerCase().includes(q.toLowerCase()) ||
            (log.ipAddress || '').toLowerCase().includes(q.toLowerCase())
          }
          filterOptions={[
            {
              label: 'Action',
              options: actionOptions,
              filterFn: (log, sel) => sel === 'ALL' || log.action === sel,
            },
          ]}
          pageSize={10}
          renderRow={(log) => (
            <tr key={log.id} style={{ fontSize: '13px' }}>
              <td>{log.createdAt}</td>
              <td style={{ fontWeight: 600 }}>{log.userEmail}</td>
              <td style={{ color: '#FF7A00', fontWeight: 600 }}>{log.action}</td>
              <td>{log.entityName}</td>
              <td style={{ fontFamily: 'monospace', fontSize: '11px' }}>{log.entityId.substring(0, 8)}...</td>
              <td
                style={{
                  fontFamily: 'monospace',
                  color: '#9CA3AF',
                  fontSize: '11px',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  maxWidth: '120px',
                }}
              >
                {log.beforeState || '-'}
              </td>
              <td
                style={{
                  fontFamily: 'monospace',
                  color: '#22C55E',
                  fontSize: '11px',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  maxWidth: '120px',
                }}
              >
                {log.afterState || '-'}
              </td>
              <td>{log.ipAddress}</td>
            </tr>
          )}
        />
      </div>
    </div>
  );
};
