import { useCallback, useEffect, useMemo } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Node,
  type Edge,
  MarkerType,
  Handle,
  Position,
} from "reactflow";
import "reactflow/dist/style.css";
import { Download, Plus, Save, Sparkles } from "lucide-react";
import type { MindMap } from "@/lib/types";
import { saveMindMap } from "@/lib/study";
import { toast } from "sonner";

interface MindMapEditorProps {
  mindmap: MindMap;
}

/* ----------------------------- Custom Nodes ----------------------------- */

function RootNode({ data }: { data: { label: string } }) {
  return (
    <div className="group relative">
      {/* halo */}
      <div className="absolute -inset-3 rounded-full bg-gradient-to-br from-fuchsia-400/40 via-pink-400/30 to-violet-500/40 blur-xl opacity-80 group-hover:opacity-100 transition" />
      <div className="relative flex items-center gap-2 rounded-full bg-gradient-to-br from-fuchsia-600 via-pink-500 to-violet-600 px-6 py-3.5 text-white shadow-[0_20px_50px_-12px_rgba(192,38,211,0.55)] ring-2 ring-white/60">
        <Sparkles className="h-4 w-4" />
        <span className="font-display text-base font-semibold tracking-tight max-w-[240px] text-center">
          {data.label}
        </span>
        <Handle type="source" position={Position.Bottom} className="!bg-white !border-fuchsia-500" />
        <Handle type="target" position={Position.Top} className="!opacity-0" />
      </div>
    </div>
  );
}

function BranchNode({ data }: { data: { label: string; tone: number } }) {
  // Distinct pastel-vibrant tones for branches
  const tones = [
    "from-fuchsia-500/95 to-pink-500/95 ring-fuchsia-200",
    "from-violet-500/95 to-purple-600/95 ring-violet-200",
    "from-pink-500/95 to-rose-500/95 ring-pink-200",
    "from-purple-500/95 to-indigo-500/95 ring-purple-200",
    "from-rose-500/95 to-fuchsia-500/95 ring-rose-200",
    "from-indigo-500/95 to-violet-600/95 ring-indigo-200",
  ];
  const cls = tones[data.tone % tones.length];
  return (
    <div className="group relative">
      <div className={`absolute -inset-1.5 rounded-2xl bg-gradient-to-br ${cls} opacity-30 blur-md group-hover:opacity-60 transition`} />
      <div
        className={`relative rounded-2xl bg-gradient-to-br ${cls} px-4 py-2.5 text-white shadow-[0_10px_30px_-12px_rgba(168,85,247,0.5)] ring-1 ring-white/40 backdrop-blur-sm font-medium text-[13px] max-w-[200px] text-center`}
      >
        <Handle type="target" position={Position.Top} className="!bg-white !border-violet-500" />
        {data.label}
        <Handle type="source" position={Position.Bottom} className="!bg-white !border-violet-500" />
      </div>
    </div>
  );
}

function LeafNode({ data }: { data: { label: string; tone: number } }) {
  // Glassy soft leaves — readable, light
  const accents = [
    "before:from-fuchsia-300 before:to-pink-300",
    "before:from-violet-300 before:to-purple-300",
    "before:from-pink-300 before:to-rose-300",
    "before:from-purple-300 before:to-indigo-300",
  ];
  const accent = accents[data.tone % accents.length];
  return (
    <div
      className={`relative rounded-xl bg-white/85 backdrop-blur-md px-3.5 py-2 text-[12px] font-medium text-violet-900 shadow-[0_8px_24px_-12px_rgba(139,92,246,0.35)] ring-1 ring-violet-100 max-w-[180px] text-center
        before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:rounded-l-xl before:bg-gradient-to-b ${accent}`}
    >
      <Handle type="target" position={Position.Top} className="!bg-violet-400 !border-white" />
      <span className="block pl-1">{data.label}</span>
      <Handle type="source" position={Position.Bottom} className="!opacity-0" />
    </div>
  );
}

const nodeTypes = { root: RootNode, branch: BranchNode, leaf: LeafNode };

/* ------------------------------ Layout ------------------------------ */

