import { useCallback, useEffect, useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
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
import { Download, Plus, Save } from "lucide-react";
import type { MindMap } from "@/lib/types";
import { saveMindMap } from "@/lib/study";
import { toast } from "sonner";

interface MindMapEditorProps {
  mindmap: MindMap;
}

// Custom rounded gradient node
function StudyNode({ data, id }: { data: { label: string; level: number }; id: string }) {
  const palettes = [
    "from-fuchsia-500 to-purple-600 text-white",
    "from-pink-400 to-fuchsia-500 text-white",
    "from-purple-400 to-violet-500 text-white",
  ];
  const cls = palettes[Math.min(data.level, palettes.length - 1)];
  return (
    <div
      className={`relative rounded-2xl bg-gradient-to-br ${cls} px-4 py-2.5 shadow-glow font-medium text-sm max-w-[220px] text-center`}
    >
      <Handle type="target" position={Position.Top} />
      {data.label}
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

const nodeTypes = { study: StudyNode };

// Simple radial layout: root in center, branches around, children further out
function layout(rawNodes: { id: string; label: string }[], rawEdges: { id: string; source: string; target: string }[]) {
  const childMap: Record<string, string[]> = {};
  rawEdges.forEach((e) => {
    childMap[e.source] = childMap[e.source] || [];
    childMap[e.source].push(e.target);
  });

  const positions: Record<string, { x: number; y: number; level: number }> = {};
  const root = rawNodes[0]?.id ?? "root";
  positions[root] = { x: 0, y: 0, level: 0 };

  const branches = childMap[root] ?? [];
  const branchRadius = 280;
  branches.forEach((b, i) => {
    const angle = (i / branches.length) * Math.PI * 2 - Math.PI / 2;
    positions[b] = {
      x: Math.cos(angle) * branchRadius,
      y: Math.sin(angle) * branchRadius,
      level: 1,
    };
    const kids = childMap[b] ?? [];
    const childRadius = 180;
    kids.forEach((c, ci) => {
      const spread = (ci - (kids.length - 1) / 2) * 0.45;
      const ca = angle + spread;
      positions[c] = {
        x: positions[b].x + Math.cos(ca) * childRadius,
        y: positions[b].y + Math.sin(ca) * childRadius,
        level: 2,
      };
    });
  });

  const nodes: Node[] = rawNodes.map((n) => ({
    id: n.id,
    type: "study",
    position: positions[n.id] ?? { x: Math.random() * 400, y: Math.random() * 400 },
    data: { label: n.label, level: positions[n.id]?.level ?? 2 },
  }));

  const edges: Edge[] = rawEdges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    type: "smoothstep",
    animated: true,
    markerEnd: { type: MarkerType.ArrowClosed, color: "#c026d3" },
  }));

  return { nodes, edges };
}

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
            markerEnd: { type: MarkerType.ArrowClosed, color: "#c026d3" },
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
        type: "study",
        position: { x: Math.random() * 200, y: Math.random() * 200 },
        data: { label, level: 2 },
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
    const blob = new Blob(
      [JSON.stringify({ nodes, edges }, null, 2)],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${mindmap.title.replace(/\s+/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="relative h-[600px] overflow-hidden rounded-3xl glass-strong shadow-soft">
      <div className="absolute right-4 top-4 z-10 flex gap-2">
        <button onClick={addNode} className="flex items-center gap-1 rounded-full bg-white/90 px-3 py-2 text-xs font-medium shadow-soft hover:bg-white">
          <Plus className="h-3.5 w-3.5" /> Nœud
        </button>
        <button onClick={exportJSON} className="flex items-center gap-1 rounded-full bg-white/90 px-3 py-2 text-xs font-medium shadow-soft hover:bg-white">
          <Download className="h-3.5 w-3.5" /> Export
        </button>
        <button onClick={save} className="flex items-center gap-1 rounded-full bg-gradient-primary px-3 py-2 text-xs font-semibold text-white shadow-glow hover:scale-105">
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
        fitViewOptions={{ padding: 0.3 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#e9d5ff" gap={20} />
        <Controls position="bottom-right" showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
