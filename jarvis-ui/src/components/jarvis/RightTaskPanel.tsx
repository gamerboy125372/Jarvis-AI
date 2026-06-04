import React from 'react';
import { useJarvisStore, Task } from '../../store/jarvisStore';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_CFG: Record<Task['status'], { label: string; color: string; bg: string; icon: string }> = {
  queued:               { label: 'QUEUED',  color: '#4488ff', bg: '#4488ff10', icon: '○' },
  running:              { label: 'ACTIVE',  color: '#00d4ff', bg: '#00d4ff10', icon: '◉' },
  completed:            { label: 'DONE',    color: '#00ff88', bg: '#00ff8808', icon: '✓' },
  failed:               { label: 'FAILED',  color: '#ff4444', bg: '#ff444410', icon: '✕' },
  waiting_confirmation: { label: 'CONFIRM', color: '#ffaa00', bg: '#ffaa0010', icon: '!' },
};

function TaskCard({ task }: { task: Task }) {
  const cfg = STATUS_CFG[task.status] ?? STATUS_CFG.queued;
  const progress = task.steps > 0 ? (task.currentStep / task.steps) * 100 : 0;
  const isRunning = task.status === 'running';
  const stepCount = `${String(task.currentStep).padStart(2, '0')} / ${String(task.steps).padStart(2, '0')}`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: task.status === 'completed' ? 0.45 : 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="relative overflow-hidden"
      style={{
        background: cfg.bg,
        border: `1px solid ${cfg.color}25`,
        borderLeft: `2px solid ${cfg.color}`,
        clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)',
        padding: '10px 12px',
        marginBottom: 8,
      }}
    >
      {/* Running glow sweep */}
      {isRunning && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(90deg, transparent, ${cfg.color}08, transparent)`,
          }}
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        />
      )}

      {/* Cut corner */}
      <div style={{
        position: 'absolute', top: 0, right: 0,
        width: 0, height: 0,
        borderStyle: 'solid',
        borderWidth: '0 10px 10px 0',
        borderColor: `transparent ${cfg.color}40 transparent transparent`,
      }} />

      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[11px] flex-shrink-0" style={{ color: cfg.color }}>{cfg.icon}</span>
          <span className="text-[10px] font-mono font-medium tracking-wide truncate" style={{ color: `${cfg.color}dd` }}>
            {task.name}
          </span>
        </div>
        <div className="flex-shrink-0 flex items-center gap-1.5">
          {isRunning && (
            <motion.div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: cfg.color, boxShadow: `0 0 5px ${cfg.color}` }}
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
          )}
          <span className="text-[9px] tracking-widest font-mono uppercase" style={{ color: `${cfg.color}88` }}>
            {cfg.label}
          </span>
        </div>
      </div>

      {/* Progress row */}
      <div className="flex items-center gap-2 mb-1.5">
        <div className="flex-1 h-[3px] rounded-full overflow-hidden" style={{ background: '#00d4ff0a' }}>
          <motion.div
            className="h-full rounded-full"
            style={{
              background: isRunning
                ? `linear-gradient(90deg, ${cfg.color}88, ${cfg.color})`
                : cfg.color,
              boxShadow: isRunning ? `0 0 6px ${cfg.color}` : 'none',
            }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(2, progress)}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>
        <span className="text-[9px] font-mono tabular-nums flex-shrink-0" style={{ color: `${cfg.color}66` }}>
          {stepCount}
        </span>
      </div>

      {/* Sub bar segments */}
      <div className="flex gap-[2px]">
        {Array.from({ length: task.steps || 5 }, (_, i) => (
          <div
            key={i}
            className="flex-1 h-[2px] rounded-full"
            style={{
              background: i < task.currentStep ? cfg.color : '#00d4ff10',
              boxShadow: i < task.currentStep && isRunning ? `0 0 4px ${cfg.color}` : 'none',
              transition: 'background 0.3s ease',
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 opacity-40">
      <svg width={48} height={48} viewBox="0 0 48 48">
        <circle cx={24} cy={24} r={20} fill="none" stroke="#00d4ff" strokeWidth={0.8} strokeDasharray="4 4" />
        <circle cx={24} cy={24} r={12} fill="none" stroke="#00d4ff" strokeWidth={0.5} />
        <line x1={24} y1={4} x2={24} y2={44} stroke="#00d4ff" strokeWidth={0.4} opacity={0.3} />
        <line x1={4} y1={24} x2={44} y2={24} stroke="#00d4ff" strokeWidth={0.4} opacity={0.3} />
      </svg>
      <div className="text-[10px] tracking-widest uppercase font-mono" style={{ color: '#00d4ff' }}>
        NO ACTIVE TASKS
      </div>
      <div className="text-[9px] tracking-wider uppercase font-mono" style={{ color: '#00d4ff50' }}>
        AWAITING DIRECTIVES
      </div>
    </div>
  );
}

export function RightTaskPanel() {
  const { tasks } = useJarvisStore();

  const activeCount = tasks.filter(t => t.status === 'running').length;
  const totalCount = tasks.length;
  const completedCount = tasks.filter(t => t.status === 'completed').length;

  return (
    <div
      className="fixed flex flex-col font-mono"
      style={{
        right: 20, top: 36, bottom: 32,
        width: 272,
        background: 'linear-gradient(225deg, #020d1fee 0%, #010918ee 100%)',
        border: '1px solid #00d4ff25',
        borderTop: '1px solid #00d4ff40',
        borderRight: '1px solid #00d4ff40',
        clipPath: 'polygon(20px 0, 100% 0, 100% 100%, 0 100%, 0 20px)',
        boxShadow: '0 0 30px rgba(0,212,255,0.05), inset 0 0 50px rgba(0,212,255,0.02)',
        padding: '16px',
        zIndex: 20,
      }}
      data-testid="right-panel"
    >
      {/* Cut corner */}
      <div style={{
        position: 'absolute', top: 0, left: 0,
        width: 0, height: 0,
        borderStyle: 'solid',
        borderWidth: '20px 0 0 20px',
        borderColor: `transparent transparent transparent #00d4ff40`,
      }} />

      {/* Header */}
      <div className="mb-4 pb-3" style={{ borderBottom: '1px solid #00d4ff20' }}>
        <div className="flex items-center justify-between mb-1">
          <div className="text-[9px] tracking-[0.3em] uppercase" style={{ color: '#00d4ff55' }}>
            OPERATIONS CENTER
          </div>
          <div className="flex items-center gap-1 text-[9px] font-mono">
            <span style={{ color: '#00d4ff40' }}>DONE</span>
            <span style={{ color: '#00d4ff80' }}>{completedCount}/{totalCount}</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-[15px] font-bold tracking-[0.15em] uppercase" style={{ color: '#00d4ff' }}>
            TASK QUEUE
          </div>
          <div
            className="px-2 py-0.5 text-[10px] font-bold tracking-widest"
            style={{
              background: activeCount > 0 ? '#00d4ff20' : '#00d4ff0a',
              border: '1px solid #00d4ff30',
              color: activeCount > 0 ? '#00d4ff' : '#00d4ff60',
            }}
          >
            {String(totalCount).padStart(2, '0')}
          </div>
        </div>
      </div>

      {/* Status summary bar */}
      {tasks.length > 0 && (
        <div className="flex gap-3 mb-4 text-[9px] font-mono tracking-wider">
          {[
            { label: 'ACTIVE', count: tasks.filter(t => t.status === 'running').length, color: '#00d4ff' },
            { label: 'QUEUED', count: tasks.filter(t => t.status === 'queued').length, color: '#4488ff' },
            { label: 'DONE', count: completedCount, color: '#00ff88' },
            { label: 'ERR', count: tasks.filter(t => t.status === 'failed').length, color: '#ff4444' },
          ].map(s => (
            <div key={s.label} className="flex flex-col items-center gap-0.5">
              <span className="font-bold" style={{ color: s.color }}>{s.count}</span>
              <span style={{ color: `${s.color}60` }}>{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Task list */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-0.5">
        <AnimatePresence>
          {tasks.length === 0 ? (
            <EmptyState />
          ) : (
            tasks.map(task => <TaskCard key={task.id} task={task} />)
          )}
        </AnimatePresence>
      </div>

      {/* Footer data */}
      <div className="mt-3 pt-2 flex justify-between items-center" style={{ borderTop: '1px solid #00d4ff10' }}>
        <span className="text-[8px] tracking-widest" style={{ color: '#00d4ff25' }}>PRIORITY: ALPHA</span>
        <span className="text-[8px] font-mono" style={{ color: '#00d4ff30' }}>THREAD-SAFE</span>
      </div>
    </div>
  );
}