function layout(
  rawNodes: { id: string; label: string }[],
  rawEdges: { id: string; source: string; target: string }[],
) {
  const childMap: Record<string, string[]> = {};
  rawEdges.forEach((e) => {
    childMap[e.source] = childMap[e.source] || [];
    childMap[e.source].push(e.target);
  });

  const positions: Record<string, { x: number; y: number; level: number; tone: number }> = {};
  const root = rawNodes[0]?.id ?? "root";
  positions[root] = { x: 0, y: 0, level: 0, tone: 0 };

  const branches = childMap[root] ?? [];
  const branchRadius = 340;

  branches.forEach((b, i) => {
    const angle = (i / Math.max(branches.length, 1)) * Math.PI * 2 - Math.PI / 2;
    positions[b] = {
      x: Math.cos(angle) * branchRadius,
      y: Math.sin(angle) * branchRadius,
      level: 1,
      tone: i,
    };
    const kids = childMap[b] ?? [];
    const childRadius = 200;
    const arc = Math.min(Math.PI / 2.2, 0.35 * Math.max(kids.length, 1));
    kids.forEach((c, ci) => {
      const t = kids.length === 1 ? 0 : (ci / (kids.length - 1)) * arc - arc / 2;
      const ca = angle + t;
      positions[c] = {
        x: positions[b].x + Math.cos(ca) * childRadius,
        y: positions[b].y + Math.sin(ca) * childRadius,
        level: 2,
        tone: i,
      };
    });
  });

  const nodes: Node[] = rawNodes.map((n) => {
    const p = positions[n.id] ?? { x: Math.random() * 400, y: Math.random() * 400, level: 2, tone: 0 };
    const type = p.level === 0 ? "root" : p.level === 1 ? "branch" : "leaf";
    return {
      id: n.id,
      type,
      position: { x: p.x, y: p.y },
      data: { label: n.label, tone: p.tone },
    };
  });

  // Branch tone palette for edges
  const edgeColors = [
    "#d946ef", // fuchsia
    "#8b5cf6", // violet
    "#ec4899", // pink
    "#a855f7", // purple
    "#f43f5e", // rose
    "#6366f1", // indigo
  ];

  const edges: Edge[] = rawEdges.map((e) => {
    const tone = positions[e.target]?.tone ?? 0;
    const color = edgeColors[tone % edgeColors.length];
    const isLeaf = (positions[e.target]?.level ?? 0) === 2;
    return {
      id: e.id,
      source: e.source,
      target: e.target,
      type: "smoothstep",
      animated: !isLeaf,
      style: {
        stroke: color,
        strokeWidth: isLeaf ? 1.6 : 2.2,
        strokeDasharray: isLeaf ? "4 4" : undefined,
        opacity: isLeaf ? 0.7 : 0.95,
      },
      markerEnd: { type: MarkerType.ArrowClosed, color, width: 18, height: 18 },
    };
  });

  return { nodes, edges };
}

/* ------------------------------ Editor ------------------------------ */

export function MindMapEditor({ mindmap }: MindMapEditorProps) {
  const initial = useMemo(
    () => layout(mindmap.nodes as any, mindmap.edges as any),
    [mindmap],
  );
  const [nodes, setNodes, onNodesChange] = useNodesState(initial.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges);

  useEffect(() => {
    setNodes(initial.nodes);
    setEdges(initial.edges);
  }, [initial, setNodes, setEdges]);

  const onConnect = useCallback(
    (c: Connection) =>
      setEdges((eds) =>
        addEdge(
          {
            ...c,
            type: "smoothstep",
            animated: true,
            style: { stroke: "#a855f7", strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: "#a855f7" },
          },
          eds,
        ),
      ),
    [setEdges],
  );

  function addNode() {
    const label = prompt("Texte du nouveau nœud ?");
    if (!label) return;
    const id = `n-${Date.now()}`;
    setNodes((ns) => [
      ...ns,
      {
        id,
        type: "leaf",
        position: { x: Math.random() * 200, y: Math.random() * 200 },
        data: { label, tone: Math.floor(Math.random() * 6) },
      },
    ]);
  }

  async function save() {
    const cleanNodes = nodes.map((n) => ({ id: n.id, label: (n.data as any).label }));
    const cleanEdges = edges.map((e) => ({ id: e.id, source: e.source, target: e.target }));
    await saveMindMap(mindmap.id, cleanNodes, cleanEdges);
    toast.success("Carte mentale sauvegardée");
  }

  function exportJSON() {
    const blob = new Blob([JSON.stringify({ nodes, edges }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${mindmap.title.replace(/\s+/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="relative h-[640px] overflow-hidden rounded-3xl glass-strong shadow-soft">
      {/* Decorative gradient background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{
          background:
            "radial-gradient(at 20% 15%, rgba(244,114,182,0.18), transparent 55%), radial-gradient(at 80% 10%, rgba(139,92,246,0.18), transparent 55%), radial-gradient(at 50% 95%, rgba(217,70,239,0.15), transparent 60%)",
        }}
      />

      {/* Toolbar */}
      <div className="absolute right-4 top-4 z-10 flex gap-2">
        <button
          onClick={addNode}
          className="flex items-center gap-1.5 rounded-full bg-white/90 px-3.5 py-2 text-xs font-medium text-violet-700 shadow-soft ring-1 ring-violet-100 hover:bg-white hover:scale-105 transition"
        >
          <Plus className="h-3.5 w-3.5" /> Nœud
        </button>
        <button
          onClick={exportJSON}
          className="flex items-center gap-1.5 rounded-full bg-white/90 px-3.5 py-2 text-xs font-medium text-violet-700 shadow-soft ring-1 ring-violet-100 hover:bg-white hover:scale-105 transition"
        >
          <Download className="h-3.5 w-3.5" /> Export
        </button>
        <button
          onClick={save}
          className="flex items-center gap-1.5 rounded-full bg-gradient-primary px-4 py-2 text-xs font-semibold text-white shadow-glow hover:scale-105 transition"
        >
          <Save className="h-3.5 w-3.5" /> Sauvegarder
        </button>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.35 }}
        proOptions={{ hideAttribution: true }}
        minZoom={0.3}
        maxZoom={1.6}
        defaultEdgeOptions={{ type: "smoothstep" }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          color="#e9d5ff"
          gap={22}
          size={1.4}
        />
        <MiniMap
          pannable
          zoomable
          ariaLabel="Aperçu carte mentale"
          maskColor="rgba(243, 232, 255, 0.6)"
          nodeColor={(n) =>
            n.type === "root" ? "#c026d3" : n.type === "branch" ? "#a855f7" : "#e9d5ff"
          }
          nodeStrokeColor="#fff"
          nodeStrokeWidth={2}
          style={{
            background: "rgba(255,255,255,0.85)",
            border: "1px solid rgba(216,180,254,0.6)",
            borderRadius: 12,
          }}
        />
        <Controls position="bottom-right" showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
